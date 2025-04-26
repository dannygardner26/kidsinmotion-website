import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const VolunteerSignup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  // Form state
  const [notes, setNotes] = useState('');
  const [availability, setAvailability] = useState('FULL_EVENT');
  const [skills, setSkills] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  
  const availabilityOptions = [
    { value: 'FULL_EVENT', label: 'Available for the full event' },
    { value: 'SETUP_ONLY', label: 'Available for setup only' },
    { value: 'TEARDOWN_ONLY', label: 'Available for teardown only' },
    { value: 'PARTIAL', label: 'Available for part of the event' }
  ];
  
  const skillsOptions = [
    { value: 'COACHING', label: 'Coaching/Teaching' },
    { value: 'FIRST_AID', label: 'First Aid/CPR Certified' },
    { value: 'PHOTOGRAPHY', label: 'Photography' },
    { value: 'EQUIPMENT', label: 'Equipment Management' },
    { value: 'SETUP', label: 'Setup/Teardown' },
    { value: 'SUPERVISION', label: 'Child Supervision' }
  ];
  
  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      navigate(`/login?redirect=/events/${id}/volunteer`);
      return;
    }
    
    // Fetch event details
    fetchEventDetails();
  }, [id]);
  
  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) {
        throw new Error('Event not found');
      }
      const data = await response.json();
      
      // Check if event needs volunteers
      if (!data.event.needsVolunteers || data.volunteersNeeded <= 0) {
        setError('This event is no longer looking for volunteers.');
        return;
      }
      
      // Check if event is in the past
      if (new Date(data.event.endDate) < new Date()) {
        setError('Volunteer sign-up is closed for this event.');
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
  
  const handleSkillsChange = (value) => {
    if (skills.includes(value)) {
      setSkills(skills.filter(skill => skill !== value));
    } else {
      setSkills([...skills, value]);
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (skills.length === 0) {
      errors.skills = 'Please select at least one skill or area of interest';
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
      
      // Format notes with selected skills
      const formattedNotes = `Skills: ${skills.join(', ')}\nAvailability: ${availability}\n${notes}`;
      
      const response = await fetch(`/api/events/${id}/volunteers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: formattedNotes
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Volunteer sign-up failed');
      }
      
      setSignupSuccess(true);
      
      // Redirect to confirmation after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error signing up as volunteer:', error);
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
              <h2>Volunteer Sign-Up Error</h2>
              <p>{error}</p>
              <a href="/events" className="btn btn-primary">Browse Events</a>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (signupSuccess) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="card">
            <div className="card-body text-center">
              <h2>Thank You for Volunteering!</h2>
              <p>Your volunteer application for {event.title} has been submitted.</p>
              <p>We'll contact you soon with more details.</p>
              <p>Redirecting to your dashboard...</p>
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
            <h1>Volunteer for {event.title}</h1>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col">
                <h3>Event Details</h3>
                <p><strong>Date:</strong> {formatDate(event.startDate)}</p>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Sport:</strong> {event.sportType}</p>
                <p><strong>Volunteers Needed:</strong> {event.volunteerCountNeeded}</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <h3>Volunteer Information</h3>
              
              <div className="form-group">
                <label>Skills and Interests*</label>
                <div className={`checkbox-group ${formErrors.skills ? 'is-invalid' : ''}`}>
                  {skillsOptions.map(option => (
                    <div key={option.value}>
                      <label>
                        <input 
                          type="checkbox" 
                          value={option.value}
                          checked={skills.includes(option.value)}
                          onChange={() => handleSkillsChange(option.value)}
                        /> {option.label}
                      </label>
                    </div>
                  ))}
                </div>
                {formErrors.skills && (
                  <div className="invalid-feedback">{formErrors.skills}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="availability">Availability</label>
                <select 
                  id="availability" 
                  className="form-control"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  {availabilityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  className="form-control"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Please share any relevant experience, special skills, or other information that would help us assign you an appropriate role."
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>
                  <input type="checkbox" required /> I understand that as a volunteer, I will be expected to follow the Kids in Motion volunteer guidelines.
                </label>
              </div>
              
              <div className="form-group">
                <label>
                  <input type="checkbox" required /> I understand that a background check may be required for certain volunteer positions involving direct supervision of children.
                </label>
              </div>
              
              <div className="mt-3">
                <button type="submit" className="btn btn-secondary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Sign Up to Volunteer'}
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

export default VolunteerSignup;