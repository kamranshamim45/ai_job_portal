const express = require('express');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get admin dashboard overview
router.get('/overview', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'active' });

    // User stats by role
    const userStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Job stats by status
    const jobStats = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers,
      totalJobs,
      totalApplications,
      activeJobs,
      userStats: userStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      jobStats: jobStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all jobs with status (admin only)
router.get('/jobs', auth, adminAuth, async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('recruiter_id', 'name email')
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users for admin
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve job
router.post('/approve-job/:jobId', auth, adminAuth, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.jobId,
      { status: 'active' },
      { new: true }
    ).populate('recruiter_id', 'name email');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Emit real-time notification for job approval
    const io = req.app.get('io');
    if (io) {
      io.emit('job_approved', {
        jobTitle: job.title,
        recruiterId: job.recruiter_id._id.toString(),
        job: {
          id: job._id,
          title: job.title,
          status: 'active',
          approvedAt: new Date()
        }
      });
    }

    res.json({ message: 'Job approved successfully', job });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete job
router.delete('/jobs/:jobId', auth, adminAuth, async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Delete associated applications
    await Application.deleteMany({ job_id: req.params.jobId });

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(req.params.userId);

    // Delete associated jobs and applications
    await Job.deleteMany({ recruiter_id: req.params.userId });
    await Application.deleteMany({ user_id: req.params.userId });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve or reject job
router.put('/jobs/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('recruiter_id', 'name email');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({
      message: `Job ${status} successfully`,
      job
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all applications (admin only)
router.get('/applications', auth, adminAuth, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('user_id', 'name email skills')
      .populate('job_id', 'title company location')
      .sort({ applied_on: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update application status (admin only)
router.put('/applications/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['applied', 'reviewed', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user_id', 'name email')
     .populate('job_id', 'title company');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update application status (recruiter only for their job applications)
router.put('/recruiter/applications/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    // Check if user is recruiter
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can update application status' });
    }

    const validStatuses = ['applied', 'reviewed', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find the application and check if the recruiter owns the job
    const application = await Application.findById(req.params.id).populate('job_id', 'recruiter_id');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job_id.recruiter_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    application.status = status;
    await application.save();

    await application.populate('user_id', 'name email');
    await application.populate('job_id', 'title company');

    res.json({
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
