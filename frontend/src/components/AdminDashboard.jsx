import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();

      // Set up Socket.IO for real-time admin notifications
      const socket = io('http://localhost:5000');

      socket.on('admin_notification', (data) => {
        // Refresh data when admin notifications are received
        fetchAdminData();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, jobsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/overview'),
        axios.get('http://localhost:5000/api/admin/users'),
        axios.get('http://localhost:5000/api/admin/jobs')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setJobs(jobsRes.data.jobs);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveJob = async (jobId) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/approve-job/${jobId}`);

      // Emit real-time notification for job approval
      const socket = io('http://localhost:5000');
      socket.emit('job_approved', {
        jobId: jobId,
        approvedAt: new Date()
      });
      socket.disconnect();

      alert('Job approved successfully!');
      fetchAdminData();
    } catch (error) {
      alert('Failed to approve job');
    }
  };

  const deleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/jobs/${jobId}`);
        alert('Job deleted successfully!');
        fetchAdminData();
      } catch (error) {
        alert('Failed to delete job');
      }
    }
  };

  const deleteUser = async (userId, userRole) => {
    if (userRole === 'admin') {
      alert('Cannot delete admin users');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/users/${userId}`);
        alert('User deleted successfully!');
        fetchAdminData();
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="bg-gray-800 p-8 rounded-lg shadow text-center border border-gray-600">
        <p className="text-white">Access denied. Admin access required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-xl text-white">Loading admin dashboard...</div>
      </div>
    );
  }

  // Chart data
  const userRoleData = {
    labels: ['Candidates', 'Recruiters', 'Admins'],
    datasets: [{
      data: [
        stats?.userStats?.candidates || 0,
        stats?.userStats?.recruiters || 0,
        stats?.userStats?.admins || 0
      ],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      borderWidth: 1,
    }],
  };

  const jobStatusData = {
    labels: ['Active', 'Pending', 'Rejected'],
    datasets: [{
      label: 'Jobs',
      data: [
        stats?.jobStats?.active || 0,
        stats?.jobStats?.pending || 0,
        stats?.jobStats?.rejected || 0
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
    }],
  };

  const applicationTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Applications',
      data: [12, 19, 15, 25, 22, 30],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    }],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <p className="text-white mt-1">Manage users, jobs, and system analytics</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
        <nav className="flex space-x-8">
          {['overview', 'users', 'jobs', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-gray-300 hover:text-white hover:border-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
            <div className="flex items-center">
              <div className="p-2 bg-gray-700 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
            <div className="flex items-center">
              <div className="p-2 bg-gray-700 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white">Total Jobs</p>
                <p className="text-2xl font-bold text-white">{stats?.totalJobs || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
            <div className="flex items-center">
              <div className="p-2 bg-gray-700 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white">Applications</p>
                <p className="text-2xl font-bold text-white">{stats?.totalApplications || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
            <div className="flex items-center">
              <div className="p-2 bg-gray-700 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white">Active Jobs</p>
                <p className="text-2xl font-bold text-white">{stats?.activeJobs || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-gray-800 shadow rounded-lg border border-gray-600">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-white mb-4">User Management</h3>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-sm text-gray-300">{user.email}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      user.role === 'admin' ? 'bg-gray-700 text-purple-400' :
                      user.role === 'recruiter' ? 'bg-gray-700 text-green-400' :
                      'bg-gray-700 text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-300">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <Link
                      to={`/profile/${user._id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      View Profile
                    </Link>
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => deleteUser(user._id, user.role)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="bg-gray-800 shadow rounded-lg border border-gray-600">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-white mb-4">Job Management</h3>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job._id} className="p-4 border border-gray-600 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white">{job.title}</h4>
                      <p className="text-gray-200">{job.company}</p>
                      <p className="text-sm text-gray-300">{job.location}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'active' ? 'bg-gray-700 text-green-400' :
                        job.status === 'pending' ? 'bg-gray-700 text-yellow-400' :
                        'bg-gray-700 text-red-400'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {job.status === 'pending' && (
                        <button
                          onClick={() => approveJob(job._id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => deleteJob(job._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Roles Chart */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
            <h3 className="text-lg font-medium text-white mb-4">User Distribution</h3>
            <div className="h-64">
              <Doughnut data={userRoleData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Job Status Chart */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
            <h3 className="text-lg font-medium text-white mb-4">Job Status Overview</h3>
            <div className="h-64">
              <Bar data={jobStatusData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Application Trends */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 lg:col-span-2">
            <h3 className="text-lg font-medium text-white mb-4">Application Trends</h3>
            <div className="h-64">
              <Line data={applicationTrendData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
