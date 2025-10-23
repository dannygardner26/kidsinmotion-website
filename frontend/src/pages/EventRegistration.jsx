import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import EventRegistrationForm from '../components/EventRegistrationForm';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const EventRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
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

    // Redirect volunteers to volunteer signup page
    if (userProfile && userProfile.userType === 'VOLUNTEER') {
      navigate(`/events/${id}/volunteer`);
      return;
    }

    // Fetch event details when user is available
    if (currentUser) {
      fetchEventDetails();
    }
  }, [id, currentUser, userProfile, authLoading, navigate]);
  
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
      <>
        <div className="container mt-4">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading event details...</p>
          </div>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
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
      </>
    );
  }
  
  if (successMessage) {
    return (
      <>
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
      </>
    );
  }
  
  return (
    <>
      <div className="container mt-4">
        {/* Enhanced info note for parents about stored account information */}
        <div className="account-info-note enhanced">
          <div className="info-icon">
            <i className="fas fa-shield-alt"></i>
          </div>
          <div className="info-content">
            <strong>Account Information Notice:</strong> We securely store your contact information (email and phone) and will use it to send important updates about your child's registration and event details.
          </div>
        </div>

        <EventRegistrationForm
          event={event}
          onSuccess={handleRegistrationSuccess}
          onCancel={handleCancel}
        />
      </div>
      
      <style>{`
        .account-info-note {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: linear-gradient(135deg, #e6f3ff 0%, #f0f8ff 100%);
          border: 2px solid #b3d9ff;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          color: #0c4a6e;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .account-info-note.enhanced {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #7dd3fc;
        }

        .account-info-note::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%);
          transform: rotate(45deg);
          pointer-events: none;
        }

        .account-info-note:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(2, 132, 199, 0.15);
          border-color: #0ea5e9;
        }

        .info-icon {
          color: #0284c7;
          font-size: 1.5rem;
          margin-top: 0.125rem;
          flex-shrink: 0;
          background: rgba(2, 132, 199, 0.1);
          padding: 0.75rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.1);
          position: relative;
          z-index: 2;
        }

        .info-content {
          line-height: 1.6;
          position: relative;
          z-index: 2;
        }

        .info-content strong {
          color: #0c4a6e;
          font-weight: 700;
          font-size: 1.05rem;
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
    </>
  );
};

export default EventRegistration;
