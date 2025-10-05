import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    ageGroup: [],
    capacity: '',
<<<<<<< HEAD
    price: ''
=======
    price: '',
    targetAudience: []
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
  });

  // Check if user is admin
  const isAdmin = userProfile?.roles?.includes('ROLE_ADMIN');

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

<<<<<<< HEAD
=======
  const handleTargetAudienceChange = (audience) => {
    setFormData(prev => {
      const currentAudiences = prev.targetAudience || [];
      if (currentAudiences.includes(audience)) {
        return {
          ...prev,
          targetAudience: currentAudiences.filter(a => a !== audience)
        };
      } else {
        return {
          ...prev,
          targetAudience: [...currentAudiences, audience]
        };
      }
    });
  };

  // Define available audience categories
  const audienceCategories = [
    { id: 'all', label: 'All Users' },
    { id: 'parents', label: 'Parents' },
    { id: 'volunteers', label: 'Volunteers' },
    { id: 'approved', label: 'Approved Volunteers' },
    { id: 'pending', label: 'Pending Applications' },
    { id: 'coaches', label: 'Coaches' },
    { id: 'event-coordinators', label: 'Event Coordinators' },
    { id: 'social-media', label: 'Social Media Team' }
  ];

>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Prepare event data
      const eventData = {
        ...formData,
        ageGroup: formData.ageGroup.length > 0 ? formData.ageGroup.join(', ') : '',
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
<<<<<<< HEAD
        price: formData.price ? parseFloat(formData.price) : 0.0
=======
        price: formData.price ? parseFloat(formData.price) : 0.0,
        targetAudience: formData.targetAudience.length > 0 ? JSON.stringify(formData.targetAudience) : null
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
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
    <>
      <div className="container mt-4" style={{ marginBottom: '4rem' }}>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
<<<<<<< HEAD
                <p className="subtitle-fancy" style={{ color: 'white' }}>🏃‍♂️ Add a New Sports Event or Clinic for Kids! 🌟</p>
=======
                <p className="subtitle-fancy" style={{ color: 'white' }}>Add a New Sports Event or Clinic for Kids!</p>
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
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

<<<<<<< HEAD
=======
                  <div className="form-group">
                    <label>Target Audience</label>
                    <div className="audience-multiselect">
                      <p className="text-muted small mb-2">Select who this event is intended for:</p>
                      <div className="audience-grid">
                        {audienceCategories.map(category => (
                          <label key={category.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.targetAudience.includes(category.id)}
                              onChange={() => handleTargetAudienceChange(category.id)}
                            />
                            <span className="checkmark"></span>
                            {category.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
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

<<<<<<< HEAD
=======
        .audience-multiselect {
          border: 2px solid #e1e5e9;
          border-radius: 4px;
          padding: 0.75rem;
          background: white;
        }

        .audience-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
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