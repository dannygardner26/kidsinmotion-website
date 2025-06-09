import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
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
      setEvent(data.event);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      <Layout>
        <div className="container mt-4">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>Loading event details...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || !event) {
    return (
      <Layout>
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
      </Layout>
    );
  }
  
  const isPastEvent = new Date(event.endDate) < new Date();
  const sportBackground = getSportBackground(event.sportType);
  
  return (
    <Layout>
      {/* Event hero section */}
      <section className="hero" style={{ minHeight: '40vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-bg" style={{ backgroundImage: `url("${sportBackground}")` }}></div>
        
        <div className="container hero-content">
          <span className="event-badge">{event.eventType}</span>
          <h1>{event.title}</h1>
          <div className="event-meta-highlights">
            <div className="event-meta-item">
              <i className="far fa-calendar"></i>
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="event-meta-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>{event.location}</span>
            </div>
            <div className="event-meta-item">
              <i className="fas fa-running"></i>
              <span>{event.sportType}</span>
            </div>
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
                    <p><i className="far fa-calendar"></i> <strong>Date:</strong> {formatDate(event.startDate)}</p>
                    <p><i className="far fa-clock"></i> <strong>Duration:</strong> {formatDuration(event.startDate, event.endDate)}</p>
                    <p><i className="fas fa-map-marker-alt"></i> <strong>Location:</strong> {event.location}</p>
                    <p><i className="fas fa-running"></i> <strong>Sport:</strong> {event.sportType}</p>
                    <p><i className="fas fa-tag"></i> <strong>Event Type:</strong> {event.eventType}</p>
                  </div>
                  
                  <h3>What to Bring</h3>
                  <ul className="what-to-bring-list">
                    <li><i className="fas fa-tint"></i> Water bottle</li>
                    <li><i className="fas fa-tshirt"></i> Comfortable athletic clothes</li>
                    <li><i className="fas fa-shoe-prints"></i> Appropriate footwear for {event.sportType.toLowerCase()}</li>
                    {event.sportType === 'BASEBALL' && (
                      <li><i className="fas fa-baseball-ball"></i> Baseball glove (if you have one, we'll provide if needed)</li>
                    )}
                    {event.sportType === 'SOCCER' && (
                      <li><i className="fas fa-shield-alt"></i> Shin guards (if you have them, we'll provide if needed)</li>
                    )}
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
                        <div className="spots-label">Available Spots</div>
                        <div className="spots-count">{event.availableSpots || 0}</div>
                        <div className="spots-progress">
                          <div 
                            className="spots-progress-bar" 
                            style={{ 
                              width: `${Math.max(0, Math.min(100, 100 * (event.availableSpots / event.maxParticipants)))}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      {event.availableSpots > 0 ? (
                        isLoggedIn ? (
                          <Link 
                            to={`/events/${event.id}/register`} 
                            className="btn btn-primary btn-block mt-3 register-btn"
                          >
                            Register Your Child
                          </Link>
                        ) : (
                          <div className="login-prompt">
                            <p>Please login to register your child for this event.</p>
                            <Link 
                              to={`/login?redirect=/events/${event.id}`} 
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
                        <div className="full-event">
                          <div className="status-icon full">
                            <i className="fas fa-users-slash"></i>
                          </div>
                          <p className="text-danger text-center">This event is currently full.</p>
                          <button className="btn btn-outline btn-block mt-2">Join Waitlist</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {event.needsVolunteers && !isPastEvent && (
                <div className="card mt-4 slide-in-right" style={{ animationDelay: '0.2s' }}>
                  <div className="card-header volunteers-header">
                    <h3>Volunteer</h3>
                  </div>
                  <div className="card-body">
                    <div className="spots-indicator">
                      <div className="spots-label">Volunteers Needed</div>
                      <div className="spots-count">{event.volunteersNeeded || 0}</div>
                    </div>
                    
                    {event.volunteersNeeded > 0 ? (
                      isLoggedIn ? (
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
                            to={`/login?redirect=/events/${event.id}`} 
                            className="btn btn-secondary btn-block mt-2"
                          >
                            Login to Volunteer
                          </Link>
                        </div>
                      )
                    ) : (
                      <div className="text-center">
                        <div className="status-icon full">
                          <i className="fas fa-check-circle"></i>
                        </div>
                        <p>We have all the volunteers we need for this event!</p>
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
      <style jsx>{`
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
        
        @media (max-width: 768px) {
          .event-meta-highlights {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .sticky-card {
            position: static;
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
    </Layout>
  );
};

// Helper function to get background image based on sport type
function getSportBackground(sportType) {
  // Always return the placeholder image
  return '/assets/placeholder.png';
}

export default EventDetail;
