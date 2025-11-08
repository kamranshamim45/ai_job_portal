import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0
  });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (user?.role === 'recruiter') {
      fetchRecruiterData();
    }
  }, [user]);

  const fetchRecruiterData = async () => {
    try {
      setLoading(true);
      const [jobsResponse, applicationsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/jobs/recruiter/my-jobs'),
        axios.get('http://localhost:5000/api/jobs/recruiter/applications')
      ]);
      setJobs(jobsResponse.data);
      setApplications(applicationsResponse.data);
    } catch (error) {
      setError('Failed to load data');
      console.error('Error fetching recruiter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/jobs/${jobId}/status`, { status });
      fetchRecruiterData(); // Refresh data
      alert(`Job ${status} successfully`);
    } catch (error) {
      alert('Failed to update job status');
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      setUpdatingStatus(true);
      await axios.put(`http://localhost:5000/api/jobs/recruiter/applications/${applicationId}/status`, { status });
      fetchRecruiterData(); // Refresh data
      alert(`Application ${status} successfully`);
      setIsProfileModalOpen(false);
    } catch (error) {
      alert('Failed to update application status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'accepted':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'recruiter') {
    return (
      <div className="bg-transparent p-8 rounded-lg border border-white/20 text-center">
        <p className="text-white">Access denied. Only recruiters can view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Tabs */}
      <div className="bg-transparent rounded-lg border border-white/20 p-6 mt-8">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded ${activeTab === 'jobs' ? 'bg-blue-500 text-white' : 'bg-transparent text-white border border-white/30 hover:bg-white/10'}`}
          >
            My Jobs
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-2 rounded ${activeTab === 'candidates' ? 'bg-blue-500 text-white' : 'bg-transparent text-white border border-white/30 hover:bg-white/10'}`}
          >
            View All Candidates
          </button>
        </div>

        {loading ? (
          <p className="text-white">Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : activeTab === 'candidates' ? (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">View All Candidates ({applications.length} total)</h2>
            {applications.length === 0 ? (
              <p className="text-white">No applications yet.</p>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app._id} className="border border-white/20 p-4 rounded bg-transparent">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white"><strong>Applicant:</strong> {app.user_id.name}</p>
                        <p className="text-white"><strong>Job:</strong> {app.job_id.title}</p>
                        <p className="text-white"><strong>Status:</strong> <span className={`px-2 py-1 rounded ${getApplicationStatusColor(app.status)}`}>{app.status}</span></p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCandidate(app);
                          setIsProfileModalOpen(true);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">My Jobs</h2>
            {jobs.length === 0 ? (
              <p className="text-white">No jobs posted yet.</p>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => (
                  <div key={job._id} className="border border-white/20 p-4 rounded bg-transparent">
                    <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                    <p className="text-white">{job.description}</p>
                    <p className="text-white">Status: <span className={`px-2 py-1 rounded ${getStatusColor(job.status)}`}>{job.status}</span></p>
                    <div className="mt-2">
                      <button onClick={() => navigate(`/job/${job._id}`)} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">View Job</button>
                      <button onClick={() => navigate(`/job/${job._id}/edit`)} className="bg-yellow-500 text-white px-4 py-2 rounded mr-2">Update Job</button>
                      <button onClick={() => updateJobStatus(job._id, 'approved')} className="bg-green-500 text-white px-4 py-2 rounded mr-2">Approve</button>
                      <button onClick={() => updateJobStatus(job._id, 'rejected')} className="bg-red-500 text-white px-4 py-2 rounded">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Modal */}
        {isProfileModalOpen && selectedCandidate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-transparent p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Candidate Profile</h3>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-white hover:text-gray-400"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg text-white">{selectedCandidate.user_id.name}</h4>
                  <p className="text-white"><strong>Email:</strong> {selectedCandidate.user_id.email}</p>
                  <p className="text-white"><strong>Job Applied For:</strong> {selectedCandidate.job_id.title}</p>
                  <p className="text-white"><strong>Application Status:</strong> <span className={`px-2 py-1 rounded ${getApplicationStatusColor(selectedCandidate.status)}`}>{selectedCandidate.status}</span></p>
                </div>

                <div>
                  <h5 className="font-semibold text-white">Education</h5>
                  <p className="text-white">{selectedCandidate.user_id.education || 'Not provided'}</p>
                </div>

                <div>
                  <h5 className="font-semibold text-white">Skills</h5>
                  <p className="text-white">{selectedCandidate.user_id.skills ? selectedCandidate.user_id.skills.join(', ') : 'Not provided'}</p>
                </div>

                <div>
                  <h5 className="font-semibold text-white">Experience</h5>
                  <p className="text-white">{selectedCandidate.user_id.experience || 'Not provided'}</p>
                </div>

                <div>
                  <h5 className="font-semibold text-white">Location</h5>
                  <p className="text-white">{selectedCandidate.user_id.location || 'Not provided'}</p>
                </div>

                <div>
                  <h5 className="font-semibold text-white">Resume</h5>
                  {selectedCandidate.user_id.resumeUrl ? (
                    <a
                      href={`http://localhost:5000${selectedCandidate.user_id.resumeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Download Resume {selectedCandidate.user_id.resumeFileName ? `(${selectedCandidate.user_id.resumeFileName})` : ''}
                    </a>
                  ) : (
                    <p className="text-white">Not provided</p>
                  )}
                </div>

                {selectedCandidate.cover_letter && (
                  <div>
                    <h5 className="font-semibold text-white">Cover Letter</h5>
                    <p className="whitespace-pre-wrap text-white">{selectedCandidate.cover_letter}</p>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => updateApplicationStatus(selectedCandidate._id, 'reviewed')}
                    disabled={updatingStatus}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating...' : 'Review'}
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(selectedCandidate._id, 'shortlisted')}
                    disabled={updatingStatus}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating...' : 'Shortlist'}
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(selectedCandidate._id, 'rejected')}
                    disabled={updatingStatus}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(selectedCandidate._id, 'accepted')}
                    disabled={updatingStatus}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating...' : 'Accept'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
