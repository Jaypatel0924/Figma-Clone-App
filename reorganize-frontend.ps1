# Figma App - Frontend Folder Setup Script
# This script reorganizes your project structure for production deployment

Write-Host "🚀 Starting Project Reorganization..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend")) {
    Write-Host "❌ Error: backend folder not found. Run this script from the root Figma_App directory." -ForegroundColor Red
    exit 1
}

# Step 1: Create frontend folder
Write-Host "📁 Step 1: Creating frontend folder..." -ForegroundColor Yellow
if (-not (Test-Path "frontend")) {
    New-Item -ItemType Directory -Name "frontend" | Out-Null
    Write-Host "✅ Frontend folder created" -ForegroundColor Green
} else {
    Write-Host "⚠️ Frontend folder already exists" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Copy source files to frontend (don't delete originals yet)
Write-Host "📋 Step 2: Copying frontend files..." -ForegroundColor Yellow

$filesToCopy = @(
    "src",
    "public",
    "index.html",
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "eslint.config.js"
)

foreach ($file in $filesToCopy) {
    if (Test-Path $file) {
        if ((Get-Item $file).PSIsContainer) {
            Copy-Item -Path $file -Destination "frontend/$file" -Recurse -Force
            Write-Host "✅ Copied folder: $file" -ForegroundColor Green
        } else {
            Copy-Item -Path $file -Destination "frontend/$file" -Force
            Write-Host "✅ Copied file: $file" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ Skipped (not found): $file" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 3: Copy .env if it exists
if (Test-Path "src/.env") {
    Copy-Item -Path "src/.env" -Destination "frontend/.env" -Force
    Write-Host "✅ Copied frontend .env file" -ForegroundColor Green
}

Write-Host ""

# Step 4: Create root package.json
Write-Host "📦 Step 3: Creating root package.json..." -ForegroundColor Yellow
if (-not (Test-Path "package.json")) {
    Copy-Item -Path "ROOT_PACKAGE.json" -Destination "package.json" -Force
    Write-Host "✅ Root package.json created" -ForegroundColor Green
} else {
    Write-Host "⚠️ Root package.json already exists. Update manually if needed." -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Instructions
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣ Install dependencies:" -ForegroundColor Green
Write-Host "   npm run install:all" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣ Update frontend/.env if needed:" -ForegroundColor Green
Write-Host "   VITE_API_URL=http://localhost:3001/api" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣ Update backend/.env:" -ForegroundColor Green
Write-Host "   NODE_ENV=development" -ForegroundColor White
Write-Host "   PORT=3001" -ForegroundColor White
Write-Host "   MONGODB_URI=your-mongodb-uri" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣ Test development:" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "5️⃣ Build for production:" -ForegroundColor Green
Write-Host "   npm run build" -ForegroundColor White
Write-Host ""
Write-Host "6️⃣ Original files to delete (AFTER TESTING):" -ForegroundColor Yellow
Write-Host "   - src/" -ForegroundColor Gray
Write-Host "   - public/" -ForegroundColor Gray
Write-Host "   - index.html" -ForegroundColor Gray
Write-Host "   - package.json (original)" -ForegroundColor Gray
Write-Host "   - vite.config.ts (original)" -ForegroundColor Gray
Write-Host "   - tsconfig*.json (original files)" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Reorganization script completed!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
