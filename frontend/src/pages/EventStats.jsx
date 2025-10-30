import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const EventStats = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  // Check if user is admin
  const isAdmin = userProfile?.userType === 'ADMIN';

  const fetchEventData = async () => {
    setIsLoading(true);
    try {
      // Fetch event details and participants in parallel
      const [eventData, participantsData] = await Promise.all([
        apiService.getEventById(eventId),
        apiService.getEventParticipants(eventId)
      ]);

      setEvent(eventData);
      setParticipants(participantsData);
    } catch (error) {
      console.error('Error fetching event data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewParticipant = (participant) => {
    setSelectedParticipant(participant);
    setShowParticipantModal(true);
  };

  const closeParticipantModal = () => {
    setSelectedParticipant(null);
    setShowParticipantModal(false);
  };

  const calculateStats = () => {
    const totalRegistrations = participants.length;
    const totalRevenue = event ? participants.reduce((sum, p) => sum + (event.price || 0), 0) : 0;
    const capacityUtilization = event?.capacity ? (totalRegistrations / event.capacity) * 100 : 0;

    // Age group distribution
    const ageGroups = participants.reduce((acc, p) => {
      const age = p.age || 'Unknown';
      acc[age] = (acc[age] || 0) + 1;
      return acc;
    }, {});

    // Registration timeline (by registration date)
    const registrationDates = participants.map(p => {
      const date = new Date(p.registrationDate).toLocaleDateString();
      return date;
    }).reduce((acc, date) => {
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Food requirements
    const foodRequests = participants.filter(p => p.needsFood).length;

    return {
      totalRegistrations,
      totalRevenue,
      capacityUtilization,
      ageGroups,
      registrationDates,
      foodRequests,
      noFoodRequests: totalRegistrations - foodRequests
    };
  };

  if (!isAdmin) {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-body text-center">
            <h2>Access Denied</h2>
            <p>You don't have permission to access event statistics.</p>
            <Link to="/admin" className="btn btn-primary">Back to Admin</Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mt-4">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading event statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          Error loading event data: {error}
          <br />
          <Link to="/admin" className="btn btn-primary mt-2">Back to Admin</Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          Event not found.
          <br />
          <Link to="/admin" className="btn btn-primary mt-2">Back to Admin</Link>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <>
      <div className="container mt-4">
        {/* Header */}
        <div className="stats-header mb-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1>Event Statistics</h1>
              <h2 className="event-title">{event.name}</h2>
              <p className="event-details">
                <i className="fas fa-calendar mr-2"></i>
                {new Date(event.date).toLocaleDateString()}
                {event.location && (
                  <>
                    <span className="mx-2">•</span>
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    {event.location}
                  </>
                )}
              </p>
            </div>
            <div className="header-actions">
              <Link to="/admin" className="btn btn-secondary mr-2">
                <i className="fas fa-arrow-left mr-2"></i>Back to Admin
              </Link>
              <Link to={`/admin/events/${event.id}/edit`} className="btn btn-primary">
                <i className="fas fa-edit mr-2"></i>Edit Event
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Overview Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="stats-card">
              <div className="stats-icon registrations">
                <i className="fas fa-users"></i>
              </div>
              <div className="stats-content">
                <h3>{stats.totalRegistrations}</h3>
                <p>Total Registrations</p>
                {event.capacity && (
                  <div className="small text-muted">
                    {stats.capacityUtilization.toFixed(1)}% capacity
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="stats-card">
              <div className="stats-icon revenue">
                <i className="fas fa-dollar-sign"></i>
              </div>
              <div className="stats-content">
                <h3>${stats.totalRevenue.toFixed(2)}</h3>
                <p>Total Revenue</p>
                {event.price > 0 && (
                  <div className="small text-muted">
                    ${event.price} per registration
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="stats-card">
              <div className="stats-icon capacity">
                <i className="fas fa-chart-bar"></i>
              </div>
              <div className="stats-content">
                <h3>{event.capacity || '∞'}</h3>
                <p>Event Capacity</p>
                {event.capacity && (
                  <div className="capacity-bar-large">
                    <div
                      className="capacity-fill-large"
                      style={{
                        width: `${Math.min(stats.capacityUtilization, 100)}%`,
                        backgroundColor: stats.capacityUtilization >= 100 ? '#dc3545' :
                                       stats.capacityUtilization >= 80 ? '#ffc107' : '#28a745'
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="stats-card">
              <div className="stats-icon food">
                <i className="fas fa-utensils"></i>
              </div>
              <div className="stats-content">
                <h3>{stats.foodRequests}</h3>
                <p>Food Requests</p>
                <div className="small text-muted">
                  {stats.noFoodRequests} don't need food
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="row">
          {/* Participants Table */}
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h3>Registered Participants</h3>
                <p>Click on any participant name to view their full registration details</p>
              </div>
              <div className="card-body">
                {participants.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-users fa-3x text-muted mb-3"></i>
                    <p>No participants registered yet.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Participant</th>
                          <th>Age</th>
                          <th>Registration Date</th>
                          <th>Food Needed</th>
                          <th>Emergency Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((participant, index) => (
                          <tr key={participant.id || index}>
                            <td>
                              <button
                                className="participant-name-link"
                                onClick={() => handleViewParticipant(participant)}
                                title="View full registration details"
                              >
                                <strong>{participant.participantName}</strong>
                              </button>
                              <div className="small text-muted">{participant.parentEmail}</div>
                            </td>
                            <td>{participant.age || 'N/A'}</td>
                            <td>{new Date(participant.registrationDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`food-indicator ${participant.needsFood ? 'yes' : 'no'}`}>
                                {participant.needsFood ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td>
                              {participant.emergencyContactName ? (
                                <div>
                                  <div>{participant.emergencyContactName}</div>
                                  <div className="small text-muted">{participant.emergencyContactPhone}</div>
                                </div>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analytics Sidebar */}
          <div className="col-lg-4">
            {/* Age Distribution */}
            <div className="card mb-4">
              <div className="card-header">
                <h4>Age Distribution</h4>
              </div>
              <div className="card-body">
                {Object.keys(stats.ageGroups).length === 0 ? (
                  <p className="text-muted">No age data available</p>
                ) : (
                  <div className="age-distribution">
                    {Object.entries(stats.ageGroups)
                      .sort(([a], [b]) => {
                        // Sort by age numerically, put "Unknown" at the end
                        if (a === 'Unknown') return 1;
                        if (b === 'Unknown') return -1;
                        return parseInt(a) - parseInt(b);
                      })
                      .map(([age, count]) => (
                        <div key={age} className="age-group-item">
                          <div className="age-group-label">
                            <span>Age {age}</span>
                            <span className="count">{count}</span>
                          </div>
                          <div className="age-group-bar">
                            <div
                              className="age-group-fill"
                              style={{
                                width: `${(count / stats.totalRegistrations) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Registration Timeline */}
            <div className="card">
              <div className="card-header">
                <h4>Registration Timeline</h4>
              </div>
              <div className="card-body">
                {Object.keys(stats.registrationDates).length === 0 ? (
                  <p className="text-muted">No registration data available</p>
                ) : (
                  <div className="registration-timeline">
                    {Object.entries(stats.registrationDates)
                      .sort(([a], [b]) => new Date(a) - new Date(b))
                      .map(([date, count]) => (
                        <div key={date} className="timeline-item">
                          <div className="timeline-date">{date}</div>
                          <div className="timeline-count">
                            <span className="badge badge-primary">{count}</span>
                            {count === 1 ? ' registration' : ' registrations'}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Participant Detail Modal */}
      {showParticipantModal && selectedParticipant && (
        <div className="modal-overlay" onClick={closeParticipantModal}>
          <div className="modal-content participant-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registration Details</h3>
              <button className="modal-close" onClick={closeParticipantModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="participant-details">
                <div className="detail-section">
                  <h4>Participant Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedParticipant.participantName}</span>
                    </div>
                    <div className="detail-item">
                      <label>Age:</label>
                      <span>{selectedParticipant.age || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Parent Email:</label>
                      <span>{selectedParticipant.parentEmail}</span>
                    </div>
                    <div className="detail-item">
                      <label>Registration Date:</label>
                      <span>{new Date(selectedParticipant.registrationDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Requirements</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Food Needed:</label>
                      <span className={`food-indicator ${selectedParticipant.needsFood ? 'yes' : 'no'}`}>
                        {selectedParticipant.needsFood ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {selectedParticipant.allergies && (
                      <div className="detail-item">
                        <label>Allergies:</label>
                        <span>{selectedParticipant.allergies}</span>
                      </div>
                    )}
                    {selectedParticipant.specialRequirements && (
                      <div className="detail-item">
                        <label>Special Requirements:</label>
                        <span>{selectedParticipant.specialRequirements}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedParticipant.emergencyContactName || selectedParticipant.emergencyContactPhone) && (
                  <div className="detail-section">
                    <h4>Emergency Contact</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Name:</label>
                        <span>{selectedParticipant.emergencyContactName || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Phone:</label>
                        <span>{selectedParticipant.emergencyContactPhone || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeParticipantModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .stats-header {
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 1rem;
        }

        .event-title {
          color: var(--primary);
          margin-bottom: 0.5rem;
        }

        .event-details {
          color: #6c757d;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .stats-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          height: 100%;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stats-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
        }

        .stats-icon.registrations {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .stats-icon.revenue {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .stats-icon.capacity {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .stats-icon.food {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .stats-content h3 {
          font-size: 2rem;
          font-weight: bold;
          margin: 0;
          color: var(--text);
        }

        .stats-content p {
          margin: 0;
          color: #6c757d;
          font-weight: 500;
        }

        .capacity-bar-large {
          width: 100%;
          height: 8px;
          background-color: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .capacity-fill-large {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .participant-name-link {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          text-decoration: underline;
          font-weight: 600;
          padding: 0;
          margin: 0;
          transition: color 0.2s ease;
        }

        .participant-name-link:hover {
          color: var(--primary-dark);
        }

        .food-indicator {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .food-indicator.yes {
          background-color: #fff3cd;
          color: #856404;
        }

        .food-indicator.no {
          background-color: #d4edda;
          color: #155724;
        }

        .age-distribution {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .age-group-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .age-group-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .age-group-label .count {
          font-weight: 600;
          color: var(--primary);
        }

        .age-group-bar {
          width: 100%;
          height: 6px;
          background-color: #e9ecef;
          border-radius: 3px;
          overflow: hidden;
        }

        .age-group-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary) 0%, #667eea 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .registration-timeline {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .timeline-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .timeline-date {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text);
        }

        .timeline-count {
          font-size: 0.875rem;
          color: #6c757d;
        }

        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .badge-primary {
          background-color: var(--primary);
          color: white;
        }

        .participant-modal {
          max-width: 600px;
          width: 90vw;
          max-height: 80vh;
          overflow-y: auto;
        }

        .participant-details {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .detail-section h4 {
          color: var(--primary);
          margin-bottom: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-item label {
          font-weight: 600;
          color: var(--text);
          font-size: 0.9rem;
        }

        .detail-item span {
          color: #666;
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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .stats-card {
            flex-direction: column;
            text-align: center;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default EventStats;