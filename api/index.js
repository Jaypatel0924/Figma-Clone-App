// api/index.js - Vercel serverless function
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const app = express();

// Security & Performance Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS Configuration
app.use(cors({
  origin: (process.env.CLIENT_URL || 'https://figma-clone-app-6msf-44fi46uc0-jay-patels-projects-21397060.vercel.app').split(','),
  credentials: true
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = conn.connections[0].readyState === 1;
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
    throw error;
  }
};

// Initialize DB connection
connectDB().catch(console.error);

// Routes
app.use('/api/auth', require('../backend/routes/auth'));
app.use('/api/canvas', require('../backend/routes/canvas'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export for Vercel
module.exports = app;
