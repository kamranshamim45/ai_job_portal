const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require(path.join(__dirname, '../backend/models/User'));
const Job = require(path.join(__dirname, '../backend/models/Job'));
const Application = require(path.join(__dirname, '../backend/models/Application'));
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/job-portal')
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});

    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);

    // Create users
    const users = await User.insertMany([
      {
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword,
        role: "candidate",
        skills: ["JavaScript", "React", "Node.js"],
        experience: "3 years",
        location: "New York",
        education: "Bachelor's in Computer Science"
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: hashedPassword,
        role: "recruiter",
        skills: ["HR", "Recruitment"],
        experience: "5 years",
        location: "San Francisco",
        company: "Tech Corp"
      },
      {
        name: "Admin User",
        email: "admin@example.com",
        password: hashedAdminPassword,
        role: "admin"
      }
    ]);

    console.log('Users created:', users.length);

    // Create jobs
    const jobs = await Job.insertMany([
      {
        title: "Frontend Developer",
        description: "Develop user interfaces using React and JavaScript",
        skills_required: ["JavaScript", "React", "CSS"],
        location: "Remote",
        salary: 80000,
        company: "Tech Corp",
        recruiter_id: users[1]._id, // Jane Smith (recruiter)
        status: "approved"
      },
      {
        title: "Backend Developer",
        description: "Build scalable APIs with Node.js and Express",
        skills_required: ["Node.js", "Express", "MongoDB"],
        location: "New York",
        salary: 90000,
        company: "Data Systems Inc",
        recruiter_id: users[1]._id,
        status: "approved"
      }
    ]);

    console.log('Jobs created:', jobs.length);

    // Create applications
    const applications = await Application.insertMany([
      {
        user_id: users[0]._id, // John Doe
        job_id: jobs[0]._id, // Frontend Developer
        status: "pending",
        resume: "Experienced frontend developer with 3 years of experience"
      }
    ]);

    console.log('Applications created:', applications.length);
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();
