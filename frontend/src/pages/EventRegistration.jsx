import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';

const EventRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [childFirstName, setChildFirstName] = useState('');
  const [childLastName, setChildLastName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePhotos, setAgreePhotos] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      navigate(`/login?redirect=/events/${id}/register`);
      return;
    }
    
    // Fetch event details
    fetchEventDetails();
    
    // Pre-fill emergency contact if user profile has phone number
    fetchUserProfile(token);
  }, [id, navigate]);
  
  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) {
        throw new Error('Event not found');
      }
      const data = await response.json();
      
      // Check if event is full
      if (data.availableSpots <= 0) {
        setError('This event is currently full. Please check other events.');
        return;
      }
      
      // Check if event is in the past
      if (new Date(data.event.endDate) < new Date()) {
        setError('Registration is closed for this event.');
        return;
      }
      
      setEvent(data.event);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.phoneNumber) {
          setEmergencyContact(userData.phoneNumber);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  
  const validateStep1 = () => {
    const errors = {};
    
    if (!childFirstName.trim()) {
      errors.childFirstName = 'First name is required';
    }
    
    if (!childLastName.trim()) {
      errors.childLastName = 'Last name is required';
    }
    
    if (!childAge) {
      errors.childAge = 'Age is required';
    } else if (isNaN(childAge) || childAge < 1 || childAge > 18) {
      errors.childAge = 'Please enter a valid age between 1 and 18';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validateStep2 = () => {
    const errors = {};
    
    if (!emergencyContact.trim()) {
      errors.emergencyContact = 'Emergency contact is required';
    }
    
    if (!agreeTerms) {
      errors.agreeTerms = 'You must acknowledge that you are the parent/guardian';
    }
    
    if (!agreePhotos) {
      errors.agreePhotos = 'You must acknowledge the photo policy';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      window.scrollTo(0, 0);
    }
  };
  
  const prevStep = () => {
    setCurrentStep(1);
    window.scrollTo(0, 0);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      nextStep();
      return;
    }
    
    if (!validateStep2()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          childFirstName,
          childLastName,
          childAge: parseInt(childAge),
          specialNeeds: specialNeeds || 'None',
          emergencyContact
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      setRegistrationSuccess(true);
      
      // Reset form
      setChildFirstName('');
      setChildLastName('');
      setChildAge('');
      setSpecialNeeds('');
      
      // Redirect to confirmation after a delay
      setTimeout(() => {
        navigate(`/events/${id}/confirmation`);
      }, 2000);
      
    } catch (error) {
      console.error('Error registering for event:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading event details...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="error-icon">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <h2>Registration Error</h2>
              <p>{error}</p>
              <Link to="/events" className="btn btn-primary">Browse Other Events</Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (registrationSuccess) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2>Registration Successful!</h2>
              <p className="lead">Thank you for registering your child for {event.title}.</p>
              <p>Redirecting to confirmation page...</p>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mt-4">
        <div className="registration-progress-container">
          <div className="registration-progress">
            <div 
              className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
              onClick={() => currentStep > 1 && prevStep()}
            >
              <div className="step-number">1</div>
              <div className="step-label">Child Information</div>
            </div>
            <div className="progress-line">
              <div className={`progress-line-inner ${currentStep > 1 ? 'completed' : ''}`}></div>
            </div>
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Emergency Contact</div>
            </div>
          </div>
        </div>
        
        <div className="card mb-4 fade-in">
          <div className="card-header">
            <h1>Register for {event.title}</h1>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col">
                <div className="event-summary">
                  <div className="event-icon">
                    <i className={`fas fa-${getSportIcon(event.sportType)}`}></i>
                  </div>
                  <div className="event-details">
                    <h3>Event Details</h3>
                    <p><strong>Date:</strong> {formatDate(event.startDate)}</p>
                    <p><strong>Location:</strong> {event.location}</p>
                    <p><strong>Sport:</strong> {event.sportType}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              {currentStep === 1 && (
                <div className="step-content fade-in">
                  <h3>Child Information</h3>
                  
                  <div className="row">
                    <div className="col-half">
                      <div className="form-floating">
                        <input
                          type="text"
                          id="childFirstName"
                          className={`form-control ${formErrors.childFirstName ? 'is-invalid' : ''}`}
                          value={childFirstName}
                          onChange={(e) => setChildFirstName(e.target.value)}
                          placeholder=" "
                        />
                        <label htmlFor="childFirstName">First Name*</label>
                        {formErrors.childFirstName && (
                          <div className="invalid-feedback">{formErrors.childFirstName}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-half">
                      <div className="form-floating">
                        <input
                          type="text"
                          id="childLastName"
                          className={`form-control ${formErrors.childLastName ? 'is-invalid' : ''}`}
                          value={childLastName}
                          onChange={(e) => setChildLastName(e.target.value)}
                          placeholder=" "
                        />
                        <label htmlFor="childLastName">Last Name*</label>
                        {formErrors.childLastName && (
                          <div className="invalid-feedback">{formErrors.childLastName}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mt-3">
                    <div className="col-half">
                      <div className="form-floating">
                        <input
                          type="number"
                          id="childAge"
                          className={`form-control ${formErrors.childAge ? 'is-invalid' : ''}`}
                          min="1"
                          max="18"
                          value={childAge}
                          onChange={(e) => setChildAge(e.target.value)}
                          placeholder=" "
                        />
                        <label htmlFor="childAge">Age*</label>
                        {formErrors.childAge && (
                          <div className="invalid-feedback">{formErrors.childAge}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group mt-3">
                    <label htmlFor="specialNeeds">Special Needs or Accommodations</label>
                    <textarea
                      id="specialNeeds"
                      className="form-control"
                      rows="3"
                      value={specialNeeds}
                      onChange={(e) => setSpecialNeeds(e.target.value)}
                      placeholder="Please share any allergies, medical conditions, or other information that would help us better support your child"
                    ></textarea>
                    <small className="form-text text-muted">
                      This information helps us prepare appropriately for your child's participation.
                    </small>
                  </div>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="step-content fade-in">
                  <h3>Emergency Contact</h3>
                  
                  <div className="form-floating mt-3">
                    <input
                      type="text"
                      id="emergencyContact"
                      className={`form-control ${formErrors.emergencyContact ? 'is-invalid' : ''}`}
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder=" "
                    />
                    <label htmlFor="emergencyContact">Emergency Contact Number*</label>
                    {formErrors.emergencyContact && (
                      <div className="invalid-feedback">{formErrors.emergencyContact}</div>
                    )}
                  </div>
                  
                  <div className={`form-check mt-4 ${formErrors.agreeTerms ? 'is-invalid' : ''}`}>
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="agreeTerms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="agreeTerms">
                      I acknowledge that I am the parent/guardian of the child being registered and authorize their participation in this event.
                    </label>
                    {formErrors.agreeTerms && (
                      <div className="invalid-feedback">{formErrors.agreeTerms}</div>
                    )}
                  </div>
                  
                  <div className={`form-check mt-3 ${formErrors.agreePhotos ? 'is-invalid' : ''}`}>
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="agreePhotos"
                      checked={agreePhotos}
                      onChange={(e) => setAgreePhotos(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="agreePhotos">
                      I understand that photos may be taken during the event for promotional purposes.
                    </label>
                    {formErrors.agreePhotos && (
                      <div className="invalid-feedback">{formErrors.agreePhotos}</div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="form-nav mt-4">
                {currentStep > 1 && (
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={prevStep}
                  >
                    <i className="fas fa-arrow-left mr-2"></i> Previous
                  </button>
                )}
                
                <button 
                  type="submit" 
                  className={`btn ${currentStep === 1 ? 'btn-outline' : 'btn-primary'}`} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      Submitting...
                    </>
                  ) : currentStep === 1 ? (
                    <>Next <i className="fas fa-arrow-right ml-2"></i></>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
                
                <Link to={`/events/${id}`} className="btn btn-link">Cancel</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for this page */}
      <style jsx>{`
        .registration-progress-container {
          padding: 2rem 0;
        }
        
        .registration-progress {
          display: flex;
          align-items: center;
          max-width: 500px;
          margin: 0 auto;
        }
        
        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        
        .progress-step.completed {
          cursor: pointer;
        }
        
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #eee;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .progress-step.active .step-number {
          background-color: var(--primary);
          color: white;
        }
        
        .progress-step.completed .step-number {
          background-color: var(--primary);
          color: white;
        }
        
        .step-label {
          font-size: 0.9rem;
          font-weight: 500;
          text-align: center;
        }
        
        .progress-line {
          flex: 1;
          height: 3px;
          background-color: #eee;
          position: relative;
          z-index: 0;
        }
        
        .progress-line-inner {
          height: 100%;
          width: 0;
          background-color: var(--primary);
          transition: width 0.5s ease;
        }
        
        .progress-line-inner.completed {
          width: 100%;
        }
        
        .event-summary {
          display: flex;
          align-items: center;
          padding: 1.5rem;
          background-color: #f8f8f8;
          border-radius: 8px;
        }
        
        .event-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1.5rem;
          font-size: 1.5rem;
        }
        
        .event-details {
          flex: 1;
        }
        
        .event-details h3 {
          margin-bottom: 0.5rem;
        }
        
        .step-content {
          animation: fadeIn 0.5s ease;
        }
        
        .form-nav {
          display: flex;
          justify-content: space-between;
          margin-top: 2rem;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(47, 80, 106, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 1rem;
        }
        
        .error-icon, .success-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }
        
        .error-icon {
          color: var(--secondary);
        }
        
        .success-icon {
          color: #28a745;
        }
        
        .loading-dots {
          display: flex;
          justify-content: center;
          margin-top: 1rem;
        }
        
        .loading-dots span {
          width: 10px;
          height: 10px;
          margin: 0 5px;
          background-color: var(--primary);
          border-radius: 50%;
          display: inline-block;
          animation: dots 1.5s infinite ease-in-out;
        }
        
        .loading-dots span:nth-child(2) {
          animation-delay: 0.5s;
        }
        
        .loading-dots span:nth-child(3) {
          animation-delay: 1s;
        }
        
        .mr-2 {
          margin-right: 0.5rem;
        }
        
        .ml-2 {
          margin-left: 0.5rem;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes dots {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        
        @media (max-width: 768px) {
          .event-summary {
            flex-direction: column;
            text-align: center;
          }
          
          .event-icon {
            margin-right: 0;
            margin-bottom: 1rem;
          }
          
          .form-nav {
            flex-direction: column;
            gap: 1rem;
          }
          
          .form-nav button, .form-nav a {
            width: 100%;
          }
        }
      `}</style>
    </Layout>
  );
};

// Helper function to get sport icon
function getSportIcon(sportType) {
  if (!sportType) return 'running';
  
  const sportIconMap = {
    'BASEBALL': 'baseball-ball',
    'SOCCER': 'futbol',
    'BASKETBALL': 'basketball-ball',
    'VOLLEYBALL': 'volleyball-ball',
    'FOOTBALL': 'football-ball',
    'TENNIS': 'tennis-ball',
  };
  
  return sportIconMap[sportType] || 'running';
}

export default EventRegistration;
