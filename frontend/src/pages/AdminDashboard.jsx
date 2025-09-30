import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import AdminMessaging from '../components/AdminMessaging';

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState([]);
  // const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'INFO',
    sendToWebsite: true,
    sendToEmail: false,
    sendToPhone: false,
    targetAudience: 'ALL_USERS'
  });

  useEffect(() => {
    fetchEvents();
    // fetchAnnouncements();
  }, []);

  const fetchEvents = async () => {
    try {
      const eventsData = await apiService.getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteEvent(eventId);
      setEvents(events.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event: ' + error.message);
    }
  };

  // Announcements feature disabled
  // const fetchAnnouncements = async () => {
  //   try {
  //     const announcementsData = await apiService.getAllAnnouncements();
  //     setAnnouncements(announcementsData);
  //   } catch (error) {
  //     console.error('Error fetching announcements:', error);
  //     setError(error.message);
  //   }
  // };

  const handleAnnouncementFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAnnouncementForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();

    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      alert('Please fill in both title and message fields.');
      return;
    }

    try {
      await apiService.createAnnouncement(announcementForm);

      // Reset form
      setAnnouncementForm({
        title: '',
        message: '',
        type: 'INFO',
        sendToWebsite: true,
        sendToEmail: false,
        sendToPhone: false,
        targetAudience: 'ALL_USERS'
      });

      // Refresh announcements
      fetchAnnouncements();
      alert('Announcement created successfully!');
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement: ' + error.message);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await apiService.deleteAnnouncement(announcementId);
      setAnnouncements(announcements.filter(announcement => announcement.id !== announcementId));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement: ' + error.message);
    }
  };

  const handleCreateSampleAnnouncement = async () => {
    try {
      await apiService.createSampleAnnouncement();
      fetchAnnouncements();
      alert('Sample announcement created!');
    } catch (error) {
      console.error('Error creating sample announcement:', error);
      alert('Failed to create sample announcement: ' + error.message);
    }
  };

  // Check if user is admin
  const isAdmin = userProfile?.roles?.includes('ROLE_ADMIN');

  if (!isAdmin) {
    return (
      <>
        <div className="container mt-4">
          <div className="card">
            <div className="card-body text-center">
              <h2>Access Denied</h2>
              <p>You don't have permission to access the admin dashboard.</p>
              <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="container mt-4">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading admin dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container mt-4">
        <div className="admin-header mb-4">
          <h1>Admin Dashboard</h1>
          <p>Manage events, users, and system settings</p>
        </div>

        <div className="admin-tabs mb-4">
          <button 
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events Management
          </button>
          {/* Announcements feature disabled */}
          {/* <button
            className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
          >
            Announcements
          </button> */}
          <button
            className={`tab-btn ${activeTab === 'messaging' ? 'active' : ''}`}
            onClick={() => setActiveTab('messaging')}
          >
            Messaging
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users & Registrations
          </button>
          <button
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </div>

        {activeTab === 'events' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Events Management</h2>
              <Link to="/admin/events/new" className="btn btn-primary">
                <i className="fas fa-plus mr-2"></i>Create New Event
              </Link>
            </div>

            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <div className="events-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Registrations</th>
                    <th>Volunteers</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event.id}>
                      <td>
                        <strong>{event.name}</strong>
                        {event.ageGroup && (
                          <div className="text-muted small">{event.ageGroup}</div>
                        )}
                      </td>
                      <td>{new Date(event.date).toLocaleDateString()}</td>
                      <td>{event.location || 'TBD'}</td>
                      <td>{event.capacity || 'Unlimited'}</td>
                      <td>
                        <Link 
                          to={`/admin/events/${event.id}/participants`}
                          className="btn btn-sm btn-outline"
                        >
                          View Registrations
                        </Link>
                      </td>
                      <td>
                        <Link 
                          to={`/admin/events/${event.id}/volunteers`}
                          className="btn btn-sm btn-outline"
                        >
                          View Volunteers
                        </Link>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link 
                            to={`/admin/events/${event.id}/edit`}
                            className="btn btn-sm btn-primary mr-2"
                          >
                            Edit
                          </Link>
                          <button 
                            onClick={() => handleDeleteEvent(event.id)}
                            className="btn btn-sm btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {events.length === 0 && (
                <div className="text-center py-4">
                  <p>No events found.</p>
                  <Link to="/admin/events/new" className="btn btn-primary">
                    Create Your First Event
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Announcements Management</h2>
              <button
                onClick={handleCreateSampleAnnouncement}
                className="btn btn-secondary"
                style={{ marginRight: '1rem' }}
              >
                Create Sample
              </button>
            </div>

            {/* Create Announcement Form */}
            <div className="announcement-form-section">
              <h3>Create New Announcement</h3>
              <form onSubmit={handleCreateAnnouncement} style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={announcementForm.title}
                    onChange={handleAnnouncementFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter announcement title..."
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={announcementForm.message}
                    onChange={handleAnnouncementFormChange}
                    required
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                    placeholder="Enter announcement message..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      Type
                    </label>
                    <select
                      name="type"
                      value={announcementForm.type}
                      onChange={handleAnnouncementFormChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="INFO">Info</option>
                      <option value="ANNOUNCEMENT">Announcement</option>
                      <option value="SUCCESS">Success</option>
                      <option value="WARNING">Warning</option>
                      <option value="ERROR">Error</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      Target Audience
                    </label>
                    <select
                      name="targetAudience"
                      value={announcementForm.targetAudience}
                      onChange={handleAnnouncementFormChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="ALL_USERS">All Users</option>
                      <option value="REGISTERED_USERS">Registered Users Only</option>
                      <option value="PARENTS_ONLY">Parents Only</option>
                      <option value="VOLUNTEERS_ONLY">Volunteers Only</option>
                      <option value="EVENT_PARTICIPANTS">Event Participants</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                    Delivery Options
                  </label>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="sendToWebsite"
                        checked={announcementForm.sendToWebsite}
                        onChange={handleAnnouncementFormChange}
                        style={{ marginRight: '0.5rem', transform: 'scale(1.2)' }}
                      />
                      Website Inbox
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="sendToEmail"
                        checked={announcementForm.sendToEmail}
                        onChange={handleAnnouncementFormChange}
                        style={{ marginRight: '0.5rem', transform: 'scale(1.2)' }}
                      />
                      Email
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="sendToPhone"
                        checked={announcementForm.sendToPhone}
                        onChange={handleAnnouncementFormChange}
                        style={{ marginRight: '0.5rem', transform: 'scale(1.2)' }}
                      />
                      SMS/Phone
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: '#2f506a',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Create Announcement
                </button>
              </form>
            </div>

            {/* Existing Announcements */}
            <div className="announcements-list">
              <h3>Existing Announcements ({announcements.length})</h3>
              {announcements.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                  <p>No announcements created yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: '#2f506a' }}>{announcement.title}</h4>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
                            <span>Type: {announcement.type}</span>
                            <span>Audience: {announcement.targetAudience}</span>
                            <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          Delete
                        </button>
                      </div>

                      <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>{announcement.message}</p>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                        <span style={{ color: announcement.sendToWebsite ? '#059669' : '#9ca3af' }}>
                          Ã°Å¸â€œÂ¬ Website: {announcement.sendToWebsite ? 'Yes' : 'No'}
                        </span>
                        <span style={{ color: announcement.sendToEmail ? '#059669' : '#9ca3af' }}>
                          Ã°Å¸â€œÂ§ Email: {announcement.sendToEmail ? 'Yes' : 'No'}
                        </span>
                        <span style={{ color: announcement.sendToPhone ? '#059669' : '#9ca3af' }}>
                          Ã°Å¸â€œÂ± SMS: {announcement.sendToPhone ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'messaging' && (
          <div className="admin-section">
            <AdminMessaging />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Users & Registrations</h2>
            </div>
            <div className="coming-soon">
              <h3>Coming Soon</h3>
              <p>User management and registration oversight features will be available in the next update.</p>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Reports & Analytics</h2>
            </div>
            <div className="coming-soon">
              <h3>Coming Soon</h3>
              <p>Comprehensive reporting and analytics features will be available in the next update.</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-header {
          text-align: center;
          padding: 2rem 0;
          border-bottom: 1px solid #eee;
        }

        .admin-tabs {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .tab-btn {
          padding: 0.75rem 1.5rem;
          border: 2px solid var(--primary);
          background: white;
          color: var(--primary);
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }

        .tab-btn:hover {
          background: var(--primary);
          color: white;
        }

        .tab-btn.active {
          background: var(--primary);
          color: white;
        }

        .admin-section {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }

        .section-header h2 {
          margin: 0;
        }

        .events-table {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .table th,
        .table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: var(--text);
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn-sm {
          padding: 0.25rem 0.75rem;
          font-size: 0.875rem;
        }

        .coming-soon {
          text-align: center;
          padding: 4rem 2rem;
          color: #6c757d;
        }

        .coming-soon h3 {
          margin-bottom: 1rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(47, 80, 106, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 1rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .alert-danger {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .mr-2 {
          margin-right: 0.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .admin-tabs {
            flex-direction: column;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .action-buttons {
            flex-direction: column;
          }

          .events-table {
            font-size: 0.875rem;
          }

          .table th,
          .table td {
            padding: 0.5rem;
          }
        }
      `}</style>
    </>
  );
};

export default AdminDashboard;