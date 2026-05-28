# AI POS Startup Script
# This script starts both the backend and frontend servers

Write-Host "🚀 Starting AI POS System..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "server/node_modules")) {
    Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
    Set-Location server
    npm install --legacy-peer-deps
    Set-Location ..
}

# Check if .env exists
if (-not (Test-Path "server/.env")) {
    Write-Host "⚠️  Warning: server/.env not found!" -ForegroundColor Red
    Write-Host "   Please configure Firebase credentials in server/.env" -ForegroundColor Red
    Write-Host "   See QUICKSTART.md for instructions" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "✅ Starting servers..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:4000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Start frontend in current window
npm run dev
