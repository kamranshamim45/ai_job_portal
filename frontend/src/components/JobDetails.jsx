import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const JobDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    skills_required: '',
    location: '',
    salary: '',
    company: ''
  });

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/jobs/${id}`);
      setJob(response.data);

      // Check if user has already applied
      if (user?.role === 'candidate') {
        const applicationsResponse = await axios.get('http://localhost:5000/api/jobs/applications/my', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const hasApplied = applicationsResponse.data.some(app => app.job_id._id === id);
        setHasApplied(hasApplied);
      }
    } catch (error) {
      setError('Failed to load job details');
      console.error('Error fetching job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setApplying(true);
    try {
      await axios.post(`http://localhost:5000/api/jobs/apply/${id}`, {}, {
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

  const handleEditClick = () => {
    setEditForm({
      title: job.title,
      description: job.description,
      skills_required: job.skills_required?.join(', ') || '',
      location: job.location,
      salary: job.salary || '',
      company: job.company
    });
    setIsEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        ...editForm,
        skills_required: editForm.skills_required
          .split(',')
          .map(skill => skill.trim())
          .filter(skill => skill)
      };

      const response = await axios.put(`http://localhost:5000/api/jobs/${id}`, updateData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setJob(response.data.job);
      setIsEditing(false);
      alert('Job updated successfully!');
    } catch (error) {
      alert('Failed to update job. Please try again.');
      console.error('Error updating job:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Job deleted successfully!');
      navigate('/recruiter-dashboard');
    } catch (error) {
      alert('Failed to delete job. Please try again.');
      console.error('Error deleting job:', error);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdminAction = async (status) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/jobs/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setJob(prev => ({ ...prev, status }));
      alert(`Job ${status} successfully!`);
    } catch (error) {
      alert('Failed to update job status. Please try again.');
      console.error('Error updating job status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
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
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
          >
            ← Back to Jobs
          </button>
        </div>

        {/* Conditional Section */}
        {isEditing ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
              <h1 className="text-3xl font-bold mb-2">Edit Job</h1>
            </div>
            <div className="px-6 py-8">
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    name="title"
                    value={editForm.title}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={editForm.company}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={editForm.location}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <input
                    type="number"
                    name="salary"
                    value={editForm.salary}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="skills_required"
                    value={editForm.skills_required}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., JavaScript, React, Node.js"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Job Details Card */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              {/* Job Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
                <h1 className="text-3xl font-bold mb-2">{job?.title}</h1>
                <div className="flex items-center space-x-4 text-blue-100">
                  <span className="flex items-center">
                    📍 {job?.location}
                  </span>
                  <span className="flex items-center">
                    💰 ₹{job?.salary?.toLocaleString() || 'Not specified'}
                  </span>
                </div>
              </div>

              {/* Job Content */}
              <div className="px-6 py-8">
                {/* Recruiter Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Posted by</h3>
                  <p className="text-gray-700">{job?.recruiter_id?.name || 'Company'}</p>
                  <p className="text-sm text-gray-500">Recruiter</p>
                </div>

                {/* Job Description */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">{job?.description}</p>
                </div>

                {/* Required Skills */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job?.skills_required?.length > 0 ? (
                      job.skills_required.map((skill, index) => (
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
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Status</h3>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      job?.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : job?.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {job?.status?.charAt(0).toUpperCase() + job?.status?.slice(1) || 'Active'}
                  </span>
                </div>

                {/* Candidate Apply Button */}
                {user?.role === 'candidate' && (
                  <div className="border-t pt-6">
                    {hasApplied ? (
                      <div className="text-center text-green-700 font-medium">
                        ✅ You have already applied for this job
                      </div>
                    ) : (
                      <button
                        onClick={handleApply}
                        disabled={applying || job?.status !== 'approved'}
                        className={`w-full py-3 px-6 rounded-lg font-medium text-white ${
                          job?.status === 'approved'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {applying ? 'Applying...' : 'Apply for this Job'}
                      </button>
                    )}
                  </div>
                )}

                {/* Recruiter Actions */}
                {user?.role === 'recruiter' && job?.recruiter_id?._id === user._id && (
                  <div className="border-t pt-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Management</h3>
                    <div className="flex space-x-4 mb-4">
                      <button
                        onClick={handleEditClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
                      >
                        Edit Job
                      </button>
                      <button
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium"
                      >
                        Delete Job
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                {user?.role === 'admin' && job?.status === 'pending' && (
                  <div className="border-t pt-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Admin Actions</h3>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleAdminAction('approved')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
                      >
                        Approve Job
                      </button>
                      <button
                        onClick={() => handleAdminAction('rejected')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium"
                      >
                        Reject Job
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JobDetails;
