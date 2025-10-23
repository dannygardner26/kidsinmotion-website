import React, { useState } from 'react';
import { apiService } from '../services/api';

const VolunteerSignupForm = ({ event, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    notes: '',
    backgroundCheck: false,
    previousVolunteer: false,
    previousVolunteerDetails: '',
    canAttendFullTime: false,
    communicationPreferences: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCommunicationPreferenceChange = (preference) => {
    setFormData(prev => ({
      ...prev,
      communicationPreferences: prev.communicationPreferences.includes(preference)
        ? prev.communicationPreferences.filter(p => p !== preference)
        : [...prev.communicationPreferences, preference]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const volunteerData = {
        eventId: event.id,
        role: 'Event Volunteer', // Default role since we removed role selection
        availability: formData.canAttendFullTime ? 'Full event duration' : null,
        skills: null, // Removed skills section
        notes: [
          formData.notes || '',
          formData.communicationPreferences.length > 0 ? `Contact via: ${formData.communicationPreferences.join(', ')}` : '',
          formData.backgroundCheck ? 'Background check completed/willing' : '',
          formData.previousVolunteer ? 'Previous Kids in Motion volunteer' : '',
          formData.previousVolunteerDetails ? `Previous experience: ${formData.previousVolunteerDetails}` : ''
        ].filter(Boolean).join('\n') || null
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
      <div className="card volunteer-signup-card">
        <div className="card-header volunteer-header">
          <h3>Volunteer Sign-up</h3>
          <h4 className="event-name">{event.name}</h4>
          <p className="volunteer-welcome">
            Thank you for your interest in volunteering! Your time and energy help make these events possible.
          </p>
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
            <div className="form-group attendance-question">
              <div className="attendance-card">
                <h4>Event Attendance Confirmation</h4>
                <p>
                  <strong>Event Duration:</strong> {event.startTime && event.endTime
                    ? `${event.startTime} to ${event.endTime}`
                    : 'Full event duration'} on {new Date(event.date).toLocaleDateString()}
                </p>
                <label className="checkbox-label attendance-checkbox">
                  <input
                    type="checkbox"
                    name="canAttendFullTime"
                    checked={formData.canAttendFullTime}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="checkmark"></span>
                  <strong>Yes, I can attend the event from start to end</strong>
                </label>
                <small className="form-text">
                  We need volunteers who can commit to the full event duration to ensure consistent support.
                </small>
              </div>
            </div>

            <div className="form-group">
              <div className="volunteer-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="backgroundCheck"
                    checked={formData.backgroundCheck}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  I have completed or am willing to complete a background check if required
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="previousVolunteer"
                    checked={formData.previousVolunteer}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  I have previously volunteered with Kids in Motion
                </label>
              </div>

              {formData.previousVolunteer && (
                <div className="previous-volunteer-details">
                  <label htmlFor="previousVolunteerDetails">Please describe your previous volunteer experience with Kids in Motion:</label>
                  <textarea
                    id="previousVolunteerDetails"
                    name="previousVolunteerDetails"
                    className="form-control"
                    rows="3"
                    value={formData.previousVolunteerDetails}
                    onChange={handleInputChange}
                    placeholder="Describe your previous roles, events you helped with, any training you received, etc."
                    required={formData.previousVolunteer}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>How would you like to be contacted? (Select all that apply)</label>
              <div className="communication-preferences">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.communicationPreferences.includes('email')}
                    onChange={() => handleCommunicationPreferenceChange('email')}
                  />
                  <span className="checkmark"></span>
                  Email
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.communicationPreferences.includes('sms')}
                    onChange={() => handleCommunicationPreferenceChange('sms')}
                  />
                  <span className="checkmark"></span>
                  SMS/Text Messages
                </label>
              </div>
              <small className="form-text">
                Please select at least one method so we can keep you updated about the event. Website messages are included automatically.
              </small>
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
              <h5>Volunteer Commitment & Expectations</h5>
              <div className="commitment-content">
                <div className="row">
                  <div className="col-md-6">
                    <h6>What We Expect:</h6>
                    <ul>
                      <li>Arrive 15 minutes before your scheduled time</li>
                      <li>Stay for your full volunteer commitment</li>
                      <li>Follow all safety protocols and guidelines</li>
                      <li>Maintain a positive, encouraging attitude</li>
                      <li>Respect all participants and fellow volunteers</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6>What You Get:</h6>
                    <ul>
                      <li>Make a meaningful impact in children's lives</li>
                      <li>Community service hours (if needed)</li>
                      <li>Experience working with youth sports</li>
                      <li>Connect with like-minded volunteers</li>
                      <li>Free event t-shirt (for regular volunteers)</li>
                    </ul>
                  </div>
                </div>
                <div className="cancellation-policy">
                  <small className="text-muted">
                    <strong>Cancellation Policy:</strong> Please contact us at least 48 hours in advance if you need to cancel.
                    We understand emergencies happen - just let us know as soon as possible!
                  </small>
                </div>
              </div>
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
                disabled={isSubmitting || !formData.canAttendFullTime || formData.communicationPreferences.length === 0}
              >
                {isSubmitting ? 'Signing Up...' : 'Sign Up as Volunteer'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .volunteer-form {
          max-width: 800px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .volunteer-signup-card {
          border: none;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06);
          border-radius: 20px;
          overflow: hidden;
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          border: 1px solid rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
        }

        .volunteer-header {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
          color: white;
          padding: 3rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .volunteer-header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='30'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          animation: floatPattern 20s linear infinite;
        }

        @keyframes floatPattern {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(-60px) translateY(-60px); }
        }

        .volunteer-header h3 {
          margin: 0 0 1rem 0;
          font-size: 2.2rem;
          font-weight: 700;
          position: relative;
          z-index: 2;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .volunteer-header .event-name {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--secondary);
          position: relative;
          z-index: 2;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 25px;
          display: inline-block;
          backdrop-filter: blur(10px);
        }

        .volunteer-welcome {
          margin: 0;
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.6;
          position: relative;
          z-index: 2;
          max-width: 500px;
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

        .attendance-question {
          margin-bottom: 2rem;
        }

        .attendance-card {
          background: #f8f9fa;
          border: 2px solid var(--primary);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }

        .attendance-card h4 {
          color: var(--primary);
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }

        .attendance-card p {
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
          color: #495057;
        }

        .attendance-checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 1.1rem;
          margin-bottom: 0.75rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .attendance-checkbox input[type="checkbox"] {
          position: relative;
          width: 20px;
          height: 20px;
          margin: 0;
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
          justify-content: space-between;
          gap: 1rem;
          margin-top: 2rem;
          padding: 1.5rem 0 0 0;
          border-top: 1px solid #eee;
        }

        .btn {
          padding: 0.75rem 2rem;
          border-radius: 6px;
          border: 2px solid;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          text-align: center;
          min-width: 120px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-outline {
          background: white;
          color: var(--primary);
          border-color: var(--primary);
        }

        .btn-outline:hover:not(:disabled) {
          background: var(--primary);
          color: white;
        }

        .btn-secondary {
          background: var(--secondary);
          color: white;
          border-color: var(--secondary);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--secondary-light);
          border-color: var(--secondary-light);
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

        .communication-preferences {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        /* Custom Checkbox Styles - Enhanced */
        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          cursor: pointer;
          margin-bottom: 1rem;
          position: relative;
          padding: 1rem;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          border: 2px solid #e9ecef;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .checkbox-label:hover {
          background: linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%);
          border-color: var(--primary);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(47, 80, 106, 0.15);
        }

        .checkbox-label input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          width: 0;
          height: 0;
        }

        .checkmark {
          position: relative;
          height: 24px;
          width: 24px;
          background: linear-gradient(145deg, #ffffff, #f1f3f4);
          border: 3px solid #ddd;
          border-radius: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          margin-top: 1px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .checkbox-label:hover .checkmark {
          border-color: var(--primary);
          background: linear-gradient(145deg, #ffffff, #f8f9fa);
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .checkbox-label input:checked ~ .checkmark {
          background: linear-gradient(145deg, var(--primary), var(--primary-light));
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2);
          transform: scale(1.05);
        }

        .checkbox-label input:focus ~ .checkmark {
          box-shadow: 0 0 0 4px rgba(47, 80, 106, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
          left: 7px;
          top: 2px;
          width: 6px;
          height: 12px;
          border: solid white;
          border-width: 0 3px 3px 0;
          transform: rotate(45deg);
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        .checkbox-label input:checked ~ .checkmark:after {
          display: block;
          animation: checkmarkPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes checkmarkPop {
          0% {
            transform: rotate(45deg) scale(0);
          }
          50% {
            transform: rotate(45deg) scale(1.2);
          }
          100% {
            transform: rotate(45deg) scale(1);
          }
        }

        .checkbox-label span:not(.checkmark) {
          line-height: 1.5;
          color: var(--text);
          font-weight: 500;
        }

        .volunteer-checkboxes {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .previous-volunteer-details {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid var(--secondary);
        }

        .previous-volunteer-details label {
          color: var(--secondary);
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .previous-volunteer-details textarea {
          background-color: white;
          border: 1px solid #ddd;
        }

        .previous-volunteer-details textarea:focus {
          border-color: var(--secondary);
          box-shadow: 0 0 0 2px rgba(231, 110, 90, 0.1);
        }

        .communication-preferences .checkbox-label {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          transition: all 0.3s ease;
        }

        .communication-preferences .checkbox-label:hover {
          background-color: rgba(47, 80, 106, 0.08);
          border-color: var(--primary);
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .communication-preferences .checkbox-label input:checked ~ .checkmark {
          background-color: var(--secondary);
          border-color: var(--secondary);
        }

        @media (max-width: 768px) {
          .form-actions {
            flex-direction: column;
          }

          .form-actions .btn {
            width: 100%;
            margin-bottom: 0.5rem;
          }

          .volunteer-form {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VolunteerSignupForm;