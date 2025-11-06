import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import firebaseRealtimeService from '../services/firebaseRealtimeService';
import AdminMessaging from '../components/AdminMessaging';
import UsersAndRegistrations from '../components/UsersAndRegistrations';
import ReportsAndAnalytics from '../components/ReportsAndAnalytics';
import PosterTemplateSelector from '../components/PosterTemplateSelector';
import { formatAgeRange } from '../utils/eventFormatters';

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const [searchParams] = useSearchParams();

  // Time formatting function - same as used in Events.jsx
  const formatEventTime = (timeValue) => {
    if (!timeValue) return 'N/A';

    try {
      let timeString = timeValue.toString();

      // If it already looks like a formatted time (contains AM/PM), return as is
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
      }

      // If it's in HH:mm:ss or HH:mm format, parse it
      if (timeString.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        // Split to check if we have seconds
        const timeParts = timeString.split(':');

        // If we only have hours and minutes, add seconds
        if (timeParts.length === 2) {
          timeString = timeString + ':00';
        }

        const timeDate = new Date(`2000-01-01T${timeString}`);
        return timeDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        });
      }

      return timeValue; // Return as-is if no format matches
    } catch (error) {
      console.error('Error parsing time:', timeValue, error);
      return 'Invalid time';
    }
  };
  const [events, setEvents] = useState([]);
  const [eventStats, setEventStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'events');
  const [selectedEventForPoster, setSelectedEventForPoster] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Subscribe to live events using Firestore listeners
    firebaseRealtimeService.subscribeToAllEvents(
      (eventsData) => {
        console.log('AdminDashboard: Real-time events update:', eventsData);
        setEvents(eventsData);
        setIsLoading(false); // Set loading to false when data is received

        // For each event, subscribe to participants and volunteers to keep eventStats in sync
        eventsData.forEach(event => {
          // Subscribe to participants for this event
          firebaseRealtimeService.subscribeToEventParticipants(
            event.id,
            (participantsData) => {
              console.log(`AdminDashboard: Real-time participants update for event ${event.id}:`, participantsData);
              updateEventStats(event.id, 'participants', participantsData);
            },
            (error) => {
              console.error(`AdminDashboard: Participants listener error for event ${event.id}:`, error);
            }
          );

          // Subscribe to volunteers for this event
          firebaseRealtimeService.subscribeToEventVolunteers(
            event.id,
            (volunteersData) => {
              console.log(`AdminDashboard: Real-time volunteers update for event ${event.id}:`, volunteersData);
              updateEventStats(event.id, 'volunteers', volunteersData);
            },
            (error) => {
              console.error(`AdminDashboard: Volunteers listener error for event ${event.id}:`, error);
            }
          );
        });
      },
      (error) => {
        console.error('AdminDashboard: Events listener error:', error);
        // Fallback to API call if needed
        fetchEvents();
      }
    );

    return () => {
      // Clean up all real-time listeners
      firebaseRealtimeService.unsubscribeAll();
    };
  }, []);

  // Helper function to update event stats when real-time data changes
  const updateEventStats = (eventId, dataType, data) => {
    setEventStats(prevStats => {
      const updatedStats = { ...prevStats };

      if (!updatedStats[eventId]) {
        updatedStats[eventId] = {
          eventId,
          registrationCount: 0,
          registrations: [],
          volunteerCount: 0,
          volunteers: [],
          volunteerError: null,
          revenue: 0,
          capacity: null,
          isFullyBooked: false
        };
      }

      if (dataType === 'participants') {
        updatedStats[eventId].registrationCount = data.length;
        updatedStats[eventId].registrations = data;

        // Find the corresponding event to calculate revenue
        const event = events.find(e => e.id === eventId);
        if (event) {
          updatedStats[eventId].revenue = data.length * (event.price || 0);
          updatedStats[eventId].capacity = event.capacity;
          updatedStats[eventId].isFullyBooked = event.capacity && data.length >= event.capacity;
        }
      } else if (dataType === 'volunteers') {
        updatedStats[eventId].volunteerCount = data.length;
        updatedStats[eventId].volunteers = data;
        updatedStats[eventId].volunteerError = null;
      }

      return updatedStats;
    });
  };

  const fetchEvents = async () => {
    try {
      // Fetch events only - stats are managed by real-time Firestore listeners
      const eventsData = await apiService.getEvents();

      console.log('Admin dashboard fetched events:', eventsData);
      setEvents(eventsData);

    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
  const isAdmin = userProfile?.userType === 'ADMIN';

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
          <button
            className={`tab-btn ${activeTab === 'messaging' ? 'active' : ''}`}
            onClick={() => setActiveTab('messaging')}
          >
            Announcements
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
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
              <div>
                <button
                  onClick={() => {
                    setIsRefreshing(true);
                    fetchEvents();
                  }}
                  className="btn btn-secondary mr-3"
                  disabled={isRefreshing}
                >
                  <i className={`fas fa-sync-alt mr-2 ${isRefreshing ? 'fa-spin' : ''}`}></i>Refresh
                </button>
                <Link to="/admin/events/new" className="btn btn-primary">
                  <i className="fas fa-plus mr-2"></i>Create New Event
                </Link>
              </div>
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
                    <th>Registration Stats</th>
                    <th>Revenue</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => {
                    const stats = eventStats[event.id] || {};
                    const registrationCount = stats.registrationCount || 0;
                    const volunteerCount = stats.volunteerCount || 0;
                    const capacity = event.capacity;
                    const isUpcoming = new Date(event.date) > new Date();
                    const revenue = stats.revenue || 0;

                    return (
                      <tr key={event.id}>
                        <td>
                          <strong>{event.name}</strong>
                          <div className="text-muted small">
                            {formatAgeRange(event)}
                          </div>
                        </td>
                        <td>
                          <div>{new Date(event.date).toLocaleDateString()}</div>
                          {event.startTime && event.endTime ? (
                            <div className="small text-info">
                              {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
                            </div>
                          ) : event.startTime ? (
                            <div className="small text-info">{formatEventTime(event.startTime)}</div>
                          ) : (
                            <div className="small text-muted">No time set</div>
                          )}
                          <div className={`small ${isUpcoming ? 'text-success' : 'text-muted'}`}>
                            {isUpcoming ? 'Upcoming' : 'Past'}
                          </div>
                        </td>
                        <td>
                          {event.location || 'TBD'}
                        </td>
                        <td>
                          <div className="stats-cell">
                            <div className="stat-item">
                              <strong>{isLoading ? '...' : registrationCount}</strong>
                              <span className="small"> registrations</span>
                            </div>
                            <div className="stat-item">
                              <strong>{isLoading ? '...' : volunteerCount}</strong>
                              <span className="small"> volunteers</span>
                              {stats.volunteerError && volunteerCount === 0 && (
                                <i className="fas fa-exclamation-triangle text-warning ml-1" title="Error loading volunteers"></i>
                              )}
                            </div>
                            {capacity && (
                              <div className="small text-muted">
                                {registrationCount}/{capacity} capacity
                                <div className="capacity-bar">
                                  <div
                                    className="capacity-fill"
                                    style={{
                                      width: `${Math.min((registrationCount / capacity) * 100, 100)}%`,
                                      backgroundColor: registrationCount >= capacity ? '#dc3545' : '#28a745'
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            {!capacity && (
                              <div className="small text-muted">Unlimited capacity</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="revenue-cell">
                            {event.price > 0 ? (
                              <>
                                <strong>${revenue.toFixed(2)}</strong>
                                <div className="small text-muted">${event.price} each</div>
                              </>
                            ) : (
                              <span className="text-success">Free Event</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="status-cell">
                            {isUpcoming ? (
                              <>
                                {stats.isFullyBooked ? (
                                  <span className="status-badge fully-booked">Fully Booked</span>
                                ) : capacity && registrationCount >= capacity * 0.8 ? (
                                  <span className="status-badge nearly-full">Nearly Full</span>
                                ) : (
                                  <span className="status-badge open">Open</span>
                                )}
                              </>
                            ) : (
                              <span className="status-badge completed">Completed</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link
                              to={`/admin/events/edit/${event.id}`}
                              className="btn btn-sm btn-warning"
                              title="Edit event"
                            >
                              <i className="fas fa-edit mr-1"></i>
                              Edit
                            </Link>
                            <Link
                              to={`/admin/events/${event.id}/overview`}
                              className="btn btn-sm btn-primary"
                              title="View complete event overview"
                            >
                              <i className="fas fa-eye mr-1"></i>
                              Overview
                            </Link>
                            <button
                              onClick={() => setSelectedEventForPoster(event)}
                              className="btn btn-sm btn-primary"
                              title="Generate promotional poster"
                            >
                              <i className="fas fa-image mr-1"></i>
                              Poster
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="btn btn-sm btn-danger"
                              title="Delete event"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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


        {activeTab === 'messaging' && (
          <div className="admin-section">
            <AdminMessaging />
          </div>
        )}


        {activeTab === 'users' && (
          <div className="admin-section">
            <UsersAndRegistrations />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="admin-section">
            <ReportsAndAnalytics />
          </div>
        )}
      </div>

      {/* Poster Template Selector Modal */}
      {selectedEventForPoster && (
        <PosterTemplateSelector
          event={selectedEventForPoster}
          onClose={() => setSelectedEventForPoster(null)}
        />
      )}

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
          min-height: 600px;
          margin-bottom: 3rem;
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

        /* Enhanced Event Statistics Styles */
        .stats-cell {
          min-width: 140px;
        }

        .stat-item {
          display: flex;
          align-items: baseline;
          gap: 2px;
          margin-bottom: 4px;
        }

        .capacity-bar {
          width: 100%;
          height: 4px;
          background-color: #e9ecef;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 2px;
        }

        .capacity-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 2px;
        }

        .revenue-cell {
          min-width: 80px;
        }

        .status-cell {
          min-width: 100px;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.open {
          background-color: #d4edda;
          color: #155724;
        }

        .status-badge.nearly-full {
          background-color: #fff3cd;
          color: #856404;
        }

        .status-badge.fully-booked {
          background-color: #f8d7da;
          color: #721c24;
        }

        .status-badge.completed {
          background-color: #d1ecf1;
          color: #0c5460;
        }

        .action-buttons {
          display: flex;
          gap: 0.25rem;
          align-items: center;
        }

        .action-buttons .btn {
          padding: 0.25rem 0.5rem;
          min-width: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .text-success {
          color: #28a745 !important;
        }

        .text-muted {
          color: #6c757d !important;
        }

        .small {
          font-size: 0.875rem;
        }

        /* Edit Field Styles */
        .edit-field {
          min-width: 150px;
        }

        .edit-field .form-control {
          border: 1px solid #ced4da;
          border-radius: 4px;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .edit-field .form-control:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 0.2rem rgba(47, 80, 106, 0.25);
          outline: 0;
        }

        .edit-field .mt-1 {
          margin-top: 0.25rem;
        }

        .action-buttons .btn-warning {
          background-color: #ffc107;
          border-color: #ffc107;
          color: #212529;
        }

        .action-buttons .btn-warning:hover {
          background-color: #e0a800;
          border-color: #d39e00;
        }

        .action-buttons .btn-success {
          background-color: #28a745;
          border-color: #28a745;
          color: white;
        }

        .action-buttons .btn-success:hover {
          background-color: #218838;
          border-color: #1e7e34;
        }

        .action-buttons .btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
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