import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    ageGroup: '',
    capacity: '',
    price: ''
  });

  // Check if user is admin
  const isAdmin = userProfile?.roles?.includes('ROLE_ADMIN');

  if (!isAdmin) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Prepare event data
      const eventData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        price: formData.price ? parseFloat(formData.price) : 0.0
      };

      await apiService.createEvent(eventData);
      navigate('/admin', { 
        state: { message: 'Event created successfully!' }
      });
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error.message || 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  return (
    <Layout>
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h2>Create New Event</h2>
                <p>Add a new sports event or clinic for kids</p>
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
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="date">Date & Time *</label>
                        <input
                          type="datetime-local"
                          id="date"
                          name="date"
                          className="form-control"
                          value={formData.date}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
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
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="ageGroup">Age Group</label>
                        <select
                          id="ageGroup"
                          name="ageGroup"
                          className="form-control"
                          value={formData.ageGroup}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Age Group</option>
                          <option value="5-7 years">5-7 years</option>
                          <option value="8-10 years">8-10 years</option>
                          <option value="11-13 years">11-13 years</option>
                          <option value="14-16 years">14-16 years</option>
                          <option value="All Ages">All Ages</option>
                        </select>
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

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="loading-spinner-small"></div>
                          Creating Event...
                        </>
                      ) : (
                        'Create Event'
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

      <style jsx>{`
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
    </Layout>
  );
};

export default CreateEvent;