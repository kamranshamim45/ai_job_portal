import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login.img.jpg')" }}
    >
      <div className="max-w-md w-full space-y-8 bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/30">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-white/80">
            Or{' '}
            <Link to="/register" className="font-medium text-blue-300 hover:text-blue-200 transition-colors">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-100 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 placeholder-white/60 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 placeholder-white/60 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="isAdminLogin"
              name="isAdminLogin"
              type="checkbox"
              className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-white/30 rounded bg-white/10"
              checked={isAdminLogin}
              onChange={(e) => setIsAdminLogin(e.target.checked)}
            />
            <label htmlFor="isAdminLogin" className="ml-2 block text-sm text-white/80">
              Login as Admin
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Signing in...' : isAdminLogin ? 'Sign in as Admin' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
