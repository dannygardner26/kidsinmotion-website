import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { parseEmergencyContact } from '../utils/emergencyContactParser';
import { useAuth } from '../context/AuthContext';
import firebaseRealtimeService from '../services/firebaseRealtimeService';

const EventRegistrationForm = ({ event, onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const errorRef = useRef(null);
  const [children, setChildren] = useState([]);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [existingRegistrations, setExistingRegistrations] = useState([]);
  const [formData, setFormData] = useState({
    emergencyContactFirstName: '',
    emergencyContactLastName: '',
    emergencyContactPhone: '',
    needsFood: false,
    additionalNotes: '',
    agreesToCommunications: false,
    confirmDropoffPickup: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [showEmailNotification, setShowEmailNotification] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Set up real-time listener for children (same as ChildrenManagement)
    firebaseRealtimeService.subscribeToUserChildren(
      currentUser.uid,
      (childrenData) => {
        console.log('EventRegistrationForm: Real-time children update:', childrenData);
        setChildren(childrenData);
        setIsLoadingChildren(false);
      },
      (error) => {
        console.error('EventRegistrationForm: Real-time children error:', error);
        // Fallback to manual fetch
        fetchChildrenFallback();
      }
    );

    fetchExistingRegistrations();

    return () => {
      // Clean up listener when component unmounts
      firebaseRealtimeService.unsubscribe(`user_children_${currentUser.uid}`);
    };
  }, [currentUser]);

  // Auto-select children who are already registered when data is loaded
  useEffect(() => {
    if (children.length > 0 && existingRegistrations.length > 0) {
      const registeredChildIds = children.filter(child => {
        return isChildAlreadyRegistered(child);
      }).map(child => child.id);

      setSelectedChildren(prev => {
        // Only add new IDs that aren't already selected
        const newIds = registeredChildIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  }, [children, existingRegistrations]);

  // Prefill emergency contact info from existing registrations
  useEffect(() => {
    if (existingRegistrations.length > 0) {
      const firstRegistration = existingRegistrations[0];
      if (firstRegistration.emergencyContactName && !formData.emergencyContactFirstName && !formData.emergencyContactLastName) {
        // Parse emergency contact name into first/last name
        const nameParts = firstRegistration.emergencyContactName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setFormData(prev => ({
          ...prev,
          emergencyContactFirstName: firstName,
          emergencyContactLastName: lastName,
          emergencyContactPhone: firstRegistration.emergencyContactPhone || '',
          // Also prefill checkbox states from the first registration if available
          needsFood: firstRegistration.specialRequests?.includes('Wants to receive free food') || false,
          confirmDropoffPickup: true // Default to true for editing
        }));
      }
    }
  }, [existingRegistrations]);

  // Scroll to error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [error]);

  const fetchChildrenFallback = async () => {
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

    // Collect missing required fields (only warn, don't block)
    const missingFields = [];
    
    if (!formData.emergencyContactFirstName || !formData.emergencyContactFirstName.trim()) {
      missingFields.push('Emergency Contact First Name');
    }
    
    if (!formData.emergencyContactLastName || !formData.emergencyContactLastName.trim()) {
      missingFields.push('Emergency Contact Last Name');
    }
    
    if (!formData.emergencyContactPhone || !formData.emergencyContactPhone.trim()) {
      missingFields.push('Emergency Contact Phone Number or Email');
    }
    
    if (!formData.agreesToCommunications) {
      missingFields.push('Agreement to receive communications');
    }
    
    if (!formData.confirmDropoffPickup) {
      missingFields.push('Confirmation of drop-off and pick-up availability');
    }

    // If no children selected, allow submission to delete all registrations
    if (selectedChildren.length === 0) {
      // This will be handled by the cancellation logic below
      // No need to block or show error
    } else if (missingFields.length > 0) {
      // Show warning if children are selected but required fields are missing
      const warningMessage = `⚠️ Warning: The following required fields are missing:\n\n${missingFields.map(field => `• ${field}`).join('\n')}\n\nYour registration will be deleted and will not count. Please fill in all required fields to complete your registration.`;
      setError(warningMessage);
      // Still allow submission to proceed - don't return early
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
          if (!child) return false; // Safety check: child not found
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

      // If no children are selected, we're done (all registrations cancelled)
      if (selectedChildren.length === 0) {
        if (successfullyCancelledIds.length > 0) {
          onSuccess('All registrations have been removed for this event.');
        } else {
          onSuccess('No registrations to update.');
        }
        setIsSubmitting(false);
        return;
      }

      // If children are selected but required fields are missing, don't create registrations
      if (missingFields.length > 0) {
        const warningMessage = `⚠️ Registration incomplete. The following required fields are missing:\n\n${missingFields.map(field => `• ${field}`).join('\n')}\n\nYour registration will be deleted and will not count. Please fill in all required fields and try again.`;
        setError(warningMessage);
        setIsSubmitting(false);
        return;
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
        if (isNaN(participantAge) || participantAge < 0 || participantAge > 21) {
          throw new Error(`Invalid age for ${child.firstName} ${child.lastName}. Age must be a number between 0 and 21.`);
        }

        // Check event age range validation
        if (event.minAge !== null && event.minAge !== undefined && participantAge < event.minAge) {
          throw new Error(`Child ${child.firstName} ${child.lastName} (age ${participantAge}) does not meet the minimum age requirement (${event.minAge}). Please email us at info@kidsinmotionpa.org if you have questions.`);
        }
        if (event.maxAge !== null && event.maxAge !== undefined && participantAge > event.maxAge) {
          throw new Error(`Child ${child.firstName} ${child.lastName} (age ${participantAge}) exceeds the maximum age requirement (${event.maxAge}). Please email us at info@kidsinmotionpa.org if you have questions.`);
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
          emergencyContactName: `${formData.emergencyContactFirstName} ${formData.emergencyContactLastName}`.trim(),
          emergencyContactPhone: formData.emergencyContactPhone,
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
            <div ref={errorRef} className="alert alert-danger mb-4">
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
            <p><strong>Date:</strong> {event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString() : 'TBD'}</p>
            {event.location && <p><strong>Location:</strong> {event.location}</p>}
            {(() => {
              if (event.minAge !== null && event.minAge !== undefined && event.maxAge !== null && event.maxAge !== undefined) {
                return <p><strong>Age Range:</strong> Ages {event.minAge}-{event.maxAge}</p>;
              } else if (event.minAge !== null && event.minAge !== undefined) {
                return <p><strong>Age Range:</strong> Ages {event.minAge}+</p>;
              } else if (event.maxAge !== null && event.maxAge !== undefined) {
                return <p><strong>Age Range:</strong> Ages up to {event.maxAge}</p>;
              } else if (event.ageGroup) {
                return <p><strong>Age Group:</strong> {event.ageGroup}</p>;
              }
              return <p><strong>Age Range:</strong> All Ages</p>;
            })()}
            {event.price && event.price > 0 ? (
              <p><strong>Price:</strong> ${event.price}</p>
            ) : (
              <p><strong>Price:</strong> FREE</p>
            )}
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
                {existingRegistrations.length > 0 && (
                  <div className="alert alert-warning mb-3">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    <strong>Important:</strong> Deselecting a child who is already registered will remove them from this event.
                  </div>
                )}
                <div className="children-selection">
                  {children.map(child => {
                    const isSelected = selectedChildren.includes(child.id);
                    return (
                      <div
                        key={child.id}
                        className={`child-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleChildSelection(child.id)}
                      >
                        <div className="selection-indicator">
                          <div className={`checkbox-circle ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <i className="fas fa-check"></i>}
                          </div>
                        </div>
                        <div className="child-info">
                          <h4 className="child-name">{child.firstName} {child.lastName}</h4>
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
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-section">
                <h4>Emergency Contact Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="emergencyContactFirstName">Emergency Contact First Name *</label>
                    <input
                      type="text"
                      id="emergencyContactFirstName"
                      name="emergencyContactFirstName"
                      className="form-control"
                      value={formData.emergencyContactFirstName}
                      onChange={handleInputChange}
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="emergencyContactLastName">Emergency Contact Last Name *</label>
                    <input
                      type="text"
                      id="emergencyContactLastName"
                      name="emergencyContactLastName"
                      className="form-control"
                      value={formData.emergencyContactLastName}
                      onChange={handleInputChange}
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="emergencyContactPhone">Phone Number or Email *</label>
                  <input
                    type="text"
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    className="form-control"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    placeholder="Phone number or email address"
                    required
                  />
                </div>
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
                      name="agreesToCommunications"
                      checked={formData.agreesToCommunications}
                      onChange={handleInputChange}
                    />
                    <span className="custom-checkbox"></span>
                    <strong>I agree to receive communications from Kids in Motion via email and/or phone *</strong>
                    <small className="d-block text-muted mt-1">
                      By checking this box, you consent to receive event updates, important announcements, and other communications from Kids in Motion to your registered email address and phone number.
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
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? 'Processing...' 
                    : selectedChildren.length === 0 
                      ? (existingRegistrations.length > 0 ? 'Remove All Registrations' : 'Submit')
                      : `Register ${selectedChildren.length === 1 ? 'Child' : 'Children'}`
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        /* Event Registration Form - Unified Design System */
        .registration-form {
          max-width: 700px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(47, 80, 106, 0.1);
          padding: 2rem;
        }

        .event-summary {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 16px rgba(47, 80, 106, 0.2);
        }

        .event-summary h4 {
          color: white;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }

        .event-summary p {
          margin-bottom: 0.5rem;
          opacity: 0.95;
        }

        /* Form Sections */
        .form-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .form-section h4 {
          color: var(--primary);
          margin-bottom: 1rem;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        /* Form Groups */
        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--primary);
          font-size: 0.95rem;
        }

        /* Form Controls */
        .form-control {
          width: 100%;
          padding: 0.875rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
          box-sizing: border-box;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.1);
          transform: translateY(-1px);
        }

        .form-control::placeholder {
          color: #9ca3af;
          opacity: 1;
        }

        textarea.form-control {
          resize: vertical;
          min-height: 120px;
          line-height: 1.6;
        }

        /* Children Selection */
        .children-selection {
          display: grid;
          gap: 1rem;
          margin-top: 1rem;
        }

        .child-card {
          background: white;
          border: 3px solid #e9ecef;
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .child-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(47, 80, 106, 0.02), rgba(47, 80, 106, 0.05));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .child-card:hover {
          border-color: var(--primary);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 40px rgba(47, 80, 106, 0.15);
        }

        .child-card:hover::before {
          opacity: 1;
        }

        .child-card.selected {
          border-color: var(--primary);
          background: linear-gradient(135deg, rgba(47, 80, 106, 0.08), rgba(47, 80, 106, 0.04));
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(47, 80, 106, 0.2);
        }

        .selection-indicator {
          flex-shrink: 0;
        }

        .checkbox-circle {
          width: 32px;
          height: 32px;
          border: 3px solid #dee2e6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .checkbox-circle.checked {
          background: linear-gradient(135deg, var(--primary), #3a5674);
          border-color: var(--primary);
          transform: scale(1.1);
          box-shadow: 0 4px 15px rgba(47, 80, 106, 0.3);
        }

        .checkbox-circle.checked i {
          color: white;
          font-size: 16px;
          font-weight: bold;
        }

        .child-card:hover .checkbox-circle {
          border-color: var(--primary);
          box-shadow: 0 4px 15px rgba(47, 80, 106, 0.2);
        }


        .child-info {
          flex: 1;
        }

        .child-name {
          margin: 0 0 0.75rem 0;
          color: var(--primary);
          font-size: 1.3rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .child-details {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }

        .detail-item {
          display: flex;
          align-items: center;
          color: #6c757d;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .detail-item i {
          margin-right: 0.5rem;
          color: var(--primary);
        }

        .health-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 2px solid #e9ecef;
        }

        .health-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .health-item.medical {
          color: #dc3545;
        }

        .health-item.allergies {
          color: #fd7e14;
        }

        .child-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }



        /* Checkbox Options - Modern Design */
        .checkbox-option {
          margin: 1.5rem 0;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          cursor: pointer;
          padding: 1.5rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          position: relative;
          overflow: hidden;
        }

        .checkbox-label::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(47, 80, 106, 0.02), rgba(47, 80, 106, 0.04));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .checkbox-label:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(47, 80, 106, 0.12);
        }

        .checkbox-label:hover::before {
          opacity: 1;
        }

        .checkbox-label input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          width: 0;
          height: 0;
        }

        .custom-checkbox {
          position: relative;
          height: 24px;
          width: 24px;
          background: white;
          border: 2px solid #cbd5e1;
          border-radius: 6px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
        }

        .checkbox-label:hover .custom-checkbox {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.1);
        }

        .checkbox-label input:checked ~ .custom-checkbox {
          background: linear-gradient(135deg, var(--primary), #3a5674);
          border-color: var(--primary);
          transform: scale(1.05);
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.2);
        }

        .custom-checkbox:after {
          content: "";
          position: absolute;
          display: none;
          width: 6px;
          height: 12px;
          border: solid white;
          border-width: 0 2.5px 2.5px 0;
          transform: rotate(45deg);
        }

        .checkbox-label input:checked ~ .custom-checkbox:after {
          display: block;
          animation: checkmark 0.3s ease-out;
        }

        @keyframes checkmark {
          0% {
            transform: rotate(45deg) scale(0);
            opacity: 0;
          }
          50% {
            transform: rotate(45deg) scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: rotate(45deg) scale(1);
            opacity: 1;
          }
        }

        .checkbox-label input:checked ~ span {
          color: var(--primary);
          font-weight: 600;
        }

        .checkbox-label span {
          position: relative;
          z-index: 1;
          transition: color 0.3s ease;
        }

        .checkbox-label small {
          position: relative;
          z-index: 1;
        }

        /* Info Notes & Alerts */
        .info-note {
          margin: 2rem 0;
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .alert-info {
          background: linear-gradient(135deg, #d1ecf1, #b8daff);
          border: 1px solid #bee5eb;
          color: #0c5460;
        }

        .alert-danger {
          background: linear-gradient(135deg, #f8d7da, #f5c6cb);
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .alert i {
          margin-top: 2px;
          font-size: 1.1rem;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 2px solid #e9ecef;
        }

        .btn {
          padding: 0.875rem 2rem;
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
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.6s ease, height 0.6s ease;
        }

        .btn:active::before {
          width: 300px;
          height: 300px;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--primary-light));
          color: white;
          border-color: var(--primary);
          box-shadow: 0 4px 15px rgba(47, 80, 106, 0.2);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(47, 80, 106, 0.3);
          background: linear-gradient(135deg, var(--primary-light), var(--primary));
        }

        .btn-outline {
          background: white;
          color: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 4px 15px rgba(47, 80, 106, 0.1);
        }

        .btn-outline:hover:not(:disabled) {
          background: var(--primary);
          color: white;
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(47, 80, 106, 0.2);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        }

        /* Loading States */
        .loading-container {
          text-align: center;
          padding: 3rem;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(47, 80, 106, 0.2);
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
          padding: 3rem;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px dashed #dee2e6;
        }

        .no-children-state h3 {
          color: #6c757d;
          margin-bottom: 1rem;
        }

        /* Email Notification */
        .email-notification {
          background: linear-gradient(135deg, #d4edda, #c3e6cb);
          border: 1px solid #c3e6cb;
          color: #155724;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 15px rgba(21, 87, 36, 0.1);
        }

        .notification-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .notification-content span {
          flex: 1;
          font-weight: 500;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .registration-form {
            margin: 1rem;
            padding: 1.5rem;
            box-shadow: none;
            border: 1px solid #e9ecef;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .form-actions .btn {
            width: 100%;
            min-width: auto;
          }

          .child-details {
            flex-direction: column;
            gap: 0.75rem;
          }

          .child-header {
            flex-direction: column;
            gap: 0.5rem;
          }

          .registration-status {
            margin-left: 0;
            align-self: flex-start;
          }
        }

        /* Utility Classes */
        .mr-3 {
          margin-right: 1rem !important;
        }

        .text-muted {
          color: #6c757d !important;
        }

        .close-btn {
          background: none;
          border: none;
          color: #155724;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background-color 0.2s ease;
          flex-shrink: 0;
        }

        .close-btn:hover {
          background-color: rgba(21, 87, 36, 0.1);
        }

        .close-btn i {
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default EventRegistrationForm;