import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const InboxModal = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = useNotifications();
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'announcement':
<<<<<<< HEAD
        return '📢';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '📬';
=======
        return 'Announcement';
      case 'info':
        return 'Info';
      case 'success':
        return 'Success';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Message';
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '5rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#2f506a',
          color: 'white'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
              Inbox
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'white',
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
<<<<<<< HEAD
            gap: '1rem',
            backgroundColor: '#f8f9fa'
=======
            gap: '0.5rem',
            backgroundColor: '#f8f9fa',
            flexWrap: 'wrap'
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
          }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: '1px solid #2f506a',
                  color: '#2f506a',
<<<<<<< HEAD
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
=======
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  flex: '1',
                  minWidth: 'fit-content',
                  whiteSpace: 'nowrap'
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2f506a';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#2f506a';
                }}
              >
<<<<<<< HEAD
                Mark all as read
=======
                Mark all read
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
              </button>
            )}
            {currentUser && (
              <button
                onClick={clearAllNotifications}
                style={{
                  background: 'none',
                  border: '1px solid #dc2626',
                  color: '#dc2626',
<<<<<<< HEAD
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
=======
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  flex: '1',
                  minWidth: 'fit-content',
                  whiteSpace: 'nowrap'
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#dc2626';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#dc2626';
                }}
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Notifications List */}
        <div style={{
          maxHeight: '50vh',
          overflowY: 'auto',
          padding: notifications.length === 0 ? '3rem 1.5rem' : '0'
        }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>No messages</h4>
              <p style={{ margin: 0 }}>You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: notification.isRead ? 'transparent' : '#f0f9ff',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  position: 'relative'
                }}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
                onMouseEnter={(e) => {
                  if (!notification.isRead) {
                    e.currentTarget.style.backgroundColor = '#e0f2fe';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notification.isRead ? 'transparent' : '#f0f9ff';
                }}
              >
<<<<<<< HEAD
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: notification.isRead ? '500' : '700',
                        color: notification.isRead ? '#374151' : '#1f2937',
                        lineHeight: '1.4'
=======
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '0.125rem' }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        fontWeight: notification.isRead ? '500' : '700',
                        color: notification.isRead ? '#374151' : '#1f2937',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        flex: 1,
                        paddingRight: '0.5rem'
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                      }}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div style={{
<<<<<<< HEAD
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#dc2626',
                          borderRadius: '50%',
                          flexShrink: 0,
                          marginLeft: '0.5rem',
=======
                          width: '6px',
                          height: '6px',
                          backgroundColor: '#dc2626',
                          borderRadius: '50%',
                          flexShrink: 0,
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                          marginTop: '0.5rem'
                        }} />
                      )}
                    </div>

                    <p style={{
                      margin: '0 0 0.75rem 0',
<<<<<<< HEAD
                      fontSize: '0.95rem',
                      color: '#6b7280',
                      lineHeight: '1.5'
=======
                      fontSize: '0.9rem',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      wordBreak: 'break-word',
                      overflow: 'hidden'
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                    }}>
                      {notification.message}
                    </p>

<<<<<<< HEAD
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
=======
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        wordBreak: 'break-word',
                        flex: '1 1 auto'
                      }}>
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                        {notification.from && <span>{notification.from} • </span>}
                        {formatDate(notification.createdAt)}
                      </div>

                      {!notification.isPersistent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
<<<<<<< HEAD
                            padding: '0.25rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            transition: 'color 0.2s'
=======
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            transition: 'color 0.2s',
                            flexShrink: 0
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#dc2626'}
                          onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Special handling for sign-in message */}
                {notification.id === 'signin-prompt' && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
<<<<<<< HEAD
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
=======
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                      <Link
                        to="/login"
                        onClick={() => {
                          onClose();
                        }}
                        style={{
                          backgroundColor: '#2f506a',
                          color: 'white',
<<<<<<< HEAD
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          transition: 'background-color 0.2s'
=======
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          transition: 'background-color 0.2s',
                          flex: '1',
                          textAlign: 'center',
                          minWidth: 'fit-content'
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#1e3a52'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#2f506a'}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={onClose}
                        style={{
                          backgroundColor: '#e53e3e',
                          color: 'white',
<<<<<<< HEAD
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          transition: 'background-color 0.2s'
=======
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          transition: 'background-color 0.2s',
                          flex: '1',
                          textAlign: 'center',
                          minWidth: 'fit-content'
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#c53030'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#e53e3e'}
                      >
                        Create Account
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxModal;