const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  status: {
    type: String,
    enum: ['applied', 'reviewed', 'shortlisted', 'rejected', 'accepted'],
    default: 'applied'
  },
  applied_on: {
    type: Date,
    default: Date.now
  },
  resume: {
    type: String, // URL to applicant's resume
  },
  cover_letter: {
    type: String,
  }
});

module.exports = mongoose.model('Application', applicationSchema);
