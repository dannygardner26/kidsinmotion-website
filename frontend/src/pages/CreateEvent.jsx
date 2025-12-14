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
    minAge: '',
    maxAge: '',
    tags: [],
    customTag: '',
    capacity: '',
    price: '',
    eventTypes: []
  });

  const predefinedTags = ['Small Group', 'Large Clinic', 'Fundraiser'];

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
        minAge: eventData.minAge ?? '',
        maxAge: eventData.maxAge ?? '',
        tags: eventData.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
        customTag: '',
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

  const handleTagToggle = (tagName) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(tag => tag !== tagName)
        : [...prev.tags, tagName]
    }));
  };

  const handleAddCustomTag = () => {
    if (formData.customTag.trim() && !formData.tags.includes(formData.customTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.customTag.trim()],
        customTag: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    disabled = { isLoading }
      >
    {
      isLoading?(
                        <>
      <div className="loading-spinner-small"></div>
    { isEditMode ? 'Updating Event...' : 'Creating Event...' }
                        </>
                      ) : (
  isEditMode ? 'Update Event' : 'Create Event'
)}
                    </button >
  <button
    type="button"
    className="btn btn-outline ml-3"
    onClick={handleCancel}
    disabled={isLoading}
  >
    Cancel
  </button>
                  </div >
                </form >
              </div >
            </div >
          </div >
        </div >
      </div >

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

        .tags-display {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .tag-badge {
          display: inline-flex;
          align-items: center;
          background-color: #e3f2fd;
          color: #1976d2;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1px solid #bbdefb;
        }

        .tag-remove {
          background: none;
          border: none;
          color: #1976d2;
          cursor: pointer;
          font-size: 1rem;
          margin-left: 0.5rem;
          padding: 0;
          line-height: 1;
        }

        .tag-remove:hover {
          color: #d32f2f;
          font-weight: bold;
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