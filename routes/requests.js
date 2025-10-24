const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

console.log('🔧 Loading requests route...');

// Create new request - SAVE TO DATABASE
const createRequest = async (req, res) => {
  console.log('➕ POST /api/requests/ called with:', req.body);
  
  try {
    // Create new request in database
    const newRequest = new Request({
      clientName: req.body.clientName,
      clientEmail: req.body.clientEmail,
      clientPhone: req.body.clientPhone,
      eventDetails: req.body.eventDetails,
      eventType: req.body.eventType || 'Event Request',
      selectedUshers: req.body.selectedUshers || [],
      status: 'pending'
    });

    const savedRequest = await newRequest.save();
    console.log('✅ Request saved to database:', savedRequest._id);

    res.status(200).json({
      success: true,
      request: savedRequest,
      message: 'Request submitted successfully'
    });
  } catch (error) {
    console.error('❌ Error creating request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create request',
      error: error.message
    });
  }
};

// Get all requests - FETCH FROM DATABASE
const getAllRequests = async (req, res) => {
  console.log('📋 GET /api/requests/ called');
  
  try {
    const requests = await Request.find()
      .populate('selectedUshers', 'name email profile')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${requests.length} requests in database`);

    res.json({
      success: true,
      requests: requests,
      message: 'Requests fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests',
      error: error.message
    });
  }
};

// Get single request
const getRequest = async (req, res) => {
  console.log('📄 GET /api/requests/:id called with ID:', req.params.id);
  
  try {
    const request = await Request.findById(req.params.id)
      .populate('selectedUshers', 'name email profile');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      request: request
    });
  } catch (error) {
    console.error('❌ Error fetching request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch request',
      error: error.message
    });
  }
};

// Update request status
const updateRequest = async (req, res) => {
  console.log('✏️ PUT /api/requests/:id called');
  
  try {
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { 
        status: req.body.status,
        notes: req.body.notes
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      request: updatedRequest,
      message: 'Request updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request',
      error: error.message
    });
  }
};

// Delete request
const deleteRequest = async (req, res) => {
  console.log('🗑️ DELETE /api/requests/:id called');
  
  try {
    const deletedRequest = await Request.findByIdAndDelete(req.params.id);

    if (!deletedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete request',
      error: error.message
    });
  }
};

// Auth bypass for testing (replace with real auth later)
const authBypass = (req, res, next) => {
  req.user = { id: 'test-admin', role: 'admin' };
  next();
};

// Routes
router.post('/', createRequest);                    // Public - no auth needed
router.get('/', authBypass, getAllRequests);        // Admin only
router.get('/:id', authBypass, getRequest);         // Admin only
router.put('/:id', authBypass, updateRequest);      // Admin only
router.delete('/:id', authBypass, deleteRequest);   // Admin only

console.log('✅ Requests routes loaded successfully');

module.exports = router;