import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const EventCheckIn = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkedInIds, setCheckedInIds] = useState(new Set());
  const [checkedInVolunteers, setCheckedInVolunteers] = useState(new Set());

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  // Check if user is admin
  const isAdmin = userProfile?.userType === 'ADMIN';

  const fetchEventData = async () => {
    setIsLoading(true);
    try {
      // Fetch event details, participants, and volunteers in parallel
      const [eventData, participantsData, volunteersData] = await Promise.all([
        apiService.getEventById(eventId),
        apiService.getEventParticipants(eventId),
        // Try to get volunteers, fall back to empty array if endpoint doesn't exist
        apiService.getEventVolunteers ? apiService.getEventVolunteers(eventId).catch(() => []) : Promise.resolve([])
      ]);

      setEvent(eventData);
      setParticipants(participantsData);
      setVolunteers(volunteersData || []);

      // Load check-in status from localStorage
      const storedCheckins = localStorage.getItem(`checkins_${eventId}`);
      const storedVolunteerCheckins = localStorage.getItem(`volunteer_checkins_${eventId}`);

      if (storedCheckins) {
        setCheckedInIds(new Set(JSON.parse(storedCheckins)));
      }
      if (storedVolunteerCheckins) {
        setCheckedInVolunteers(new Set(JSON.parse(storedVolunteerCheckins)));
      }

    } catch (error) {
      console.error('Error fetching event data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParticipantCheckIn = (participantId) => {
    const newCheckedInIds = new Set(checkedInIds);
    if (newCheckedInIds.has(participantId)) {
      newCheckedInIds.delete(participantId);
    } else {
      newCheckedInIds.add(participantId);
    }
    setCheckedInIds(newCheckedInIds);

    // Save to localStorage
    localStorage.setItem(`checkins_${eventId}`, JSON.stringify(Array.from(newCheckedInIds)));
  };

  const handleVolunteerCheckIn = (volunteerId) => {
    const newCheckedInVolunteers = new Set(checkedInVolunteers);
    if (newCheckedInVolunteers.has(volunteerId)) {
      newCheckedInVolunteers.delete(volunteerId);
    } else {
      newCheckedInVolunteers.add(volunteerId);
    }
    setCheckedInVolunteers(newCheckedInVolunteers);

    // Save to localStorage
    localStorage.setItem(`volunteer_checkins_${eventId}`, JSON.stringify(Array.from(newCheckedInVolunteers)));
  };

  const getFilteredParticipants = () => {
    if (!searchTerm) return participants;
    return participants.filter(participant =>
      participant.participantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.parentEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredVolunteers = () => {
    if (!searchTerm) return volunteers;
    return volunteers.filter(volunteer =>
      volunteer.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getStats = () => {
    const filteredParticipants = getFilteredParticipants();
    const filteredVolunteers = getFilteredVolunteers();
    const checkedInParticipants = filteredParticipants.filter(p => checkedInIds.has(p.id));
    const checkedInVolunteersList = filteredVolunteers.filter(v => checkedInVolunteers.has(v.id));

    return {
      totalParticipants: filteredParticipants.length,
      checkedInParticipants: checkedInParticipants.length,
      totalVolunteers: filteredVolunteers.length,
      checkedInVolunteers: checkedInVolunteersList.length,
      participantCheckInRate: filteredParticipants.length > 0 ? (checkedInParticipants.length / filteredParticipants.length * 100).toFixed(1) : 0,
      volunteerCheckInRate: filteredVolunteers.length > 0 ? (checkedInVolunteersList.length / filteredVolunteers.length * 100).toFixed(1) : 0
    };
  };

  if (!isAdmin) {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-body text-center">
            <h2>Access Denied</h2>
            <p>You don't have permission to access event check-in.</p>
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
          <p>Loading event check-in data...</p>
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

  const stats = getStats();

  return (
    <>
      <div className="container mt-4">
        {/* Header */}
        <div className="checkin-header mb-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1>Event Check-In</h1>
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
              <Link to={`/admin/events/${event.id}/stats`} className="btn btn-primary">
                <i className="fas fa-chart-bar mr-2"></i>View Stats
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="checkin-stats-card participants">
              <div className="stats-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stats-content">
                <h3>{stats.checkedInParticipants}/{stats.totalParticipants}</h3>
                <p>Participants Checked In</p>
                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${stats.participantCheckInRate}%` }}
                  ></div>
                </div>
                <small>{stats.participantCheckInRate}% checked in</small>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="checkin-stats-card volunteers">
              <div className="stats-icon">
                <i className="fas fa-hands-helping"></i>
              </div>
              <div className="stats-content">
                <h3>{stats.checkedInVolunteers}/{stats.totalVolunteers}</h3>
                <p>Volunteers Checked In</p>
                <div className="progress">
                  <div
                    className="progress-bar volunteer-progress"
                    style={{ width: `${stats.volunteerCheckInRate}%` }}
                  ></div>
                </div>
                <small>{stats.volunteerCheckInRate}% checked in</small>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="search-section mb-4">
          <div className="search-input-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Participants Section */}
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h3>
                  <i className="fas fa-users mr-2"></i>
                  Participants ({getFilteredParticipants().length})
                </h3>
              </div>
              <div className="card-body">
                {getFilteredParticipants().length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-search fa-3x text-muted mb-3"></i>
                    <p>{searchTerm ? 'No participants found matching your search.' : 'No participants registered yet.'}</p>
                  </div>
                ) : (
                  <div className="checkin-list">
                    {getFilteredParticipants().map((participant, index) => {
                      const isCheckedIn = checkedInIds.has(participant.id);
                      return (
                        <div
                          key={participant.id || index}
                          className={`checkin-item ${isCheckedIn ? 'checked-in' : ''}`}
                        >
                          <div className="person-info">
                            <div className="person-name">{participant.participantName}</div>
                            <div className="person-details">
                              <span className="person-email">{participant.parentEmail}</span>
                              {participant.age && (
                                <span className="person-age">Age: {participant.age}</span>
                              )}
                              {participant.needsFood && (
                                <span className="food-badge">Needs Food</span>
                              )}
                            </div>
                          </div>
                          <button
                            className={`checkin-btn ${isCheckedIn ? 'checked-in' : ''}`}
                            onClick={() => handleParticipantCheckIn(participant.id)}
                          >
                            <i className={`fas ${isCheckedIn ? 'fa-check-circle' : 'fa-circle'}`}></i>
                            {isCheckedIn ? 'Checked In' : 'Check In'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Volunteers Section */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h3>
                  <i className="fas fa-hands-helping mr-2"></i>
                  Volunteers ({getFilteredVolunteers().length})
                </h3>
              </div>
              <div className="card-body">
                {getFilteredVolunteers().length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-search fa-2x text-muted mb-2"></i>
                    <p className="small">{searchTerm ? 'No volunteers found.' : 'No volunteers signed up.'}</p>
                  </div>
                ) : (
                  <div className="checkin-list compact">
                    {getFilteredVolunteers().map((volunteer, index) => {
                      const isCheckedIn = checkedInVolunteers.has(volunteer.id);
                      return (
                        <div
                          key={volunteer.id || index}
                          className={`checkin-item compact ${isCheckedIn ? 'checked-in' : ''}`}
                        >
                          <div className="person-info">
                            <div className="person-name">{volunteer.user?.name || volunteer.user?.email || 'Unknown'}</div>
                            <div className="person-details">
                              <span className="volunteer-role">{volunteer.role}</span>
                            </div>
                          </div>
                          <button
                            className={`checkin-btn compact ${isCheckedIn ? 'checked-in' : ''}`}
                            onClick={() => handleVolunteerCheckIn(volunteer.id)}
                          >
                            <i className={`fas ${isCheckedIn ? 'fa-check' : 'fa-circle'}`}></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .checkin-header {
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

        .checkin-stats-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          height: 100%;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .checkin-stats-card.participants .stats-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .checkin-stats-card.volunteers .stats-icon {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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

        .stats-content {
          flex: 1;
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

        .progress {
          height: 8px;
          background-color: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin: 0.5rem 0;
        }

        .progress-bar {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-bar.volunteer-progress {
          background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
        }

        .search-section {
          display: flex;
          justify-content: center;
        }

        .search-input-container {
          position: relative;
          max-width: 400px;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 2px solid #e9ecef;
          border-radius: 25px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.1);
        }

        .clear-search {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 0.25rem;
        }

        .checkin-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .checkin-list.compact {
          gap: 0.5rem;
        }

        .checkin-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .checkin-item.compact {
          padding: 0.75rem;
        }

        .checkin-item.checked-in {
          border-color: #28a745;
          background-color: #f8fff9;
        }

        .person-info {
          flex: 1;
        }

        .person-name {
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--text);
        }

        .checkin-item.compact .person-name {
          font-size: 1rem;
        }

        .person-details {
          display: flex;
          gap: 1rem;
          margin-top: 0.25rem;
          flex-wrap: wrap;
        }

        .person-email {
          color: #6c757d;
          font-size: 0.9rem;
        }

        .person-age {
          color: #495057;
          font-size: 0.8rem;
          background: #e9ecef;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
        }

        .volunteer-role {
          color: #495057;
          font-size: 0.85rem;
          background: #f8f9fa;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
        }

        .food-badge {
          color: #856404;
          background: #fff3cd;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .checkin-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          background: white;
          color: #6c757d;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .checkin-btn.compact {
          padding: 0.5rem;
          font-size: 0.9rem;
        }

        .checkin-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .checkin-btn.checked-in {
          border-color: #28a745;
          background: #28a745;
          color: white;
        }

        .checkin-btn.checked-in:hover {
          background: #218838;
          border-color: #218838;
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

          .checkin-stats-card {
            flex-direction: column;
            text-align: center;
          }

          .person-details {
            flex-direction: column;
            gap: 0.5rem;
          }

          .checkin-item {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .checkin-btn {
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
};

export default EventCheckIn;