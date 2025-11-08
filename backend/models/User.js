const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['candidate', 'recruiter', 'admin'],
    default: 'candidate'
  },
  skills: [{
    type: String,
    trim: true
  }],
  resume: {
    type: String, // URL to resume file
  },
  resumeUrl: {
    type: String, // URL to uploaded resume file
  },
  resumeFileName: {
    type: String, // Original filename of uploaded resume
  },
  profile_pic: {
    type: String, // URL to profile picture
  },
  location: {
    type: String,
    trim: true
  },
  education: {
    type: String,
    trim: true
  },
  experience: {
    type: String, // years of experience
    trim: true
  },
  // Company details for recruiters
  companyName: {
    type: String,
    trim: true
  },
  companyLogo: {
    type: String, // URL to company logo
  },
  industryType: {
    type: String,
    trim: true
  },
  companyWebsite: {
    type: String,
    trim: true
  },
  companySize: {
    type: String,
    trim: true
  },
  headquarters: {
    type: String,
    trim: true
  },
  aboutCompany: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
