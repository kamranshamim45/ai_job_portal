const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { auth, recruiterAuth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all jobs (public)
router.get('/', async (req, res) => {
  try {
    const { location, skills, page = 1, limit = 10 } = req.query;

    let query = { status: 'approved' };

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (skills) {
      const skillArray = skills.split(',').map(skill => skill.trim());
      query.skills_required = { $in: skillArray };
    }

    const jobs = await Job.find(query)
      .populate('recruiter_id', 'name company')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('recruiter_id', 'name email company');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create job (recruiter only)
router.post('/', auth, recruiterAuth, async (req, res) => {
  try {
    const { title, description, skills_required, location, salary, company } = req.body;

    const job = new Job({
      title,
      description,
      skills_required,
      location,
      salary,
      company,
      recruiter_id: req.user._id,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    await job.save();

    // Emit real-time notification for new job posting
    const io = req.app.get('io');
    if (io) {
      io.emit('job_posted', {
        jobTitle: title,
        job: {
          id: job._id,
          title,
          company,
          location,
          skills_required,
          postedAt: new Date()
        }
      });
    }

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update job (recruiter who created it or admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the recruiter who created the job or admin
    if (job.recruiter_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      job[key] = updates[key];
    });

    await job.save();

    res.json({
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete job (recruiter who created it or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the recruiter who created the job or admin
    if (job.recruiter_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Apply for job
router.post('/apply/:id', auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user._id;
    const { cover_letter } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId).populate('recruiter_id', 'name email');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({ user_id: userId, job_id: jobId });
    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // Create application
    const application = new Application({
      user_id: userId,
      job_id: jobId,
      cover_letter,
      resume: req.user.resumeUrl || req.user.resume
    });

    await application.save();

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('job_applied', {
        jobTitle: job.title,
        recruiterId: job.recruiter_id._id.toString(),
        application: {
          userId: userId,
          jobId: jobId,
          appliedAt: new Date()
        }
      });
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's applications
router.get('/applications/my', auth, async (req, res) => {
  try {
    const applications = await Application.find({ user_id: req.user._id })
      .populate('job_id', 'title company location salary')
      .sort({ applied_on: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve job (admin only)
router.put('/approve/:id', auth, adminAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.status = 'approved';
    await job.save();

    res.json({ message: 'Job approved successfully', job });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recruiter's jobs
router.get('/recruiter/my-jobs', auth, recruiterAuth, async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter_id: req.user._id })
      .sort({ createdAt: -1 });

    // Add application count for each job
    const jobsWithCount = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await Application.countDocuments({ job_id: job._id });
        return {
          ...job.toObject(),
          applicationCount
        };
      })
    );

    res.json(jobsWithCount);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get applications for recruiter's jobs
router.get('/recruiter/applications', auth, recruiterAuth, async (req, res) => {
  try {
    // First get all jobs posted by this recruiter
    const recruiterJobs = await Job.find({ recruiter_id: req.user._id }).select('_id');

    // Get all applications for these jobs
    const applications = await Application.find({
      job_id: { $in: recruiterJobs.map(job => job._id) }
    })
      .populate('job_id', 'title company location')
      .populate('user_id', 'name email skills location experience education resumeUrl resumeFileName')
      .sort({ applied_on: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific application details for recruiter
router.get('/recruiter/applications/:id', auth, recruiterAuth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job_id', 'title company location salary recruiter_id')
      .populate('user_id', 'name email skills location experience education resume');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if the recruiter owns the job
    if (application.job_id.recruiter_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update job status (recruiter only for their own jobs)
router.put('/:id/status', auth, recruiterAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the recruiter who created the job
    if (job.recruiter_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    // Only allow certain status changes for recruiters
    if (!['approved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status for recruiter' });
    }

    job.status = status;
    await job.save();

    res.json({ message: 'Job status updated successfully', job });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update application status (recruiter only for their job applications)
router.put('/recruiter/applications/:id/status', auth, recruiterAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('job_id', 'recruiter_id');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if the recruiter owns the job
    if (application.job_id.recruiter_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Validate status
    const validStatuses = ['applied', 'reviewed', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    application.status = status;
    await application.save();

    res.json({ message: 'Application status updated successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
