import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const JobRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.skills && user.skills.length > 0) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5001/api/recommend', {
        skills: user.skills
      });

      if (response.data.success) {
        setRecommendations(response.data.recommendations);
      } else {
        setError('No recommendations available');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Failed to load recommendations. Please check if the AI service is running.');
    } finally {
      setLoading(false);
    }
  };

  const applyForJob = async (jobId) => {
    try {
      await axios.post(`http://localhost:5000/api/jobs/apply/${jobId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Application submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to apply for job');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-xl text-white">Loading AI recommendations...</div>
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

  if (!user?.skills || user.skills.length === 0) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <p>Please update your profile with skills to get AI-powered job recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-500 p-6 rounded-lg border border-yellow-600">
        <h3 className="text-xl font-semibold text-black mb-2">
          🤖 AI-Powered Job Recommendations
        </h3>
        <p className="text-black">
          Based on your skills: {user.skills.join(', ')}
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-transparent p-8 rounded-lg shadow text-center border border-white/20">
          <p className="text-white">No recommendations available at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={rec.job_id} className="bg-transparent p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-white/20">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      #{index + 1} Match
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {rec.similarity_score}% Match
                    </span>
                  </div>

                  <h4 className="text-xl font-semibold text-white">{rec.title}</h4>
                  <p className="text-white mt-2">{rec.description}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {rec.skills_required.map((skill, skillIndex) => (
                      <span key={skillIndex} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-4 mt-4 text-sm text-white">
                    <span>📍 {rec.location}</span>
                    <span>💰 ₹{rec.salary.toLocaleString()}</span>
                  </div>
                </div>

                <div className="ml-6 text-right">
                  <div className="mb-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {rec.similarity_score}%
                    </div>
                    <div className="text-xs text-white">Match Score</div>
                  </div>
                  <button
                    onClick={() => applyForJob(rec.job_id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-transparent p-4 rounded-lg border border-white/20">
        <h4 className="text-sm font-medium text-white mb-2">How AI Recommendations Work:</h4>
        <ul className="text-sm text-white space-y-1">
          <li>• Analyzes your skills using Natural Language Processing</li>
          <li>• Compares with job requirements using TF-IDF and Cosine Similarity</li>
          <li>• Ranks jobs by compatibility score (0-100%)</li>
          <li>• Updates recommendations as you add more skills</li>
        </ul>
      </div>
    </div>
  );
};

export default JobRecommendations;
