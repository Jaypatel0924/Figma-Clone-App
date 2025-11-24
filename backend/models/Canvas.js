// models/Canvas.js - Canvas Model
const mongoose = require('mongoose');

const shapeSchema = new mongoose.Schema({
  id: String,
  type: {
    type: String,
    enum: ['rectangle', 'circle', 'line', 'arrow', 'text'],
    required: true
  },
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  rotation: { type: Number, default: 0 },
  fill: String,
  stroke: String,
  strokeWidth: Number,
  opacity: { type: Number, default: 1 },
  locked: { type: Boolean, default: false },
  zIndex: Number,
  text: String,
  endX: Number,
  endY: Number
}, { _id: false });

const canvasSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  userId: {
    type: String, // Accept both ObjectId strings and 'guest'
    required: true,
    index: true
  },
  shapes: [shapeSchema],
  thumbnail: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: String,
    default: null
  }],
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for faster queries
canvasSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Canvas', canvasSchema);