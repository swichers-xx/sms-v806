const express = require('express');
const router = express.Router();
const csvParser = require('csv-parser');
const upload = require('../middleware/uploadMiddleware');
const { isAuthenticated } = require('../routes/middleware/authMiddleware');
const Contact = require('../models/Contact');
const Project = require('../models/Project');
const Template = require('../models/Template');
const Conversation = require('../models/Conversation');
const twilio = require('twilio');
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const utils = require('../utils/twilioMessaging'); // Assuming utils/twilioMessaging.js exists and exports sendMessage

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management
 */

/**
 * @swagger
 * /uploadCsv:
 *   post:
 *     summary: Upload a CSV file for a project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               projectId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contacts uploaded and saved successfully
 *       400:
 *         description: No file uploaded or Project ID is required
 *       500:
 *         description: Error saving contacts to database or Error parsing CSV
 */
router.post('/uploadCsv', isAuthenticated, upload.single('file'), async (req, res) => {
  if (!req.file) {
    console.log('No file uploaded.');
    return res.status(400).send('No file uploaded.');
  }

  const projectId = req.body.projectId;
  // Ensure projectId is provided
  if (!projectId) {
    console.log('Project ID is required.');
    return res.status(400).send('Project ID is required.');
  }

  const contacts = [];
  const headers = [];

  const stream = require('stream');
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  bufferStream
    .pipe(csvParser())
    .on('headers', (headerList) => {
      headers.push(...headerList); // Capture CSV headers for template creation
    })
    .on('data', (data) => {
      // Assuming 'phone', 'fname', 'lname', 'surveyLink', etc. are columns in the CSV
      const { phone, fname, lname, surveyLink, metaData } = data;
      let parsedMetaData = {};
      try {
        parsedMetaData = JSON.parse(metaData);
      } catch (error) {
        console.error('Error parsing metaData:', error);
      }
      contacts.push({ phone, fname, lname, surveyLink, metaData: parsedMetaData, projectId });
    })
    .on('end', async () => {
      try {
        await Contact.insertMany(contacts);
        console.log('Contacts uploaded and saved successfully.');
        // Logic to handle headers and metaData keys for template creation should be implemented here if needed
        res.send('Contacts uploaded and saved successfully.');
      } catch (err) {
        console.error('Error saving contacts to database:', err);
        res.status(500).send('Error saving contacts to database.');
      }
    })
    .on('error', (err) => {
      console.error('Error parsing CSV:', err);
      res.status(500).send('Error parsing CSV.');
    });
});

/**
 * @swagger
 * /dispatch:
 *   get:
 *     summary: Get dispatch page with projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Dispatch page rendered with projects
 *       500:
 *         description: Error fetching projects
 */
router.get('/dispatch', isAuthenticated, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.session.userId });
    res.render('dispatch', { projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).send('Error fetching projects');
  }
});

/**
 * @swagger
 * /dispatchMessages:
 *   post:
 *     summary: Dispatch messages for a project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *               messageTemplateId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Messages dispatched successfully
 *       404:
 *         description: Message template not found
 *       500:
 *         description: Error dispatching messages
 */
router.post('/dispatchMessages', isAuthenticated, async (req, res) => {
  const { projectId, messageTemplateId, message } = req.body;
  try {
    const contacts = await Contact.find({ projectId });
    let messageContent = message;
    if (messageTemplateId) {
      const template = await Template.findById(messageTemplateId);
      if (!template) {
        return res.status(404).send('Message template not found');
      }
      messageContent = template.content;
    }
    for (const contact of contacts) {
      console.log(`Preparing to send message to ${contact.phone}`);
      const finalMessageContent = messageContent.replace(/\[(\w+)\]/g, (_, key) => contact[key] || '');
      await utils.sendMessage(contact.phone, finalMessageContent, contact._id, projectId)
        .then(async message => {
          console.log(`Message sent to ${contact.phone}, SID: ${message.sid}`);
          const existingConversation = await Conversation.findOne({ projectId: projectId, contactId: contact._id });
          if (existingConversation) {
            existingConversation.messages.push({
              body: finalMessageContent,
              direction: 'outbound',
              status: message.status, // Correctly handling Twilio response status
              timestamp: new Date()
            });
            await existingConversation.save();
            console.log(`Conversation updated for contact ${contact.phone}`);
          } else {
            await Conversation.create({
              projectId: projectId,
              contactId: contact._id,
              messages: [{
                body: finalMessageContent,
                direction: 'outbound',
                status: message.status, // Correctly handling Twilio response status
                timestamp: new Date()
              }]
            });
            console.log(`New conversation created for contact ${contact.phone}`);
          }
        })
        .catch(error => {
          console.error('Error sending message via Twilio:', error.message, error.stack);
        });
    }
    res.send('Messages dispatched successfully.');
  } catch (error) {
    console.error('Error dispatching messages:', error.message, error.stack);
    res.status(500).send('Error dispatching messages');
  }
});

/**
 * @swagger
 * /{projectId}/inbox:
 *   get:
 *     summary: Get inbox for a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Inbox page rendered with conversations
 *       500:
 *         description: Error fetching conversations
 */
router.get('/:projectId/inbox', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const conversations = await Conversation.find({ projectId: projectId }).sort({ updatedAt: -1 }).populate('contactId');
    res.render('inbox', { conversations, projectId });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).send('Error fetching conversations');
  }
});

/**
 * @swagger
 * /{projectId}/inboxPartial:
 *   get:
 *     summary: Get partial inbox content for AJAX requests
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Partial inbox content rendered
 *       500:
 *         description: Error fetching partial conversations
 */
router.get('/:projectId/inboxPartial', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const conversations = await Conversation.find({ projectId: projectId }).sort({ updatedAt: -1 }).populate('contactId');
    res.render('partials/_inboxList', { conversations });
  } catch (error) {
    console.error('Error fetching partial conversations:', error);
    res.status(500).send('Error fetching partial conversations');
  }
});

/**
 * @swagger
 * /create:
 *   get:
 *     summary: Get create project page
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Create project page rendered
 */
router.get('/create', isAuthenticated, (req, res) => {
  res.render('createProject');
});

/**
 * @swagger
 * /submit:
 *   post:
 *     summary: Submit a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               projectName:
 *                 type: string
 *               originationNumber:
 *                 type: string
 *               rotationSchedule:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Redirects to dispatch page
 *       500:
 *         description: Error creating project
 */
router.post('/submit', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const { projectName, originationNumber, rotationSchedule } = req.body;
    const newProject = await Project.create({ name: projectName, userId: req.session.userId, createdAt: new Date(), originationNumber, rotationSchedule });
    console.log(`New project created: ${projectName}`);

    if (req.file) {
      const contacts = [];
      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);

      bufferStream
        .pipe(csvParser())
        .on('data', (data) => {
          contacts.push({ ...data, projectId: newProject._id });
        })
        .on('end', async () => {
          await Contact.insertMany(contacts);
          console.log('Contacts uploaded and saved successfully.');
        })
        .on('error', (err) => {
          console.error('Error parsing CSV:', err);
        });
    }
    res.redirect('/dispatch');
  } catch (error) {
    console.error('Error creating project:', error.message, error.stack);
    res.status(500).send('Error creating project');
  }
});

/**
 * @swagger
 * /{projectId}/reports:
 *   get:
 *     summary: Generate and download reports for a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Report generated and downloaded successfully
 *       500:
 *         description: Error generating report
 */
router.get('/:projectId/reports', isAuthenticated, async (req, res) => {
  const { projectId } = req.params;
  try {
    const conversations = await Conversation.find({ projectId }).populate('contactId');
    const reportData = conversations.map(conversation => {
      return {
        contactName: `${conversation.contactId.fname} ${conversation.contactId.lname}`,
        lastMessage: conversation.messages[conversation.messages.length - 1].body,
        lastMessageStatus: conversation.messages[conversation.messages.length - 1].status,
        updatedAt: conversation.updatedAt
      };
    });

    const reportPath = path.join(__dirname, `../reports/project_${projectId}_report.csv`);
    const csvWriter = createCsvWriter({
      path: reportPath,
      header: [
        { id: 'contactName', title: 'Contact Name' },
        { id: 'lastMessage', title: 'Last Message' },
        { id: 'lastMessageStatus', title: 'Last Message Status' },
        { id: 'updatedAt', title: 'Last Updated At' }
      ]
    });

    await csvWriter.writeRecords(reportData)
    .then(() => {
      console.log('Report generated successfully.');
      res.download(reportPath);
    });
  } catch (error) {
    console.error('Error generating report:', error.message, error.stack);
    res.status(500).send('Error generating report');
  }
});

/**
 * @swagger
 * /{projectId}/details:
 *   get:
 *     summary: Get details for a specific project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Project details page rendered with contacts
 *       500:
 *         description: Error fetching project details
 */
router.get('/:projectId/details', isAuthenticated, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findOne({ _id: projectId, userId: req.session.userId });
    if (!project) {
      console.error('Project not found or user not authorized to view this project');
      return res.status(403).send('Not authorized to view this project');
    }
    const contacts = await Contact.find({ projectId: projectId });
    res.render('projectDetails', { project, contacts });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).send('Error fetching project details');
  }
});

/**
 * @swagger
 * /{projectId}/sendMessage:
 *   get:
 *     summary: Get page for sending messages to contacts of a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Send message page rendered
 *       500:
 *         description: Error fetching page
 */
router.get('/:projectId/sendMessage', isAuthenticated, async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findById(projectId);
    const templates = await Template.find({ projectId });
    if (!project) {
      console.log('Project not found');
      return res.status(404).send('Project not found');
    }
    res.render('sendMessage', { project, templates, projectId: projectId });
  } catch (error) {
    console.error('Error fetching send message page:', error);
    res.status(500).send('Error fetching send message page');
  }
});

/**
 * @swagger
 * /purchaseOriginationNumber:
 *   get:
 *     summary: Get page for purchasing an origination number
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Purchase number page rendered
 *       500:
 *         description: Error fetching page
 */
router.get('/purchaseOriginationNumber', isAuthenticated, (req, res) => {
  res.render('purchaseOriginationNumber');
});

/**
 * @swagger
 * /setRotationSchedule:
 *   get:
 *     summary: Get page for setting a rotation schedule
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Set schedule page rendered
 *       500:
 *         description: Error fetching page
 */
router.get('/setRotationSchedule', isAuthenticated, (req, res) => {
  res.render('setRotationSchedule');
});

/**
 * @swagger
 * /templates/create:
 *   get:
 *     summary: Get page for creating a new template
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Create template page rendered
 *       500:
 *         description: Error fetching page
 */
router.get('/templates/create', isAuthenticated, (req, res) => {
  res.render('createTemplate');
});

module.exports = router;
