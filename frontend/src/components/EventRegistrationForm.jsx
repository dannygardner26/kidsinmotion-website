import React, { useState } from 'react';
import { apiService } from '../services/api';

const EventRegistrationForm = ({ event, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    childName: '',
    childAge: '',
    allergies: '',
    emergencyContact: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const registrationData = {
        eventId: event.id,
        childName: formData.childName,
        childAge: formData.childAge ? parseInt(formData.childAge) : null,
        allergies: formData.allergies || null,
        emergencyContact: formData.emergencyContact || null
      };

      await apiService.registerForEvent(registrationData);
      onSuccess('Registration successful! Your child has been registered for this event.');
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-form">
      <div className="card">
        <div className="card-header">
          <h3>Register for {event.name}</h3>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
            </div>
          )}

          <div className="event-summary mb-4">
            <h4>Event Details</h4>
            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
            {event.location && <p><strong>Location:</strong> {event.location}</p>}
            {event.ageGroup && <p><strong>Age Group:</strong> {event.ageGroup}</p>}
            {event.price && <p><strong>Price:</strong> ${event.price}</p>}
            {event.capacity && (
              <p><strong>Capacity:</strong> {event.capacity} participants</p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="childName">Child's Name *</label>
              <input
                type="text"
                id="childName"
                name="childName"
                className="form-control"
                value={formData.childName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="childAge">Child's Age</label>
              <input
                type="number"
                id="childAge"
                name="childAge"
                className="form-control"
                value={formData.childAge}
                onChange={handleInputChange}
                min="3"
                max="18"
              />
            </div>

            <div className="form-group">
              <label htmlFor="allergies">Allergies or Medical Information</label>
              <textarea
                id="allergies"
                name="allergies"
                className="form-control"
                rows="3"
                value={formData.allergies}
                onChange={handleInputChange}
                placeholder="Please list any allergies or medical conditions we should be aware of..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="emergencyContact">Emergency Contact</label>
              <input
                type="text"
                id="emergencyContact"
                name="emergencyContact"
                className="form-control"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                placeholder="Emergency contact name and phone number"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline mr-3"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !formData.childName}
              >
                {isSubmitting ? 'Registering...' : 'Register Child'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .registration-form {
          max-width: 600px;
          margin: 0 auto;
        }

        .event-summary {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid var(--primary);
        }

        .event-summary h4 {
          margin-bottom: 0.75rem;
          color: var(--primary);
        }

        .event-summary p {
          margin-bottom: 0.5rem;
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
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(47, 80, 106, 0.1);
        }

        textarea.form-control {
          resize: vertical;
          min-height: 100px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .alert {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .alert-danger {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .mr-3 {
          margin-right: 1rem;
        }

        @media (max-width: 768px) {
          .form-actions {
            flex-direction: column;
          }

          .form-actions .btn {
            width: 100%;
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EventRegistrationForm;