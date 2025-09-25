import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const AdminMessaging = () => {
  const { currentUser, userProfile } = useAuth();
  const [messageForm, setMessageForm] = useState({
    title: '',
    message: '',
    recipient: 'all', // 'all', 'volunteers', 'parents', 'specific'
    specificUser: '',
    senderTitle: 'Director',
    senderFirstName: 'Danny',
    senderLastName: 'Gardner'
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await apiService.getAllUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      // For demo purposes, create mock users
      setUsers([
        { id: '1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
        { id: '2', email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith' },
      ]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMessageForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const sendMessage = async (userId, userEmail) => {
    const senderName = `${messageForm.senderFirstName} ${messageForm.senderLastName} (${messageForm.senderTitle})`;

    const message = {
      id: `admin_${Date.now()}_${userId}`,
      type: 'admin',
      title: messageForm.title,
      message: messageForm.message,
      from: senderName,
      timestamp: new Date().toISOString(),
      read: false,
      isSystem: false
    };

    try {
      // Try to send via backend API
      await apiService.sendMessage(userId, message);
    } catch (error) {
      console.error('Backend error, saving to localStorage:', error);
      // Fallback: save directly to localStorage
      const existingMessages = JSON.parse(localStorage.getItem(`inbox_${userId}`) || '[]');
      existingMessages.unshift(message);
      localStorage.setItem(`inbox_${userId}`, JSON.stringify(existingMessages));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      let sentCount = 0;

      if (messageForm.recipient === 'all') {
        // Send to all users
        for (const user of users) {
          await sendMessage(user.firebaseUid || user.id, user.email);
          sentCount++;
        }
      } else if (messageForm.recipient === 'volunteers') {
        // Send to volunteers only
        const volunteers = users.filter(user => user.role === 'VOLUNTEER' || user.roles?.includes('ROLE_VOLUNTEER'));
        for (const user of volunteers) {
          await sendMessage(user.firebaseUid || user.id, user.email);
          sentCount++;
        }
      } else if (messageForm.recipient === 'parents') {
        // Send to parents only
        const parents = users.filter(user => user.role === 'PARENT' || user.roles?.includes('ROLE_PARENT'));
        for (const user of parents) {
          await sendMessage(user.firebaseUid || user.id, user.email);
          sentCount++;
        }
      } else if (messageForm.recipient === 'specific' && messageForm.specificUser) {
        // Send to specific user
        const user = users.find(u => u.email === messageForm.specificUser);
        if (user) {
          await sendMessage(user.firebaseUid || user.id, user.email);
          sentCount = 1;
        }
      }

      setSuccessMessage(`Message sent successfully to ${sentCount} user(s)!`);
      setMessageForm({
        title: '',
        message: '',
        recipient: 'all',
        specificUser: '',
        senderTitle: messageForm.senderTitle,
        senderFirstName: messageForm.senderFirstName,
        senderLastName: messageForm.senderLastName
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setErrorMessage('Failed to send message. Please try again.');
    }

    setLoading(false);
  };

  // Check if user is admin
  if (!userProfile?.roles?.includes('ROLE_ADMIN')) {
    return (
      <div className="card">
        <div className="card-body">
          <p>Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <i className="fas fa-paper-plane mr-2"></i>
          Send Message to Users
        </h3>
      </div>
      <div className="card-body">
        {successMessage && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle mr-2"></i>
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sender Information */}
          <div className="row mb-4">
            <div className="col-12">
              <h4 className="text-primary mb-3">Sender Information</h4>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label htmlFor="senderTitle">Title</label>
                <input
                  type="text"
                  id="senderTitle"
                  name="senderTitle"
                  className="form-control"
                  value={messageForm.senderTitle}
                  onChange={handleInputChange}
                  placeholder="e.g., Director, Coordinator"
                  required
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label htmlFor="senderFirstName">First Name</label>
                <input
                  type="text"
                  id="senderFirstName"
                  name="senderFirstName"
                  className="form-control"
                  value={messageForm.senderFirstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="col-md-5">
              <div className="form-group">
                <label htmlFor="senderLastName">Last Name</label>
                <input
                  type="text"
                  id="senderLastName"
                  name="senderLastName"
                  className="form-control"
                  value={messageForm.senderLastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div className="form-group">
            <label htmlFor="recipient">Send To</label>
            <select
              id="recipient"
              name="recipient"
              className="form-control"
              value={messageForm.recipient}
              onChange={handleInputChange}
              required
            >
              <option value="all">All Users</option>
              <option value="volunteers">Volunteers Only</option>
              <option value="parents">Parents Only</option>
              <option value="specific">Specific User</option>
            </select>
          </div>

          {messageForm.recipient === 'specific' && (
            <div className="form-group">
              <label htmlFor="specificUser">User Email</label>
              <select
                id="specificUser"
                name="specificUser"
                className="form-control"
                value={messageForm.specificUser}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.email}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message Content */}
          <div className="form-group">
            <label htmlFor="title">Message Title</label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-control"
              value={messageForm.title}
              onChange={handleInputChange}
              placeholder="e.g., Important Update, New Event Announcement"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message Content</label>
            <textarea
              id="message"
              name="message"
              className="form-control"
              rows={6}
              value={messageForm.message}
              onChange={handleInputChange}
              placeholder="Enter your message here..."
              required
            />
          </div>

          {/* Preview */}
          <div className="form-group">
            <label>Message Preview</label>
            <div className="card border-light">
              <div className="card-body" style={{ backgroundColor: '#f8f9fa' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '0.5rem' }}>
                  <i className="fas fa-user-circle mr-1"></i>
                  {messageForm.senderFirstName} {messageForm.senderLastName} ({messageForm.senderTitle})
                </div>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                  {messageForm.title || 'Message Title'}
                </div>
                <div style={{ color: 'var(--text-light)', lineHeight: '1.4' }}>
                  {messageForm.message || 'Message content will appear here...'}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Sending...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                Send Message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminMessaging;