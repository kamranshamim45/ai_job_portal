// MongoDB Schema Design for AI Job Portal

// Users Collection
const userSchema = {
  _id: ObjectId,
  name: String,
  email: String,
  password: String, // hashed
  role: String, // 'candidate', 'recruiter', 'admin'
  skills: [String],
  experience: Number,
  location: String,
  education: String,
  resume: String, // file path or URL
  profilePic: String, // file path or URL
  createdAt: Date,
  updatedAt: Date
};

// Jobs Collection
const jobSchema = {
  _id: ObjectId,
  title: String,
  description: String,
  skillsRequired: [String],
  location: String,
  salary: Number,
  company: String,
  recruiterId: ObjectId, // reference to Users
  status: String, // 'active', 'inactive', 'approved', 'rejected'
  createdAt: Date,
  updatedAt: Date
};

// Applications Collection
const applicationSchema = {
  _id: ObjectId,
  userId: ObjectId, // reference to Users
  jobId: ObjectId, // reference to Jobs
  status: String, // 'pending', 'reviewed', 'accepted', 'rejected'
  appliedAt: Date,
  updatedAt: Date
};

// Indexes for performance
// Users: email (unique), role
// Jobs: recruiterId, status, skillsRequired
// Applications: userId, jobId, status

module.exports = { userSchema, jobSchema, applicationSchema };
