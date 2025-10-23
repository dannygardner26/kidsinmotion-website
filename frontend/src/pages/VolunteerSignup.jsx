import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
      <>
        <div className="container mt-4">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading event details...</p>
          </div>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <div className="container mt-4">
          <div className="error-container">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2 className="error-title">Volunteer Sign-Up Error</h2>
            <p className="error-message">{error}</p>
            <a href="/events" className="btn btn-primary enhanced-btn">Browse Events</a>
          </div>
        </div>
      </>
    );
  }
  
  if (successMessage) {
    return (
      <>
        <div className="container mt-4">
          <div className="success-container">
            <div className="success-icon">
              <i className="fas fa-heart"></i>
            </div>
            <h2 className="success-title">Thank You for Volunteering!</h2>
            <p className="success-message">{successMessage}</p>
            <p className="redirect-message">Redirecting to your dashboard...</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <div className="container mt-4">
        <VolunteerSignupForm
          event={event}
          onSuccess={handleVolunteerSuccess}
          onCancel={handleCancel}
        />
      </div>

      <style>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 3rem;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(47, 80, 106, 0.2);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s linear infinite;
          margin-bottom: 2rem;
          box-shadow: 0 4px 15px rgba(47, 80, 106, 0.15);
        }

        .loading-text {
          font-size: 1.2rem;
          color: var(--primary);
          font-weight: 600;
          text-align: center;
          margin: 0;
        }

        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 3rem;
          background: linear-gradient(145deg, #fff5f5 0%, #fed7d7 100%);
          border-radius: 20px;
          border: 2px solid #feb2b2;
          box-shadow: 0 10px 30px rgba(239, 68, 68, 0.1);
        }

        .error-icon {
          font-size: 4rem;
          color: #ef4444;
          margin-bottom: 2rem;
          animation: pulse 2s infinite;
        }

        .error-title {
          color: #dc2626;
          margin-bottom: 1rem;
          font-weight: 700;
          font-size: 1.8rem;
          text-align: center;
        }

        .error-message {
          color: #7f1d1d;
          font-size: 1.1rem;
          text-align: center;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .success-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 3rem;
          background: linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%);
          border-radius: 20px;
          border: 2px solid #bbf7d0;
          box-shadow: 0 10px 30px rgba(34, 197, 94, 0.1);
        }

        .success-icon {
          font-size: 4rem;
          color: #22c55e;
          margin-bottom: 2rem;
          animation: heartbeat 1.5s ease-in-out infinite;
        }

        .success-title {
          color: #15803d;
          margin-bottom: 1rem;
          font-weight: 700;
          font-size: 1.8rem;
          text-align: center;
        }

        .success-message {
          color: #166534;
          font-size: 1.1rem;
          text-align: center;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .redirect-message {
          color: #15803d;
          font-size: 1rem;
          text-align: center;
          margin-bottom: 2rem;
          font-style: italic;
        }

        .loading-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .loading-dots span {
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, var(--primary), var(--primary-light));
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
          box-shadow: 0 2px 8px rgba(47, 80, 106, 0.3);
        }

        .loading-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        .enhanced-btn {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%) !important;
          border: 2px solid var(--primary) !important;
          box-shadow: 0 4px 15px rgba(47, 80, 106, 0.2) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          font-weight: 600 !important;
          letter-spacing: 0.5px !important;
          text-transform: uppercase !important;
          font-size: 0.9rem !important;
          padding: 0.875rem 2rem !important;
          border-radius: 8px !important;
        }

        .enhanced-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(47, 80, 106, 0.3) !important;
          background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%) !important;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes heartbeat {
          0%, 50%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          75% { transform: scale(1.05); }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default VolunteerSignup;