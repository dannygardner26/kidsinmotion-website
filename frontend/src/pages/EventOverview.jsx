import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const EventOverview = () => {
  console.log('EventOverview component is loading!');
  const { id: eventId } = useParams();
  console.log('EventOverview eventId from params:', eventId);
  const { userProfile } = useAuth();
  console.log('EventOverview userProfile:', userProfile);
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search functionality
  const [participantSearch, setParticipantSearch] = useState('');
  const [volunteerSearch, setVolunteerSearch] = useState('');

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      console.log('EventOverview: Starting to fetch data for event ID:', eventId);

      // Fetch event details
      console.log('EventOverview: Fetching event details...');
      const eventData = await apiService.getEventById(eventId);
      console.log('EventOverview: Event data received:', eventData);
      setEvent(eventData);

      // Fetch participants (kids + parents)
      console.log('EventOverview: Fetching participants...');
      const participantsData = await apiService.getEventParticipants(eventId);
      console.log('EventOverview: Participants data received:', participantsData);
      setParticipants(participantsData);

      // Fetch volunteers for this event
      console.log('EventOverview: Fetching volunteers...');
      let volunteersData = [];
      try {
        volunteersData = await apiService.getEventVolunteers(eventId);
        console.log('EventOverview: Volunteers data received:', volunteersData);
        setVolunteers(volunteersData);
      } catch (volError) {
        console.log('EventOverview: No volunteers found for this event:', volError.message);
        setVolunteers([]);
      }

      // Calculate statistics
      console.log('EventOverview: Calculating statistics...');
      const stats = {
        totalParticipants: participantsData.length,
        totalVolunteers: volunteersData.length,
        revenue: participantsData.length * (eventData.price || 0),
        capacity: eventData.capacity,
        registrationRate: eventData.capacity ? (participantsData.length / eventData.capacity * 100).toFixed(1) : 100,
        ageGroups: calculateAgeGroups(participantsData),
        registrationTrend: calculateRegistrationTrend(participantsData)
      };
      console.log('EventOverview: Statistics calculated:', stats);
      setStatistics(stats);

      console.log('EventOverview: Data fetching completed successfully');
    } catch (error) {
      console.error('EventOverview: Error fetching event data:', error);
      setError(error.message);
    } finally {
      console.log('EventOverview: Setting loading to false');
      setIsLoading(false);
    }
  };

  const calculateAgeGroups = (participants) => {
    const ageGroups = {};
    participants.forEach(participant => {
      const ageGroup = participant.ageGroup || 'Unknown';
      ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + 1;
    });
    return ageGroups;
  };

  const calculateRegistrationTrend = (participants) => {
    // Group registrations by date
    const registrationsByDate = {};
    participants.forEach(participant => {
      const date = new Date(participant.registrationDate).toLocaleDateString();
      registrationsByDate[date] = (registrationsByDate[date] || 0) + 1;
    });
    return registrationsByDate;
  };

  // Filter functions for search
  const filteredParticipants = participants.filter(participant => {
    if (!participantSearch.trim()) return true;

    const searchTerm = participantSearch.toLowerCase();
    const childName = (participant.childName || participant.participantName || participant.name || '').toLowerCase();
    const parentName = participant.parentUser?.firstName && participant.parentUser?.lastName
      ? `${participant.parentUser.firstName} ${participant.parentUser.lastName}`.toLowerCase()
      : (participant.parentName || '').toLowerCase();

    return childName.includes(searchTerm) || parentName.includes(searchTerm);
  });

  const filteredVolunteers = volunteers.filter(volunteer => {
    if (!volunteerSearch.trim()) return true;

    const searchTerm = volunteerSearch.toLowerCase();
    const volunteerName = volunteer.user?.firstName && volunteer.user?.lastName
      ? `${volunteer.user.firstName} ${volunteer.user.lastName}`.toLowerCase()
      : '';
    const volunteerEmail = (volunteer.user?.email || '').toLowerCase();
    const volunteerRole = (volunteer.role || '').toLowerCase();

    return volunteerName.includes(searchTerm) ||
           volunteerEmail.includes(searchTerm) ||
           volunteerRole.includes(searchTerm);
  });

  // Check if user is admin
  const isAdmin = userProfile?.userType === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-body text-center">
            <h2>Access Denied</h2>
            <p>You don't have permission to access this page.</p>
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
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
          <p>Loading event overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Error Loading Event</h4>
          <p>{error}</p>
          <Link to="/admin" className="btn btn-primary">Back to Admin Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <h4>Event Not Found</h4>
          <p>The event you're looking for doesn't exist.</p>
          <Link to="/admin" className="btn btn-primary">Back to Admin Dashboard</Link>
        </div>
      </div>
    );
  }

  const isUpcoming = new Date(event.date) > new Date();

  return (
    <>
      <div className="container mt-4">
        <div className="event-overview-header">
          <div className="header-content">
            <div className="breadcrumb">
              <Link to="/admin" className="breadcrumb-link">Admin Dashboard</Link>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Event Overview</span>
            </div>
            <h1 className="event-title">{event.name}</h1>
            <div className="event-meta">
              <div className="event-meta-item">
                <i className="fas fa-info-circle"></i>
                <div className="event-meta-content">
                  <div className="event-meta-label">Status</div>
                  <div className="event-meta-value">
                    <span className={`event-status ${isUpcoming ? 'upcoming' : 'past'}`}>
                      {isUpcoming ? 'Upcoming Event' : 'Past Event'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="event-meta-item">
                <i className="fas fa-calendar"></i>
                <div className="event-meta-content">
                  <div className="event-meta-label">Date & Time</div>
                  <div className="event-meta-value">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                    {new Date(event.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div className="event-meta-item">
                <i className="fas fa-map-marker-alt"></i>
                <div className="event-meta-content">
                  <div className="event-meta-label">Location</div>
                  <div className="event-meta-value">{event.location || 'TBD'}</div>
                </div>
              </div>

              {event.ageGroup && (
                <div className="event-meta-item">
                  <i className="fas fa-child"></i>
                  <div className="event-meta-content">
                    <div className="event-meta-label">Age Group</div>
                    <div className="event-meta-value">{event.ageGroup}</div>
                  </div>
                </div>
              )}

              {event.capacity && (
                <div className="event-meta-item">
                  <i className="fas fa-users"></i>
                  <div className="event-meta-content">
                    <div className="event-meta-label">Capacity</div>
                    <div className="event-meta-value">{event.capacity} participants</div>
                  </div>
                </div>
              )}

              <div className="event-meta-item">
                <i className="fas fa-dollar-sign"></i>
                <div className="event-meta-content">
                  <div className="event-meta-label">Price</div>
                  <div className="event-meta-value">
                    {event.price > 0 ? `$${event.price}` : 'Free'}
                  </div>
                </div>
              </div>
            </div>
            <div className="header-actions">
              <Link to="/admin?tab=messaging" className="btn btn-secondary">
                Send a Message
              </Link>
            </div>
          </div>
        </div>

        {/* Key Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon participants">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalParticipants}</div>
              <div className="stat-label">Participants</div>
              {event.capacity && (
                <div className="stat-sublabel">
                  {statistics.registrationRate}% of {event.capacity} capacity
                </div>
              )}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon volunteers">
              <i className="fas fa-hands-helping"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.totalVolunteers}</div>
              <div className="stat-label">Volunteers</div>
              <div className="stat-sublabel">Supporting this event</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon revenue">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">${statistics.revenue}</div>
              <div className="stat-label">Revenue</div>
              <div className="stat-sublabel">
                {event.price > 0 ? `$${event.price} per participant` : 'Free event'}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon capacity">
              <i className="fas fa-chart-pie"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.registrationRate}%</div>
              <div className="stat-label">Capacity</div>
              <div className="stat-sublabel">
                {event.capacity ? `${statistics.totalParticipants}/${event.capacity} spots` : 'Unlimited'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="overview-sections">

          {/* Participants Section */}
          <div className="section-card">
            <div className="section-header">
              <div className="section-title">
                <h3>
                  <i className="fas fa-users mr-2"></i>
                  Participants ({filteredParticipants.length}{participants.length !== filteredParticipants.length ? ` of ${participants.length}` : ''})
                </h3>
              </div>
              <div className="section-search">
                <div className="search-box">
                  <i className="fas fa-search search-icon"></i>
                  <input
                    type="text"
                    placeholder="Search by child name or parent name..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="search-input"
                  />
                  {participantSearch && (
                    <button
                      className="clear-search"
                      onClick={() => setParticipantSearch('')}
                      title="Clear search"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="section-content">
              {filteredParticipants.length === 0 ? (
                <div className="empty-state">
                  {participants.length === 0 ? (
                    <p>No participants registered yet.</p>
                  ) : (
                    <p>No participants found matching "{participantSearch}".</p>
                  )}
                </div>
              ) : (
                <div className="participants-grid">
                  {filteredParticipants.map(participant => {
                    // Try to get child name from multiple possible fields
                    const childName = participant.childName || participant.participantName || participant.name;
                    const parentName = participant.parentUser?.firstName && participant.parentUser?.lastName
                      ? `${participant.parentUser.firstName} ${participant.parentUser.lastName}`
                      : participant.parentName || 'Unknown Parent';

                    return (
                      <div key={participant.id} className="participant-card">
                        <div className="participant-header">
                          <div className="names-section">
                            <h4 className="child-name">
                              {childName}
                            </h4>
                            <h5 className="parent-name">
                              Parent: {parentName}
                            </h5>
                          </div>
                        </div>
                        <div className="participant-details">
                          {participant.childAge && (
                            <span className="detail-item age">
                              Age: {participant.childAge} years
                            </span>
                          )}
                          {participant.ageGroup && (
                            <span className="detail-item age-group">
                              Group: {participant.ageGroup}
                            </span>
                          )}
                          {participant.grade && (
                            <span className="detail-item grade">
                              Grade: {participant.grade}
                            </span>
                          )}
                        </div>
                        <div className="contact-info">
                          {participant.parentUser?.email && (
                            <div className="contact-item">
                              Email: {participant.parentUser.email}
                            </div>
                          )}
                          {participant.parentUser?.phoneNumber && (
                            <div className="contact-item">
                              Phone: {participant.parentUser.phoneNumber}
                            </div>
                          )}
                        </div>
                        <div className="registration-info">
                          <span className="registration-date">
                            Registered: {new Date(participant.registrationDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Volunteers Section */}
          <div className="section-card">
            <div className="section-header">
              <div className="section-title">
                <h3>
                  <i className="fas fa-hands-helping mr-2"></i>
                  Volunteers ({filteredVolunteers.length}{volunteers.length !== filteredVolunteers.length ? ` of ${volunteers.length}` : ''})
                </h3>
              </div>
              <div className="section-search">
                <div className="search-box">
                  <i className="fas fa-search search-icon"></i>
                  <input
                    type="text"
                    placeholder="Search by volunteer name, email, or role..."
                    value={volunteerSearch}
                    onChange={(e) => setVolunteerSearch(e.target.value)}
                    className="search-input"
                  />
                  {volunteerSearch && (
                    <button
                      className="clear-search"
                      onClick={() => setVolunteerSearch('')}
                      title="Clear search"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="section-content">
              {filteredVolunteers.length === 0 ? (
                <div className="empty-state">
                  {volunteers.length === 0 ? (
                    <p>No volunteers assigned to this event yet.</p>
                  ) : (
                    <p>No volunteers found matching "{volunteerSearch}".</p>
                  )}
                </div>
              ) : (
                <div className="volunteers-grid">
                  {filteredVolunteers.map(volunteer => (
                    <div key={volunteer.id} className="volunteer-card">
                      <div className="volunteer-info">
                        <h5>{volunteer.user?.firstName} {volunteer.user?.lastName}</h5>
                        <div className="volunteer-role">{volunteer.role || 'General Volunteer'}</div>
                      </div>
                      <div className="contact-info">
                        <div><i className="fas fa-envelope"></i> {volunteer.user?.email}</div>
                        {volunteer.user?.phoneNumber && (
                          <div><i className="fas fa-phone"></i> {volunteer.user?.phoneNumber}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analytics Section */}
          <div className="section-card">
            <div className="section-header">
              <h3>
                <i className="fas fa-chart-bar mr-2"></i>
                Registration Analytics
              </h3>
            </div>
            <div className="section-content">
              <div className="analytics-grid">

                {/* Age Groups Breakdown */}
                <div className="analytics-card">
                  <h4>Age Groups</h4>
                  {Object.keys(statistics.ageGroups).length === 0 ? (
                    <p className="text-muted">No age group data available</p>
                  ) : (
                    <div className="age-groups-list">
                      {Object.entries(statistics.ageGroups).map(([ageGroup, count]) => (
                        <div key={ageGroup} className="age-group-item">
                          <span className="age-group-name">{ageGroup}</span>
                          <span className="age-group-count">{count} participants</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Registration Timeline */}
                <div className="analytics-card">
                  <h4>Registration Timeline</h4>
                  {Object.keys(statistics.registrationTrend).length === 0 ? (
                    <p className="text-muted">No registration data available</p>
                  ) : (
                    <div className="registration-timeline">
                      {Object.entries(statistics.registrationTrend)
                        .sort(([a], [b]) => new Date(a) - new Date(b))
                        .map(([date, count]) => (
                        <div key={date} className="timeline-item">
                          <span className="timeline-date">{date}</span>
                          <span className="timeline-count">{count} registration{count !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="analytics-card">
                  <h4>Event Details</h4>
                  <div className="event-details-list">
                    {event.description && (
                      <div className="detail-item">
                        <strong>Description:</strong>
                        <p>{event.description}</p>
                      </div>
                    )}
                    {event.ageGroup && (
                      <div className="detail-item">
                        <strong>Target Age Group:</strong> {event.ageGroup}
                      </div>
                    )}
                    {event.price !== undefined && (
                      <div className="detail-item">
                        <strong>Price:</strong> {event.price > 0 ? `$${event.price}` : 'Free'}
                      </div>
                    )}
                    {event.capacity && (
                      <div className="detail-item">
                        <strong>Capacity:</strong> {event.capacity} participants
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .event-overview-header {
          background: var(--primary);
          color: white;
          padding: 3rem 0;
          margin-bottom: 2rem;
          border-bottom: 4px solid var(--secondary);
          position: relative;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          position: relative;
          z-index: 2;
        }

        .breadcrumb {
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }

        .breadcrumb-link {
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          transition: color 0.3s ease;
          font-weight: 500;
        }

        .breadcrumb-link:hover {
          color: white;
          text-decoration: underline;
        }

        .breadcrumb-separator {
          margin: 0 0.75rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .breadcrumb-current {
          color: white;
          font-weight: 600;
        }

        .event-title {
          font-size: 3rem;
          margin-bottom: 1.5rem;
          font-weight: 800;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          line-height: 1.1;
        }

        .event-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 2rem;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .event-meta-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .event-meta-item i {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          width: 20px;
          text-align: center;
        }

        .event-meta-content {
          flex: 1;
        }

        .event-meta-label {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }

        .event-meta-value {
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .event-status {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
          display: inline-block;
        }

        .event-status.upcoming {
          background: rgba(40, 167, 69, 0.9);
          color: white;
          border: 1px solid rgba(40, 167, 69, 1);
        }

        .event-status.past {
          background: rgba(108, 117, 125, 0.9);
          color: white;
          border: 1px solid rgba(108, 117, 125, 1);
        }

        .header-actions {
          margin-top: 1.5rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          display: inline-block;
        }

        .btn-secondary {
          background: var(--secondary);
          color: white;
        }

        .btn-secondary:hover {
          background: var(--secondary-light);
          color: white;
          text-decoration: none;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
        }

        .stat-icon.participants {
          background: var(--primary);
        }

        .stat-icon.volunteers {
          background: var(--secondary);
        }

        .stat-icon.revenue {
          background: var(--primary-light);
        }

        .stat-icon.capacity {
          background: var(--secondary-light);
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1;
        }

        .stat-label {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text);
          margin-top: 0.5rem;
        }

        .stat-sublabel {
          font-size: 0.9rem;
          color: #6c757d;
          margin-top: 0.25rem;
        }

        .overview-sections {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .section-card {
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .section-header {
          background: #f8f9fa;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #eee;
        }

        .section-header h3 {
          margin: 0;
          color: var(--text);
          font-weight: 600;
        }

        .section-content {
          padding: 2rem;
        }

        .participants-grid, .volunteers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .participant-card, .volunteer-card {
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .participant-card:hover, .volunteer-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: var(--primary);
        }

        .names-section {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f1f3f4;
        }

        .child-name {
          margin: 0 0 0.5rem 0;
          color: var(--primary);
          font-weight: 700;
          font-size: 1.3rem;
          line-height: 1.2;
        }

        .parent-name {
          margin: 0;
          color: var(--secondary);
          font-weight: 600;
          font-size: 1rem;
        }

        .participant-details {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .detail-item {
          background: linear-gradient(135deg, var(--primary), var(--primary-light));
          color: white;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(47, 80, 106, 0.2);
        }

        .detail-item.age {
          background: linear-gradient(135deg, #28a745, #20c997);
        }

        .detail-item.grade {
          background: linear-gradient(135deg, var(--secondary), #ff6b6b);
        }

        .contact-info {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 3px solid var(--secondary);
        }

        .contact-item {
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
          color: #495057;
          font-weight: 500;
        }

        .contact-item:last-child {
          margin-bottom: 0;
        }

        .registration-info {
          text-align: center;
          padding-top: 0.75rem;
          border-top: 1px solid #e9ecef;
        }

        .registration-date {
          font-size: 0.8rem;
          color: #6c757d;
          font-style: italic;
          background: #f1f3f4;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          display: inline-block;
        }

        .participant-info h5, .volunteer-info h5 {
          margin-bottom: 0.5rem;
          color: var(--primary);
          font-weight: 600;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .analytics-card {
          border: 1px solid #eee;
          border-radius: 10px;
          padding: 1.5rem;
          background: #fafafa;
        }

        .analytics-card h4 {
          margin-bottom: 1rem;
          color: var(--text);
          font-weight: 600;
        }

        .age-groups-list, .registration-timeline, .event-details-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .age-group-item, .timeline-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: white;
          border-radius: 6px;
          border: 1px solid #eee;
        }

        .age-group-name, .timeline-date {
          font-weight: 500;
        }

        .age-group-count, .timeline-count {
          color: #6c757d;
          font-size: 0.9rem;
        }

        .detail-item {
          margin-bottom: 1rem;
        }

        .detail-item strong {
          display: block;
          margin-bottom: 0.25rem;
          color: var(--text);
        }

        .detail-item p {
          margin: 0;
          color: #6c757d;
          line-height: 1.5;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
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

        .alert {
          padding: 1.5rem;
          border-radius: 10px;
          margin-bottom: 2rem;
        }

        .alert-danger {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .alert-warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
        }

        .text-muted {
          color: #6c757d !important;
        }

        .mr-1 {
          margin-right: 0.25rem;
        }

        .mr-2 {
          margin-right: 0.5rem;
        }

        @media (max-width: 768px) {
          .event-title {
            font-size: 2rem;
          }

          .event-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .participants-grid, .volunteers-grid {
            grid-template-columns: 1fr;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .section-content {
            padding: 1rem;
          }
        }

        /* Search functionality styling */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .section-title {
          flex: 1;
        }

        .section-search {
          flex: 0 0 auto;
          min-width: 300px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: #6c757d;
          z-index: 2;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 2px solid #e9ecef;
          border-radius: 25px;
          background: white;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          outline: none;
        }

        .search-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.1);
        }

        .search-input::placeholder {
          color: #adb5bd;
        }

        .clear-search {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .clear-search:hover {
          background-color: #f8f9fa;
          color: var(--secondary);
        }

        @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
            align-items: stretch;
          }

          .section-search {
            min-width: auto;
            width: 100%;
          }

          .search-input {
            font-size: 16px; /* Prevent zoom on iOS */
          }
        }
      `}</style>
    </>
  );
};

export default EventOverview;