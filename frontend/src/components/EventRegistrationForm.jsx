import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { parseEmergencyContact } from '../utils/emergencyContactParser';

const EventRegistrationForm = ({ event, onSuccess, onCancel }) => {
  const [children, setChildren] = useState([]);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [existingRegistrations, setExistingRegistrations] = useState([]);
  const [formData, setFormData] = useState({
    emergencyContact: '',
    needsFood: false,
    additionalNotes: '',
    confirmDropoffPickup: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [showEmailNotification, setShowEmailNotification] = useState(false);

  useEffect(() => {
    fetchChildren();
    fetchExistingRegistrations();
  }, []);

  const fetchChildren = async () => {
    try {
      setIsLoadingChildren(true);
      const childrenData = await apiService.getChildren();
      setChildren(childrenData);
    } catch (error) {
      console.error('Error fetching children:', error);
      setError('Failed to load your children. Please try refreshing the page.');
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const fetchExistingRegistrations = async () => {
    try {
      const registrations = await apiService.getMyRegistrations();
      const eventRegistrations = registrations.filter(reg =>
        (reg.event?.id || reg.eventId) === event.id
      );
      setExistingRegistrations(eventRegistrations);
    } catch (error) {
      console.error('Error fetching existing registrations:', error);
      // Don't show an error for this as it's not critical
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleChildSelection = (childId) => {
    setSelectedChildren(prev => {
      if (prev.includes(childId)) {
        return prev.filter(id => id !== childId);
      } else {
        return [...prev, childId];
      }
    });
  };

  // Helper function to normalize names for comparison
  const normalizeName = (name) => {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
  };

  // Helper function to check if child is already registered
  const isChildAlreadyRegistered = (child) => {
    const childName = child.fullName || `${child.firstName} ${child.lastName}`;
    const normalizedChildName = normalizeName(childName);

    return existingRegistrations.some(reg => {
      const normalizedRegName = normalizeName(reg.childName);
      return normalizedRegName === normalizedChildName;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (selectedChildren.length === 0) {
      setError('Please select at least one child to register for this event.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.confirmDropoffPickup) {
      setError('Please confirm that you can dropoff and pickup your child(ren) at the scheduled times.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.emergencyContact || !formData.emergencyContact.trim()) {
      setError('Please provide an emergency contact name and phone number.');
      setIsSubmitting(false);
      return;
    }

    const emergencyContactInfo = parseEmergencyContact(formData.emergencyContact);
    if (!emergencyContactInfo.name || !emergencyContactInfo.name.trim() || !emergencyContactInfo.phone || !emergencyContactInfo.phone.trim()) {
      setError('Please enter an emergency contact name and phone number.');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('=== REGISTRATION SYNC DEBUG ===');
      console.log('Existing registrations:', existingRegistrations);
      console.log('Selected children IDs:', selectedChildren);
      console.log('All children:', children);

      // First, cancel registrations for children who are no longer selected
      const childrenToUnregister = existingRegistrations.filter(reg => {
        // Find if this registration matches any selected child
        const matchingChild = selectedChildren.find(childId => {
          const child = children.find(c => c.id === childId);
          const childName = child.fullName || `${child.firstName} ${child.lastName}`;
          const normalizedRegName = normalizeName(reg.childName);
          const normalizedChildName = normalizeName(childName);
          const matches = normalizedRegName === normalizedChildName;
          console.log(`Checking if registration "${reg.childName}" matches selected child "${childName}": ${matches}`);
          return matches;
        });
        const shouldCancel = !matchingChild;
        console.log(`Registration "${reg.childName}" should be cancelled: ${shouldCancel}`);
        return shouldCancel;
      });

      console.log('Children to unregister:', childrenToUnregister);

      // Cancel unselected registrations
      const cancellationPromises = childrenToUnregister.map(async (registration) => {
        try {
          await apiService.cancelRegistration(registration.id);
          console.log(`Cancelled registration for ${registration.childName}`);
          return { success: true, registrationId: registration.id };
        } catch (cancelError) {
          console.warn('Could not cancel registration for', registration.childName, ':', cancelError);
          return { success: false, registrationId: registration.id };
        }
      });

      const cancellationResults = await Promise.all(cancellationPromises);

      // Update existingRegistrations state by removing successfully cancelled registrations
      const successfullyCancelledIds = cancellationResults
        .filter(result => result.success)
        .map(result => result.registrationId);

      if (successfullyCancelledIds.length > 0) {
        const updatedExistingRegistrations = existingRegistrations.filter(
          reg => !successfullyCancelledIds.includes(reg.id)
        );
        setExistingRegistrations(updatedExistingRegistrations);
      }

      // Now process each selected child - create or update registrations
      const registrationPromises = selectedChildren.map(async (childId) => {
        const child = children.find(c => c.id === childId);

        // Check if child is already registered - skip API call if so
        if (isChildAlreadyRegistered(child)) {
          console.log(`Child ${child.firstName} ${child.lastName} is already registered, skipping API call`);
          return { success: true, childName: `${child.firstName} ${child.lastName}`, skipped: true };
        }

        // Calculate age group based on child's age
        const getAgeGroup = (age) => {
          if (age >= 4 && age <= 6) return '4-6 years';
          if (age >= 7 && age <= 9) return '7-9 years';
          if (age >= 10 && age <= 12) return '10-12 years';
          if (age >= 13 && age <= 15) return '13-15 years';
          if (age >= 16 && age <= 18) return '16-18 years';
          return `${age} years`; // fallback
        };

        // Ensure participantAge is a valid number
        const participantAge = parseInt(child.age, 10);
        if (isNaN(participantAge) || participantAge < 4 || participantAge > 18) {
          throw new Error(`Invalid age for ${child.firstName} ${child.lastName}. Age must be a number between 4 and 18.`);
        }

        // Combine all special requests and medical info
        const specialRequests = [
          child.foodAllergies ? `Food Allergies: ${child.foodAllergies}` : '',
          formData.needsFood ? 'Wants to receive free food' : '',
          child.baseballExperience ? `Baseball Experience: ${child.baseballExperience}` : '',
          child.additionalInformation || '',
          formData.additionalNotes || ''
        ].filter(Boolean).join('\n') || null;

        // Create registration data matching backend ParticipantRegistrationRequest structure
        const registrationData = {
          eventId: event.id,
          participantFirstName: child.firstName,
          participantLastName: child.lastName,
          participantAge: participantAge,
          participantAgeGroup: getAgeGroup(participantAge),
          emergencyContactName: emergencyContactInfo.name,
          emergencyContactPhone: emergencyContactInfo.phone,
          medicalInfo: child.medicalConcerns || null,
          specialRequests: specialRequests
        };

        try {
          const result = await apiService.registerForEvent(registrationData);
          // Handle new API response structure: { participant, deliveryStatus }
          const participant = result.participant || result; // Fallback to old structure if needed
          const deliveryStatus = result.deliveryStatus || null;
          return {
            success: true,
            childName: `${child.firstName} ${child.lastName}`,
            result: participant,
            deliveryStatus: deliveryStatus
          };
        } catch (error) {
          return { success: false, childName: `${child.firstName} ${child.lastName}`, error: error.message };
        }
      });

      const registrationResults = await Promise.allSettled(registrationPromises);

      // Process results to separate successes and failures
      const successfulRegistrations = [];
      const failedRegistrations = [];
      let anyEmailSent = false; // Track if any email was sent

      registrationResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const registrationData = result.value;
          if (registrationData.success) {
            successfulRegistrations.push(registrationData);
            // Check if email was sent for this registration
            if (registrationData.deliveryStatus?.emailSent === true) {
              anyEmailSent = true;
            }
          } else {
            failedRegistrations.push(registrationData);
          }
        } else {
          // Promise was rejected
          const childId = selectedChildren[index];
          const child = children.find(c => c.id === childId);
          failedRegistrations.push({
            success: false,
            childName: `${child.firstName} ${child.lastName}`,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      // Create appropriate success message based on results
      let message = '';
      const hadExistingRegistrations = existingRegistrations.length > 0;
      const unregisteredCount = childrenToUnregister.length;

      if (successfulRegistrations.length > 0) {
        const successfulNames = successfulRegistrations.map(reg => reg.childName.split(' ')[0]).join(', ');

        if (hadExistingRegistrations) {
          if (unregisteredCount > 0) {
            message = `Registration updated! ${successfulNames} ${successfulRegistrations.length === 1 ? 'is' : 'are'} now registered for this event.`;
          } else {
            message = `Registration updated! ${successfulNames} ${successfulRegistrations.length === 1 ? 'has' : 'have'} been registered for this event.`;
          }
        } else {
          message = `Registration successful! ${successfulNames} ${successfulRegistrations.length === 1 ? 'has' : 'have'} been registered for this event.`;
        }
      }

      // Add error information if there were failures
      if (failedRegistrations.length > 0) {
        const failedNames = failedRegistrations.map(reg => reg.childName).join(', ');
        const errorMessage = `\n\nHowever, registration failed for: ${failedNames}. Please try again or contact support.`;
        message = message ? message + errorMessage : `Registration failed for: ${failedNames}. Please try again.`;
      }

      // Check if there are actual new registrations (not skipped)
      const hasNewRegistrations = successfulRegistrations.some(r => !r.skipped && r.result);

      // Add email confirmation notice to success messages only for new registrations and when email was actually sent
      if (hasNewRegistrations && message) {
        if (anyEmailSent) {
          message += '\n\nA confirmation email has been sent to your registered email address with event details and important information.';
        } else {
          message += '\n\nWe will email you confirmation if email is enabled.';
        }
      }

      // Update existingRegistrations state with new successful registrations
      if (successfulRegistrations.length > 0) {
        const newRegistrations = successfulRegistrations
          .filter(reg => !reg.skipped && reg.result) // Only add actual new registrations, not skipped ones
          .map(reg => ({
            id: reg.result.id,
            childName: reg.result.childName,
            eventId: event.id,
            status: 'REGISTERED'
          }));

        if (newRegistrations.length > 0) {
          setExistingRegistrations(prev => [...prev, ...newRegistrations]);
        }

        // Show email notification only if there were actual new registrations AND email was sent
        if (hasNewRegistrations && anyEmailSent) {
          setShowEmailNotification(true);
          // Auto-dismiss after 5 seconds
          setTimeout(() => setShowEmailNotification(false), 5000);
        }

        onSuccess(message);
      } else {
        // All registrations failed
        setError(message || 'All registrations failed. Please try again.');
      }
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

          {showEmailNotification && (
            <div className="alert alert-success email-notification mb-4">
              <div className="notification-content">
                <i className="fas fa-envelope mr-2"></i>
                <span>📧 Confirmation email sent! Check your inbox for event details and registration information.</span>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setShowEmailNotification(false)}
                  aria-label="Close notification"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
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

          {isLoadingChildren ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your children...</p>
            </div>
          ) : children.length === 0 ? (
            <div className="no-children-state">
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                <strong>No Children Found</strong>
              </div>
              <p>You need to add your children's information before you can register for events.</p>
              <Link to="/dashboard" className="btn btn-primary">
                <i className="fas fa-arrow-left mr-2"></i>
                Go to Dashboard to Add Children
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Children to Register *</label>
                <p className="help-text">Select which children you'd like to register for this event. Click on a child card to select them.</p>
                <div className="children-selection">
                  {children.map(child => {
                    const isAlreadyRegistered = isChildAlreadyRegistered(child);

                    return (
                      <div key={child.id} className={`child-selection-card ${isAlreadyRegistered ? 'already-registered' : ''}`}>
                        <label className="child-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedChildren.includes(child.id)}
                            onChange={() => handleChildSelection(child.id)}
                          />
                          <span className="checkmark"></span>
                          <div className="child-info">
                            <div className="child-header">
                              <h4>{child.firstName} {child.lastName}</h4>
                              {isAlreadyRegistered && (
                                <span className="registration-status">
                                  <i className="fas fa-check-circle mr-1"></i>
                                  Already Registered
                                </span>
                              )}
                            </div>
                          <div className="child-details">
                            <span className="detail-item">
                              <i className="fas fa-birthday-cake mr-1"></i>
                              {child.age} years old
                            </span>
                            {child.grade && (
                              <span className="detail-item">
                                <i className="fas fa-graduation-cap mr-1"></i>
                                {child.grade}
                              </span>
                            )}
                          </div>
                          {(child.medicalConcerns || child.foodAllergies) && (
                            <div className="health-info">
                              {child.medicalConcerns && (
                                <div className="health-item medical">
                                  <i className="fas fa-heart mr-1"></i>
                                  <strong>Medical:</strong> {child.medicalConcerns}
                                </div>
                              )}
                              {child.foodAllergies && (
                                <div className="health-item allergies">
                                  <i className="fas fa-exclamation-circle mr-1"></i>
                                  <strong>Allergies:</strong> {child.foodAllergies}
                                </div>
                              )}
                            </div>
                          )}
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="emergencyContact">Emergency Contact *</label>
                <input
                  type="text"
                  id="emergencyContact"
                  name="emergencyContact"
                  className="form-control"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="Emergency contact name and phone number"
                  required
                />
              </div>

              <div className="info-note">
                <div className="alert alert-info">
                  <i className="fas fa-info-circle mr-2"></i>
                  <strong>Note:</strong> We will use your account contact information to communicate with you about this event registration.
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="additionalNotes">Additional Notes</label>
                <textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  className="form-control"
                  rows="3"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  placeholder="Any additional information for this event registration..."
                />
              </div>

              <div className="form-group">
                <div className="checkbox-option">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="needsFood"
                      checked={formData.needsFood}
                      onChange={handleInputChange}
                    />
                    <span className="custom-checkbox"></span>
                    <strong>Children would like to receive free food</strong>
                    <small className="d-block text-muted mt-1">
                      We typically provide free pizza, popsicles, or other snacks during events.
                      Check this box if your children would like to participate in the food program.
                    </small>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <div className="checkbox-option">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="confirmDropoffPickup"
                      checked={formData.confirmDropoffPickup}
                      onChange={handleInputChange}
                    />
                    <span className="custom-checkbox"></span>
                    <strong>I confirm that I can drop off and pick up my child(ren) at the scheduled event times *</strong>
                    <small className="d-block text-muted mt-1">
                      Please ensure you are available for both drop-off and pick-up at the times specified for this event.
                    </small>
                  </label>
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
                  className="btn btn-primary"
                  disabled={isSubmitting || selectedChildren.length === 0}
                >
                  {isSubmitting ? 'Registering...' : `Register ${selectedChildren.length === 1 ? 'Child' : 'Children'}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .registration-form {
          max-width: 600px;
          margin: 0 auto;
        }

        /* Force checkbox styles with maximum specificity */
        .registration-form .child-selection-card .child-checkbox,
        .registration-form .checkbox-option .checkbox-label {
          display: flex !important;
          align-items: flex-start !important;
          gap: 1rem !important;
          cursor: pointer !important;
          margin: 0 !important;
          padding: 1.25rem !important;
          border: 2px solid #e9ecef !important;
          border-radius: 12px !important;
          transition: all 0.3s ease !important;
          background: white !important;
          width: 100% !important;
          box-sizing: border-box !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
        }

        .registration-form .child-selection-card .child-checkbox:hover,
        .registration-form .checkbox-option .checkbox-label:hover {
          border-color: #2f506a !important;
          background-color: rgba(47, 80, 106, 0.05) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }

        .registration-form .child-checkbox input[type="checkbox"],
        .registration-form .checkbox-label input[type="checkbox"] {
          position: absolute !important;
          opacity: 0 !important;
          cursor: pointer !important;
          width: 0 !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .registration-form .child-checkbox .checkmark,
        .registration-form .checkbox-label .custom-checkbox {
          position: relative !important;
          min-height: 24px !important;
          min-width: 24px !important;
          height: 24px !important;
          width: 24px !important;
          background-color: #fff !important;
          border: 3px solid #ced4da !important;
          border-radius: 6px !important;
          transition: all 0.3s ease !important;
          flex-shrink: 0 !important;
          margin-top: 0px !important;
          display: inline-block !important;
          box-sizing: border-box !important;
        }

        .registration-form .child-checkbox:hover .checkmark,
        .registration-form .checkbox-label:hover .custom-checkbox {
          border-color: #2f506a !important;
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.15) !important;
        }

        .registration-form .child-checkbox input:checked ~ .checkmark,
        .registration-form .checkbox-label input:checked ~ .custom-checkbox {
          background-color: #2f506a !important;
          border-color: #2f506a !important;
        }

        .registration-form .child-checkbox .checkmark:after,
        .registration-form .checkbox-label .custom-checkbox:after {
          content: "" !important;
          position: absolute !important;
          display: none !important;
          left: 7px !important;
          top: 3px !important;
          width: 6px !important;
          height: 12px !important;
          border: solid white !important;
          border-width: 0 3px 3px 0 !important;
          transform: rotate(45deg) !important;
        }

        .registration-form .child-checkbox input:checked ~ .checkmark:after,
        .registration-form .checkbox-label input:checked ~ .custom-checkbox:after {
          display: block !important;
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

        .loading-container {
          text-align: center;
          padding: 3rem;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(47, 80, 106, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .no-children-state {
          text-align: center;
          padding: 2rem;
        }

        .children-selection {
          display: grid;
          gap: 1rem;
          margin-top: 1rem;
        }

        .child-selection-card {
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.3s ease;
          background: white;
        }

        .child-selection-card:hover {
          border-color: var(--primary);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }


        .child-info {
          flex: 1;
        }

        .child-info h4 {
          margin: 0 0 0.5rem 0;
          color: var(--primary);
          font-size: 1.2rem;
        }

        .child-details {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }

        .detail-item {
          display: flex;
          align-items: center;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .health-info {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e9ecef;
        }

        .health-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .health-item.medical {
          color: #dc3545;
        }

        .health-item.allergies {
          color: #fd7e14;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text);
        }

        .help-text {
          color: #6c757d;
          font-size: 0.9rem;
          margin: 0.5rem 0 1rem 0;
          font-style: italic;
        }

        .info-note {
          margin: 1.5rem 0;
        }

        .alert-info {
          background-color: #d1ecf1;
          border: 1px solid #bee5eb;
          color: #0c5460;
          padding: 1rem;
          border-radius: 4px;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
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
          position: relative;
          z-index: 10;
        }

        .form-actions .btn {
          pointer-events: auto;
          cursor: pointer;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          min-width: 140px;
          border: 2px solid transparent;
        }

        .form-actions .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--primary-light));
          color: white;
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(47, 80, 106, 0.2);
        }

        .form-actions .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(47, 80, 106, 0.3);
          background: linear-gradient(135deg, var(--primary-light), var(--primary));
        }

        .form-actions .btn-outline {
          background: white;
          color: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 2px 8px rgba(47, 80, 106, 0.1);
        }

        .form-actions .btn-outline:hover:not(:disabled) {
          background: var(--primary);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(47, 80, 106, 0.2);
        }

        .form-actions .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
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

        .checkbox-option {
          margin: 1rem 0;
        }


        .child-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .registration-status {
          background-color: #d4edda;
          color: #155724;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          margin-left: 1rem;
        }

        .child-selection-card.already-registered {
          background-color: #f8f9fa;
          border-color: #28a745;
        }

        .child-selection-card.already-registered:hover {
          border-color: #20c997;
          background-color: #f0fff4;
        }

        .mr-3 {
          margin-right: 1rem;
        }

        /* Email notification banner styles */
        .email-notification {
          background-color: #d4edda !important;
          border: 1px solid #c3e6cb !important;
          color: #155724 !important;
          border-radius: 8px !important;
          padding: 1rem !important;
          margin-bottom: 1rem !important;
        }

        .notification-content {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 1rem !important;
        }

        .notification-content span {
          flex: 1 !important;
          font-weight: 600 !important;
        }

        .close-btn {
          background: none !important;
          border: none !important;
          color: #155724 !important;
          cursor: pointer !important;
          padding: 0.25rem !important;
          border-radius: 4px !important;
          transition: background-color 0.2s ease !important;
          flex-shrink: 0 !important;
        }

        .close-btn:hover {
          background-color: rgba(21, 87, 36, 0.1) !important;
        }

        .close-btn i {
          font-size: 1rem !important;
        }

        @media (max-width: 768px) {
          .form-actions {
            flex-direction: column;
          }

          .form-actions .btn {
            width: 100%;
            margin-bottom: 0.5rem;
          }

          .child-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .registration-status {
            margin-left: 0;
            margin-top: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EventRegistrationForm;