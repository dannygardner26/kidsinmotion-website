import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { assetUrls } from '../utils/firebaseAssets';
import { formatAgeRange } from '../utils/eventFormatters';
import firebaseRealtimeService from '../services/firebaseRealtimeService';

const EventDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Set up real-time listener for this specific event
    firebaseRealtimeService.subscribeToEvent(
      id,
      (eventData) => {
        console.log('EventDetail: Real-time event update:', eventData);
        setEvent(eventData);
        setIsLoading(false);
      },
      (error) => {
        console.error('EventDetail: Real-time event error:', error);
        // Fallback to manual fetch
        fetchEventDetails();
      }
    );

    return () => {
      // Clean up listener when component unmounts or id changes
      firebaseRealtimeService.unsubscribe(`event_${id}`);
    };
  }, [id]);
  
  const fetchEventDetails = async () => {
    try {
      const eventData = await apiService.getEvent(id);
      setEvent(eventData);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  
  // Format date for display
  const formatDate = (dateString, startTime, endTime) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    let formattedDate = date.toLocaleDateString(undefined, dateOptions);

    // Helper function to format time from various possible formats
    const formatTime = (timeValue) => {
      if (!timeValue) return null;

      try {
        // Handle time formats like "17:00:00", "17:00", or already formatted times
        let timeString = timeValue.toString();

        // If it already looks like a formatted time (contains AM/PM), return as is
        if (timeString.includes('AM') || timeString.includes('PM')) {
          return timeString;
        }

        // If it's in HH:mm:ss or HH:mm format, parse it
        if (timeString.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
          // Split to check if we have seconds
          const timeParts = timeString.split(':');

          // If we only have hours and minutes, add seconds
          if (timeParts.length === 2) {
            timeString = timeString + ':00';
          }

          const timeDate = new Date(`2000-01-01T${timeString}`);
          return timeDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          });
        }

        return null;
      } catch (error) {
        console.error('Error parsing time:', timeValue, error);
        return null;
      }
    };

    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    // Check for valid formatted times
    if (formattedStartTime && formattedEndTime) {
      formattedDate += ` • ${formattedStartTime} - ${formattedEndTime}`;
    } else if (formattedStartTime) {
      formattedDate += ` • ${formattedStartTime}`;
    }

    return formattedDate;
  };
  
  // Format duration
  const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'TBD';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffHours = Math.round((end - start) / (1000 * 60 * 60));
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  };
  
  if (isLoading) {
    return (
      <>
        <div className="container mt-4">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>Loading event details...</p>
          </div>
        </div>
      </>
    );
  }
  
  if (error || !event) {
    return (
      <>
        <div className="container mt-4">
          <div className="card error-card">
            <div className="card-body text-center">
              <div className="error-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2>Error</h2>
              <p>{error || 'Event not found'}</p>
              <Link to="/events" className="btn btn-primary">Back to Events</Link>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  const isPastEvent = new Date(event.date) < new Date();
  const sportBackground = getSportBackground(event.ageGroup);
  
  return (
    <>
      {/* Event hero section */}
      <section className="hero" style={{ minHeight: '40vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-bg" style={{ backgroundImage: `url("${sportBackground}")` }}></div>
        
        <div className="container hero-content">
          <span className="event-badge">{formatAgeRange(event)}</span>
          <h1>{event.name}</h1>
          <div className="event-meta-highlights">
            <div className="event-meta-item">
              <i className="far fa-calendar"></i>
              <span>{formatDate(event.date, event.startTime, event.endTime)}</span>
            </div>
            <div className="event-meta-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>{event.location || 'TBD'}</span>
            </div>
            {event.price && event.price > 0 && (
              <div className="event-meta-item">
                <i className="fas fa-dollar-sign"></i>
                <span>${event.price}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="hero-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path
              fill="#ede9e7"
              fillOpacity="1"
              d="M0,64L60,58.7C120,53,240,43,360,48C480,53,600,75,720,75C840,75,960,53,1080,48C1200,43,1320,53,1380,58.7L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!currentUser && !isPastEvent && (
            <div className="account-requirement-banner fade-in" style={{ marginBottom: '2rem' }}>
              <div className="banner-icon">
                <i className="fas fa-info-circle"></i>
              </div>
              <div className="banner-content">
                <h3>Account Required</h3>
                <p>You need a Kids in Motion account to register for this event. Please log in or create an account to continue.</p>
              </div>
              <div className="banner-actions">
                <Link
                  to={`/login?redirect=/events/${event.id}`}
                  className="btn btn-primary"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-outline"
                >
                  Create Account
                </Link>
              </div>
            </div>
          )}
          <div className="row">
            <div className="col-two-thirds">
              <div className="card mb-4 fade-in">
                <div className="card-header">
                  <h2>About This Event</h2>
                </div>
                <div className="card-body">
                  <p className="mb-3">{event.description}</p>
                  
                  <h3>Event Details</h3>
                  <div className="event-meta mb-3">
                    <p><i className="far fa-calendar"></i> <strong>Date:</strong> {formatDate(event.date, event.startTime, event.endTime)}</p>
                    <p><i className="fas fa-map-marker-alt"></i> <strong>Location:</strong> {event.location || 'TBD'}</p>
                    <p><i className="fas fa-child"></i> <strong>Age Range:</strong> {formatAgeRange(event)}</p>
                    {event.tags && event.tags.trim() && (
                      <div style={{marginTop: '1rem'}}>
                        <p><i className="fas fa-tags"></i> <strong>Tags:</strong></p>
                        <div className="event-tags-display">
                          {event.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                            <span key={tag} className="event-tag-badge">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {event.capacity && (
                      <p><i className="fas fa-users"></i> <strong>Capacity:</strong> {event.capacity}</p>
                    )}
                    {event.price && event.price > 0 && (
                      <p><i className="fas fa-dollar-sign"></i> <strong>Price:</strong> ${event.price}</p>
                    )}
                  </div>
                  
                  <h3>What to Bring</h3>
                  <ul className="what-to-bring-list">
                    <li><i className="fas fa-tint"></i> Water bottle</li>
                    <li><i className="fas fa-tshirt"></i> Comfortable athletic clothes</li>
                    <li><i className="fas fa-shoe-prints"></i> Appropriate athletic footwear</li>
                    <li><i className="fas fa-smile"></i> Positive attitude and ready to have fun!</li>
                  </ul>
                </div>
              </div>
              
              {!isPastEvent && (
                <div className="card mb-4 fade-in">
                  <div className="card-header">
                    <h2>Frequently Asked Questions</h2>
                  </div>
                  <div className="card-body">
                    <div className="accordion">
                      <div className="accordion-item">
                        <button className="accordion-toggle">
                          <h4>What age groups is this event for?</h4>
                          <i className="fas fa-chevron-down"></i>
                        </button>
                        <div className="accordion-content">
                          <p>Our events are generally designed for children ages 6-14, but specific age requirements may vary by event. Please contact us if you have questions about your child's eligibility.</p>
                        </div>
                      </div>
                      
                      <div className="accordion-item">
                        <button className="accordion-toggle">
                          <h4>Do I need to bring equipment?</h4>
                          <i className="fas fa-chevron-down"></i>
                        </button>
                        <div className="accordion-content">
                          <p>While we encourage participants to bring their own equipment if they have it, we will provide all necessary equipment for those who need it.</p>
                        </div>
                      </div>
                      
                      <div className="accordion-item">
                        <button className="accordion-toggle">
                          <h4>What if my child has special needs?</h4>
                          <i className="fas fa-chevron-down"></i>
                        </button>
                        <div className="accordion-content">
                          <p>We strive to make our events inclusive for all children. Please note any special needs during registration, and we'll do our best to accommodate them.</p>
                        </div>
                      </div>
                      
                      <div className="accordion-item">
                        <button className="accordion-toggle">
                          <h4>What if it rains?</h4>
                          <i className="fas fa-chevron-down"></i>
                        </button>
                        <div className="accordion-content">
                          <p>In case of inclement weather, we will notify all registered participants of any changes via email. We may reschedule the event or move it to an indoor location if available.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="col-third">
              <div className="card sticky-card slide-in-right">
                <div className="card-header">
                  <h3>Registration</h3>
                </div>
                <div className="card-body">
                  {isPastEvent ? (
                    <div className="text-center">
                      <div className="status-icon past">
                        <i className="fas fa-history"></i>
                      </div>
                      <p>This event has already taken place.</p>
                      <Link to="/events" className="btn btn-outline btn-block mt-3">View Upcoming Events</Link>
                    </div>
                  ) : (
                    <>
                      <div className="spots-indicator">
                        <div className="spots-label">Capacity</div>
                        <div className="spots-count">{event.capacity || 'Unlimited'}</div>
                        {event.capacity && (
                          <div className="spots-progress">
                            <div 
                              className="spots-progress-bar" 
                              style={{ 
                                width: '20%'
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                      
                      {!isPastEvent ? (
                        currentUser ? (
                          <Link 
                            to={`/events/${event.id}/register`} 
                            className="btn btn-primary btn-block mt-3 register-btn"
                          >
                            Register Your Child
                          </Link>
                        ) : (
                          <div className="login-prompt">
                            <div className="login-prompt-icon">
                              <i className="fas fa-user-lock"></i>
                            </div>
                            <p className="login-prompt-text"><strong>Account Required:</strong> Please log in or create an account to register your child for this event.</p>
                            <Link
                              to={`/login?redirect=/events/${event.id}/register`}
                              className="btn btn-primary btn-block mt-2"
                            >
                              Login to Register
                            </Link>
                            <Link
                              to="/register"
                              className="btn btn-outline btn-block mt-2"
                            >
                              Create an Account
                            </Link>
                          </div>
                        )
                      ) : (
                        <div className="text-center">
                          <p>This event has ended.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {!isPastEvent && (
                <div className="card mt-4 slide-in-right" style={{ animationDelay: '0.2s' }}>
                  <div className="card-header volunteers-header">
                    <h3>Volunteer</h3>
                  </div>
                  <div className="card-body">
                    <div className="spots-indicator">
                      <div className="spots-label">Help Make This Event Great!</div>
                      <div className="spots-count"><i className="fas fa-hands-helping"></i></div>
                    </div>
                    
                    {currentUser ? (
                      <Link
                        to={`/events/${event.id}/volunteer`}
                        className="btn btn-secondary btn-block mt-3"
                      >
                        Sign Up to Volunteer
                      </Link>
                    ) : (
                      <div className="login-prompt">
                        <p>Please login to sign up as a volunteer.</p>
                        <Link
                          to={`/login?redirect=/events/${event.id}/volunteer`}
                          className="btn btn-secondary btn-block mt-2"
                        >
                          Login to Volunteer
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="card mt-4 slide-in-right" style={{ animationDelay: '0.4s' }}>
                <div className="card-header">
                  <h3>Share</h3>
                </div>
                <div className="card-body">
                  <button className="btn btn-outline btn-block mb-2 social-share-btn">
                    <i className="fab fa-facebook-f mr-2"></i> Share on Facebook
                  </button>
                  <button className="btn btn-outline btn-block mb-2 social-share-btn">
                    <i className="fab fa-twitter mr-2"></i> Share on Twitter
                  </button>
                  <button className="btn btn-outline btn-block social-share-btn">
                    <i className="fas fa-envelope mr-2"></i> Share via Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Custom CSS for this page */}
      <style>{`
        .event-badge {
          display: inline-block;
          background-color: var(--secondary);
          color: white;
          padding: 0.4rem 1rem;
          border-radius: 50px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .event-meta-highlights {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        
        .event-meta-item {
          display: flex;
          align-items: center;
          color: white;
          background-color: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 4px;
        }
        
        .event-meta-item i {
          margin-right: 0.5rem;
          font-size: 1.2rem;
        }
        
        .what-to-bring-list {
          list-style: none;
          padding: 0;
        }
        
        .what-to-bring-list li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
        }
        
        .what-to-bring-list li:last-child {
          border-bottom: none;
        }
        
        .what-to-bring-list li i {
          margin-right: 0.8rem;
          color: var(--primary);
        }
        
        .accordion-item {
          border: 1px solid #eee;
          border-radius: 4px;
          margin-bottom: 1rem;
          overflow: hidden;
        }
        
        .accordion-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          text-align: left;
          padding: 1rem;
          background-color: #f8f8f8;
          border: none;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .accordion-toggle:hover {
          background-color: #f1f1f1;
        }
        
        .accordion-toggle h4 {
          margin: 0;
          font-size: 1.1rem;
        }
        
        .accordion-content {
          padding: 0 1rem;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }
        
        .accordion-item.active .accordion-content {
          max-height: 200px;
          padding: 1rem;
        }
        
        .accordion-item.active .accordion-toggle i {
          transform: rotate(180deg);
        }
        
        .sticky-card {
          position: sticky;
          top: 100px;
        }
        
        .spots-indicator {
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .spots-label {
          font-size: 0.9rem;
          margin-bottom: 0.3rem;
          color: var(--text-light);
        }
        
        .spots-count {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary);
        }
        
        .spots-progress {
          height: 6px;
          background-color: #eee;
          border-radius: 3px;
          margin-top: 0.5rem;
          overflow: hidden;
        }
        
        .spots-progress-bar {
          height: 100%;
          background-color: var(--primary);
          transition: width 0.3s ease;
        }
        
        .status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          margin: 0 auto 1rem;
          font-size: 1.5rem;
        }
        
        .status-icon.past {
          background-color: #f8f8f8;
          color: var(--text-light);
        }
        
        .status-icon.full {
          background-color: #fff2f2;
          color: var(--secondary);
        }
        
        .login-prompt {
          text-align: center;
          padding: 1rem 0;
        }

        .login-prompt-icon {
          font-size: 2rem;
          color: var(--primary);
          margin-bottom: 0.5rem;
        }

        .login-prompt-text {
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .account-requirement-banner {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-left: 4px solid var(--primary);
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .banner-icon {
          flex-shrink: 0;
          font-size: 2.5rem;
          color: var(--primary);
        }

        .banner-content {
          flex: 1;
        }

        .banner-content h3 {
          margin: 0 0 0.5rem 0;
          color: var(--primary);
          font-size: 1.3rem;
        }

        .banner-content p {
          margin: 0;
          color: #1976d2;
        }

        .banner-actions {
          display: flex;
          gap: 0.75rem;
          flex-shrink: 0;
        }
        
        .volunteers-header {
          background-color: var(--secondary);
        }
        
        .social-share-btn {
          transition: all 0.3s ease;
        }
        
        .social-share-btn:hover {
          transform: translateY(-3px);
        }
        
        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
        }
        
        .loading-spinner {
          display: inline-block;
          width: 50px;
          height: 50px;
          border: 3px solid rgba(47, 80, 106, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 1rem;
        }
        
        .error-card {
          text-align: center;
        }
        
        .error-icon {
          font-size: 3rem;
          color: var(--secondary);
          margin-bottom: 1rem;
        }
        
        .register-btn {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(47, 80, 106, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(47, 80, 106, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(47, 80, 106, 0);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .event-tags-display {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .event-tag-badge {
          background-color: #e3f2fd;
          color: #1976d2;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid #bbdefb;
        }

        @media (max-width: 768px) {
          .event-meta-highlights {
            flex-direction: column;
            gap: 0.5rem;
          }

          .sticky-card {
            position: static;
          }

          .account-requirement-banner {
            flex-direction: column;
            text-align: center;
          }

          .banner-actions {
            flex-direction: column;
            width: 100%;
          }

          .banner-actions .btn {
            width: 100%;
          }
        }
      `}</style>
      
      {/* JavaScript for accordion functionality */}
      <script>
        {`
          document.addEventListener('DOMContentLoaded', function() {
            const accordionToggles = document.querySelectorAll('.accordion-toggle');
            
            accordionToggles.forEach(toggle => {
              toggle.addEventListener('click', function() {
                const accordionItem = this.parentElement;
                accordionItem.classList.toggle('active');
              });
            });
          });
        `}
      </script>
    </>
  );
};

// Helper function to get background image based on sport type
function getSportBackground(sportType) {
  // Always return the placeholder image
  return assetUrls['placeholder.png'];
}

export default EventDetail;
