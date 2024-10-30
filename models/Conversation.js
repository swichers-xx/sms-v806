const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  body: String,
  direction: { type: String, enum: ['inbound', 'outbound'] },
  status: String,
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  messages: [messageSchema],
  updatedAt: { type: Date, default: Date.now }
});

conversationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  console.log(`Updating conversation for project ID: ${this.projectId} and contact ID: ${this.contactId}`);
  next();
});

conversationSchema.virtual('turn').get(function() {
  const lastMessage = this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
  return lastMessage && lastMessage.direction === 'inbound' ? 'Your turn' : 'Their turn';
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;