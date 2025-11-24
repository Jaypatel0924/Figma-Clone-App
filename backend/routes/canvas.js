// routes/canvas.js - Canvas Routes
const express = require('express');
const Canvas = require('../models/Canvas');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/canvas
// @desc    Create new canvas
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, shapes, thumbnail } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Canvas name is required' });
    }

    const canvas = new Canvas({
      name,
      userId: req.userId,
      shapes: shapes || [],
      thumbnail
    });

    await canvas.save();

    res.status(201).json({
      message: 'Canvas created successfully',
      canvas
    });
  } catch (error) {
    console.error('Create canvas error:', error);
    res.status(500).json({ error: 'Error creating canvas' });
  }
});

// @route   GET /api/canvas
// @desc    Get all canvases for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const canvases = await Canvas.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('-shapes'); // Exclude shapes for list view

    res.json({ canvases });
  } catch (error) {
    console.error('Get canvases error:', error);
    res.status(500).json({ error: 'Error fetching canvases' });
  }
});

// @route   GET /api/canvas/:id
// @desc    Get single canvas by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const canvas = await Canvas.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.userId },
        { sharedWith: req.userId },
        { isPublic: true }
      ]
    });

    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    res.json({ canvas });
  } catch (error) {
    console.error('Get canvas error:', error.message);
    // Return 404 if invalid ID format instead of 500
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Canvas not found' });
    }
    res.status(500).json({ error: 'Error fetching canvas' });
  }
});

// @route   PUT /api/canvas/:id
// @desc    Update canvas
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid canvas ID format' });
    }

    const { name, shapes, thumbnail, isPublic } = req.body;

    const canvas = await Canvas.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found or unauthorized' });
    }

    // Update fields
    if (name) canvas.name = name;
    if (shapes !== undefined) canvas.shapes = shapes;
    if (thumbnail) canvas.thumbnail = thumbnail;
    if (isPublic !== undefined) canvas.isPublic = isPublic;
    
    canvas.version += 1;
    
    await canvas.save();

    res.json({
      message: 'Canvas updated successfully',
      canvas
    });
  } catch (error) {
    console.error('Update canvas error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Canvas not found' });
    }
    res.status(500).json({ error: 'Error updating canvas' });
  }
});

// @route   DELETE /api/canvas/:id
// @desc    Delete canvas
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid canvas ID format' });
    }

    const canvas = await Canvas.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found or unauthorized' });
    }

    res.json({ message: 'Canvas deleted successfully' });
  } catch (error) {
    console.error('Delete canvas error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Canvas not found' });
    }
    res.status(500).json({ error: 'Error deleting canvas' });
  }
});

// @route   POST /api/canvas/:id/share
// @desc    Share canvas with other users
// @access  Private
router.post('/:id/share', auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid canvas ID format' });
    }

    const { userEmails } = req.body;

    if (!Array.isArray(userEmails) || userEmails.length === 0) {
      return res.status(400).json({ error: 'userEmails must be a non-empty array' });
    }

    // Validate all emails
    const emailRegex = /^\S+@\S+\.\S+$/;
    const invalidEmails = userEmails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return res.status(400).json({ error: `Invalid email format: ${invalidEmails.join(', ')}` });
    }

    const canvas = await Canvas.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found or unauthorized' });
    }

    // Look up user IDs by email
    const User = require('../models/User');
    const users = await User.find({ email: { $in: userEmails } }).select('_id email');
    
    if (users.length === 0) {
      return res.status(404).json({ error: `No users found with emails: ${userEmails.join(', ')}` });
    }

    // Check if any emails weren't found
    const foundEmails = users.map(u => u.email.toLowerCase());
    const notFoundEmails = userEmails.filter(email => !foundEmails.includes(email.toLowerCase()));
    if (notFoundEmails.length > 0) {
      return res.status(404).json({ error: `Users not found: ${notFoundEmails.join(', ')}` });
    }

    const userIds = users.map(u => u._id.toString());

    // Add to sharedWith, avoiding duplicates
    canvas.sharedWith = [...new Set([...canvas.sharedWith, ...userIds])];
    await canvas.save();

    res.json({
      message: 'Canvas shared successfully',
      canvas,
      sharedWith: users.map(u => ({ id: u._id, email: u.email }))
    });
  } catch (error) {
    console.error('Share canvas error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Canvas not found' });
    }
    res.status(500).json({ error: 'Error sharing canvas: ' + error.message });
  }
});

// @route   POST /api/canvas/:id/duplicate
// @desc    Duplicate canvas
// @access  Private
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid canvas ID format' });
    }

    const originalCanvas = await Canvas.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.userId },
        { sharedWith: req.userId },
        { isPublic: true }
      ]
    });

    if (!originalCanvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    const duplicatedCanvas = new Canvas({
      name: `${originalCanvas.name} (Copy)`,
      userId: req.userId,
      shapes: originalCanvas.shapes,
      thumbnail: originalCanvas.thumbnail,
      isPublic: false
    });

    await duplicatedCanvas.save();

    res.status(201).json({
      message: 'Canvas duplicated successfully',
      canvas: duplicatedCanvas
    });
  } catch (error) {
    console.error('Duplicate canvas error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Canvas not found' });
    }
    res.status(500).json({ error: 'Error duplicating canvas' });
  }
});

// @route   GET /api/canvas/public/list
// @desc    Get all public canvases
// @access  Public
router.get('/public/list', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const canvases = await Canvas.find({ isPublic: true })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-shapes')
      .populate('userId', 'username');

    const count = await Canvas.countDocuments({ isPublic: true });

    res.json({
      canvases,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get public canvases error:', error);
    res.status(500).json({ error: 'Error fetching public canvases' });
  }
});

module.exports = router;