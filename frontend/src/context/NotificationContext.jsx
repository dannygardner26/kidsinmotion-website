import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Default message for unauthenticated users
  const defaultSignInMessage = {
    id: 'signin-prompt',
    title: 'Sign In to Access All Features',
    message: 'Create an account or sign in to register for events, volunteer, and receive personalized updates from Kids in Motion.',
    type: 'info',
    createdAt: new Date().toISOString(),
    isRead: false,
    isPersistent: true // This message persists until user signs in
  };

  // Load notifications from localStorage
  useEffect(() => {
    const loadNotifications = () => {
      if (!currentUser) {
        // For unauthenticated users, always show the sign-in message
        setNotifications([defaultSignInMessage]);
        setUnreadCount(1);
      } else {
        // For authenticated users, load from localStorage
        const stored = localStorage.getItem(`notifications_${currentUser.uid}`);
        if (stored) {
          const parsedNotifications = JSON.parse(stored);
          setNotifications(parsedNotifications);
          setUnreadCount(parsedNotifications.filter(n => !n.isRead).length);
        } else {
          // New user - no notifications yet
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    loadNotifications();
  }, [currentUser]);

  // Save notifications to localStorage (only for authenticated users)
  useEffect(() => {
    if (currentUser && notifications.length > 0) {
      localStorage.setItem(`notifications_${currentUser.uid}`, JSON.stringify(notifications));
    }
  }, [notifications, currentUser]);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isRead: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );

    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const newNotifications = prev.filter(n => n.id !== notificationId);

      // Update unread count if the deleted notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }

      return newNotifications;
    });
  };

  const clearAllNotifications = () => {
    if (!currentUser) {
      // For unauthenticated users, keep the sign-in message
      setNotifications([defaultSignInMessage]);
      setUnreadCount(1);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Function to simulate receiving a new announcement (for testing)
  const simulateAnnouncement = (announcement) => {
    if (currentUser) {
      addNotification({
        title: announcement.title,
        message: announcement.message,
        type: 'announcement',
        from: 'Kids in Motion Admin'
      });
    }
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    simulateAnnouncement
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};