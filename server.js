const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 10000;

// Supabase Configuration
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// HMS Configuration - Read from environment (fallback)
let HMS_MANAGEMENT_TOKEN = process.env.HMS_MANAGEMENT_TOKEN || '';
let HMS_ACCESS_KEY = process.env.HMS_ACCESS_KEY || '';
let HMS_APP_SECRET = process.env.HMS_APP_SECRET || '';
const HMS_API_URL = 'https://api.100ms.live/v2';

// Cache for admin settings (refreshed every 5 minutes)
let adminSettingsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to fetch HMS tokens from database
async function getHMSTokensFromDatabase() {
  try {
    const now = Date.now();
    
    // Return cached value if still valid
    if (adminSettingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📦 Using cached HMS tokens');
      return adminSettingsCache;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('admin_api_settings')
      .select('hms_management_token, hms_access_key, hms_secret')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('⚠️ Error fetching HMS tokens from database:', error.message);
      // Fall back to environment variables
      return {
        hms_management_token: process.env.HMS_MANAGEMENT_TOKEN || '',
        hms_access_key: process.env.HMS_ACCESS_KEY || '',
        hms_secret: process.env.HMS_APP_SECRET || ''
      };
    }

    if (data) {
      adminSettingsCache = data;
      cacheTimestamp = now;
      console.log('✅ HMS tokens fetched from database');
      return data;
    }

    // Fall back to environment variables
    return {
      hms_management_token: process.env.HMS_MANAGEMENT_TOKEN || '',
      hms_access_key: process.env.HMS_ACCESS_KEY || '',
      hms_secret: process.env.HMS_APP_SECRET || ''
    };
  } catch (error) {
    console.error('❌ Error in getHMSTokensFromDatabase:', error.message);
    // Fall back to environment variables
    return {
      hms_management_token: process.env.HMS_MANAGEMENT_TOKEN || '',
      hms_access_key: process.env.HMS_ACCESS_KEY || '',
      hms_secret: process.env.HMS_APP_SECRET || ''
    };
  }
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'HMS Proxy Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasToken: !!HMS_MANAGEMENT_TOKEN,
    timestamp: new Date().toISOString()
  });
});

// HMS Auth Token Endpoint - Generate JWT token
app.post('/api/hms/auth-token', async (req, res) => {
  try {
    const { roomId, userId, role = 'guest' } = req.body;

    console.log('🔐 Auth token request:', { roomId, userId, role });

    if (!roomId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: roomId and userId' 
      });
    }

    // Fetch tokens from database
    const tokens = await getHMSTokensFromDatabase();
    const hmsAccessKey = tokens.hms_access_key;
    const hmsAppSecret = tokens.hms_secret;

    if (!hmsAccessKey || !hmsAppSecret) {
      console.error('❌ HMS_ACCESS_KEY or HMS_APP_SECRET not configured!');
      return res.status(500).json({ 
        error: 'HMS App credentials not configured. Please set them in admin settings.' 
      });
    }

    // Generate JWT token for HMS
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (24 * 3600); // 24 hours expiry

    const payload = {
      access_key: hmsAccessKey,
      room_id: roomId,
      user_id: userId,
      role: role,
      type: 'app',
      version: 2,
      iat: now,
      nbf: now,
      exp: exp,
      jti: uuidv4()
    };

    const token = jwt.sign(payload, hmsAppSecret, {
      algorithm: 'HS256'
    });

    console.log('✅ Auth token generated successfully');
    res.json({ token });

  } catch (error) {
    console.error('❌ Error generating token:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
});

// Create Room Endpoint
app.post('/api/hms/rooms', async (req, res) => {
  try {
    const { name, description } = req.body;

    console.log('🏗️ Create room request:', name);

    if (!name) {
      return res.status(400).json({ 
        error: 'Missing required field: name' 
      });
    }

    // Fetch tokens from database
    const tokens = await getHMSTokensFromDatabase();
    const hmsManagementToken = tokens.hms_management_token;

    if (!hmsManagementToken) {
      return res.status(500).json({ 
        error: 'HMS Management Token not configured. Please set it in admin settings.' 
      });
    }

    const response = await fetch(`${HMS_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hmsManagementToken}`
      },
      body: JSON.stringify({
        name: name,
        description: description || ''
      })
    });

    if (!response.ok) {
      console.error('❌ HMS API Error:', response.status, response.statusText);
      let errorMessage = 'HMS API Error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch (e) {
        errorMessage = response.statusText;
      }
      return res.status(response.status).json({ 
        error: errorMessage
      });
    }

    const data = await response.json();
    console.log('✅ Room created:', data.id);
    res.json(data);

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
});

// Check Room Endpoint
app.get('/api/hms/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    console.log('🔍 Check room:', roomId);

    // Fetch tokens from database
    const tokens = await getHMSTokensFromDatabase();
    const hmsManagementToken = tokens.hms_management_token;

    if (!hmsManagementToken) {
      return res.status(500).json({ 
        error: 'HMS Management Token not configured. Please set it in admin settings.' 
      });
    }

    const response = await fetch(`${HMS_API_URL}/rooms/${roomId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${hmsManagementToken}`
      }
    });

    if (response.status === 404) {
      return res.json({ exists: false });
    }

    if (!response.ok) {
      console.error('❌ HMS API Error:', response.status, response.statusText);
      let errorMessage = 'HMS API Error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch (e) {
        errorMessage = response.statusText;
      }
      return res.status(response.status).json({ 
        error: errorMessage
      });
    }

    const data = await response.json();
    console.log('✅ Room found:', data.id);
    res.json(data);

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   🚀 HMS Proxy Backend Server Running          ║
╚════════════════════════════════════════════════╝

📍 Port: ${PORT}
🔑 HMS Token: ${HMS_MANAGEMENT_TOKEN ? '✅ Configured (env)' : '⏳ Will load from database'}
🗄️  Database: ${process.env.VITE_SUPABASE_URL ? '✅ Connected' : '⚠️  Not configured'}
⏰ Started: ${new Date().toISOString()}

API Endpoints:
  - GET  /health
  - POST /api/hms/auth-token
  - POST /api/hms/rooms
  - GET  /api/hms/rooms/:roomId
  `);
});
