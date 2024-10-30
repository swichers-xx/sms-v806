const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./middleware/authMiddleware');
const Project = require('../models/Project');
const Conversation = require('../models/Conversation');

// Get conversations for a specific project
router.get('/project/:projectId/inbox', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    // Verify projectId is a valid MongoDB ObjectId
    if (!projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send('Invalid project ID');
    }
    const conversations = await Conversation.find({ projectId }).sort({ updatedAt: -1 }).populate('contactId');
    res.render('inbox', { conversations, projectId });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).send('Error fetching conversations');
  }
});

// Get partial inbox content for AJAX updates
router.get('/project/:projectId/inboxPartial', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    // Verify projectId is a valid MongoDB ObjectId
    if (!projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send('Invalid project ID');
    }
    const conversations = await Conversation.find({ projectId }).sort({ updatedAt: -1 }).populate('contactId');
    res.render('partials/_inboxList', { conversations });
  } catch (error) {
    console.error('Error fetching partial conversations:', error);
    res.status(500).send('Error fetching partial conversations');
  }
});

module.exports = router;
