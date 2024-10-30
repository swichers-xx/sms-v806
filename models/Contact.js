const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  phone: String,
  fname: String,
  lname: String,
  surveyLink: String,
  metaData: mongoose.Schema.Types.Mixed, // Since metaData can have varied structure
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;