import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      // Connect to Socket.IO server
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      // Join user room
      newSocket.emit('join', user._id);

      // Listen for notifications
      newSocket.on('new_application', (data) => {
        addNotification({
          id: Date.now(),
          type: 'application',
          title: 'New Application',
          message: data.message,
          timestamp: new Date(),
          read: false
        });
      });

      newSocket.on('new_job', (data) => {
        addNotification({
          id: Date.now(),
          type: 'job',
          title: 'New Job Posted',
          message: data.message,
          timestamp: new Date(),
          read: false
        });
      });

      newSocket.on('job_status_update', (data) => {
        addNotification({
          id: Date.now(),
          type: 'status',
          title: 'Job Status Update',
          message: data.message,
          timestamp: new Date(),
          read: false
        });
      });

      newSocket.on('admin_notification', (data) => {
        if (user.role === 'admin') {
          addNotification({
            id: Date.now(),
            type: 'admin',
            title: 'Admin Alert',
            message: data.message,
            timestamp: new Date(),
            read: false
          });
        }
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application':
        return '📋';
      case 'job':
        return '💼';
      case 'status':
        return '✅';
      case 'admin':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'application':
        return 'border-blue-500 bg-blue-50';
      case 'job':
        return 'border-green-500 bg-green-50';
      case 'status':
        return 'border-purple-500 bg-purple-50';
      case 'admin':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5H9v-5h6z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 bg-gray-400 text-white text-xs rounded-full h-3 w-3"></span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute top-12 right-0 bg-white border rounded-lg shadow-lg p-3 min-w-64 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <div className="flex space-x-2 mb-3">
              <button
                onClick={markAllAsRead}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
              >
                Mark All Read
              </button>
              <button
                onClick={clearAll}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5H9v-5h6z" />
                </svg>
                <p>No notifications yet</p>
                <p className="text-xs mt-1">Real-time updates will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border-l-4 cursor-pointer transition-colors ${
                      notification.read
                        ? 'bg-gray-50 border-gray-300'
                        : `${getNotificationColor(notification.type)} border-l-4`
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                          {notification.title}
                        </p>
                        <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Real-time notifications powered by Socket.IO
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
