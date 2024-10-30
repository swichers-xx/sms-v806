const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['initial', 'response'] },
  content: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
});

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;