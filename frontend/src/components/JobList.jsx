import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const JobList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchJobs();

    // Set up Socket.IO for real-time job updates
    const socket = io('http://localhost:5000');

    socket.on('new_job', (data) => {
      // Add new job to the list
      setJobs(prevJobs => [data.job, ...prevJobs]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, locationFilter, skillFilter]);

  const fetchJobs = async () => {
    try {
      // Fetch all jobs for admins, active jobs for others
      const endpoint = user?.role === 'admin' ? 'http://localhost:5000/api/admin/jobs' : 'http://localhost:5000/api/jobs';
      const response = await axios.get(endpoint, {
        headers: user?.role === 'admin' ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}
      });
      setJobs(response.data.jobs || response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (skillFilter) {
      filtered = filtered.filter(job =>
        job.skills_required.some(skill =>
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        )
      );
    }

    setFilteredJobs(filtered);
  };

  const approveJob = async (jobId) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/approve-job/${jobId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Emit real-time notification for job approval
      const socket = io('http://localhost:5000');
      socket.emit('job_approved', {
        jobId: jobId,
        approvedAt: new Date()
      });
      socket.disconnect();

      alert('Job approved successfully!');
      fetchJobs();
    } catch (error) {
      alert('Failed to approve job');
    }
  };

  const deleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert('Job deleted successfully!');
        fetchJobs();
      } catch (error) {
        alert('Failed to delete job');
      }
    }
  };

  const applyForJob = async (jobId) => {
    try {
      await axios.post(`http://localhost:5000/api/jobs/apply/${jobId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Emit real-time notification for job application
      const socket = io('http://localhost:5000');
      socket.emit('job_applied', {
        jobId: jobId,
        appliedAt: new Date()
      });
      socket.disconnect();

      alert('Application submitted successfully!');
      setHasApplied(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to apply for job');
    }
  };

  const openModal = async (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);

    // Check if user has already applied for this job
    if (user?.role === 'candidate') {
      try {
        const applicationsResponse = await axios.get('http://localhost:5000/api/jobs/applications/my', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const hasApplied = applicationsResponse.data.some(app => app.job_id._id === job._id);
        setHasApplied(hasApplied);
      } catch (error) {
        console.error('Error checking application status:', error);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
    setHasApplied(false);
  };

  const handleApplyInModal = async () => {
    if (!selectedJob) return;

    setApplying(true);
    try {
      await axios.post(`http://localhost:5000/api/jobs/apply/${selectedJob._id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHasApplied(true);
      alert('Application submitted successfully!');
    } catch (error) {
      alert('Failed to apply for job. Please try again.');
      console.error('Error applying for job:', error);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-xl">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Panel Header */}
      {user?.role === 'admin' && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
          <h2 className="text-2xl font-bold text-white">Admin Job Management</h2>
          <p className="text-white mt-1">Review and manage all job postings</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
        <h3 className="text-lg font-medium text-white mb-4">Filter Jobs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-white">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Job title, company, or keywords"
              className="mt-1 block w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-white">
              Location
            </label>
            <input
              type="text"
              id="location"
              placeholder="City, state, or remote"
              className="mt-1 block w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="skill" className="block text-sm font-medium text-white">
              Skills
            </label>
            <input
              type="text"
              id="skill"
              placeholder="Required skills"
              className="mt-1 block w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-600 text-center">
            <p className="text-white">No jobs found matching your criteria.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job._id} className="bg-gray-800 p-6 rounded-lg border border-gray-600 hover:border-gray-500 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'active' ? 'bg-gray-700 text-green-400' :
                      job.status === 'pending' ? 'bg-gray-700 text-yellow-400' :
                      'bg-gray-700 text-red-400'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-lg text-white mt-1">{job.company}</p>
                  <p className="text-sm text-gray-300 mt-1">{job.location}</p>
                  <p className="text-gray-200 mt-3">{job.description}</p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {job.skills_required.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-blue-400 border border-blue-400">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-4 mt-4 text-sm text-gray-300">
                    <span>Salary: ₹{job.salary}</span>
                    <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  <button
                    onClick={() => openModal(job)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                  {user?.role === 'candidate' && job.status === 'active' && (
                    <button
                      onClick={() => applyForJob(job._id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Apply Now
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <div className="flex flex-col space-y-2">
                      {job.status === 'pending' && (
                        <button
                          onClick={() => approveJob(job._id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => deleteJob(job._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto h-full w-full z-50" onClick={closeModal}>
          <div className="relative top-20 mx-auto p-5 border border-gray-600 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Job Details</h3>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-300"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Job Header */}
              <div className="bg-blue-600 px-6 py-6 text-white rounded-lg mb-6">
                <h1 className="text-2xl font-bold mb-2">{selectedJob.title}</h1>
                <div className="flex items-center space-x-4 text-blue-100">
                  <span className="flex items-center">
                    📍 {selectedJob.location}
                  </span>
                  <span className="flex items-center">
                    💰 ₹{selectedJob.salary?.toLocaleString() || 'Not specified'}
                  </span>
                </div>
              </div>

              {/* Job Content */}
              <div className="space-y-6">
                {/* Recruiter Info */}
                <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <h4 className="text-lg font-semibold text-white mb-2">Posted by</h4>
                  <p className="text-white">{selectedJob.recruiter_id?.name || 'Company'}</p>
                  <p className="text-sm text-gray-300">Recruiter</p>
                </div>

                {/* Company */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Company</h4>
                  <p className="text-white">{selectedJob.company}</p>
                </div>

                {/* Job Description */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Job Description</h4>
                  <p className="text-white whitespace-pre-line">{selectedJob.description}</p>
                </div>

                {/* Required Skills */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills_required?.length > 0 ? (
                      selectedJob.skills_required.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-white">No specific skills listed</p>
                    )}
                  </div>
                </div>

                {/* Job Status */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Job Status</h4>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedJob.status === 'active'
                        ? 'bg-green-500 text-white'
                        : selectedJob.status === 'pending'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {selectedJob.status?.charAt(0).toUpperCase() + selectedJob.status?.slice(1) || 'Active'}
                  </span>
                </div>

                {/* Posted Date */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Posted Date</h4>
                  <p className="text-white">{new Date(selectedJob.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Admin Controls */}
                {user?.role === 'admin' && (
                  <div className="border-t border-gray-600 pt-6">
                    <div className="flex space-x-4">
                      {selectedJob.status === 'pending' && (
                        <button
                          onClick={() => approveJob(selectedJob._id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium"
                        >
                          Approve Job
                        </button>
                      )}
                      <button
                        onClick={() => deleteJob(selectedJob._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium"
                      >
                        Delete Job
                      </button>
                    </div>
                  </div>
                )}

                {/* Apply Button for Candidates */}
                {user?.role === 'candidate' && (
                  <div className="border-t border-gray-600 pt-6">
                    {hasApplied ? (
                      <div className="text-center text-green-400 font-medium">
                        ✅ You have already applied for this job
                      </div>
                    ) : (
                      <button
                        onClick={handleApplyInModal}
                        disabled={applying || selectedJob.status !== 'active'}
                        className={`w-full py-3 px-6 rounded-lg font-medium text-white ${
                          selectedJob.status === 'active'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {applying ? 'Applying...' : 'Apply for this Job'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobList;
