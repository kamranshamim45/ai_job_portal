import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import JobList from './JobList';
import JobPost from './JobPost';
import JobRecommendations from './JobRecommendations';
import AdminDashboard from './AdminDashboard';
import ApplicationTracker from './ApplicationTracker';
import RecruiterDashboard from './RecruiterDashboard';
import Notifications from './Notifications';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs');

  return (
    <div className="min-h-screen bg-transparent">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'admin'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Admin Panel
                </button>
              )}
              {user?.role === 'candidate' && (
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'recommendations'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  AI Recommendations
                </button>
              )}
              <button
                onClick={() => setActiveTab('jobs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'jobs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {user?.role === 'candidate' ? 'Find Jobs' : 'Job Listings'}
              </button>
              {user?.role === 'candidate' && (
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'applications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  My Applications
                </button>
              )}
              {user?.role === 'candidate' && (
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'notifications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Notifications
                </button>
              )}
              {user?.role === 'recruiter' && (
                <>
                  <button
                    onClick={() => setActiveTab('recruiter')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'recruiter'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    Manage Jobs
                  </button>
                  <button
                    onClick={() => setActiveTab('post')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'post'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    Post Job
                  </button>
                </>
              )}
              {user?.role === 'candidate' && (
                <button
                  onClick={() => window.location.href = '/profile'}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Profile
                </button>
              )}
            </nav>
          </div>

          {/* Content */}
          <div className="bg-transparent shadow rounded-lg border border-white/20">
            <div className="px-4 py-5 sm:p-6">
              {activeTab === 'admin' && user?.role === 'admin' && <AdminDashboard />}
              {activeTab === 'recommendations' && user?.role === 'candidate' && <JobRecommendations />}
              {activeTab === 'jobs' && <JobList />}
              {activeTab === 'applications' && user?.role === 'candidate' && <ApplicationTracker />}
              {activeTab === 'notifications' && user?.role === 'candidate' && <Notifications />}
              {activeTab === 'recruiter' && user?.role === 'recruiter' && <RecruiterDashboard />}
              {activeTab === 'post' && user?.role === 'recruiter' && <JobPost />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
