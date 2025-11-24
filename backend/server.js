// // server.js - Main Express Server
// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const mongoose = require('mongoose');
// const helmet = require('helmet');
// const compression = require('compression');
// const morgan = require('morgan');
// const authRoutes = require('./routes/auth');
// const canvasRoutes = require('./routes/canvas');

// dotenv.config();

// const app = express();

// // Security & Performance Middleware
// app.use(helmet()); // Security headers
// app.use(compression()); // Gzip compression
// app.use(morgan('combined')); // Request logging

// // CORS Configuration
// const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(url => url.trim());
// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.some(o => origin.includes(o) || o === '*')) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   optionsSuccessStatus: 200
// }));

// // Body Parser Middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // MongoDB Connection with retry logic
// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(
//       process.env.MONGODB_URI || 'mongodb://localhost:27017/canvas-editor',
//       {
//         maxPoolSize: 10,
//         serverSelectionTimeoutMS: 5000,
//         connectTimeoutMS: 10000,
//       }
//     );
//     console.log('✅ MongoDB Connected:', conn.connection.host);
//     return conn;
//   } catch (err) {
//     console.error('❌ MongoDB Connection Error:', err.message);
//     // Retry connection after 5 seconds
//     setTimeout(connectDB, 5000);
//   }
// };

// connectDB();

// // Handle connection events
// mongoose.connection.on('disconnected', () => {
//   console.warn('⚠️ MongoDB disconnected');
// });

// mongoose.connection.on('error', (err) => {
//   console.error('❌ MongoDB error:', err);
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/canvas', canvasRoutes);

// // Serve static files (frontend build)
// if (process.env.NODE_ENV === 'production') {
//   const path = require('path');
//   app.use(express.static(path.join(__dirname, '../dist')));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../dist/index.html'));
//   });
// }

// // Health Check
// app.get('/health', (req, res) => {
//   res.json({ status: 'OK', message: 'Server is running' });
// });

// // Error Handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(err.status || 500).json({
//     error: err.message || 'Internal Server Error'
//   });
// });

// // 404 Handler
// app.use((req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// const PORT = process.env.PORT || 3001;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

// module.exports = app;

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

dotenv.config();

const app = express();

// Security & Performance
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL?.split(",") || "*",
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Connect MongoDB only once
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = conn.connections[0].readyState;
    console.log("MongoDB Connected");
  } catch (error) {
    console.log("MongoDB Error:", error.message);
  }
}

connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/canvas', require('./routes/canvas'));

app.get('/health', (req, res) => {
  res.json({ status: "OK" });
});

// Serve static files from frontend/dist (production only)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Export for Vercel
module.exports = app;
