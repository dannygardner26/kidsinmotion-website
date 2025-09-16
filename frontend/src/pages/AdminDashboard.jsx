import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('events');

  useEffect(() => {
    fetchEvents();
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

  // Check if user is admin
  const isAdmin = userProfile?.roles?.includes('ROLE_ADMIN');

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="card">
            <div className="card-body text-center">
              <h2>Access Denied</h2>
              <p>You don't have permission to access the admin dashboard.</p>
              <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading admin dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
    </Layout>
  );
};

export default AdminDashboard;