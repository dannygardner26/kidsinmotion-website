import React, { useState } from 'react';
import { apiService } from '../services/api';

const VolunteerSignupForm = ({ event, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    role: '',
    availability: '',
    skills: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const volunteerRoles = [
    'Event Helper',
    'Setup Crew',
    'Registration Assistant',
    'Activity Leader',
    'Photographer',
    'First Aid Support',
    'Cleanup Crew',
    'Equipment Manager',
    'Snack Coordinator',
    'Other'
  ];

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
      const volunteerData = {
        eventId: event.id,
        role: formData.role,
        availability: formData.availability || null,
        skills: formData.skills || null,
        notes: formData.notes || null
      };

      await apiService.volunteerForEvent(volunteerData);
      onSuccess('Volunteer signup successful! Thank you for volunteering for this event.');
    } catch (error) {
      console.error('Volunteer signup failed:', error);
      setError(error.message || 'Volunteer signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="volunteer-form">
      <div className="card">
        <div className="card-header">
          <h3>Volunteer for {event.name}</h3>
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
            <p><strong>Description:</strong> {event.description}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="role">Volunteer Role *</label>
              <select
                id="role"
                name="role"
                className="form-control"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a role...</option>
                {volunteerRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="availability">Availability</label>
              <input
                type="text"
                id="availability"
                name="availability"
                className="form-control"
                value={formData.availability}
                onChange={handleInputChange}
                placeholder="e.g., Available all day, Morning only, 9 AM - 2 PM"
              />
              <small className="form-text">
                Please specify when you're available during the event
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="skills">Relevant Skills or Experience</label>
              <textarea
                id="skills"
                name="skills"
                className="form-control"
                rows="3"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="Any relevant skills, certifications, or experience (e.g., First Aid certified, Photography experience, Working with children)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                className="form-control"
                rows="3"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional information or special requirements"
              />
            </div>

            <div className="volunteer-commitment">
              <h5>Volunteer Commitment</h5>
              <ul>
                <li>Arrive on time and stay for your designated volunteer period</li>
                <li>Follow all safety guidelines and event protocols</li>
                <li>Help create a positive and fun environment for children</li>
                <li>Contact event organizers if you need to cancel (at least 48 hours notice preferred)</li>
              </ul>
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
                className="btn btn-secondary"
                disabled={isSubmitting || !formData.role}
              >
                {isSubmitting ? 'Signing Up...' : 'Sign Up as Volunteer'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .volunteer-form {
          max-width: 600px;
          margin: 0 auto;
        }

        .event-summary {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid var(--secondary);
        }

        .event-summary h4 {
          margin-bottom: 0.75rem;
          color: var(--secondary);
        }

        .event-summary p {
          margin-bottom: 0.5rem;
        }

        .volunteer-commitment {
          background-color: #e8f4f8;
          padding: 1rem;
          border-radius: 8px;
          margin: 1.5rem 0;
        }

        .volunteer-commitment h5 {
          color: var(--secondary);
          margin-bottom: 1rem;
        }

        .volunteer-commitment ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .volunteer-commitment li {
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
          border-color: var(--secondary);
          box-shadow: 0 0 0 2px rgba(231, 110, 90, 0.1);
        }

        select.form-control {
          background-color: white;
        }

        textarea.form-control {
          resize: vertical;
          min-height: 100px;
        }

        .form-text {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: #6c757d;
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

export default VolunteerSignupForm;