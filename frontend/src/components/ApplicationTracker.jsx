import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ApplicationTracker = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    if (user?.role === 'candidate') {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/jobs/applications/my');
      setApplications(response.data);
    } catch (error) {
      setError('Failed to load applications');
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
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

  const openModal = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  if (user?.role !== 'candidate') {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500">Access denied. Only candidates can view applications.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-xl">Loading your applications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          📋 My Job Applications
        </h3>
        <p className="text-gray-600">
          Track the status of all your job applications
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">You haven't applied for any jobs yet.</p>
          <p className="text-sm text-gray-400 mt-2">Start applying to jobs to see your applications here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900">{application.job_id.title}</h4>
                  <p className="text-gray-600 mt-1">{application.job_id.company}</p>
                  <p className="text-sm text-gray-500 mt-1">{application.job_id.location}</p>

                  <div className="flex items-center space-x-4 mt-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Applied on: {new Date(application.applied_on).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {application.job_id.skills_required && application.job_id.skills_required.slice(0, 3).map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {skill}
                      </span>
                    ))}
                    {application.job_id.skills_required && application.job_id.skills_required.length > 3 && (
                      <span className="text-xs text-gray-500">+{application.job_id.skills_required.length - 3} more</span>
                    )}
                  </div>
                </div>

                <div className="ml-6 text-right">
                  <div className="text-sm text-gray-500 mb-2">
                    Salary: ₹{application.job_id.salary.toLocaleString()}
                  </div>
                  <button
                    onClick={() => openModal(application.job_id)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    View Job
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={closeModal}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Job Details</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Job Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-6 text-white rounded-lg mb-6">
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
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Posted by</h4>
                  <p className="text-gray-700">{selectedJob.recruiter_id?.name || 'Company'}</p>
                  <p className="text-sm text-gray-500">Recruiter</p>
                </div>

                {/* Company */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Company</h4>
                  <p className="text-gray-700">{selectedJob.company}</p>
                </div>

                {/* Job Description */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Job Description</h4>
                  <p className="text-gray-700 whitespace-pre-line">{selectedJob.description}</p>
                </div>

                {/* Required Skills */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills_required?.length > 0 ? (
                      selectedJob.skills_required.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No specific skills listed</p>
                    )}
                  </div>
                </div>

                {/* Job Status */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Job Status</h4>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedJob.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : selectedJob.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedJob.status?.charAt(0).toUpperCase() + selectedJob.status?.slice(1) || 'Active'}
                  </span>
                </div>

                {/* Posted Date */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Posted Date</h4>
                  <p className="text-gray-700">{new Date(selectedJob.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Application Status Guide:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span>Applied - Your application is under review</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <span>Reviewed - Recruiter has seen your application</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span>Shortlisted - You're in the consideration pool</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span>Rejected - Application was not successful</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
            <span>Accepted - Congratulations! You've been selected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationTracker;
