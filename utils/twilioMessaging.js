const twilio = require('twilio');
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const Contact = require('../models/Contact');
const Template = require('../models/Template');
const Conversation = require('../models/Conversation');

/**
 * Sends a message using Twilio after replacing placeholders with actual contact details.
 * @param {string} to - The phone number to send the message to.
 * @param {string} messageContent - The content of the message after template placeholders have been replaced.
 * @param {string} contactId - The ID of the contact to whom the message is being sent.
 * @param {string} projectId - The ID of the project the message is associated with.
 * @param {string} from - The Twilio phone number messages are sent from.
 * @returns Promise<object>
 */
const sendMessage = async (to, messageContent, contactId, projectId, from = process.env.TWILIO_PHONE_NUMBER) => {
    try {
        const message = await client.messages.create({ to, from, body: messageContent });
        console.log(`Message sent successfully to ${to}. SID: ${message.sid}`);

        // Check if a conversation exists for the contact, if not, create one
        let conversation = await Conversation.findOne({ contactId, projectId });
        if (!conversation) {
            conversation = new Conversation({
                projectId,
                contactId,
                messages: []
            });
        }

        // Add the message to the conversation
        conversation.messages.push({
            body: messageContent,
            direction: 'outbound',
            status: message.status,
            timestamp: new Date()
        });

        // Save the updated conversation
        await conversation.save();
        console.log(`Conversation updated for contact ${contactId} in project ${projectId}`);

        return message;
    } catch (error) {
        console.error('Error sending message via Twilio:', error.message, error.stack);
        throw error;
    }
};

module.exports = { sendMessage };