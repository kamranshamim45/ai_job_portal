import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import JobList from './components/JobList';
import JobDetails from './components/JobDetails';
import JobPost from './components/JobPost';
import RecruiterDashboard from './components/RecruiterDashboard';
import AdminDashboard from './components/AdminDashboard';
import JobRecommendations from './components/JobRecommendations';
import ApplicationTracker from './components/ApplicationTracker';
import ApplicationDetails from './components/ApplicationDetails';
import Notifications from './components/Notifications';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-8">
          <div className="text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/job/:id" element={<JobDetails />} />
        <Route path="/job/:id/edit" element={<JobDetails />} />
        <Route path="/application" element={<ApplicationDetails />} />
        <Route path="/application/:id" element={<ApplicationDetails />} />
        <Route path="/post-job" element={<JobPost />} />
        <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/recommendations" element={<JobRecommendations />} />
        <Route path="/applications" element={<ApplicationTracker />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </Layout>
  );
}

export default App;
