import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
<<<<<<< HEAD
          const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users/profile`);
=======
          const response = await axios.get('http://localhost:5000/api/users/profile');
>>>>>>> 4fffe7eb334f11c3ecdc8f348bf9ff3b3cd6d817
          setUser(response.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
<<<<<<< HEAD
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
=======
      const response = await axios.post('http://localhost:5000/api/auth/login', {
>>>>>>> 4fffe7eb334f11c3ecdc8f348bf9ff3b3cd6d817
        email,
        password
      });

      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
<<<<<<< HEAD
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, userData);
=======
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
>>>>>>> 4fffe7eb334f11c3ecdc8f348bf9ff3b3cd6d817

      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
