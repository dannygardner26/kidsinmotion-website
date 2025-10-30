import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';

const EventRegistrations = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEventAndParticipants();
  }, [id]);

  const fetchEventAndParticipants = async () => {
    try {
      setLoading(true);
      // Fetch event details
      const eventData = await apiService.getEvent(id);
      setEvent(eventData);

      // Fetch participants for this event
      const participantsData = await apiService.getEventParticipants(id);
      setParticipants(participantsData);
    } catch (error) {
      console.error('Error fetching event participants:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading event registrations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Error Loading Registrations</h4>
          <p>{error}</p>
          <Link to="/admin" className="btn btn-primary">
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>Event Registrations</h2>
              {event && <h4 className="text-muted">{event.name}</h4>}
            </div>
            <Link to="/admin" className="btn btn-secondary">
              Back to Admin Dashboard
            </Link>
          </div>

          {event && (
            <div className="card mb-4">
              <div className="card-body">
                <h5>Event Details</h5>
                <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Location:</strong> {event.location || 'Not specified'}</p>
                <p><strong>Capacity:</strong> {event.capacity || 'Unlimited'}</p>
                <p><strong>Age Group:</strong> {event.ageGroup || 'All ages'}</p>
                <p><strong>Price:</strong> {event.price ? `$${event.price}` : 'Free'}</p>
                <p><strong>Description:</strong> {event.description}</p>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                Registrations ({participants.length})
                {event?.capacity && (
                  <span className="text-muted"> / {event.capacity}</span>
                )}
              </h5>
            </div>
            <div className="card-body">
              {participants.length === 0 ? (
                <div className="text-center py-4">
                  <h6>No registrations yet</h6>
                  <p className="text-muted">
                    Participants who register for this event will appear here.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Participant Name</th>
                        <th>Parent/Guardian</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Age</th>
                        <th>Registered</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant) => (
                        <tr key={participant.id}>
                          <td>
                            <strong>{participant.childName}</strong>
                          </td>
                          <td>
                            {participant.user?.name || 'N/A'}
                          </td>
                          <td>
                            {participant.user?.email || 'N/A'}
                          </td>
                          <td>
                            {participant.user?.phone || participant.emergencyContact || 'N/A'}
                          </td>
                          <td>
                            {participant.childAge || 'N/A'}
                          </td>
                          <td>
                            {new Date(participant.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                participant.status === 'CONFIRMED' ? 'bg-success' :
                                participant.status === 'PENDING' ? 'bg-warning' :
                                participant.status === 'CANCELLED' ? 'bg-danger' :
                                'bg-secondary'
                              }`}
                            >
                              {participant.status || 'REGISTERED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {event?.capacity && participants.length > 0 && (
                <div className="mt-3">
                  <div className="progress" style={{ position: 'relative' }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{
                        width: `${Math.min((participants.length / event.capacity) * 100, 100)}%`
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontWeight: 'bold',
                        color: '#000',
                        fontSize: '0.875rem',
                        textShadow: '1px 1px 1px rgba(255,255,255,0.8)'
                      }}
                    >
                      {participants.length} / {event.capacity}
                    </div>
                  </div>
                  <small className="text-muted">
                    {event.capacity - participants.length > 0
                      ? `${event.capacity - participants.length} spots remaining`
                      : 'Event is full'
                    }
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventRegistrations;