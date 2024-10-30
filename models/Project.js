const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originationNumber: String, // Added field for origination number
  rotationSchedule: String, // Added field for rotation schedule
  createdAt: {
    type: Date,
    default: Date.now
  }
});

projectSchema.pre('save', async function(next) {
  try {
    // Ensure that each project has a unique name for each user
    const existingProject = await Project.findOne({ name: this.name, userId: this.userId });
    if (existingProject) {
      throw new Error('A project with this name already exists for this user.');
    }
    next();
  } catch (err) {
    console.error('Error checking for existing project:', err.message, err.stack);
    next(err);
  }
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;