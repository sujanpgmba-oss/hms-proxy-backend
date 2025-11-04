# 🚀 Quick Setup Script for Render Deployment

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   HMS Backend Proxy - Render Deployment       " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Initialize Git
Write-Host "📦 Step 1: Initializing Git repository..." -ForegroundColor Yellow
cd e:\spark\hms-backend-render
git init
git add .
git commit -m "Initial HMS proxy backend for Render"
Write-Host "✅ Git repository initialized" -ForegroundColor Green
Write-Host ""

# Step 2: Instructions for GitHub
Write-Host "🐙 Step 2: Push to GitHub" -ForegroundColor Yellow
Write-Host "   1. Go to: https://github.com/new" -ForegroundColor White
Write-Host "   2. Repository name: hms-proxy-backend" -ForegroundColor White
Write-Host "   3. Visibility: Private" -ForegroundColor White
Write-Host "   4. Click 'Create repository'" -ForegroundColor White
Write-Host ""
Write-Host "   Then run these commands:" -ForegroundColor White
Write-Host "   cd e:\spark\hms-backend-render" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/hms-proxy-backend.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""

# Step 3: Render deployment instructions
Write-Host "🌐 Step 3: Deploy to Render" -ForegroundColor Yellow
Write-Host "   1. Go to: https://render.com/dashboard" -ForegroundColor White
Write-Host "   2. Click 'New +' → 'Web Service'" -ForegroundColor White
Write-Host "   3. Connect your GitHub repository: hms-proxy-backend" -ForegroundColor White
Write-Host ""
Write-Host "   4. Configure:" -ForegroundColor White
Write-Host "      - Name: hms-proxy-backend" -ForegroundColor Cyan
Write-Host "      - Runtime: Node" -ForegroundColor Cyan
Write-Host "      - Build Command: npm install" -ForegroundColor Cyan
Write-Host "      - Start Command: npm start" -ForegroundColor Cyan
Write-Host "      - Instance Type: Free" -ForegroundColor Cyan
Write-Host ""
Write-Host "   5. Add Environment Variable:" -ForegroundColor White
Write-Host "      Key: HMS_MANAGEMENT_TOKEN" -ForegroundColor Cyan
Write-Host "      Value: [Your HMS Management Token]" -ForegroundColor Cyan
Write-Host ""
Write-Host "   6. Click 'Create Web Service'" -ForegroundColor White
Write-Host ""

Write-Host "⏰ Wait 2-3 minutes for deployment to complete..." -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ After deployment, you'll get a URL like:" -ForegroundColor Green
Write-Host "   https://hms-proxy-backend.onrender.com" -ForegroundColor Cyan
Write-Host ""

Write-Host "🧪 Test your deployment:" -ForegroundColor Yellow
Write-Host "   Invoke-RestMethod -Uri 'https://YOUR-SERVICE.onrender.com/health'" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚙️  Update frontend .env:" -ForegroundColor Yellow
Write-Host "   VITE_USE_HMS_PROXY=true" -ForegroundColor Cyan
Write-Host "   VITE_API_URL=https://YOUR-SERVICE.onrender.com" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔨 Then rebuild:" -ForegroundColor Yellow
Write-Host "   cd e:\spark" -ForegroundColor Cyan
Write-Host "   npm run build" -ForegroundColor Cyan
Write-Host ""

Write-Host "📤 Upload dist/ folder to cinfinityfilms.com and clear cache!" -ForegroundColor Green
Write-Host ""

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Full guide: RENDER_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "===============================================" -ForegroundColor Cyan
