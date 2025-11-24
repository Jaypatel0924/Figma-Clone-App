#!/usr/bin/env node

/**
 * Backend Health Check & Startup Verification
 * Run this after starting the backend to verify everything is working
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(50));
console.log('🏥 Backend Health Check');
console.log('='.repeat(50) + '\n');

// Color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function checkFile(filePath, description) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        log(`✅ ${description}`, 'green');
        return true;
    } else {
        log(`❌ ${description} NOT FOUND: ${filePath}`, 'red');
        return false;
    }
}

function checkEnvVariable(key, description) {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) {
        log(`❌ .env.local not found!`, 'red');
        return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes(`${key}=`)) {
        log(`✅ ${description}`, 'green');
        return true;
    } else {
        log(`❌ ${description} NOT CONFIGURED`, 'yellow');
        return false;
    }
}

// Check files
console.log('📁 File Structure Check:\n');
checkFile('server.js', 'Main server file');
checkFile('package.json', 'Package configuration');
checkFile('.env.local', 'Environment variables');
checkFile('middleware/auth.js', 'Authentication middleware');
checkFile('routes/auth.js', 'Auth routes');
checkFile('routes/canvas.js', 'Canvas routes');
checkFile('models/User.js', 'User model');
checkFile('models/Canvas.js', 'Canvas model');

// Check environment
console.log('\n' + '='.repeat(50));
console.log('⚙️  Environment Configuration:\n');
checkEnvVariable('PORT', 'PORT configured');
checkEnvVariable('MONGODB_URI', 'MongoDB URI configured');
checkEnvVariable('JWT_SECRET', 'JWT Secret configured');
checkEnvVariable('NODE_ENV', 'Node environment configured');

// Check port availability
console.log('\n' + '='.repeat(50));
console.log('🔌 Port Check:\n');

const PORT = process.env.PORT || 3001;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK' }));
});

server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        log(`❌ Port ${PORT} is already in use!`, 'red');
        log(`   Kill the process using this port or use a different port`, 'yellow');
    } else {
        log(`❌ Server error: ${err.message}`, 'red');
    }
    server.close();
});

server.listen(PORT, () => {
    log(`✅ Port ${PORT} is available`, 'green');
    
    // Check backend connectivity
    console.log('\n' + '='.repeat(50));
    console.log('🌐 Backend Connectivity:\n');
    
    const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/health',
        method: 'GET',
        timeout: 5000
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                log(`✅ Backend health check: OK`, 'green');
                log(`   Status: ${res.statusCode}`, 'green');
                log(`   Response: ${data}`, 'cyan');
            } else {
                log(`⚠️  Backend health check: ${res.statusCode}`, 'yellow');
            }
            
            // Display info
            console.log('\n' + '='.repeat(50));
            console.log('ℹ️  Startup Information:\n');
            log(`Backend URL: http://localhost:${PORT}`, 'cyan');
            log(`Frontend URL: http://localhost:5173`, 'cyan');
            log(`API Base URL: http://localhost:${PORT}/api`, 'cyan');
            
            console.log('\n' + '='.repeat(50));
            console.log('✨ Important Endpoints:\n');
            log(`🔐 Login: POST /api/auth/login`, 'blue');
            log(`📝 Register: POST /api/auth/signup`, 'blue');
            log(`🎨 Get Canvases: GET /api/canvas`, 'blue');
            log(`➕ Create Canvas: POST /api/canvas`, 'blue');
            log(`💾 Save Design: PUT /api/canvas/:id`, 'blue');
            
            console.log('\n' + '='.repeat(50));
            console.log('🚀 Ready to Develop!\n');
            log(`Visit http://localhost:5173 in your browser`, 'green');
            log(`Click "Continue as Guest" to test without login`, 'cyan');
            
            server.close();
            process.exit(0);
        });
    });
    
    req.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
            log(`❌ Backend is not responding`, 'red');
            log(`   Make sure MongoDB is running and backend is started`, 'yellow');
            log(`   Run: npm start`, 'yellow');
        } else {
            log(`❌ Connection error: ${err.message}`, 'red');
        }
        server.close();
        process.exit(1);
    });
    
    req.on('timeout', () => {
        log(`❌ Backend health check timeout`, 'red');
        log(`   Backend may not be running properly`, 'yellow');
        server.close();
        process.exit(1);
    });
    
    req.end();
});
