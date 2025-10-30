import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import EventChat from '../components/EventChat';
import firestoreParticipantService from '../services/firestoreParticipantService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const VolunteerEventView = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [volunteerSignup, setVolunteerSignup] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [volunteerCount, setVolunteerCount] = useState(0);
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
        setParticipantCount(participants.length);
      } catch (error) {
        console.warn('Could not fetch participant count from Firestore:', error);
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
        <div className="col-lg-8">
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
                  <p><strong>Age Group:</strong> {event.ageGroup}</p>
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
              {participantCount >= event.capacity && (
                <div className="alert alert-info mt-3" role="alert">
                  <i className="fas fa-info-circle me-2"></i>
                  This event is fully booked!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Column */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">
                <i className="fas fa-comments me-2"></i>
                Event Discussion
              </h3>
            </div>
            <div className="card-body p-0">
              <EventChat
                eventId={eventId}
                currentUser={user}
                userRole="volunteer"
                eventName={event.name}
              />
            </div>
          </div>
        </div>
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
    </div>
  );
};

export default VolunteerEventView;