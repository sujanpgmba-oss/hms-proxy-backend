const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// HMS Configuration - Read from environment
const HMS_MANAGEMENT_TOKEN = process.env.HMS_MANAGEMENT_TOKEN || '';
const HMS_ACCESS_KEY = process.env.HMS_ACCESS_KEY || '';
const HMS_APP_SECRET = process.env.HMS_APP_SECRET || '';
const HMS_API_URL = 'https://api.100ms.live/v2';

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

// HMS Auth Token Endpoint
app.post('/api/hms/auth-token', async (req, res) => {
  try {
    const { roomId, userId, role = 'participant' } = req.body;

    console.log('🔐 Auth token request:', { roomId, userId, role });

    if (!roomId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: roomId and userId' 
      });
    }

    if (!HMS_ACCESS_KEY || !HMS_APP_SECRET) {
      console.error('❌ HMS_ACCESS_KEY or HMS_APP_SECRET not configured!');
      return res.status(500).json({ 
        error: 'HMS App credentials not configured on server' 
      });
    }

    // Use native fetch (Node 18+) - Auth tokens need App Access Key + Secret
    const response = await fetch(`${HMS_API_URL}/auth-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HMS_APP_SECRET}`
      },
      body: JSON.stringify({
        room_id: roomId,
        role: role,
        user_id: userId,
        type: 'app',
        access_key: HMS_ACCESS_KEY
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
    console.log('✅ Auth token generated successfully');
    res.json({ token: data.token });

  } catch (error) {
    console.error('❌ Error:', error);
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

    if (!HMS_MANAGEMENT_TOKEN) {
      return res.status(500).json({ 
        error: 'HMS Management Token not configured on server' 
      });
    }

    const response = await fetch(`${HMS_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`
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

    if (!HMS_MANAGEMENT_TOKEN) {
      return res.status(500).json({ 
        error: 'HMS Management Token not configured on server' 
      });
    }

    const response = await fetch(`${HMS_API_URL}/rooms/${roomId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`
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
🔑 HMS Token: ${HMS_MANAGEMENT_TOKEN ? '✅ Configured' : '❌ Missing'}
⏰ Started: ${new Date().toISOString()}

API Endpoints:
  - GET  /health
  - POST /api/hms/auth-token
  - POST /api/hms/rooms
  - GET  /api/hms/rooms/:roomId
  `);
});
