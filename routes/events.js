const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();
console.log('🔧 Loading events routes with real DB...');

// GET /api/events - Get all events (public, filter by status/date)
router.get('/', async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query;
    let query = {};
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }
    const events = await Event.find(query)
      .populate('createdBy', 'name email role')
      .populate('ushers', 'name profile')
      .sort({ date: 1 });
    res.json({ success: true, events, count: events.length });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('ushers', 'name profile');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/events - Create event (admin/usher)
router.post('/', authenticateToken, [
  body('title').isLength({ min: 5, max: 100 }).trim(),
  body('description').isLength({ min: 10, max: 500 }),
  body('date').isISO8601(),
  body('location').isLength({ min: 5, max: 200 }).trim(),
  body('client').isLength({ min: 2, max: 100 }).trim(),
  body('clientEmail').isEmail(),
  body('usherCount').isInt({ min: 1 }),
  body('images').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'usher') {
    return res.status(403).json({ success: false, message: 'Admin/Usher required' });
  }
  try {
    const event = new Event({
      ...req.body,
      createdBy: req.user.id
    });
    await event.save();
    const populated = await Event.findById(event._id).populate('createdBy', 'name');
    res.status(201).json({ success: true, message: 'Event created', event: populated });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/events/:id - Update event (creator or admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');
    res.json({ success: true, message: 'Event updated', event: updated });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/events/:id - Delete event (creator or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

console.log('✅ Events routes loaded with real DB');
module.exports = router;