// middleware/auth.js - JWT Authentication Middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Allow guest token to bypass JWT verification
    if (token === 'guest123') {
      req.user = {
        _id: 'guest',
        username: 'Guest',
        email: 'guest@example.com'
      };
      req.userId = 'guest';
      req.token = token;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      if (token === 'guest123') {
        req.user = {
          _id: 'guest',
          username: 'Guest',
          email: 'guest@example.com'
        };
        req.userId = 'guest';
      } else {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);
        if (user) {
          req.user = user;
          req.userId = user._id;
        }
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { auth, optionalAuth };
