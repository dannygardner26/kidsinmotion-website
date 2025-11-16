import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import firestoreParticipantService from '../services/firestoreParticipantService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { formatAgeRange } from '../utils/eventFormatters';

const ParentEventView = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

      // Fetch parent's registrations and filter for this event
      const allRegistrations = await apiService.getMyRegistrations();
      const eventRegistrations = allRegistrations.filter(reg => reg.eventId === eventId);

      if (eventRegistrations.length === 0) {
        setError('You do not have any children registered for this event.');
        setIsLoading(false);
        return;
      }

      setRegistrations(eventRegistrations);

      // Fetch volunteer count from Firestore directly
      try {
        const volunteersRef = collection(db, 'volunteers');
        const volunteerQuery = query(volunteersRef, where('eventId', '==', eventId));
        const volunteerSnapshot = await getDocs(volunteerQuery);
        setVolunteerCount(volunteerSnapshot.size);
      } catch (error) {
        console.warn('Could not fetch volunteer count from Firestore:', error);
        setVolunteerCount(0);
      }

      // Fetch total participant count from Firestore directly
      try {
        const participants = await firestoreParticipantService.getParticipantsByEvent(eventId);
        setTotalParticipants(participants.length);
      } catch (error) {
        console.warn('Could not fetch participant count from Firestore:', error);
        setTotalParticipants(eventRegistrations.length); // At least we know our own
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
      case 'REGISTERED':
      case 'CONFIRMED':
        return '#28a745';
      case 'PENDING':
        return '#ffc107';
      case 'CANCELLED':
        return '#dc3545';
      case 'ATTENDED':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      return 'N/A';
    }
  };

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

  if (!event) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Event Not Found</h4>
          <p>The requested event could not be found.</p>
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
            <Link to="/dashboard?tab=children">My Registrations</Link>
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
          <p className="text-muted">Parent Event Dashboard</p>
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

          {/* Your Registrations Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="fas fa-users me-2"></i>
                Your Registrations ({registrations.length})
              </h3>
            </div>
            <div className="card-body">
              {registrations.map((registration, index) => (
                <div key={registration.id || index} className="border rounded p-3 mb-3">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="mb-2">
                        <i className="fas fa-child me-2"></i>
                        {registration.childName}
                      </h6>
                      <p className="mb-1">
                        <strong>Age:</strong> {registration.childAge || calculateAge(registration.childBirthDate)} years old
                      </p>
                      <p className="mb-1">
                        <strong>Registration Date:</strong> {formatDate(registration.registrationDate)}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1">
                        <strong>Status:</strong>{' '}
                        <span
                          className="badge"
                          style={{
                            backgroundColor: getStatusBadgeColor(registration.status),
                            color: 'white'
                          }}
                        >
                          {registration.status || 'REGISTERED'}
                        </span>
                      </p>
                      {registration.emergencyContact && (
                        <p className="mb-1">
                          <strong>Emergency Contact:</strong> {registration.emergencyContact}
                        </p>
                      )}
                      {registration.medicalConcerns && (
                        <p className="mb-1">
                          <strong>Medical Notes:</strong>
                          <small className="text-muted d-block">{registration.medicalConcerns}</small>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h4 className="text-primary">{totalParticipants}</h4>
                    <p className="mb-0">Total Participants</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h4 className="text-success">{volunteerCount}</h4>
                    <p className="mb-0">Volunteers Helping</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Updates Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="fas fa-bullhorn me-2"></i>
                Event Updates & Information
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>What to Bring:</h6>
                  <ul>
                    <li>Water bottle</li>
                    <li>Comfortable athletic clothing</li>
                    <li>Closed-toe athletic shoes</li>
                    <li>Any personal medication needed</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Drop-off & Pick-up:</h6>
                  <ul>
                    <li>Arrive 15 minutes before start time</li>
                    <li>Check in with event coordinator</li>
                    <li>Pick up promptly at end time</li>
                    <li><strong>Equipment:</strong> Bring whatever equipment you have. Contact us at <a href="mailto:info@kidsinmotionpa.org">info@kidsinmotionpa.org</a> or <a href="tel:+14848856284">(484) 885-6284</a> if you need something.</li>
                  </ul>
                </div>
              </div>
              <div className="alert alert-info mt-3" role="alert">
                <strong>Contact Information:</strong><br />
                For questions or concerns, contact us at info@kidsinmotionpa.org or (484) 885-6284
              </div>
            </div>
          </div>

          {/* Event Announcements Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="fas fa-bullhorn me-2"></i>
                Event Announcements
              </h3>
            </div>
            <div className="card-body">
              <div id="parent-announcements">
                <div className="text-muted text-center py-3">
                  <i className="fas fa-bullhorn fa-2x mb-2"></i>
                  <p>No announcements yet. Check back for important updates about this event.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentEventView;