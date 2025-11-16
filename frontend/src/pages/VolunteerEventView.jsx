import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import firestoreParticipantService from '../services/firestoreParticipantService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { formatAgeRange } from '../utils/eventFormatters';

const VolunteerEventView = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [volunteerSignup, setVolunteerSignup] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check-in functionality state
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    fetchEventData();
  }, [eventId, user]);

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch event details
      const eventData = await apiService.getEvent(eventId);
      setEvent(eventData);

      // Fetch volunteer's own signup
      const volunteerSignups = await apiService.getMyVolunteerSignups();
      const mySignup = volunteerSignups.find(v => v.eventId === eventId);

      if (!mySignup) {
        setError('You are not signed up as a volunteer for this event.');
        setIsLoading(false);
        return;
      }

      setVolunteerSignup(mySignup);

      // Fetch participant and volunteer counts from Firestore directly
      try {
        const participants = await firestoreParticipantService.getParticipantsByEvent(eventId);
        setParticipants(participants);
        setParticipantCount(participants.length);
      } catch (error) {
        console.warn('Could not fetch participants from Firestore:', error);
        setParticipants([]);
        setParticipantCount(0);
      }

      try {
        // Query volunteers collection directly for count
        const volunteersRef = collection(db, 'volunteers');
        const volunteerQuery = query(volunteersRef, where('eventId', '==', eventId));
        const volunteerSnapshot = await getDocs(volunteerQuery);
        setVolunteerCount(volunteerSnapshot.size);
      } catch (error) {
        console.warn('Could not fetch volunteer count from Firestore:', error);
        setVolunteerCount(0);
      }

    } catch (error) {
      console.error('Error fetching event data:', error);
      setError('Failed to load event data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return '#28a745';
      case 'PENDING':
        return '#ffc107';
      case 'CANCELLED':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  // Search participants by name, email, or phone
  const handleSearchParticipants = () => {
    if (!searchTerm.trim()) {
      setFilteredParticipants(participants);
    } else {
      const filtered = participants.filter(participant => {
        // Handle both old format (firstName/lastName) and new format (childFirstName/childLastName)
        const firstName = participant.firstName || participant.childFirstName || '';
        const lastName = participant.lastName || participant.childLastName || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        const email = (participant.parentEmail || '').toLowerCase();
        const phone = (participant.parentPhone || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        return fullName.includes(search) || email.includes(search) || phone.includes(search);
      });
      setFilteredParticipants(filtered);
    }
  };

  // Handle participant check-in/check-out
  const handleCheckIn = async (participantId, currentStatus) => {
    setIsCheckingIn(true);
    try {
      const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
      await firestoreParticipantService.updateAttendanceStatus(participantId, newStatus);

      // Update local state
      const updatedParticipants = participants.map(p =>
        p.id === participantId ? { ...p, attendanceStatus: newStatus } : p
      );
      setParticipants(updatedParticipants);

      // Update filtered list if search is active
      if (filteredParticipants.length > 0) {
        const updatedFiltered = filteredParticipants.map(p =>
          p.id === participantId ? { ...p, attendanceStatus: newStatus } : p
        );
        setFilteredParticipants(updatedFiltered);
      }

    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Failed to update attendance. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Initialize search when modal opens
  useEffect(() => {
    if (showCheckInModal) {
      handleSearchParticipants();
    }
  }, [showCheckInModal, participants]);

  // Update search results when search term changes
  useEffect(() => {
    if (showCheckInModal) {
      handleSearchParticipants();
    }
  }, [searchTerm]);

  // Calculate checked-in count
  const checkedInCount = participants.filter(p => p.attendanceStatus === 'PRESENT').length;

  if (isLoading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Access Error</h4>
          <p>{error}</p>
          <hr />
          <Link to="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!event || !volunteerSignup) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Event Not Found</h4>
          <p>The requested event could not be found or you don't have access to it.</p>
          <Link to="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/dashboard?tab=volunteer">Volunteer Activities</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {event.name}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="h2">{event.name}</h1>
          <p className="text-muted">Your Volunteer Dashboard</p>
        </div>
        <div className="col-md-4 text-md-end">
          <Link
            to={`/events/${eventId}`}
            className="btn btn-outline-primary me-2"
            target="_blank"
          >
            <i className="fas fa-external-link-alt me-1"></i>
            View Public Page
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            <i className="fas fa-arrow-left me-1"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="row">
        {/* Event Information Column */}
        <div className="col-12">
          {/* Event Information Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="fas fa-calendar-alt me-2"></i>
                Event Information
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Date:</strong> {formatDate(event.date)}</p>
                  <p><strong>Time:</strong> {formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
                  <p><strong>Age Range:</strong> {formatAgeRange(event)
                  }</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Location:</strong> {event.location}</p>
                  <p><strong>Price:</strong> ${event.price}</p>
                  <p><strong>Capacity:</strong> {event.capacity} participants</p>
                </div>
              </div>
              {event.description && (
                <div className="mt-3">
                  <h6>Description:</h6>
                  <p className="text-muted">{event.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Your Assignment Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="fas fa-user-check me-2"></i>
                Your Volunteer Assignment
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Role:</strong> {volunteerSignup.role || 'General Volunteer'}</p>
                  <p><strong>Signup Date:</strong> {formatDate(volunteerSignup.signupDate)}</p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span
                      className="badge"
                      style={{
                        backgroundColor: getStatusBadgeColor(volunteerSignup.status),
                        color: 'white'
                      }}
                    >
                      {volunteerSignup.status || 'PENDING'}
                    </span>
                  </p>
                </div>
                <div className="col-md-6">
                  {volunteerSignup.availability && (
                    <p><strong>Your Availability:</strong> {volunteerSignup.availability}</p>
                  )}
                  {volunteerSignup.skills && (
                    <p><strong>Skills/Tasks:</strong> {volunteerSignup.skills}</p>
                  )}
                  {volunteerSignup.notes && (
                    <p><strong>Notes:</strong> {volunteerSignup.notes}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Event Stats Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Event Statistics
              </h3>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-4">
                  <div className="border rounded p-3">
                    <h4 className="text-primary">{participantCount}</h4>
                    <p className="mb-0">Participants Registered</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="border rounded p-3">
                    <h4 className="text-success">{volunteerCount}</h4>
                    <p className="mb-0">Volunteers Signed Up</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="border rounded p-3">
                    <h4 className={participantCount >= event.capacity ? 'text-danger' : 'text-warning'}>
                      {Math.max(0, event.capacity - participantCount)}
                    </h4>
                    <p className="mb-0">Spots Remaining</p>
                  </div>
                </div>
              </div>
              {event.capacity && participantCount >= event.capacity && (
                <div className="alert alert-info mt-3" role="alert">
                  <i className="fas fa-info-circle me-2"></i>
                  This event is fully booked!
                </div>
              )}
            </div>
          </div>

          {/* Event Announcements */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="fas fa-bullhorn me-2"></i>
                Event Announcements
              </h3>
            </div>
            <div className="card-body">
              <div id="volunteer-announcements">
                <div className="text-muted text-center py-3">
                  <i className="fas fa-bullhorn fa-2x mb-2"></i>
                  <p>No announcements yet. Check back for updates from event coordinators.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Participant Check-in */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="fas fa-clipboard-check me-2"></i>
                Participant Check-in
              </h3>
            </div>
            <div className="card-body">
              <p className="text-muted mb-3">As a volunteer, you can help check in participants when they arrive.</p>
              <div className="row">
                <div className="col-md-6">
                  <div className="stat-card text-center p-3 border rounded">
                    <h4 className="text-primary mb-1">{participantCount}</h4>
                    <p className="mb-0">Total Registered</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="stat-card text-center p-3 border rounded">
                    <h4 className="text-success mb-1">{checkedInCount}</h4>
                    <p className="mb-0">Checked In</p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCheckInModal(true)}
                >
                  <i className="fas fa-search me-2"></i>
                  Check In Participants
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Column */}
      </div>

      {/* Additional Information */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Volunteer Information
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Event Day Checklist:</h6>
                  <ul>
                    <li>Arrive 30 minutes before event start time</li>
                    <li>Check in with event coordinator</li>
                    <li>Wear comfortable clothing and closed-toe shoes</li>
                    <li>Bring water bottle and any personal items needed</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Contact Information:</h6>
                  <p>
                    <strong>Event Coordinator:</strong><br />
                    Email: info@kidsinmotionpa.org<br />
                    Phone: (484) 885-6284
                  </p>
                  <p>
                    <strong>Emergency Contact:</strong><br />
                    Call the event coordinator number above
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-clipboard-check me-2"></i>
                  Participant Check-in
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCheckInModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-8">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by participant name, parent email, or phone number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-muted">
                      <small>{filteredParticipants.length} of {participantCount} participants</small>
                    </div>
                  </div>
                </div>

                {filteredParticipants.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-search fa-2x text-muted mb-3"></i>
                    <p className="text-muted">
                      {participants.length === 0 ? 'No participants registered for this event yet.' : 'No participants found matching your search.'}
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Participant</th>
                          <th>Parent Info</th>
                          <th>Age</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredParticipants.map((participant) => {
                          // Handle both old and new field name formats
                          const firstName = participant.firstName || participant.childFirstName || '';
                          const lastName = participant.lastName || participant.childLastName || '';
                          const age = participant.age || participant.childAge || '';
                          const allergies = participant.allergies || participant.medicalInfo || '';

                          return (
                          <tr key={participant.id}>
                            <td>
                              <strong>{firstName} {lastName}</strong>
                              {allergies && (
                                <div className="text-danger small">
                                  <i className="fas fa-exclamation-triangle me-1"></i>
                                  Medical/Allergies: {allergies}
                                </div>
                              )}
                            </td>
                            <td>
                              <div>{participant.parentEmail}</div>
                              {participant.parentPhone && (
                                <div className="text-muted small">{participant.parentPhone}</div>
                              )}
                            </td>
                            <td>{age}</td>
                            <td>
                              <span
                                className={`badge ${
                                  participant.attendanceStatus === 'PRESENT'
                                    ? 'bg-success'
                                    : participant.attendanceStatus === 'ABSENT'
                                    ? 'bg-danger'
                                    : 'bg-secondary'
                                }`}
                              >
                                {participant.attendanceStatus || 'Not Set'}
                              </span>
                            </td>
                            <td>
                              <button
                                className={`btn btn-sm ${
                                  participant.attendanceStatus === 'PRESENT'
                                    ? 'btn-outline-danger'
                                    : 'btn-outline-success'
                                }`}
                                onClick={() => handleCheckIn(participant.id, participant.attendanceStatus)}
                                disabled={isCheckingIn}
                              >
                                {isCheckingIn ? (
                                  <i className="fas fa-spinner fa-spin me-1"></i>
                                ) : (
                                  <i className={`fas ${
                                    participant.attendanceStatus === 'PRESENT'
                                      ? 'fa-times'
                                      : 'fa-check'
                                  } me-1`}></i>
                                )}
                                {participant.attendanceStatus === 'PRESENT' ? 'Mark Absent' : 'Check In'}
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <div className="me-auto">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    {checkedInCount} of {participantCount} participants checked in
                  </small>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCheckInModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerEventView;