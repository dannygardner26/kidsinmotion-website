import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import firebaseRealtimeService from '../services/firebaseRealtimeService';

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
  const [volunteerError, setVolunteerError] = useState(null);


  // Search functionality
  const [participantSearch, setParticipantSearch] = useState('');
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [updatingAttendance, setUpdatingAttendance] = useState({});

  // Delete functionality
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for real-time updates
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);

  // Real-time listener state
  const [realtimeError, setRealtimeError] = useState(null);

  useEffect(() => {
    if (eventId) {
      console.log('EventOverview: Setting up real-time listeners for event:', eventId);
      setupRealtimeListeners();

      return () => {
        // Clean up real-time listeners
        firebaseRealtimeService.unsubscribeAll();
      };
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      console.log('EventOverview: Starting to fetch data for event ID:', eventId);

      // Fetch event details and participants in parallel
      console.log('EventOverview: Fetching event details and participants...');
      const [eventData, participantsData] = await Promise.all([
        apiService.getEventById(eventId),
        apiService.getEventParticipants(eventId)
      ]);

      console.log('EventOverview: Event data received:', eventData);
      console.log('EventOverview: Participants data received:', participantsData);
      setEvent(eventData);
      setParticipants(participantsData);

      // Fetch volunteers for this event (admin only)
      console.log('EventOverview: Fetching volunteers...');
      console.log('EventOverview: Current user profile:', userProfile);
      console.log('EventOverview: User type:', userProfile?.userType);
      console.log('EventOverview: Is admin check:', userProfile?.userType === 'ADMIN');
      let volunteersData = [];

      // Clear previous volunteer error
      setVolunteerError(null);

      if (userProfile && userProfile.userType === 'ADMIN') {
        try {
          setLoadingVolunteers(true);
          volunteersData = await apiService.getEventVolunteers(eventId);
          console.log('EventOverview: Volunteers data received:', volunteersData);
          setVolunteers(volunteersData);
        } catch (volError) {
          console.error('EventOverview: Volunteer fetch error:', volError);
          console.error('EventOverview: Error response:', volError.response);

          // Set specific error messages based on error type
          let errorMessage = 'Failed to load volunteers';
          if (volError.message) {
            if (volError.message.includes('403') || volError.message.includes('Forbidden')) {
              errorMessage = 'Access denied - admin privileges required';
            } else if (volError.message.includes('404')) {
              errorMessage = 'Volunteer service not found';
            } else if (volError.message.includes('500')) {
              errorMessage = 'Server error loading volunteers';
            } else {
              errorMessage = volError.message;
            }
          }

          setVolunteerError(errorMessage);
          setVolunteers([]);
        } finally {
          setLoadingVolunteers(false);
        }
      } else if (userProfile?.userType) {
        // User is logged in but not admin
        setVolunteerError('Admin access required to view volunteers');
        setVolunteers([]);
        setLoadingVolunteers(false);
        console.log('EventOverview: User is not admin, skipping volunteer fetch');
      } else {
        // User profile not loaded yet or user not logged in
        console.log('EventOverview: User profile not available, skipping volunteer fetch');
        setVolunteers([]);
        setLoadingVolunteers(false);
      }

      // Calculate statistics
      console.log('EventOverview: Calculating statistics...');
      const attendedCount = participantsData.filter(p => p.status === 'ATTENDED').length;
      const stats = {
        totalParticipants: participantsData.length,
        totalVolunteers: volunteersData.length,
        volunteerError: volunteerError,
        revenue: participantsData.length * (eventData.price || 0),
        capacity: eventData.capacity,
        registrationRate: eventData.capacity ? (participantsData.length / eventData.capacity * 100).toFixed(1) : 'N/A',
        attendedCount: attendedCount,
        attendanceRate: participantsData.length > 0 ? ((attendedCount / participantsData.length) * 100).toFixed(1) : 0,
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
      setIsRefreshing(false);
    }
  };


  // Real-time listeners setup
  const setupRealtimeListeners = () => {
    setIsLoading(true);
    setRealtimeError(null);

    // Subscribe to event changes
    firebaseRealtimeService.subscribeToEvent(
      eventId,
      (eventData) => {
        console.log('EventOverview: Real-time event update:', eventData);
        setEvent(eventData);
      },
      (error) => {
        console.error('EventOverview: Real-time event error:', error);
        setRealtimeError(`Event updates unavailable: ${error.message}`);
        // Fallback to API if needed
        fallbackToApiCall('event');
      }
    );

    // Subscribe to participants changes
    firebaseRealtimeService.subscribeToEventParticipants(
      eventId,
      (participantsData) => {
        console.log('EventOverview: Real-time participants update:', participantsData);
        setParticipants(participantsData);

        // Update statistics when participants change
        if (event) {
          updateStatistics(event, participantsData, volunteers);
        }
      },
      (error) => {
        console.error('EventOverview: Real-time participants error:', error);
        setRealtimeError(`Participant updates unavailable: ${error.message}`);
        // Fallback to API if needed
        fallbackToApiCall('participants');
      }
    );

    // Subscribe to volunteers changes (admin only)
    if (userProfile && userProfile.userType === 'ADMIN') {
      setLoadingVolunteers(true);
      firebaseRealtimeService.subscribeToEventVolunteers(
        eventId,
        (volunteersData) => {
          console.log('EventOverview: Real-time volunteers update:', volunteersData);
          setVolunteers(volunteersData);
          setVolunteerError(null);
          setLoadingVolunteers(false);

          // Update statistics when volunteers change
          if (event) {
            updateStatistics(event, participants, volunteersData);
          }
        },
        (error) => {
          console.error('EventOverview: Real-time volunteers error:', error);
          let errorMessage = 'Real-time volunteer updates unavailable';
          if (error.message) {
            if (error.message.includes('permission-denied')) {
              errorMessage = 'Access denied - admin privileges required';
            } else if (error.message.includes('not-found')) {
              errorMessage = 'Volunteer data not found';
            } else {
              errorMessage = error.message;
            }
          }
          setVolunteerError(errorMessage);
          setLoadingVolunteers(false);
          // Fallback to API if needed
          fallbackToApiCall('volunteers');
        }
      );
    } else {
      setVolunteers([]);
      setLoadingVolunteers(false);
    }

    setIsLoading(false);
  };

  // Fallback to API calls if real-time fails
  const fallbackToApiCall = async (dataType) => {
    console.log(`EventOverview: Falling back to API for ${dataType}`);

    try {
      switch (dataType) {
        case 'event':
          const eventData = await apiService.getEventById(eventId);
          setEvent(eventData);
          break;
        case 'participants':
          const participantsData = await apiService.getEventParticipants(eventId);
          setParticipants(participantsData);
          break;
        case 'volunteers':
          if (userProfile && userProfile.userType === 'ADMIN') {
            const volunteersData = await apiService.getEventVolunteers(eventId);
            setVolunteers(volunteersData);
            setVolunteerError(null);
          }
          break;
      }
    } catch (error) {
      console.error(`EventOverview: API fallback failed for ${dataType}:`, error);
    }
  };

  // Update statistics helper
  const updateStatistics = (eventData, participantsData, volunteersData) => {
    const attendedCount = participantsData.filter(p => p.status === 'ATTENDED').length;
    const stats = {
      totalParticipants: participantsData.length,
      totalVolunteers: volunteersData.length,
      volunteerError: volunteerError,
      revenue: participantsData.length * (eventData.price || 0),
      capacity: eventData.capacity,
      registrationRate: eventData.capacity ? (participantsData.length / eventData.capacity * 100).toFixed(1) : 100,
      attendedCount: attendedCount,
      attendanceRate: participantsData.length > 0 ? ((attendedCount / participantsData.length) * 100).toFixed(1) : 0,
      ageGroups: calculateAgeGroups(participantsData),
      registrationTrend: calculateRegistrationTrend(participantsData)
    };
    console.log('EventOverview: Statistics updated:', stats);
    setStatistics(stats);
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
    // Group registrations by date with date guards
    const registrationsByDate = {};
    participants.forEach(participant => {
      if (participant.registrationDate) {
        try {
          const date = new Date(participant.registrationDate).toLocaleDateString();
          // Check if date is valid
          if (date !== 'Invalid Date') {
            registrationsByDate[date] = (registrationsByDate[date] || 0) + 1;
          }
        } catch (dateError) {
          console.warn('Invalid registration date for participant:', participant.id, participant.registrationDate);
        }
      }
    });
    return registrationsByDate;
  };


  // Filter functions for search
  const filteredParticipants = participants.filter(participant => {
    if (!participantSearch.trim()) return true;

    const searchTerm = participantSearch.toLowerCase();
    const childName = (participant.childName || participant.participantName || participant.name || '').toLowerCase();
    
    // Check parent name from denormalized fields first, then nested object, then fallback
    let parentName = '';
    if (participant.parentUserFullName) {
      parentName = participant.parentUserFullName.toLowerCase();
    } else if (participant.parentUserFirstName && participant.parentUserLastName) {
      parentName = `${participant.parentUserFirstName} ${participant.parentUserLastName}`.toLowerCase();
    } else if (participant.parentUser?.firstName && participant.parentUser?.lastName) {
      parentName = `${participant.parentUser.firstName} ${participant.parentUser.lastName}`.toLowerCase();
    } else if (participant.parentName) {
      parentName = participant.parentName.toLowerCase();
    }

    return childName.includes(searchTerm) || parentName.includes(searchTerm);
  });

  const handleAttendanceToggle = async (participantId, currentStatus) => {
    try {
      setUpdatingAttendance(prev => ({ ...prev, [participantId]: true }));

      const isCurrentlyPresent = currentStatus === 'ATTENDED';
      const newIsPresent = !isCurrentlyPresent;

      await apiService.updateParticipantAttendance(participantId, newIsPresent);

      // Update the local state
      setParticipants(prev =>
        prev.map(participant =>
          participant.id === participantId
            ? { ...participant, status: newIsPresent ? 'ATTENDED' : 'REGISTERED' }
            : participant
        )
      );

    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Failed to update attendance: ' + error.message);
    } finally {
      setUpdatingAttendance(prev => ({ ...prev, [participantId]: false }));
    }
  };

  // Delete handlers
  const handleDeleteParticipant = (participantId, childName) => {
    setDeleteTarget({
      id: participantId,
      name: childName,
      type: 'participant'
    });
    setShowDeleteModal(true);
  };

  const handleDeleteVolunteer = (volunteerId, volunteerName) => {
    setDeleteTarget({
      id: volunteerId,
      name: volunteerName,
      type: 'volunteer'
    });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'participant') {
        await apiService.cancelRegistration(deleteTarget.id);
        setParticipants(prev => prev.filter(p => p.id !== deleteTarget.id));

        // Recalculate statistics
        const updatedParticipants = participants.filter(p => p.id !== deleteTarget.id);
        updateStatistics(event, updatedParticipants, volunteers);
      } else if (deleteTarget.type === 'volunteer') {
        await apiService.cancelVolunteerSignup(deleteTarget.id);
        setVolunteers(prev => prev.filter(v => v.id !== deleteTarget.id));

        // Recalculate statistics
        const updatedVolunteers = volunteers.filter(v => v.id !== deleteTarget.id);
        updateStatistics(event, participants, updatedVolunteers);
      }

      setShowDeleteModal(false);
      setDeleteTarget(null);
      alert(`${deleteTarget.name} has been successfully removed.`);
    } catch (error) {
      console.error('Error deleting:', error);
      alert(`Failed to delete ${deleteTarget.name}: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredVolunteers = volunteers.filter(volunteer => {
    if (!volunteerSearch.trim()) return true;

    const searchTerm = volunteerSearch.toLowerCase();
    const volunteerName = volunteer.userFirstName && volunteer.userLastName
      ? `${volunteer.userFirstName} ${volunteer.userLastName}`.toLowerCase()
      : '';
    const volunteerEmail = (volunteer.userEmail || '').toLowerCase();
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
              <button
                onClick={() => {
                  setIsRefreshing(true);
                  setupRealtimeListeners();
                }}
                className="btn btn-sm btn-secondary ml-3"
                disabled={isRefreshing}
                title="Refresh real-time listeners"
              >
                <i className={`fas fa-sync-alt ${isRefreshing ? 'fa-spin' : ''}`}></i>
              </button>
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
                    {event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Date TBD'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                    {(() => {
                      // Helper function to format time from various possible formats
                      const formatTime = (timeValue) => {
                        if (!timeValue) return null;
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
                          return null;
                        } catch (error) {
                          console.error('Error parsing time:', timeValue, error);
                          return null;
                        }
                      };

                      const formattedStartTime = formatTime(event.startTime);
                      const formattedEndTime = formatTime(event.endTime);

                      if (formattedStartTime && formattedEndTime) {
                        return `${formattedStartTime} - ${formattedEndTime}`;
                      } else if (formattedStartTime) {
                        return formattedStartTime;
                      } else {
                        return 'Time TBD';
                      }
                    })()}
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

        {/* Real-time Status Alert */}
        {realtimeError && (
          <div className="alert alert-warning">
            <div className="d-flex align-items-center">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <div className="flex-grow-1">
                <strong>Real-time Updates Issue:</strong> {realtimeError}
              </div>
              <button
                className="btn btn-sm btn-outline-dark"
                onClick={() => {
                  setRealtimeError(null);
                  setupRealtimeListeners();
                }}
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

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
              <div className="stat-number">
                {statistics.totalVolunteers}
                {statistics.volunteerError && statistics.totalVolunteers === 0 && (
                  <i className="fas fa-exclamation-triangle text-warning ml-2"
                     title={`Error loading volunteers: ${statistics.volunteerError}`}></i>
                )}
              </div>
              <div className="stat-label">Volunteers</div>
              <div className="stat-sublabel">
                {statistics.volunteerError && statistics.totalVolunteers === 0
                  ? `Error: ${statistics.volunteerError}`
                  : 'Supporting this event'
                }
              </div>
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
              <div className="stat-number">{statistics.registrationRate === 'N/A' ? 'N/A' : `${statistics.registrationRate}%`}</div>
              <div className="stat-label">Capacity</div>
              <div className="stat-sublabel">
                {event.capacity ? `${statistics.totalParticipants}/${event.capacity} spots` : 'Unlimited'}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon attendance">
              <i className="fas fa-user-check"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{statistics.attendedCount}</div>
              <div className="stat-label">Present</div>
              <div className="stat-sublabel">
                {statistics.attendanceRate}% attendance rate
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
                    
                    // Get parent name - check denormalized fields first, then nested object, then fallback
                    let parentName = 'Unknown Parent';
                    if (participant.parentUserFullName) {
                      parentName = participant.parentUserFullName;
                    } else if (participant.parentUserFirstName && participant.parentUserLastName) {
                      parentName = `${participant.parentUserFirstName} ${participant.parentUserLastName}`;
                    } else if (participant.parentUser?.firstName && participant.parentUser?.lastName) {
                      parentName = `${participant.parentUser.firstName} ${participant.parentUser.lastName}`;
                    } else if (participant.parentName) {
                      parentName = participant.parentName;
                    }

                    const isPresent = participant.status === 'ATTENDED';
                    const isUpdating = updatingAttendance[participant.id];

                    return (
                      <div key={participant.id} className={`participant-card ${isPresent ? 'present' : 'absent'}`}>
                        <div className="participant-header">
                          <div className="child-info">
                            <h5 className="child-name">
                              <i className="fas fa-child mr-2"></i>
                              {childName}
                            </h5>
                            <div className="participant-details">
                              {participant.childAge && (
                                <span className="age-group">
                                  <i className="fas fa-birthday-cake mr-1"></i>
                                  {participant.childAge} years old
                                </span>
                              )}
                              {participant.ageGroup && (
                                <span className="age-group">{participant.ageGroup}</span>
                              )}
                              {participant.grade && (
                                <span className="grade">Grade {participant.grade}</span>
                              )}
                            </div>
                          </div>
                          <div className="attendance-controls">
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteParticipant(participant.id, childName)}
                              title="Delete Registration"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc3545',
                                fontSize: '14px',
                                cursor: 'pointer',
                                marginRight: '10px'
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                            <div className={`attendance-status ${isPresent ? 'present' : 'absent'}`}>
                              <i className={`fas ${isPresent ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                              {isPresent ? 'Present' : 'Absent'}
                            </div>
                            <button
                              className={`attendance-toggle ${isPresent ? 'mark-absent' : 'mark-present'}`}
                              onClick={() => handleAttendanceToggle(participant.id, participant.status)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <>
                                  <i className={`fas ${isPresent ? 'fa-user-times' : 'fa-user-check'}`}></i>
                                  {isPresent ? 'Mark Absent' : 'Mark Present'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="parent-info">
                          <div className="parent-name">
                            <i className="fas fa-user mr-2"></i>
                            <strong>Parent:</strong> {participant.parentUserId ? (
                              <Link
                                to={`/account/${participant.parentUserId}`}
                                className="parent-link"
                                title="View parent profile"
                              >
                                {parentName}
                              </Link>
                            ) : (
                              parentName
                            )}
                          </div>
                          <div className="contact-info">
                            {participant.parentUserEmail && (
                              <div><i className="fas fa-envelope"></i> {participant.parentUserEmail}</div>
                            )}
                            {participant.parentUserPhoneNumber && (
                              <div><i className="fas fa-phone"></i> {participant.parentUserPhoneNumber}</div>
                            )}
                            {participant.emergencyContact && (
                              <div><i className="fas fa-phone-alt"></i> <strong>Emergency:</strong> {participant.emergencyContact}</div>
                            )}
                          </div>
                        </div>

                        {/* Additional Registration Details */}
                        <div className="registration-details">
                          {participant.allergies && (
                            <div className="detail-item allergies">
                              <i className="fas fa-exclamation-triangle mr-1"></i>
                              <strong>Allergies:</strong> {participant.allergies}
                            </div>
                          )}
                          {participant.medicalConcerns && (
                            <div className="detail-item medical">
                              <i className="fas fa-heartbeat mr-1"></i>
                              <strong>Medical Concerns:</strong> {participant.medicalConcerns}
                            </div>
                          )}
                          {participant.needsFood !== null && (
                            <div className="detail-item food">
                              <i className={`fas ${participant.needsFood ? 'fa-utensils' : 'fa-times'} mr-1`}></i>
                              <strong>Food needed:</strong> {participant.needsFood ? 'Yes' : 'No'}
                            </div>
                          )}
                          {participant.additionalInformation && (
                            <div className="detail-item additional">
                              <i className="fas fa-info-circle mr-1"></i>
                              <strong>Additional Info:</strong> {participant.additionalInformation}
                            </div>
                          )}
                        </div>

                        <div className="registration-date">
                          <i className="fas fa-calendar mr-1"></i>
                          Registered: {participant.registrationDate
                            ? (() => {
                                try {
                                  const date = new Date(participant.registrationDate).toLocaleDateString();
                                  return date !== 'Invalid Date' ? date : 'Unknown';
                                } catch {
                                  return 'Unknown';
                                }
                              })()
                            : 'Unknown'
                          }
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
              {loadingVolunteers ? (
                <div className="loading-state">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading volunteers...</p>
                </div>
              ) : statistics.volunteerError ? (
                <div className="error-state">
                  <div className="alert alert-warning">
                    <h5><i className="fas fa-exclamation-triangle mr-2"></i>Volunteer Loading Error</h5>
                    <p>{statistics.volunteerError}</p>
                    {userProfile?.userType === 'ADMIN' && (
                      <small className="text-muted">
                        This may be due to a temporary service issue. Try refreshing the page.
                      </small>
                    )}
                  </div>
                </div>
              ) : filteredVolunteers.length === 0 ? (
                <div className="empty-state">
                  {volunteers.length === 0 ? (
                    <div>
                      <p>No volunteers assigned to this event yet.</p>
                      {userProfile?.userType === 'ADMIN' && (
                        <small className="text-muted">Volunteers may sign up for this event through the volunteer signup form.</small>
                      )}
                    </div>
                  ) : (
                    <p>No volunteers found matching "{volunteerSearch}".</p>
                  )}
                </div>
              ) : (
                <div className="volunteers-grid">
                  {filteredVolunteers.map(volunteer => (
                    <div key={volunteer.id} className="volunteer-card">
                      <div className="volunteer-header">
                        <div className="volunteer-info">
                          <h5>{volunteer.userFirstName} {volunteer.userLastName}</h5>
                          <div className="volunteer-role">{volunteer.role || 'General Volunteer'}</div>
                        </div>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteVolunteer(volunteer.id, `${volunteer.userFirstName} ${volunteer.userLastName}`)}
                          title="Remove Volunteer"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc3545',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      <div className="contact-info">
                        <div><i className="fas fa-envelope"></i> {volunteer.userEmail}</div>
                        {volunteer.userPhoneNumber && (
                          <div><i className="fas fa-phone"></i> {volunteer.userPhoneNumber}</div>
                        )}
                      </div>
                      <div className="volunteer-details">
                        <div className="volunteer-status">
                          <span className={`status-badge ${volunteer.status?.toLowerCase()}`}>
                            {volunteer.status || 'CONFIRMED'}
                          </span>
                        </div>
                        <div className="signup-date">
                          <i className="fas fa-calendar mr-1"></i>
                          Signed up: {new Date(volunteer.signupDate).toLocaleDateString()}
                        </div>
                        {volunteer.availability && (
                          <div className="availability">
                            <i className="fas fa-clock mr-1"></i>
                            {volunteer.availability}
                          </div>
                        )}
                        {volunteer.notes && (
                          <div className="volunteer-notes">
                            <i className="fas fa-sticky-note mr-1"></i>
                            <strong>Notes:</strong> {volunteer.notes}
                          </div>
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
                  {!statistics.ageGroups || Object.keys(statistics.ageGroups).length === 0 ? (
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
                  {!statistics.registrationTrend || Object.keys(statistics.registrationTrend).length === 0 ? (
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

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-primary:hover {
          background: var(--primary-light);
          color: white;
          text-decoration: none;
        }

        .btn-primary:disabled {
          background: #6c757d;
          border-color: #6c757d;
          opacity: 0.65;
          cursor: not-allowed;
        }

        .ml-2 {
          margin-left: 0.5rem;
        }

        .mr-1 {
          margin-right: 0.25rem;
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

        .stat-icon.attendance {
          background: #28a745;
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
          border: 1px solid #eee;
          border-radius: 10px;
          padding: 1.5rem;
          background: #fafafa;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
        }

        .participant-card:hover, .volunteer-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .participant-card.present {
          border-left: 4px solid #28a745;
          background: rgba(40, 167, 69, 0.05);
        }

        .participant-card.absent {
          border-left: 4px solid #6c757d;
          background: rgba(108, 117, 125, 0.05);
        }

        .participant-info h5, .volunteer-info h5 {
          margin-bottom: 0.5rem;
          color: var(--primary);
          font-weight: 600;
        }

        .parent-link {
          color: var(--primary);
          text-decoration: none;
          border-bottom: 1px dotted var(--primary);
          transition: all 0.2s ease;
        }

        .parent-link:hover {
          color: var(--secondary);
          border-bottom-color: var(--secondary);
          text-decoration: none;
        }

        .participant-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .participant-details {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .attendance-controls {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .attendance-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .attendance-status.present {
          background-color: #d4edda;
          color: #155724;
        }

        .attendance-status.absent {
          background-color: #f8d7da;
          color: #721c24;
        }

        .attendance-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .attendance-toggle:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .attendance-toggle.mark-present {
          background-color: #28a745;
          color: white;
        }

        .attendance-toggle.mark-present:hover:not(:disabled) {
          background-color: #218838;
        }

        .attendance-toggle.mark-absent {
          background-color: #dc3545;
          color: white;
        }

        .attendance-toggle.mark-absent:hover:not(:disabled) {
          background-color: #c82333;
        }

        .registration-details {
          margin: 1rem 0;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .detail-item {
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .detail-item:last-child {
          margin-bottom: 0;
        }

        .detail-item.allergies {
          color: #856404;
          background: #fff3cd;
          padding: 0.5rem;
          border-radius: 4px;
          border-left: 3px solid #ffc107;
        }

        .detail-item.medical {
          color: #721c24;
          background: #f8d7da;
          padding: 0.5rem;
          border-radius: 4px;
          border-left: 3px solid #dc3545;
        }

        .detail-item.food {
          color: #0c5460;
          background: #d1ecf1;
          padding: 0.5rem;
          border-radius: 4px;
          border-left: 3px solid #17a2b8;
        }

        .detail-item.additional {
          color: #495057;
          background: #f8f9fa;
          padding: 0.5rem;
          border-radius: 4px;
          border-left: 3px solid #6c757d;
        }

        .age-group, .grade, .volunteer-role {
          background: var(--primary);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .volunteer-details {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .volunteer-status {
          margin-bottom: 0.75rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.confirmed {
          background-color: #d4edda;
          color: #155724;
        }

        .status-badge.pending {
          background-color: #fff3cd;
          color: #856404;
        }

        .status-badge.cancelled {
          background-color: #f8d7da;
          color: #721c24;
        }

        .signup-date, .availability {
          font-size: 0.85rem;
          color: #6c757d;
          margin-bottom: 0.5rem;
        }

        .volunteer-notes {
          font-size: 0.85rem;
          margin-top: 0.75rem;
          padding: 0.5rem;
          background: rgba(47, 80, 106, 0.05);
          border-radius: 6px;
          border-left: 3px solid var(--primary);
        }

        .parent-info, .contact-info {
          margin-bottom: 0.75rem;
        }

        .contact-info div {
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
          color: #6c757d;
        }

        .contact-info i {
          width: 16px;
          margin-right: 0.5rem;
        }

        .registration-date {
          font-size: 0.8rem;
          color: #6c757d;
          font-style: italic;
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

        .error-state {
          padding: 1rem;
        }

        .error-state .alert {
          margin: 0;
        }

        .text-warning {
          color: #ffc107 !important;
        }

        .ml-2 {
          margin-left: 0.5rem;
        }

        .btn-success {
          background-color: #28a745;
          border-color: #28a745;
          color: white;
        }

        .btn-outline-secondary {
          border-color: #6c757d;
          color: #6c757d;
        }

        .btn-outline-secondary:hover {
          background-color: #6c757d;
          color: white;
        }

        .btn-outline-dark {
          border-color: #343a40;
          color: #343a40;
        }

        .btn-outline-dark:hover {
          background-color: #343a40;
          color: white;
        }

        .d-flex {
          display: flex !important;
        }

        .align-items-center {
          align-items: center !important;
        }

        .flex-grow-1 {
          flex-grow: 1 !important;
        }

        .loading-state {
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

          .participant-header {
            flex-direction: column;
            gap: 1rem;
          }

          .attendance-controls {
            align-items: stretch;
            width: 100%;
          }

          .attendance-toggle {
            justify-content: center;
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h4 style={{ marginBottom: '15px', color: '#dc3545' }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
              Confirm Deletion
            </h4>
            <p style={{ marginBottom: '20px', fontSize: '16px' }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>'s {deleteTarget.type === 'participant' ? 'registration' : 'volunteer signup'}?
            </p>
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#856404'
            }}>
              <strong>Warning:</strong> This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.6 : 1
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default EventOverview;