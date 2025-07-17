import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import VolunteerSignupForm from '../components/VolunteerSignupForm';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const VolunteerSignup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  useEffect(() => {
    // Check authentication
    if (!authLoading && !currentUser) {
      navigate(`/login?redirect=/events/${id}/volunteer`);
      return;
    }
    
    // Fetch event details when user is available
    if (currentUser) {
      fetchEventDetails();
    }
  }, [id, currentUser, authLoading, navigate]);
  
  const fetchEventDetails = async () => {
    try {
      const eventData = await apiService.getEvent(id);
      
      // Check if event is in the past
      if (new Date(eventData.date) < new Date()) {
        setError('Volunteer sign-up is closed for this event.');
        return;
      }
      
      setEvent(eventData);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError(error.message || 'Event not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolunteerSuccess = (message) => {
    setSuccessMessage(message);
    // Redirect to dashboard after a delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  const handleCancel = () => {
    navigate(`/events/${id}`);
  };
  
  if (authLoading || isLoading) {
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
  
  if (successMessage) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="card">
            <div className="card-body text-center">
              <h2>Thank You for Volunteering!</h2>
              <p>{successMessage}</p>
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
        <VolunteerSignupForm 
          event={event}
          onSuccess={handleVolunteerSuccess}
          onCancel={handleCancel}
        />
      </div>
    </Layout>
  );
};

export default VolunteerSignup;