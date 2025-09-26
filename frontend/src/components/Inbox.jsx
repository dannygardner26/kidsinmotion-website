import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const Inbox = ({ isOpen, onClose, isDropdown = false }) => {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdminUser = userProfile?.roles?.includes('ROLE_ADMIN') || userProfile?.accountType === 'admin';

  const normalizeMessageLinks = (msgs, persist = false) => {
    if (!Array.isArray(msgs)) return [];
    let updated = false;
    const normalized = msgs.map(msg => {
      if (msg?.actionLink === '/volunteer-application') {
        updated = true;
        return { ...msg, actionLink: '/volunteer' };
      }
      return msg;
    });

    if (persist && updated && currentUser) {
      localStorage.setItem(`inbox_${currentUser.uid}`, JSON.stringify(normalized));
    }

    return normalized;
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadMessages();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    // Load messages and set up automatic system messages
    if (currentUser) {
      loadMessages();
      generateSystemMessages();
    }
  }, [currentUser, userProfile]);

  const loadMessages = async () => {
    if (!currentUser) return;

    if (!isAdminUser) {
      const savedMessages = JSON.parse(localStorage.getItem(`inbox_${currentUser.uid}`) || '[]');
      const normalizedSaved = normalizeMessageLinks(savedMessages, true);
      setMessages(normalizedSaved);
      const unread = normalizedSaved.filter(msg => !msg.read).length;
      setUnreadCount(unread);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Try to load messages from backend
      const response = await apiService.getInboxMessages();
      if (response && response.messages) {
        const normalizedMessages = normalizeMessageLinks(response.messages);
        const unreadFromApi = normalizedMessages.filter(msg => !msg.read).length;
        setMessages(normalizedMessages);
        setUnreadCount(response.unreadCount !== undefined ? response.unreadCount : unreadFromApi);
      } else {
        // API returned null (403 handled gracefully) or invalid format - use localStorage fallback
        const savedMessages = JSON.parse(localStorage.getItem(`inbox_${currentUser.uid}`) || '[]');
        const normalizedSaved = normalizeMessageLinks(savedMessages, true);
        const unread = normalizedSaved.filter(msg => !msg.read).length;
        setMessages(normalizedSaved);
        setUnreadCount(unread);
      }
    } catch (error) {
      // Handle any other errors
      console.warn('Inbox API error, using localStorage fallback:', error.message);
      const savedMessages = JSON.parse(localStorage.getItem(`inbox_${currentUser.uid}`) || '[]');
      const normalizedSaved = normalizeMessageLinks(savedMessages, true);
      const unread = normalizedSaved.filter(msg => !msg.read).length;
      setMessages(normalizedSaved);
      setUnreadCount(unread);
    }
    setLoading(false);
  };

  const generateSystemMessages = () => {
    if (!currentUser) return;

    const existingMessages = JSON.parse(localStorage.getItem(`inbox_${currentUser.uid}`) || '[]');
    const normalizedExisting = normalizeMessageLinks(existingMessages);
    let newMessages = [...normalizedExisting];
    let didMutate = JSON.stringify(normalizedExisting) !== JSON.stringify(existingMessages);

    // Only show welcome message for verified users
    const isVerified = currentUser && userProfile && userProfile.firstName && userProfile.lastName;

    // Determine user type - volunteers typically have 'volunteer' in email or specific roles
    const email = userProfile?.email || currentUser?.email || '';
    const isVolunteer = email.toLowerCase().includes('volunteer') ||
                       userProfile?.roles?.includes('ROLE_VOLUNTEER') ||
                       userProfile?.accountType === 'volunteer';

    const filteredMessages = newMessages.filter(msg => !(msg.type === 'welcome' || (msg.type === 'volunteer' && msg.title !== 'Apply for a Team!')));
    if (filteredMessages.length !== newMessages.length) {
      didMutate = true;
    }
    newMessages = filteredMessages;

    const hasWelcomeMessage = newMessages.some(msg => msg.type === 'welcome');

    if (isVerified && !hasWelcomeMessage) {
      const welcomeMessage = isVolunteer
        ? {
            id: `vol_team_${Date.now()}`,
            type: 'welcome',
            title: 'Apply for a Team!',
            message: 'Choose from our available volunteer teams: Coaching, Event Coordination, Social Media, Website Development, Community Outreach, and more! Submit your application to get started.',
            actionLink: '/volunteer',
            actionText: 'Apply Now',
            from: 'Kids in Motion Team',
            timestamp: new Date().toISOString(),
            read: false,
            isSystem: true
          }
        : {
            id: `parent_welcome_${Date.now()}`,
            type: 'welcome',
            title: 'Discover Our Programs!',
            message: 'Explore our free sports clinics and programs designed to help kids build skills, make friends, and have fun! Check out our upcoming events and register your children today.',
            actionLink: '/events',
            actionText: 'View Events',
            from: 'Kids in Motion Team',
            timestamp: new Date().toISOString(),
            read: false,
            isSystem: true
          };
      newMessages.unshift(welcomeMessage);
      didMutate = true;
    }

    if (didMutate) {
      const normalizedFinal = normalizeMessageLinks(newMessages, true);
      setMessages(normalizedFinal);
      const unread = normalizedFinal.filter(msg => !msg.read).length;
      setUnreadCount(unread);
    }
  };

  const markAsRead = (messageId) => {
    const updatedMessages = messages.map(msg =>
      msg.id === messageId ? { ...msg, read: true } : msg
    );
    setMessages(updatedMessages);
    localStorage.setItem(`inbox_${currentUser.uid}`, JSON.stringify(updatedMessages));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const deleteMessage = (messageId) => {
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    setMessages(updatedMessages);
    localStorage.setItem(`inbox_${currentUser.uid}`, JSON.stringify(updatedMessages));
    const unread = updatedMessages.filter(msg => !msg.read).length;
    setUnreadCount(unread);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isOpen) return null;

  if (isDropdown) {
    return (
      <div className="inbox-dropdown-content" onClick={e => e.stopPropagation()}>
        <div className="inbox-dropdown-header">
          <span className="inbox-title">
            <i className="fas fa-inbox mr-2"></i>
            Messages
            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </span>
        </div>

        <div className="inbox-dropdown-body">
          {loading ? (
            <div className="inbox-loading">
              <i className="fas fa-spinner fa-spin"></i> Loading...
            </div>
          ) : messages.length === 0 ? (
            <div className="inbox-empty">
              <i className="fas fa-inbox fa-lg"></i>
              <p>No messages</p>
            </div>
          ) : (
            <div className="inbox-messages">
              {messages.slice(0, 5).map(message => (
                <div
                  key={message.id}
                  className={`inbox-message-compact ${!message.read ? 'unread' : ''}`}
                  onClick={() => !message.read && markAsRead(message.id)}
                >
                  <div className="message-header-compact">
                    <div className="message-from-compact">
                      {message.isSystem && <i className="fas fa-cog mr-1"></i>}
                      {message.from}
                    </div>
                    <button
                      className="message-delete-compact"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMessage(message.id);
                      }}
                      title="Delete"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <div className="message-title-compact">{message.title}</div>
                  <div className="message-body-compact">{message.message}</div>
                  <div className="message-time-compact">{formatTimestamp(message.timestamp)}</div>

                  {message.actionLink && (
                    <div className="message-action-compact">
                      <a
                        href={message.actionLink}
                        className="btn btn-primary btn-xs"
                        onClick={onClose}
                      >
                        {message.actionText}
                      </a>
                    </div>
                  )}
                </div>
              ))}
              {messages.length > 5 && (
                <div className="inbox-view-all">
                  <span>View all messages...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-overlay" onClick={onClose}>
      <div className="inbox-container" onClick={e => e.stopPropagation()}>
        <div className="inbox-header">
          <h3>
            <i className="fas fa-inbox mr-2"></i>
            Inbox
            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </h3>
          <button className="inbox-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="inbox-content">
          {loading ? (
            <div className="inbox-loading">
              <i className="fas fa-spinner fa-spin"></i> Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="inbox-empty">
              <i className="fas fa-inbox fa-2x"></i>
              <p>No messages yet</p>
            </div>
          ) : (
            <div className="inbox-messages">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`inbox-message ${!message.read ? 'unread' : ''}`}
                  onClick={() => !message.read && markAsRead(message.id)}
                >
                  <div className="message-header">
                    <div className="message-from">
                      {message.isSystem && <i className="fas fa-cog mr-1"></i>}
                      {message.from}
                    </div>
                    <div className="message-actions">
                      <span className="message-time">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      <button
                        className="message-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMessage(message.id);
                        }}
                        title="Delete message"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div className="message-title">{message.title}</div>
                  <div className="message-body">{message.message}</div>

                  {message.actionLink && (
                    <div className="message-action">
                      <a
                        href={message.actionLink}
                        className="btn btn-primary btn-sm"
                        onClick={onClose}
                      >
                        {message.actionText}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook to get unread count for navbar badge
export const useInboxCount = () => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      const messages = JSON.parse(localStorage.getItem(`inbox_${currentUser.uid}`) || '[]');
      const unread = messages.filter(msg => !msg.read).length;
      setUnreadCount(unread);

      // Set up periodic check for new messages
      const interval = setInterval(() => {
        const updatedMessages = JSON.parse(localStorage.getItem(`inbox_${currentUser.uid}`) || '[]');
        const updatedUnread = updatedMessages.filter(msg => !msg.read).length;
        setUnreadCount(updatedUnread);
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  return unreadCount;
};

export default Inbox;