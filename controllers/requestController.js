const Request = require('../models/Request');
const User = require('../models/User');
const { sendNewRequestNotification } = require('../utils/sendEmail');

// Create new client request
// POST /api/requests
// Public
const createRequest = async (req, res) => {
  try {
    const { 
      clientName, 
      clientEmail, 
      clientPhone,
      selectedUshers,
      eventType,
      eventDate,
      location,
      message 
    } = req.body;

    // Validate selected ushers exist and are active
    const ushers = await User.find({
      _id: { $in: selectedUshers },
      role: 'usher',
      isActive: true
    });

    if (ushers.length !== selectedUshers.length) {
      return res.status(400).json({ 
        message: 'Some selected ushers are not available' 
      });
    }

    const request = new Request({
      clientName,
      clientEmail,
      clientPhone,
      selectedUshers,
      eventType,
      eventDate,
      location,
      message
    });

    await request.save();

    // Populate ushers for email notification
    await request.populate('selectedUshers', 'name email profile.profileImage');

    // Send notification email to admin
    await sendNewRequestNotification(request, ushers);

    res.status(201).json({
      success: true,
      message: 'Request submitted successfully',
      request
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Error submitting request' });
  }
};

// Get all requests
// GET /api/requests
// Private/Admin
const getRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const requests = await Request.find(filter)
      .populate('selectedUshers', 'name email profile.profileImage')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Request.countDocuments(filter);

    res.json({
      success: true,
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRequests: total
      }
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Error fetching requests' });
  }
};

// Get single request
// GET /api/requests/:id
// Private/Admin
const getRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('selectedUshers', 'name email profile');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Error fetching request' });
  }
};

// Update request status
// PUT /api/requests/:id
// Private/Admin
const updateRequest = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (status) request.status = status;
    if (adminNotes !== undefined) request.adminNotes = adminNotes;

    await request.save();

    res.json({
      success: true,
      message: 'Request updated successfully',
      request
    });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: 'Error updating request' });
  }
};

// Delete request
// DELETE /api/requests/:id
// Private/Admin
const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    await Request.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ message: 'Error deleting request' });
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequest,
  updateRequest,
  deleteRequest
};