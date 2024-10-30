const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../routes/middleware/authMiddleware');
const Project = require('../models/Project');
const Conversation = require('../models/Conversation');
const Contact = require('../models/Contact');

// Main dashboard route
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    // Fetch user's projects
    const projects = await Project.find({ userId: req.session.userId });
    
    // Get statistics for each project
    const projectStats = await Promise.all(projects.map(async (project) => {
      const contacts = await Contact.countDocuments({ projectId: project._id });
      const conversations = await Conversation.countDocuments({ projectId: project._id });
      const messages = await Conversation.aggregate([
        { $match: { projectId: project._id } },
        { $unwind: '$messages' },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]);
      
      return {
        ...project.toObject(),
        contactCount: contacts,
        conversationCount: conversations,
        messageCount: messages[0]?.count || 0
      };
    }));

    // Calculate overall statistics
    const totalContacts = projectStats.reduce((sum, project) => sum + project.contactCount, 0);
    const totalConversations = projectStats.reduce((sum, project) => sum + project.conversationCount, 0);
    const totalMessages = projectStats.reduce((sum, project) => sum + project.messageCount, 0);

    res.render('dashboard', {
      projects: projectStats,
      stats: {
        totalProjects: projects.length,
        totalContacts,
        totalConversations,
        totalMessages
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).render('error', {
      title: 'Dashboard Error',
      message: 'Error loading dashboard data. Please try again.'
    });
  }
});

// Dashboard API endpoint for real-time updates
router.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.session.userId });
    const totalContacts = await Contact.countDocuments({ 
      projectId: { $in: projects.map(p => p._id) } 
    });
    const totalConversations = await Conversation.countDocuments({ 
      projectId: { $in: projects.map(p => p._id) } 
    });
    
    const messages = await Conversation.aggregate([
      { $match: { projectId: { $in: projects.map(p => p._id) } } },
      { $unwind: '$messages' },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

    res.json({
      totalProjects: projects.length,
      totalContacts,
      totalConversations,
      totalMessages: messages[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Error fetching dashboard statistics' });
  }
});

module.exports = router;
