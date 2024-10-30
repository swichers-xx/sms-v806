const express = require('express');
const { isAuthenticated } = require('./middleware/authMiddleware');
const Template = require('../models/Template');
const Project = require('../models/Project');
const Contact = require('../models/Contact');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Templates
 *   description: Template management
 */

/**
 * @swagger
 * /create:
 *   get:
 *     summary: Get page for creating a new template
 *     tags: [Templates]
 *     security:
 *       - secssionAuth: []
 *     responses:
 *       200:
 *         description: Create template page rendered
 *       500:
 *         description: Error fetching page
 */
router.get('/create', isAuthenticated, (req, res) => {
  res.render('createTemplate');
});

/**
 * @swagger
 * /createInitialMessageTemplate:
 *   post:
 *     summary: Create an initial message template
 *     tags: [Templates]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the message template.
 *               projectId:
 *                 type: string
 *                 description: The project ID the template belongs to.
 *     responses:
 *       200:
 *         description: Initial message template created successfully.
 *       400:
 *         description: Content is required.
 *       404:
 *         description: Project not found or access denied.
 *       500:
 *         description: Error creating initial message template.
 */
router.post('/createInitialMessageTemplate', isAuthenticated, async (req, res) => {
  try {
    const { content, projectId } = req.body;
    if (!content) {
      console.log('Content is required for creating an initial message template.');
      return res.status(400).send('Content is required.');
    }
    const project = await Project.findOne({ _id: projectId, userId: req.session.userId });
    if (!project) {
      console.log(`Project not found or access denied for projectId: ${projectId}`);
      return res.status(404).send('Project not found or you do not have access to it.');
    }
    const template = new Template({ type: 'initial', content, projectId });
    await template.save();
    console.log('Initial message template created successfully.');
    res.send('Initial message template created successfully.');
  } catch (error) {
    console.error('Error creating initial message template:', error.message, error.stack);
    res.status(500).send(error.message);
  }
});

/**
 * @swagger
 * /createResponseTemplate:
 *   post:
 *     summary: Create a response template
 *     tags: [Templates]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the response template.
 *               projectId:
 *                 type: string
 *                 description: The project ID the template belongs to.
 *     responses:
 *       200:
 *         description: Response template created successfully.
 *       400:
 *         description: Content is required.
 *       404:
 *         description: Project not found or access denied.
 *       500:
 *         description: Error creating response template.
 */
router.post('/createResponseTemplate', isAuthenticated, async (req, res) => {
  try {
    const { content, projectId } = req.body;
    if (!content) {
      console.log('Content is required for creating a response template.');
      return res.status(400).send('Content is required.');
    }
    const project = await Project.findOne({ _id: projectId, userId: req.session.userId });
    if (!project) {
      console.log(`Project not found or access denied for projectId: ${projectId}`);
      return res.status(404).send('Project not found or you do not have access to it.');
    }
    const template = new Template({ type: 'response', content, projectId });
    await template.save();
    console.log('Response template created successfully.');
    res.send('Response template created successfully.');
  } catch (error) {
    console.error('Error creating response template:', error.message, error.stack);
    res.status(500).send(error.message);
  }
});

/**
 * @swagger
 * /saveTemplate:
 *   post:
 *     summary: Save a message as a new template
 *     tags: [Templates]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the template.
 *               projectId:
 *                 type: string
 *                 description: The project ID the template belongs to.
 *               type:
 *                 type: string
 *                 description: The type of the template, either 'initial' or 'response'.
 *     responses:
 *       200:
 *         description: Template saved successfully.
 *       400:
 *         description: Content and type are required.
 *       404:
 *         description: Project not found or access denied.
 *       500:
 *         description: Error saving the template.
 */
router.post('/saveTemplate', isAuthenticated, async (req, res) => {
  try {
    const { content, projectId, type } = req.body;
    if (!content || !type) {
      console.log('Content and type are required for saving a template.');
      return res.status(400).send('Content and type are required.');
    }
    if (!['initial', 'response'].includes(type)) {
      console.log('Invalid template type. Must be either "initial" or "response".');
      return res.status(400).send('Invalid template type.');
    }
    const project = await Project.findOne({ _id: projectId, userId: req.session.userId });
    if (!project) {
      console.log(`Project not found or access denied for projectId: ${projectId}`);
      return res.status(404).send('Project not found or you do not have access to it.');
    }
    const template = new Template({ type, content, projectId });
    await template.save();
    console.log('Template saved successfully.');
    res.send('Template saved successfully.');
  } catch (error) {
    console.error('Error saving the template:', error.message, error.stack);
    res.status(500).send('Error saving the template');
  }
});

/**
 * @swagger
 * /getTemplatesByProjectId/{projectId}:
 *   get:
 *     summary: Get all templates by project ID
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID to fetch templates for
 *     responses:
 *       200:
 *         description: Templates fetched successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Error fetching templates
 */
router.get('/getTemplatesByProjectId/:projectId', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const templates = await Template.find({ projectId });
    if (!templates) {
      console.log(`No templates found for projectId: ${projectId}`);
      return res.status(404).send('No templates found for this project.');
    }
    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error.message, error.stack);
    res.status(500).send('Error fetching templates');
  }
});

/**
 * @swagger
 * /createCustomTemplate:
 *   post:
 *     summary: Create a custom message template with multiple blocks
 *     tags: [Templates]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: The project ID the template belongs to.
 *               blocks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: The type of the block (e.g., 'greeting', 'identifier', 'message', 'link', 'optout').
 *                     content:
 *                       type: array
 *                       items:
 *                         type: string
 *                         description: The content of the block.
 *     responses:
 *       200:
 *         description: Custom template created successfully.
 *       400:
 *         description: Project ID and blocks are required.
 *       404:
 *         description: Project not found or access denied.
 *       500:
 *         description: Error creating custom template.
 */
router.post('/createCustomTemplate', isAuthenticated, async (req, res) => {
  try {
    const { projectId, blocks } = req.body;
    if (!projectId || !blocks) {
      console.log('Project ID and blocks are required for creating a custom template.');
      return res.status(400).send('Project ID and blocks are required.');
    }
    const project = await Project.findOne({ _id: projectId, userId: req.session.userId });
    if (!project) {
      console.log(`Project not found or access denied for projectId: ${projectId}`);
      return res.status(404).send('Project not found or you do not have access to it.');
    }

    const templates = [];
    blocks.forEach(block => {
      block.content.forEach(content => {
        const template = new Template({ type: block.type, content, projectId });
        templates.push(template);
      });
    });

    await Template.insertMany(templates);
    console.log('Custom templates created successfully.');
    res.send('Custom templates created successfully.');
  } catch (error) {
    console.error('Error creating custom template:', error.message, error.stack);
    res.status(500).send('Error creating custom template');
  }
});

module.exports = router;
