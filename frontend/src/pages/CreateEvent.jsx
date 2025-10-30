import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import firestoreEventService from '../services/firestoreEventService';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { id: eventId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalEvent, setOriginalEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    ageGroup: [],
    capacity: '',
    price: '',
    eventTypes: []
  });

  // Check if user is admin
  const isAdmin = userProfile?.userType === 'ADMIN';

  useEffect(() => {
    if (eventId) {
      setIsEditMode(true);
      loadEventData(eventId);
    }
  }, [eventId]);

  const loadEventData = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const eventData = await apiService.getEvent(id);
      setOriginalEvent(eventData);

      // Populate form data with existing event data
      setFormData({
        name: eventData.name || '',
        description: eventData.description || '',
        date: eventData.date || '',
        startTime: eventData.startTime?.substring(0, 5) || '', // Convert "17:00:00" to "17:00"
        endTime: eventData.endTime?.substring(0, 5) || '',
        location: eventData.location || '',
        ageGroup: eventData.ageGroup?.split(', ').map(item => item.trim()).filter(item => item !== '') || [], // Parse comma-separated string back to array
        capacity: eventData.capacity || '',
        price: eventData.price || '',
        eventTypes: eventData.eventTypes?.split(', ').map(item => item.trim()).filter(item => item !== '') || [] // Parse comma-separated string back to array
      });
    } catch (error) {
      console.error('Error loading event data:', error);
      setError('Failed to load event data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <>
        <div className="container mt-4">
          <div className="card">
            <div className="card-body text-center">
              <h2>Access Denied</h2>
              <p>You don't have permission to create events.</p>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAgeGroupChange = (ageGroup) => {
    setFormData(prev => {
      const currentAgeGroups = prev.ageGroup || [];
      if (currentAgeGroups.includes(ageGroup)) {
        return {
          ...prev,
          ageGroup: currentAgeGroups.filter(ag => ag !== ageGroup)
        };
      } else {
        return {
          ...prev,
          ageGroup: [...currentAgeGroups, ageGroup]
        };
      }
    });
  };

  const handleEventTypeChange = (eventType) => {
    setFormData(prev => {
      const currentEventTypes = prev.eventTypes || [];
      if (currentEventTypes.includes(eventType)) {
        return {
          ...prev,
          eventTypes: currentEventTypes.filter(et => et !== eventType)
        };
      } else {
        return {
          ...prev,
          eventTypes: [...currentEventTypes, eventType]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Prepare event data
      const eventData = {
        ...formData,
        ageGroup: formData.ageGroup.length > 0 ? formData.ageGroup.join(', ') : '',
        eventTypes: formData.eventTypes.length > 0 ? formData.eventTypes.join(', ') : '',
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        price: formData.price ? parseFloat(formData.price) : 0.0,
        // Ensure times are null if empty, not empty strings
        startTime: formData.startTime && formData.startTime.trim() !== '' ? formData.startTime : null,
        endTime: formData.endTime && formData.endTime.trim() !== '' ? formData.endTime : null
      };

      console.log('=== FRONTEND EVENT CREATION DEBUG ===');
      console.log('Original form data:', {
        startTime: formData.startTime,
        endTime: formData.endTime,
        startTimeType: typeof formData.startTime,
        endTimeType: typeof formData.endTime
      });
      console.log('Processed event data being sent to API:', {
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        startTimeType: typeof eventData.startTime,
        endTimeType: typeof eventData.endTime
      });
      console.log('Full event data object:', eventData);

      if (isEditMode) {
        try {
          await apiService.updateEvent(eventId, eventData);
          navigate('/admin', {
            state: { message: 'Event updated successfully!' }
          });
        } catch (apiError) {
          console.log('API update failed, trying Firestore directly:', apiError);
          await firestoreEventService.updateEvent(eventId, eventData);
          navigate('/admin', {
            state: { message: 'Event updated successfully! (via Firestore)' }
          });
        }
      } else {
        try {
          await apiService.createEvent(eventData);
          navigate('/admin', {
            state: { message: 'Event created successfully!' }
          });
        } catch (apiError) {
          console.log('API creation failed, trying Firestore directly:', apiError);
          await firestoreEventService.createEvent(eventData);
          navigate('/admin', {
            state: { message: 'Event created successfully! (via Firestore)' }
          });
        }
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} event:`, error);
      setError(error.message || `Failed to ${isEditMode ? 'update' : 'create'} event`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  return (
    <>
      <div className="container mt-4" style={{ marginBottom: '4rem' }}>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <p className="subtitle-fancy" style={{ color: 'white' }}>
                  {isEditMode ? `✏️ Edit Event: ${originalEvent?.name || 'Loading...'} 🌟` : '🏃‍♂️ Add a New Sports Event or Clinic for Kids! 🌟'}
                </p>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Event Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Soccer Skills Clinic"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description *</label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      rows="4"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      placeholder="Describe what kids will learn and do at this event..."
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="date">Date *</label>
                        <input
                          type="date"
                          id="date"
                          name="date"
                          className="form-control"
                          value={formData.date}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="startTime">Start Time</label>
                        <input
                          type="time"
                          id="startTime"
                          name="startTime"
                          className="form-control"
                          value={formData.startTime || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="endTime">End Time</label>
                        <input
                          type="time"
                          id="endTime"
                          name="endTime"
                          className="form-control"
                          value={formData.endTime || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      className="form-control"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Community Park Field 1"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Age Groups</label>
                        <div className="age-group-multiselect">
                          {['5-7 years', '8-10 years', '11-13 years', '14-16 years', 'All Ages'].map(ageGroup => (
                            <label key={ageGroup} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={formData.ageGroup.includes(ageGroup)}
                                onChange={() => handleAgeGroupChange(ageGroup)}
                              />
                              <span className="checkmark"></span>
                              {ageGroup}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="capacity">Capacity</label>
                        <input
                          type="number"
                          id="capacity"
                          name="capacity"
                          className="form-control"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          min="1"
                          placeholder="Leave empty for unlimited"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="price">Price ($)</label>
                        <input
                          type="number"
                          id="price"
                          name="price"
                          className="form-control"
                          value={formData.price}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00 for free"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Event Types *</label>
                        <div className="event-type-multiselect">
                          {['VOLUNTEER', 'KID_EVENT'].map(eventType => (
                            <label key={eventType} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={formData.eventTypes.includes(eventType)}
                                onChange={() => handleEventTypeChange(eventType)}
                              />
                              <span className="checkmark"></span>
                              {eventType === 'VOLUNTEER' ? 'Volunteer Event' : 'Kid Event'}
                            </label>
                          ))}
                        </div>
                        <small className="text-muted">
                          Select whether this is a volunteer opportunity, kid event, or both
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="loading-spinner-small"></div>
                          {isEditMode ? 'Updating Event...' : 'Creating Event...'}
                        </>
                      ) : (
                        isEditMode ? 'Update Event' : 'Create Event'
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline ml-3"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .subtitle-fancy {
          font-size: 1.4rem;
          font-weight: 600;
          color: #2f7b8a;
          background: linear-gradient(135deg, #2f7b8a 0%, #4a90a4 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          margin: 1rem 0;
          text-align: center;
          letter-spacing: 0.5px;
        }

        .age-group-multiselect {
          border: 2px solid #e1e5e9;
          border-radius: 4px;
          padding: 0.75rem;
          background: white;
          max-height: 200px;
          overflow-y: auto;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          cursor: pointer;
          font-size: 0.95rem;
          position: relative;
          padding-left: 2rem;
        }

        .checkbox-label input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkmark {
          position: absolute;
          left: 0;
          top: 0;
          height: 1.2rem;
          width: 1.2rem;
          background-color: #eee;
          border: 2px solid #ddd;
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .checkbox-label:hover input ~ .checkmark {
          background-color: #ccc;
        }

        .checkbox-label input:checked ~ .checkmark {
          background-color: var(--primary);
          border-color: var(--primary);
        }

        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
          left: 4px;
          top: 1px;
          width: 6px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .checkbox-label input:checked ~ .checkmark:after {
          display: block;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text);
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.1);
        }

        .form-control::placeholder {
          color: #6c757d;
        }

        textarea.form-control {
          resize: vertical;
          min-height: 100px;
        }

        .form-actions {
          display: flex;
          align-items: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #eee;
        }

        .loading-spinner-small {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-right: 0.5rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }

        .alert-danger {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .ml-3 {
          margin-left: 1rem;
        }

        .row {
          display: flex;
          flex-wrap: wrap;
          margin: 0 -0.75rem;
        }

        .col-md-4,
        .col-md-6,
        .col-md-8 {
          padding: 0 0.75rem;
        }

        .col-md-4 {
          flex: 0 0 33.333333%;
          max-width: 33.333333%;
        }

        .col-md-6 {
          flex: 0 0 50%;
          max-width: 50%;
        }

        .col-md-8 {
          flex: 0 0 66.666667%;
          max-width: 66.666667%;
        }

        .justify-content-center {
          justify-content: center;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .col-md-4,
          .col-md-6,
          .col-md-8 {
            flex: 0 0 100%;
            max-width: 100%;
          }

          .form-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .form-actions .btn {
            margin-bottom: 0.5rem;
          }

          .ml-3 {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
};

export default CreateEvent;