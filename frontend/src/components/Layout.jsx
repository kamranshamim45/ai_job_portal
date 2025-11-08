import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Notifications from './Notifications';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isRecruiterDashboard = (location.pathname === '/dashboard' || location.pathname === '/jobs' || location.pathname === '/profile') && user?.role === 'recruiter';
  const isCandidateDashboard = (location.pathname === '/dashboard' || location.pathname === '/jobs' || location.pathname === '/profile') && user?.role === 'candidate';
  const isAdminDashboard = location.pathname === '/admin-dashboard' && user?.role === 'admin';

  useEffect(() => {
    if (isAdminDashboard) {
      document.body.style.backgroundImage = "url('/background.img.png')";
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundAttachment = '';
    }
  }, [isAdminDashboard]);

  return (
    <div
      className={`min-h-screen ${isAuthPage || isRecruiterDashboard || isCandidateDashboard || isAdminDashboard ? 'bg-cover bg-center bg-no-repeat' : ''}`}
      style={isAuthPage ? { backgroundImage: "url('/login.img.jpg')" } : (isRecruiterDashboard || isCandidateDashboard || isAdminDashboard) ? { backgroundImage: "url('/background.img.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : {}}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent shadow-lg border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/">
                <img src="/logo2.png" alt="AI Job Portal Logo" className="h-36 w-auto" />
              </Link>
            </div>

            <nav className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`${
                      user?.role === 'admin'
                        ? 'text-gray-800 hover:text-gray-900 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg font-medium'
                        : 'text-white hover:text-white'
                    } transition-colors`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/jobs"
                    className={`${
                      user?.role === 'admin'
                        ? 'text-gray-800 hover:text-gray-900 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg font-medium'
                        : 'text-white hover:text-white'
                    } transition-colors`}
                  >
                    Jobs
                  </Link>
                  <Link
                    to="/profile"
                    className={`${
                      user?.role === 'admin'
                        ? 'text-gray-800 hover:text-gray-900 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg font-medium'
                        : 'text-white hover:text-white'
                    } transition-colors`}
                  >
                    Profile
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin-dashboard"
                      className="text-gray-800 hover:text-gray-900 bg-yellow-400 hover:bg-yellow-500 px-3 py-2 rounded-lg font-medium transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}
                  {user && <Notifications />}
                  <button
                    onClick={handleLogout}
                    className={`${
                      user?.role === 'admin'
                        ? 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg'
                        : 'bg-red-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-red-600/80 shadow-lg'
                    } transition-all duration-200`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="bg-blue-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-blue-600/80 transition-all duration-200 shadow-lg">
                    Login
                  </Link>
                  <Link to="/register" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-transparent border-t border-white/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-white/80">
            <p>&copy; 2025 AI Job Recommendation Portal | Developed by Kamran Shamim</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
