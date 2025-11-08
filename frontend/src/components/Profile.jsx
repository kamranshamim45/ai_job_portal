import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: '',
    resume: '',
    location: '',
    experience: '',
    education: '',
    // Company fields for recruiters
    companyName: '',
    companyLogo: '',
    industryType: '',
    companyWebsite: '',
    companySize: '',
    headquarters: '',
    aboutCompany: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (id) {
        // Viewing another user's profile
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users/profile/${id}`);
          setProfileData(response.data);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else if (user) {
        // Viewing own profile
        setProfileData(user);
        setFormData({
          name: user.name || '',
          email: user.email || '',
          skills: user.skills?.join(', ') || '',
          resume: user.resume || '',
          location: user.location || '',
          experience: user.experience || '',
          education: user.education || '',
          // Company fields for recruiters
          companyName: user.companyName || '',
          companyLogo: user.companyLogo || '',
          industryType: user.industryType || '',
          companyWebsite: user.companyWebsite || '',
          companySize: user.companySize || '',
          headquarters: user.headquarters || '',
          aboutCompany: user.aboutCompany || '',
          contactEmail: user.contactEmail || '',
          contactPhone: user.contactPhone || ''
        });
      }
    };

    fetchProfile();
  }, [user, id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF or Word document');
        return;
      }
      setResumeFile(file);
    }
  };

  const uploadResume = async () => {
    if (!resumeFile) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('resume', resumeFile);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/users/upload-resume`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Update user context with resume URL
      updateUser({ ...user, resumeUrl: response.data.resumeUrl, resumeFileName: response.data.fileName });
      alert('Resume uploaded successfully!');
      setResumeFile(null);
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
      };

      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/users/profile`, updateData);

      // Update user context
      updateUser(response.data.user);

      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      skills: user?.skills?.join(', ') || '',
      resume: user?.resume || '',
      location: user?.location || '',
      experience: user?.experience || '',
      education: user?.education || '',
      // Company fields for recruiters
      companyName: user?.companyName || '',
      companyLogo: user?.companyLogo || '',
      industryType: user?.industryType || '',
      companyWebsite: user?.companyWebsite || '',
      companySize: user?.companySize || '',
      headquarters: user?.headquarters || '',
      aboutCompany: user?.aboutCompany || '',
      contactEmail: user?.contactEmail || '',
      contactPhone: user?.contactPhone || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please login to view your profile.</p>
      </div>
    );
  }

  // Only allow candidates to edit their own profile, recruiters and admins can view others
  const isOwnProfile = !id || id === user._id;
  if (!isOwnProfile && user.role === 'candidate') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You can only view your own profile.</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const displayUser = profileData || user;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{displayUser?.name}</h1>
              <p className="text-blue-100 mt-1">{displayUser?.email}</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white mt-2 capitalize">
                {displayUser?.role}
              </span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {displayUser?.role === 'candidate' ? '👨‍💻' : displayUser?.role === 'recruiter' ? '🏢' : '⚙️'}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-6 py-8">
          {!isEditing ? (
            // View Mode
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {displayUser?.role === 'recruiter' ? 'Company Details' : 'Profile Information'}
                </h2>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    {displayUser?.role === 'recruiter' ? 'Edit Company Details' : 'Edit Profile'}
                  </button>
                )}
              </div>

              {displayUser?.role === 'recruiter' ? (
                // Company Details for Recruiters
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                        <p className="mt-1 text-gray-900">{displayUser?.companyName || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Industry Type</label>
                        <p className="mt-1 text-gray-900">{displayUser?.industryType || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company Website</label>
                        <p className="mt-1 text-gray-900">
                          {displayUser?.companyWebsite ? (
                            <a href={displayUser.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              {displayUser.companyWebsite}
                            </a>
                          ) : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company Size</label>
                        <p className="mt-1 text-gray-900">{displayUser?.companySize || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact & Location</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Headquarters</label>
                        <p className="mt-1 text-gray-900">{displayUser?.headquarters || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                        <p className="mt-1 text-gray-900">{displayUser?.contactEmail || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                        <p className="mt-1 text-gray-900">{displayUser?.contactPhone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Profile Information for Candidates
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-gray-900">{displayUser?.name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-gray-900">{displayUser?.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <p className="mt-1 text-gray-900">{displayUser?.location || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Skills</label>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {displayUser?.skills && displayUser.skills.length > 0 ? (
                            displayUser.skills.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-gray-500">No skills added yet</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Experience</label>
                        <p className="mt-1 text-gray-900">{displayUser?.experience || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Education</label>
                        <p className="mt-1 text-gray-900">{displayUser?.education || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {displayUser?.role === 'recruiter' && displayUser?.aboutCompany && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">About Company</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{displayUser.aboutCompany}</p>
                  </div>
                </div>
              )}

              {(displayUser?.resume || displayUser?.resumeUrl) && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Resume</h3>
                  {displayUser.resume && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-gray-700">{displayUser.resume}</p>
                    </div>
                  )}
                  {displayUser.resumeUrl && (
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">📄</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{displayUser.resumeFileName || 'Resume Document'}</p>
                            <p className="text-xs text-gray-500">Click to view/download</p>
                          </div>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL}${displayUser.resumeUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                        >
                          View Resume
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isOwnProfile && displayUser?.role === 'candidate' && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">💡 Pro Tip</h3>
                  <p className="text-blue-700">
                    Add more skills to your profile to get better AI-powered job recommendations!
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {displayUser?.role === 'recruiter' ? 'Edit Company Details' : 'Edit Profile'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {displayUser?.role === 'recruiter' ? (
                  // Company Edit Form for Recruiters
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="industryType" className="block text-sm font-medium text-gray-700">
                          Industry Type
                        </label>
                        <input
                          type="text"
                          id="industryType"
                          name="industryType"
                          value={formData.industryType}
                          onChange={handleInputChange}
                          placeholder="e.g., Technology, Healthcare, Finance"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">
                          Company Website
                        </label>
                        <input
                          type="url"
                          id="companyWebsite"
                          name="companyWebsite"
                          value={formData.companyWebsite}
                          onChange={handleInputChange}
                          placeholder="https://www.example.com"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">
                          Company Size
                        </label>
                        <select
                          id="companySize"
                          name="companySize"
                          value={formData.companySize}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="">Select company size</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="501-1000">501-1000 employees</option>
                          <option value="1000+">1000+ employees</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="headquarters" className="block text-sm font-medium text-gray-700">
                          Headquarters
                        </label>
                        <input
                          type="text"
                          id="headquarters"
                          name="headquarters"
                          value={formData.headquarters}
                          onChange={handleInputChange}
                          placeholder="City, State/Country"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          id="contactEmail"
                          name="contactEmail"
                          value={formData.contactEmail}
                          onChange={handleInputChange}
                          placeholder="contact@company.com"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                          Contact Phone
                        </label>
                        <input
                          type="tel"
                          id="contactPhone"
                          name="contactPhone"
                          value={formData.contactPhone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 123-4567"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="aboutCompany" className="block text-sm font-medium text-gray-700">
                        About Company
                      </label>
                      <textarea
                        id="aboutCompany"
                        name="aboutCompany"
                        rows={4}
                        value={formData.aboutCompany}
                        onChange={handleInputChange}
                        placeholder="Tell us about your company..."
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </>
                ) : (
                  // Profile Edit Form for Candidates
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                          Location
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="City, State/Country"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                          Experience
                        </label>
                        <input
                          type="text"
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          placeholder="e.g., 3 years as Software Engineer"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="education" className="block text-sm font-medium text-gray-700">
                        Education
                      </label>
                      <input
                        type="text"
                        id="education"
                        name="education"
                        value={formData.education}
                        onChange={handleInputChange}
                        placeholder="e.g., Bachelor's in Computer Science"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                        Skills (comma-separated) *
                      </label>
                      <textarea
                        id="skills"
                        name="skills"
                        rows={3}
                        value={formData.skills}
                        onChange={handleInputChange}
                        placeholder="e.g., JavaScript, React, Node.js, Python"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Separate skills with commas. These will be used for AI job recommendations.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
                        Resume/Summary
                      </label>
                      <textarea
                        id="resume"
                        name="resume"
                        rows={4}
                        value={formData.resume}
                        onChange={handleInputChange}
                        placeholder="Brief summary of your professional background..."
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Upload Resume File (PDF/DOC/DOCX)
                      </label>
                      <div className="mt-1 flex items-center space-x-4">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <button
                          type="button"
                          onClick={uploadResume}
                          disabled={!resumeFile || uploading}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? 'Uploading...' : 'Upload Resume'}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Max file size: 5MB. Supported formats: PDF, DOC, DOCX
                      </p>
                      {user?.resumeFileName && (
                        <p className="mt-1 text-sm text-green-600">
                          Current resume: {user.resumeFileName}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
