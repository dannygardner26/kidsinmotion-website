import React, { useState, useEffect, useRef } from 'react';
import firebaseRealtimeService from '../services/firebaseRealtimeService';

const EventChat = ({ eventId, currentUser, userRole, eventName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to chat messages
  useEffect(() => {
    if (!eventId) return;

    setIsLoading(true);
    setError(null);

    const unsubscribe = firebaseRealtimeService.subscribeToEventChat(
      eventId,
      (messagesData) => {
        setMessages(messagesData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Chat subscription error:', error);
        setError('Failed to load chat messages');
        setIsLoading(false);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    const messageData = {
      text: newMessage.trim(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email,
      senderRole: userRole
    };

    try {
      await firebaseRealtimeService.sendEventChatMessage(eventId, messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    let date;
    if (timestamp.toDate) {
      // Firestore timestamp
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      // Timestamp object
      date = new Date(timestamp.seconds * 1000);
    } else {
      // Regular date
      date = new Date(timestamp);
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return '#dc3545'; // Red
      case 'volunteer':
        return '#28a745'; // Green
      case 'parent':
        return '#007bff'; // Blue
      default:
        return '#6c757d'; // Gray
    }
  };

  if (isLoading) {
    return (
      <div className="chat-container" style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading chat messages...</div>
      </div>
    );
  }

  return (
    <div className="chat-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '500px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#fff'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px 8px 0 0'
      }}>
        <h4 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
          {eventName ? `${eventName} - Discussion` : 'Event Discussion'}
        </h4>
        <small style={{ color: '#666' }}>
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </small>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            marginTop: '50px'
          }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUser.uid;
            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                  marginBottom: '5px'
                }}
              >
                {/* Sender Info */}
                {!isOwnMessage && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginBottom: '2px',
                    fontSize: '12px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>
                      {message.senderName}
                    </span>
                    <span style={{
                      backgroundColor: getRoleBadgeColor(message.senderRole),
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      textTransform: 'uppercase'
                    }}>
                      {message.senderRole}
                    </span>
                  </div>
                )}

                {/* Message Bubble */}
                <div style={{
                  backgroundColor: isOwnMessage ? '#007bff' : '#f1f3f4',
                  color: isOwnMessage ? 'white' : '#333',
                  padding: '8px 12px',
                  borderRadius: '18px',
                  maxWidth: '70%',
                  wordWrap: 'break-word'
                }}>
                  {message.text}
                </div>

                {/* Timestamp */}
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  marginTop: '2px'
                }}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          margin: '10px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Message Input */}
      <div style={{
        padding: '15px',
        borderTop: '1px solid #eee',
        backgroundColor: '#f8f9fa'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '20px',
              fontSize: '14px',
              outline: 'none'
            }}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: isSending ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: (!newMessage.trim() || isSending) ? 0.6 : 1
            }}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
        <div style={{
          fontSize: '11px',
          color: '#666',
          marginTop: '5px',
          textAlign: 'center'
        }}>
          Press Enter to send • Max 500 characters
        </div>
      </div>
    </div>
  );
};

export default EventChat;