#!/bin/bash

# Figma App - Frontend Folder Setup Script
# This script reorganizes your project structure for production deployment

echo "🚀 Starting Project Reorganization..."
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: backend folder not found. Run this script from the root Figma_App directory."
    exit 1
fi

# Step 1: Create frontend folder
echo "📁 Step 1: Creating frontend folder..."
if [ ! -d "frontend" ]; then
    mkdir frontend
    echo "✅ Frontend folder created"
else
    echo "⚠️  Frontend folder already exists"
fi

echo ""

# Step 2: Copy files
echo "📋 Step 2: Copying frontend files..."

FILES_TO_COPY=(
    "src"
    "public"
    "index.html"
    "package.json"
    "package-lock.json"
    "vite.config.ts"
    "tsconfig.json"
    "tsconfig.app.json"
    "tsconfig.node.json"
    "eslint.config.js"
)

for file in "${FILES_TO_COPY[@]}"; do
    if [ -e "$file" ]; then
        cp -r "$file" "frontend/$file"
        echo "✅ Copied: $file"
    else
        echo "⚠️  Skipped (not found): $file"
    fi
done

echo ""

# Step 3: Copy .env
if [ -f "src/.env" ]; then
    cp "src/.env" "frontend/.env"
    echo "✅ Copied frontend .env file"
fi

echo ""

# Step 4: Create root package.json
echo "📦 Step 3: Creating root package.json..."
if [ ! -f "package.json" ] || [ -f "ROOT_PACKAGE.json" ]; then
    cp ROOT_PACKAGE.json package.json
    echo "✅ Root package.json created"
else
    echo "⚠️  Root package.json already exists"
fi

echo ""
echo "================================================"
echo "📋 NEXT STEPS:"
echo "================================================"
echo ""
echo "1️⃣ Install dependencies:"
echo "   npm run install:all"
echo ""
echo "2️⃣ Update frontend/.env if needed:"
echo "   VITE_API_URL=http://localhost:3001/api"
echo ""
echo "3️⃣ Update backend/.env"
echo ""
echo "4️⃣ Test development:"
echo "   npm run dev"
echo ""
echo "5️⃣ Build for production:"
echo "   npm run build"
echo ""
echo "6️⃣ Delete original files after testing:"
echo "   rm -rf src public index.html package.json vite.config.ts tsconfig*.json eslint.config.js"
echo ""
echo "================================================"
echo "✅ Reorganization script completed!"
echo "================================================"
