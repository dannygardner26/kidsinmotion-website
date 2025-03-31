import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const EventRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // Form state
  const [childFirstName, setChildFirstName] = useState('');
  const [childLastName, setChildLastName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
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
  }, [id]);
  
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
  
  const validateForm = () => {
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
    
    if (!emergencyContact.trim()) {
      errors.emergencyContact = 'Emergency contact is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
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
          <p>Loading event details...</p>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="card">
            <div className="card-body">
              <h2>Registration Error</h2>
              <p>{error}</p>
              <a href="/events" className="btn btn-primary">Browse Other Events</a>
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
              <h2>Registration Successful!</h2>
              <p>Thank you for registering your child for {event.title}.</p>
              <p>Redirecting to confirmation page...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mt-4">
        <div className="card mb-4">
          <div className="card-header">
            <h1>Register for {event.title}</h1>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col">
                <h3>Event Details</h3>
                <p><strong>Date:</strong> {formatDate(event.startDate)}</p>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Sport:</strong> {event.sportType}</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <h3>Child Information</h3>
              
              <div className="row">
                <div className="col-half">
                  <div className="form-group">
                    <label htmlFor="childFirstName">First Name*</label>
                    <input
                      type="text"
                      id="childFirstName"
                      className={`form-control ${formErrors.childFirstName ? 'is-invalid' : ''}`}
                      value={childFirstName}
                      onChange={(e) => setChildFirstName(e.target.value)}
                    />
                    {formErrors.childFirstName && (
                      <div className="invalid-feedback">{formErrors.childFirstName}</div>
                    )}
                  </div>
                </div>
                
                <div className="col-half">
                  <div className="form-group">
                    <label htmlFor="childLastName">Last Name*</label>
                    <input
                      type="text"
                      id="childLastName"
                      className={`form-control ${formErrors.childLastName ? 'is-invalid' : ''}`}
                      value={childLastName}
                      onChange={(e) => setChildLastName(e.target.value)}
                    />
                    {formErrors.childLastName && (
                      <div className="invalid-feedback">{formErrors.childLastName}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="row">
                <div className="col-half">
                  <div className="form-group">
                    <label htmlFor="childAge">Age*</label>
                    <input
                      type="number"
                      id="childAge"
                      className={`form-control ${formErrors.childAge ? 'is-invalid' : ''}`}
                      min="1"
                      max="18"
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                    />
                    {formErrors.childAge && (
                      <div className="invalid-feedback">{formErrors.childAge}</div>
                    )}
                  </div>
                </div>
                
                <div className="col-half">
                  <div className="form-group">
                    <label htmlFor="emergencyContact">Emergency Contact Number*</label>
                    <input
                      type="text"
                      id="emergencyContact"
                      className={`form-control ${formErrors.emergencyContact ? 'is-invalid' : ''}`}
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="XXX-XXX-XXXX"
                    />
                    {formErrors.emergencyContact && (
                      <div className="invalid-feedback">{formErrors.emergencyContact}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="specialNeeds">Special Needs or Accommodations</label>
                <textarea
                  id="specialNeeds"
                  className="form-control"
                  rows="3"
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  placeholder="Please share any allergies, medical conditions, or other information that would help us better support your child"
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>
                  <input type="checkbox" required /> I acknowledge that I am the parent/guardian of the child being registered and authorize their participation in this event.
                </label>
              </div>
              
              <div className="form-group">
                <label>
                  <input type="checkbox" required /> I understand that photos may be taken during the event for promotional purposes.
                </label>
              </div>
              
              <div className="mt-3">
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Complete Registration'}
                </button>
                <a href={`/events/${id}`} className="btn btn-outline ml-2">Cancel</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventRegistration;