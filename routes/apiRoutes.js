const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Added for ObjectId type in aggregation
const { isAuthenticated } = require('./middleware/authMiddleware');
const Conversation = require('../models/Conversation');

/**
 * @swagger
 * tags:
 *   name: API
 *   description: API for statistics and data manipulation
 */

/**
 * @swagger
 * /statistics/{projectId}:
 *   get:
 *     summary: Fetches messaging statistics for a specific project
 *     tags: [API]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to fetch statistics for
 *     responses:
 *       200:
 *         description: Successfully fetched statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMessagesSent:
 *                   type: integer
 *                 totalMessagesDelivered:
 *                   type: integer
 *                 totalResponsesReceived:
 *                   type: integer
 *       400:
 *         description: Invalid project ID
 *       500:
 *         description: Error fetching statistics
 */
router.get('/statistics/:projectId', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const conversations = await Conversation.find({ projectId: projectId });

    let totalMessagesSent = 0;
    let totalMessagesDelivered = 0;
    let totalResponsesReceived = 0;

    conversations.forEach(conversation => {
      conversation.messages.forEach(message => {
        if (message.direction === 'outbound') {
          totalMessagesSent++;
          if (message.status === 'delivered') {
            totalMessagesDelivered++;
          }
        } else if (message.direction === 'inbound') {
          totalResponsesReceived++;
        }
      });
    });

    console.log(`Statistics fetched for project ID: ${projectId}`);

    res.json({
      totalMessagesSent,
      totalMessagesDelivered,
      totalResponsesReceived
    });
  } catch (error) {
    console.error(`Error fetching statistics for project ID: ${req.params.projectId}: ${error.message}`);
    console.error(error.stack);
    res.status(500).send('Error fetching statistics');
  }
});

/**
 * @swagger
 * /conversations/{projectId}:
 *   get:
 *     summary: Fetches all conversations for a specific project
 *     tags: [API]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to fetch conversations for
 *     responses:
 *       200:
 *         description: Successfully fetched conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Invalid project ID
 *       500:
 *         description: Error fetching conversations
 */
router.get('/conversations/:projectId', isAuthenticated, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const conversations = await Conversation.find({ projectId })
      .populate('contactId', 'phone')
      .lean(); // Use lean() to get plain JavaScript objects
    conversations.forEach(conversation => {
      conversation.turn = conversation.messages.length > 0 && conversation.messages[conversation.messages.length - 1].direction === 'inbound' ? 'Your turn' : 'Their turn';
    });
    console.log(`Conversations fetched for project ID: ${projectId}`);
    res.json({ conversations });
  } catch (error) {
    console.error(`Error fetching conversations for project ID: ${projectId}: ${error.message}`);
    console.error(error.stack);
    res.status(500).send('Error fetching conversations');
  }
});

/**
 * @swagger
 * /realtime-statistics/{projectId}:
 *   get:
 *     summary: Fetches real-time messaging statistics for a specific project
 *     tags: [API]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to fetch real-time statistics for
 *     responses:
 *       200:
 *         description: Successfully fetched real-time statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMessagesSent:
 *                   type: integer
 *                 totalMessagesDelivered:
 *                   type: integer
 *                 totalResponsesReceived:
 *                   type: integer
 *       400:
 *         description: Invalid project ID
 *       500:
 *         description: Error fetching statistics
 */
router.get('/realtime-statistics/:projectId', isAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    // Example logic to fetch statistics, to be replaced with actual logic based on your application's data structure
    const totalMessagesSent = await Conversation.aggregate([
      { $match: { projectId: mongoose.Types.ObjectId(projectId) } },
      { $unwind: '$messages' },
      { $match: { 'messages.direction': 'outbound' } },
      { $count: 'totalMessagesSent' }
    ]);

    const totalMessagesDelivered = await Conversation.aggregate([
      { $match: { projectId: mongoose.Types.ObjectId(projectId) } },
      { $unwind: '$messages' },
      { $match: { 'messages.status': 'delivered' } },
      { $count: 'totalMessagesDelivered' }
    ]);

    const totalResponsesReceived = await Conversation.aggregate([
      { $match: { projectId: mongoose.Types.ObjectId(projectId) } },
      { $unwind: '$messages' },
      { $match: { 'messages.direction': 'inbound' } },
      { $count: 'totalResponsesReceived' }
    ]);

    res.json({
      totalMessagesSent: totalMessagesSent.length ? totalMessagesSent[0].totalMessagesSent : 0,
      totalMessagesDelivered: totalMessagesDelivered.length ? totalMessagesDelivered[0].totalMessagesDelivered : 0,
      totalResponsesReceived: totalResponsesReceived.length ? totalResponsesReceived[0].totalResponsesReceived : 0
    });
    console.log(`Real-time statistics fetched for project ID: ${projectId}`);
  } catch (error) {
    console.error(`Error fetching real-time statistics for project ID: ${projectId}: ${error.message}`);
    console.error(error.stack);
    res.status(500).send('Error fetching real-time statistics');
  }
});

module.exports = router;