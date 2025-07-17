import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import EventRegistrationForm from '../components/EventRegistrationForm';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const EventRegistration = () => {
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
      navigate(`/login?redirect=/events/${id}/register`);
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
        setError('Registration is closed for this event.');
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
  
  const handleRegistrationSuccess = (message) => {
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
  
  if (successMessage) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2>Registration Successful!</h2>
              <p className="lead">{successMessage}</p>
              <p>Redirecting to your dashboard...</p>
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
        <EventRegistrationForm 
          event={event}
          onSuccess={handleRegistrationSuccess}
          onCancel={handleCancel}
        />
      </div>
      
      <style jsx>{`
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
        
        .success-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
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
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes dots {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </Layout>
  );
};

export default EventRegistration;
