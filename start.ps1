# PowerShell Startup Script for Figma App
# Run this script to start everything!

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚀 Figma App Startup Script" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$nodeCheck = node --version 2>$null
if (-not $nodeCheck) {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js $nodeCheck found" -ForegroundColor Green

# Check if npm is installed
$npmCheck = npm --version 2>$null
if (-not $npmCheck) {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ npm $npmCheck found" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Starting Application..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Change to project root
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Install frontend dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend installation failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
}

# Install backend dependencies if needed
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend installation failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 MongoDB Status:" -ForegroundColor Yellow
Write-Host "   To use local MongoDB:" -ForegroundColor Cyan
Write-Host "   1. Install MongoDB Community Server" -ForegroundColor Gray
Write-Host "   2. Run: mongod" -ForegroundColor Gray
Write-Host ""
Write-Host "   OR use MongoDB Atlas (cloud):" -ForegroundColor Cyan
Write-Host "   1. Update backend\.env.local with Atlas URI" -ForegroundColor Gray
Write-Host "   2. Get connection string from: https://www.mongodb.com/cloud/atlas" -ForegroundColor Gray
Write-Host ""

# Ask user what to do
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Choose startup method:" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host "1. Start Backend ONLY (for development)" -ForegroundColor Green
Write-Host "2. Start Frontend ONLY (for testing without DB)" -ForegroundColor Green
Write-Host "3. Start BOTH (requires MongoDB running)" -ForegroundColor Green
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔧 Starting Backend Server..." -ForegroundColor Green
        Write-Host "   URL: http://localhost:3001" -ForegroundColor Cyan
        Write-Host ""
        Push-Location backend
        npm start
        Pop-Location
    }
    "2" {
        Write-Host ""
        Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Green
        Write-Host "   URL: http://localhost:5173" -ForegroundColor Cyan
        Write-Host ""
        npm run dev
    }
    "3" {
        Write-Host ""
        Write-Host "⚠️  WARNING: This requires MongoDB running!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "If MongoDB is NOT running, this will fail!" -ForegroundColor Red
        Write-Host "Start MongoDB first: mongod" -ForegroundColor Yellow
        Write-Host ""
        
        Read-Host "Press Enter to continue or Ctrl+C to cancel..."
        
        Write-Host ""
        Write-Host "🚀 Starting FULL STACK Application..." -ForegroundColor Green
        Write-Host ""
        
        # Start backend in new window
        Write-Host "📌 Backend starting in new window..." -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start"
        
        # Wait a bit for backend to start
        Start-Sleep -Seconds 3
        
        # Start frontend
        Write-Host "📌 Frontend starting..." -ForegroundColor Cyan
        npm run dev
    }
    default {
        Write-Host "❌ Invalid choice!" -ForegroundColor Red
        exit 1
    }
}
