const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./middleware/authMiddleware');
const Contact = require('../models/Contact');
const Template = require('../models/Template');
const utils = require('../utils/twilioMessaging');

router.post('/project/:projectId/confirmAndDispatchMessages', isAuthenticated, async (req, res) => {
  const { projectId } = req.params;
  const { messageTemplateId, message } = req.body;

  try {
    const contacts = await Contact.find({ projectId });
    if (!contacts || contacts.length === 0) {
      return res.status(404).send('No contacts found for this project.');
    }

    let messageContent = message;
    if (messageTemplateId) {
      const template = await Template.findById(messageTemplateId);
      if (!template) {
        return res.status(404).send('Message template not found');
      }
      messageContent = template.content;
    }

    // Prepare messages for confirmation
    const messagesToConfirm = contacts.map(contact => {
      const finalMessageContent = messageContent.replace(/\[(\w+)\]/g, (_, key) => contact[key] || '');
      return {
        phone: contact.phone,
        message: finalMessageContent,
        contactId: contact._id,
        projectId
      };
    });

    // Send back the messages for confirmation before dispatching
    res.json(messagesToConfirm);
  } catch (error) {
    console.error('Error in confirmAndDispatchMessages:', error.message, error.stack);
    res.status(500).send('Error preparing messages for dispatch');
  }
});

// Endpoint to actually send the messages after user confirmation
router.post('/project/:projectId/dispatchConfirmedMessages', isAuthenticated, async (req, res) => {
  const { confirmedMessages } = req.body;

  try {
    for (const messageInfo of confirmedMessages) {
      await utils.sendMessage(messageInfo.phone, messageInfo.message, messageInfo.contactId, messageInfo.projectId)
        .then(message => {
          console.log(`Message sent to ${messageInfo.phone}, SID: ${message.sid}`);
        })
        .catch(error => {
          console.error('Error sending message via Twilio:', error.message, error.stack);
        });
    }

    res.send('All confirmed messages dispatched successfully.');
  } catch (error) {
    console.error('Error dispatching confirmed messages:', error.message, error.stack);
    res.status(500).send('Error dispatching confirmed messages');
  }
});

module.exports = router;