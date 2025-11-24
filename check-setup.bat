@echo off
REM Quick Diagnostic Script for Figma App

echo.
echo ======================================
echo   FIGMA APP - Quick Diagnostic
echo ======================================
echo.

echo Checking Prerequisites...
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js is installed
    node --version
) else (
    echo [ERROR] Node.js NOT found - please install from nodejs.org
    exit /b 1
)
echo.

REM Check npm
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] npm is installed
    npm --version
) else (
    echo [ERROR] npm NOT found
    exit /b 1
)
echo.

REM Check if node_modules exists
if exist "node_modules\" (
    echo [OK] Frontend dependencies installed
) else (
    echo [WARNING] Frontend dependencies not installed
    echo          Run: npm install
)
echo.

REM Check if backend node_modules exists
if exist "backend\node_modules\" (
    echo [OK] Backend dependencies installed
) else (
    echo [WARNING] Backend dependencies not installed
    echo          Run: cd backend ^&^& npm install
)
echo.

REM Check .env files
if exist "backend\.env.local" (
    echo [OK] Backend environment file found
) else (
    echo [WARNING] Backend .env.local not found
    echo          Copy from .env.example or create new
)
echo.

echo ======================================
echo   STATUS CHECKS
echo ======================================
echo.

REM Check if ports are in use
netstat -ano | find ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 5173 (Frontend) - IN USE
) else (
    echo [INFO] Port 5173 (Frontend) - Available
)

netstat -ano | find ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 3001 (Backend) - IN USE
) else (
    echo [INFO] Port 3001 (Backend) - Available
)

netstat -ano | find ":27017" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 27017 (MongoDB) - IN USE
) else (
    echo [INFO] Port 27017 (MongoDB) - Available
)
echo.

echo ======================================
echo   NEXT STEPS
echo ======================================
echo.
echo 1. Open 3 PowerShell terminals:
echo.
echo    Terminal 1 - MongoDB:
echo    $ mongod
echo.
echo    Terminal 2 - Backend:
echo    $ cd backend
echo    $ npm start
echo.
echo    Terminal 3 - Frontend:
echo    $ npm run dev
echo.
echo 2. Open: http://localhost:5173
echo 3. Click "Continue as Guest"
echo.
echo For detailed setup: see START_HERE.md or QUICK_FIX.md
echo.
