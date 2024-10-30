const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./middleware/authMiddleware');
const Template = require('../models/Template');

router.post('/project/:projectId/saveTemplate', isAuthenticated, async (req, res) => {
  const { projectId } = req.params;
  const { templateName, templateContent } = req.body;
  if (!templateName || !templateContent) {
    console.log('Template name and content are required.');
    return res.status(400).send('Template name and content are required.');
  }
  try {
    const newTemplate = await Template.create({
      type: 'initial', // Assuming 'initial' as default type; adjust as necessary
      content: templateContent,
      projectId: projectId
    });
    console.log(`New template created with ID: ${newTemplate._id}`);
    res.status(201).send({ message: 'Template saved successfully', templateId: newTemplate._id });
  } catch (error) {
    console.error('Error saving template:', error.message, error.stack);
    res.status(500).send('Error saving template');
  }
});

module.exports = router;