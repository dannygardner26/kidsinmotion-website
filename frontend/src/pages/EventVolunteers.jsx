import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';

const EventVolunteers = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEventAndVolunteers();
  }, [id]);

  const fetchEventAndVolunteers = async () => {
    try {
      setLoading(true);
      // Fetch event details
      const eventData = await apiService.getEvent(id);
      setEvent(eventData);

      // Fetch volunteers for this event
      const volunteersData = await apiService.getEventVolunteers(id);
      setVolunteers(volunteersData);
    } catch (error) {
      console.error('Error fetching event volunteers:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateVolunteerStatus = async (volunteerId, status) => {
    try {
      await apiService.updateVolunteerStatus(volunteerId, status);
      // Refresh volunteers list
      await fetchEventAndVolunteers();
    } catch (error) {
      console.error('Error updating volunteer status:', error);
      alert('Failed to update volunteer status');
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading event volunteers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Error Loading Volunteers</h4>
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
              <h2>Event Volunteers</h2>
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
                <p><strong>Description:</strong> {event.description}</p>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                Volunteers ({volunteers.length})
              </h5>
            </div>
            <div className="card-body">
              {volunteers.length === 0 ? (
                <div className="text-center py-4">
                  <h6>No volunteers signed up yet</h6>
                  <p className="text-muted">
                    Volunteers who sign up for this event will appear here.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Signed Up</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volunteers.map((volunteer) => (
                        <tr key={volunteer.id}>
                          <td>
                            {volunteer.user?.name || 'N/A'}
                          </td>
                          <td>
                            {volunteer.user?.email || 'N/A'}
                          </td>
                          <td>
                            {volunteer.user?.phone || 'N/A'}
                          </td>
                          <td>
                            {new Date(volunteer.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                volunteer.status === 'CONFIRMED' ? 'bg-success' :
                                volunteer.status === 'PENDING' ? 'bg-warning' :
                                volunteer.status === 'CANCELLED' ? 'bg-danger' :
                                'bg-secondary'
                              }`}
                            >
                              {volunteer.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              {volunteer.status !== 'CONFIRMED' && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => updateVolunteerStatus(volunteer.id, 'CONFIRMED')}
                                >
                                  Confirm
                                </button>
                              )}
                              {volunteer.status !== 'CANCELLED' && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => updateVolunteerStatus(volunteer.id, 'CANCELLED')}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
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
      </div>
    </div>
  );
};

export default EventVolunteers;