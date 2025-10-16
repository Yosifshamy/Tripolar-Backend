const Event = require('../models/Event')

// Create new event
const createEvent = async (req, res) => {
  try {
    console.log('Creating event - Request body:', req.body)

    const { title, description, date, location, client, usherCount } = req.body

    // Validate required fields
    if (!title || !description || !date || !location || !client || !usherCount) {
      console.log('Missing required fields:', {
        title: !!title,
        description: !!description,
        date: !!date,
        location: !!location,
        client: !!client,
        usherCount: !!usherCount
      })
      return res.status(400).json({
        success: false,
        message: 'All fields are required: title, description, date, location, client, usherCount'
      })
    }

    // Validate date
    const eventDate = new Date(date)
    if (isNaN(eventDate.getTime())) {
      console.log('Invalid date:', date)
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      })
    }

    // Validate usher count
    const parsedUsherCount = parseInt(usherCount)
    if (isNaN(parsedUsherCount) || parsedUsherCount < 1) {
      console.log('Invalid usher count:', usherCount)
      return res.status(400).json({
        success: false,
        message: 'Usher count must be a valid number greater than 0'
      })
    }

    // Create event (without images for now)
    const eventData = {
      title: title.trim(),
      description: description.trim(),
      date: eventDate,
      location: location.trim(),
      client: client.trim(),
      usherCount: parsedUsherCount,
      images: [] // Empty for now
    }

    console.log('Creating event with data:', eventData)
    const event = new Event(eventData)
    await event.save()

    console.log('Event created successfully:', event._id)
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    })

  } catch (error) {
    console.error('Error creating event:', error)

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Event with this title already exists'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating event',
      error: error.message
    })
  }
}

// Get all events
const getAllEvents = async (req, res) => {
  try {
    console.log('Fetching all events...')
    const events = await Event.find({})
      .sort({ createdAt: -1 })
      .lean()

    console.log(`Found ${events.length} events`)
    res.json({
      success: true,
      events
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching events'
    })
  }
}

// Get single event
const getEvent = async (req, res) => {
  try {
    console.log('Fetching event:', req.params.id)
    const event = await Event.findById(req.params.id)

    if (!event) {
      console.log('Event not found:', req.params.id)
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    console.log('Event found:', event.title)
    res.json({
      success: true,
      event
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching event'
    })
  }
}

// Update event
const updateEvent = async (req, res) => {
  try {
    const { title, description, date, location, client, usherCount } = req.body
    const eventId = req.params.id

    console.log('Updating event:', eventId)
    console.log('Update data:', req.body)

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    // Update fields
    const updateData = {}
    if (title) updateData.title = title.trim()
    if (description) updateData.description = description.trim()
    if (date) updateData.date = new Date(date)
    if (location) updateData.location = location.trim()
    if (client) updateData.client = client.trim()
    if (usherCount) updateData.usherCount = parseInt(usherCount)

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true, runValidators: true }
    )

    console.log('Event updated successfully')
    res.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    })

  } catch (error) {
    console.error('Error updating event:', error)

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      })
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating event'
    })
  }
}

// Delete event
const deleteEvent = async (req, res) => {
  try {
    console.log('Deleting event:', req.params.id)
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    await Event.findByIdAndDelete(req.params.id)
    console.log('Event deleted successfully')

    res.json({
      success: true,
      message: 'Event deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting event:', error)
    res.status(500).json({
      success: false,
      message: 'Server error deleting event'
    })
  }
}

// Export all functions
module.exports = {
  createEvent,
  getAllEvents,
  getEvent,
  updateEvent,
  deleteEvent
}