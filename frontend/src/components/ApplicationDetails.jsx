import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ApplicationDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchApplicationDetails();
    } else {
      fetchAllApplications();
    }
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/jobs/recruiter/applications/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setApplication(response.data);
    } catch (error) {
      setError('Failed to load application details');
      console.error('Error fetching application details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllApplications = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/jobs/recruiter/applications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setApplications(response.data);
    } catch (error) {
      setError('Failed to load applications');
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (status) => {
    setUpdating(true);
    try {
      const response = await axios.put(`http://localhost:5000/api/admin/recruiter/applications/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setApplication(response.data.application);
      alert(`Application ${status} successfully`);
    } catch (error) {
      alert('Failed to update application status');
      console.error('Error updating application status:', error);
    } finally {
      setUpdating(false);
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

  if (user?.role !== 'recruiter') {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500">Access denied. Only recruiters can view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/recruiter-dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If no id, show list of all applications
  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => navigate('/recruiter-dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">All Applications</h1>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500">No applications found.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {applications.map(app => (
                <div key={app._id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{app.user_id?.name}</h3>
                      <p className="text-gray-600">{app.job_id?.title}</p>
                      <p className="text-sm text-gray-500">Applied on: {new Date(app.applied_on).toLocaleDateString()}</p>
                    </div>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                      {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email:</p>
                      <p className="text-gray-900">{app.user_id?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Skills:</p>
                      <p className="text-gray-900">{app.user_id?.skills?.join(', ') || 'Not specified'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/application/${app._id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    View Full Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h2>
          <button
            onClick={() => navigate('/application')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md mr-4"
          >
            Back to Applications
          </button>
          <button
            onClick={() => navigate('/recruiter-dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/application')}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center mr-4"
          >
            ← Back to Applications
          </button>
          <button
            onClick={() => navigate('/recruiter-dashboard')}
            className="text-gray-600 hover:text-gray-800 mb-4 inline-flex items-center"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Application Details Card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Application Details</h1>
            <div className="flex items-center space-x-4 text-blue-100">
              <span className="flex items-center">
                👤 {application.user_id?.name || 'Applicant'}
              </span>
              <span className="flex items-center">
                💼 {application.job_id?.title || 'Job Title'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {/* Job Information */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900">{application.job_id?.title}</h4>
                <p className="text-gray-600 mt-1">{application.job_id?.company}</p>
                <p className="text-sm text-gray-500 mt-1">{application.job_id?.location}</p>
                <p className="text-sm text-gray-500 mt-1">Salary: ₹{application.job_id?.salary?.toLocaleString() || 'Not specified'}</p>
              </div>
            </div>

            {/* Applicant Information */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Applicant Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900">{application.user_id?.name}</h4>
                <p className="text-gray-600 mt-1">{application.user_id?.email}</p>
                {application.user_id?.skills && application.user_id.skills.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {application.user_id.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {application.user_id?.experience && (
                  <p className="text-sm text-gray-500 mt-2">Experience: {application.user_id.experience} years</p>
                )}
                {application.user_id?.location && (
                  <p className="text-sm text-gray-500 mt-1">Location: {application.user_id.location}</p>
                )}
              </div>
            </div>

            {/* Application Details */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Application Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Status</h4>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}
                  >
                    {application.status?.charAt(0).toUpperCase() + application.status?.slice(1) || 'Applied'}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Applied On</h4>
                  <p className="text-gray-700">{new Date(application.applied_on).toLocaleDateString()}</p>
                </div>

                {application.cover_letter && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Cover Letter</h4>
                    <p className="text-gray-700 whitespace-pre-line">{application.cover_letter}</p>
                  </div>
                )}

                {application.user_id?.resume && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Resume</h4>
                    <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap">{application.user_id.resume}</pre>
                    </div>
                  </div>
                )}

                {application.user_id?.education && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Education</h4>
                    <p className="text-gray-700">{application.user_id.education}</p>
                  </div>
                )}

                {application.user_id?.experience && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Experience</h4>
                    <p className="text-gray-700">{application.user_id.experience}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => updateApplicationStatus('reviewed')}
                  disabled={updating}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Mark as Reviewed'}
                </button>
                <button
                  onClick={() => updateApplicationStatus('shortlisted')}
                  disabled={updating}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Shortlist'}
                </button>
                <button
                  onClick={() => updateApplicationStatus('rejected')}
                  disabled={updating}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Reject'}
                </button>
                <button
                  onClick={() => updateApplicationStatus('accepted')}
                  disabled={updating}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Accept'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;
