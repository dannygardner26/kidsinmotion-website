import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { assetUrls } from '../utils/firebaseAssets';
import { formatAgeRange, formatEventDateTime } from '../utils/eventFormatters';
import firebaseRealtimeService from '../services/firebaseRealtimeService';

const EventDetail = () => {
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();
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

  const handleShareEvent = async () => {
    if (!event) return;

    const shareData = {
      title: `${event.name} - Kids in Motion`,
      text: `Check out this event: ${event.name}`,
      url: window.location.href
    };

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled sharing or error occurred
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackShare(shareData);
        }
      }
    } else {
      // Fallback to copying URL to clipboard
      fallbackShare(shareData);
    }
  };

  const fallbackShare = (shareData) => {
    // Copy URL to clipboard
    navigator.clipboard.writeText(shareData.url).then(() => {
      // Show temporary notification
      const notification = document.createElement('div');
      notification.innerHTML = `
        <i class="fas fa-check-circle" style="color: green; margin-right: 8px;"></i>
        Event link copied to clipboard!
      `;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #2f506a;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
      `;
      document.body.appendChild(notification);

      // Remove notification after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }).catch(() => {
      // If clipboard API fails, show the URL in an alert
      alert(`Copy this link to share the event:\n${shareData.url}`);
    });
  };

  
  // Format date for display - using fixed timezone utility
  const formatDate = (dateString, startTime, endTime) => {
    if (!dateString) return 'TBD';
    return formatEventDateTime(dateString, startTime, endTime);
  };
  
  // Format duration
  const formatDuration = (date, startTime, endTime) => {
    if (!date || !startTime || !endTime) return 'TBD';

    try {
      // Parse start and end times for the given date
      const startDateTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(`${date}T${endTime}:00`);

      const diffMs = endDateTime - startDateTime;
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 1) {
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
      } else {
        const hours = Math.floor(diffHours);
        const minutes = Math.round((diffHours - hours) * 60);
        if (minutes === 0) {
          return `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
          return `${hours}h ${minutes}m`;
        }
      }
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 'TBD';
    }
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
  
  const isPastEvent = new Date(event.date + 'T00:00:00') < new Date();
  const sportBackground = getSportBackground(event.ageGroup);
  
  return (
    <div className="event-detail-container">
      {/* Top Navigation Bar */}
      <div className="event-nav-bar">
        <div className="container">
          <div className="nav-content">
            <Link to="/events" className="back-btn">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Events</span>
            </Link>
            <div className="nav-actions">
              <button className="share-btn" onClick={handleShareEvent}>
                <i className="fas fa-share-alt"></i>
                Share Event
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Main Event Content - No Scroll Layout */}
        <div className="event-layout">
          {/* Left Column: Event Info */}
          <div className="event-info-column">
            {/* Event Header */}
            <div className="event-header">
              <div className="event-badge">{formatAgeRange(event)}</div>
              <h1 className="event-title">{event.name}</h1>
              <div className="event-quick-meta">
                <div className="meta-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span>{formatDate(event.date, event.startTime, event.endTime)}</span>
                </div>
                <div className="meta-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{event.location || 'TBD'}</span>
                </div>
                {event.price && event.price > 0 && (
                  <div className="meta-item">
                    <i className="fas fa-dollar-sign"></i>
                    <span>${event.price}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Event Description */}
            <div className="event-description-box">
              <h3>About This Event</h3>
              <p>{event.description}</p>
            </div>

            {/* Event Details Grid */}
            <div className="details-grid">
              <div className="detail-card">
                <div className="detail-header">
                  <i className="fas fa-info-circle"></i>
                  <h4>Event Details</h4>
                </div>
                <div className="detail-list">
                  <div className="detail-item">
                    <span className="label">Age Range:</span>
                    <span className="value">{formatAgeRange(event)}</span>
                  </div>
                  {event.capacity && (
                    <div className="detail-item">
                      <span className="label">Capacity:</span>
                      <span className="value">{event.capacity}</span>
                    </div>
                  )}
                  {event.tags && event.tags.trim() && (
                    <div className="detail-item">
                      <span className="label">Tags:</span>
                      <div className="event-tags-display">
                        {event.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                          <span key={tag} className="event-tag-badge">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-header">
                  <i className="fas fa-backpack"></i>
                  <h4>What to Bring</h4>
                </div>
                <div className="bring-list">
                  <div className="bring-item">
                    <i className="fas fa-tint"></i>
                    <span>Water bottle</span>
                  </div>
                  <div className="bring-item">
                    <i className="fas fa-tshirt"></i>
                    <span>Athletic clothes</span>
                  </div>
                  <div className="bring-item">
                    <i className="fas fa-shoe-prints"></i>
                    <span>Athletic footwear</span>
                  </div>
                  <div className="bring-item">
                    <i className="fas fa-smile"></i>
                    <span>Positive attitude!</span>
                  </div>
                  <div className="equipment-notice">
                    <i className="fas fa-info-circle"></i>
                    <span><strong>Equipment:</strong> Bring whatever equipment you have. Contact us at <a href="mailto:info@kidsinmotionpa.org">info@kidsinmotionpa.org</a> or <a href="tel:+14848856284">(484) 885-6284</a> if you need something.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="event-actions-column">
            {/* Account Required Banner */}
            {!currentUser && !isPastEvent && (
              <div className="account-banner">
                <div className="banner-icon">
                  <i className="fas fa-user-lock"></i>
                </div>
                <div className="banner-text">
                  <h4>Account Required</h4>
                  <p>Please log in or create an account to register</p>
                </div>
              </div>
            )}

            {/* Registration Card */}
            <div className="action-card registration-card">
              <div className="card-header">
                <h3>
                  <i className="fas fa-user-plus"></i>
                  Registration
                </h3>
              </div>
              <div className="card-content">
                {isPastEvent ? (
                  <div className="status-message">
                    <div className="status-icon past">
                      <i className="fas fa-history"></i>
                    </div>
                    <p>This event has ended</p>
                    <Link to="/events" className="btn-secondary">View Upcoming Events</Link>
                  </div>
                ) : (
                  <>
                    <div className="capacity-display">
                      <div className="capacity-number">{event.capacity || '∞'}</div>
                      <div className="capacity-label">Available Spots</div>
                    </div>

                    {currentUser ? (
                      <div className="action-buttons">
                        {userProfile?.userType === 'VOLUNTEER' ? (
                          <Link
                            to={`/events/${event.id}/volunteer`}
                            className="btn-primary register-pulse"
                          >
                            <i className="fas fa-hands-helping"></i>
                            Sign Up to Volunteer
                          </Link>
                        ) : (
                          <Link
                            to={`/events/${event.id}/register`}
                            className="btn-primary register-pulse"
                          >
                            <i className="fas fa-plus-circle"></i>
                            Register Your Child
                          </Link>
                        )}
                        <Link
                          to={`/events/${event.id}/parent-view`}
                          className="btn-outline"
                        >
                          <i className="fas fa-dashboard"></i>
                          Event Dashboard
                        </Link>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <Link
                          to={`/login?redirect=/events/${event.id}/register`}
                          className="btn-primary"
                        >
                          <i className="fas fa-sign-in-alt"></i>
                          Login to Register
                        </Link>
                        <Link
                          to="/register"
                          className="btn-outline"
                        >
                          <i className="fas fa-user-plus"></i>
                          Create Account
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Volunteer Card */}
            {!isPastEvent && (
              <div className="action-card volunteer-card">
                <div className="card-header volunteer-header">
                  <h3>
                    <i className="fas fa-hands-helping"></i>
                    Volunteer
                  </h3>
                </div>
                <div className="card-content">
                  <p className="volunteer-text">Help make this event amazing!</p>
                  {currentUser ? (
                    <Link
                      to={`/events/${event.id}/volunteer`}
                      className="btn-secondary"
                    >
                      <i className="fas fa-heart"></i>
                      Sign Up to Volunteer
                    </Link>
                  ) : (
                    <Link
                      to={`/login?redirect=/events/${event.id}/volunteer`}
                      className="btn-secondary volunteer-login-btn"
                    >
                      <i className="fas fa-sign-in-alt"></i>
                      <span>Login to Volunteer</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Quick Info Card */}
            <div className="action-card info-card">
              <div className="card-header">
                <h3>
                  <i className="fas fa-info-circle"></i>
                  Quick Info
                </h3>
              </div>
              <div className="card-content">
                <div className="quick-info-grid">
                  <div className="quick-info-item">
                    <div className="info-icon">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div className="info-text">
                      <span className="info-label">Duration</span>
                      <span className="info-value">{formatDuration(event.date, event.startTime, event.endTime)}</span>
                    </div>
                  </div>
                  <div className="quick-info-item">
                    <div className="info-icon">
                      <i className="fas fa-users"></i>
                    </div>
                    <div className="info-text">
                      <span className="info-label">Ages</span>
                      <span className="info-value">{formatAgeRange(event)}</span>
                    </div>
                  </div>
                  <div className="quick-info-item">
                    <div className="info-icon">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div className="info-text">
                      <span className="info-label">Contact</span>
                      <span className="info-value">(484) 885-6284</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Custom CSS for no-scroll layout */}
      <style>{`
        .event-detail-container {
          min-height: calc(100vh - 200px);
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          margin-bottom: 6rem;
          padding-bottom: 2rem;
        }

        .event-nav-bar {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 1rem 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          background: rgba(47, 80, 106, 0.1);
          color: var(--primary);
          text-decoration: none;
        }

        .share-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--secondary);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .share-btn:hover {
          background: rgba(230, 79, 80, 0.9);
        }

        .event-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          padding: 2rem 0;
          min-height: 70vh;
          position: relative;
        }

        .event-info-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding-right: 1rem;
        }

        .event-actions-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .event-header {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .event-badge {
          display: inline-block;
          background: var(--secondary);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .event-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary);
          margin: 0 0 1.5rem 0;
          line-height: 1.2;
        }

        .event-quick-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(47, 80, 106, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          color: var(--primary);
          font-weight: 500;
        }

        .meta-item i {
          font-size: 1.1rem;
        }

        .event-description-box {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .event-description-box h3 {
          color: var(--primary);
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .event-description-box p {
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .detail-card {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .detail-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .detail-header i {
          color: var(--primary);
          font-size: 1.2rem;
        }

        .detail-header h4 {
          color: var(--primary);
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-item .label {
          color: #64748b;
          font-weight: 500;
        }

        .detail-item .value {
          color: var(--primary);
          font-weight: 600;
        }

        .bring-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .bring-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #64748b;
        }

        .bring-item i {
          color: var(--primary);
          font-size: 1.1rem;
          width: 20px;
          text-align: center;
        }

        .equipment-notice {
          margin-top: 1rem;
          padding: 1rem;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .equipment-notice i {
          color: #856404;
          font-size: 1.1rem;
          width: 20px;
          text-align: center;
          margin-top: 0.1rem;
        }

        .equipment-notice span {
          color: #856404;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .equipment-notice a {
          color: #6c5d03;
          text-decoration: underline;
        }

        .equipment-notice a:hover {
          color: #5a4f02;
        }

        .volunteer-login-btn i {
          margin-right: 0.75rem;
        }

        .account-banner {
          background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .banner-icon {
          font-size: 2rem;
          color: #92400e;
        }

        .banner-text h4 {
          margin: 0 0 0.25rem 0;
          color: #92400e;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .banner-text p {
          margin: 0;
          color: #92400e;
          font-size: 0.875rem;
        }

        .action-card {
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          background: var(--primary);
          color: white;
          padding: 1.25rem;
        }

        .card-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .volunteer-header {
          background: var(--secondary);
        }

        .card-content {
          padding: 1.5rem;
        }

        .capacity-display {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .capacity-number {
          font-size: 3rem;
          font-weight: 700;
          color: var(--primary);
          line-height: 1;
        }

        .capacity-label {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .btn-primary, .btn-secondary, .btn-outline {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          text-decoration: none;
          border: 2px solid transparent;
          transition: all 0.2s ease;
          text-align: center;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-primary:hover {
          background: rgba(47, 80, 106, 0.9);
          color: white;
          text-decoration: none;
        }

        .btn-secondary {
          background: var(--secondary);
          color: white;
        }

        .btn-secondary:hover {
          background: rgba(230, 79, 80, 0.9);
          color: white;
          text-decoration: none;
        }

        .btn-outline {
          background: transparent;
          color: var(--primary);
          border-color: var(--primary);
        }

        .btn-outline:hover {
          background: var(--primary);
          color: white;
          text-decoration: none;
        }

        .register-pulse {
          animation: pulse-glow 2s infinite;
        }

        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(47, 80, 106, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(47, 80, 106, 0); }
          100% { box-shadow: 0 0 0 0 rgba(47, 80, 106, 0); }
        }

        .status-message {
          text-align: center;
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
          background: #f1f5f9;
          color: #64748b;
        }

        .volunteer-text {
          text-align: center;
          color: #64748b;
          margin: 0 0 1rem 0;
          font-style: italic;
        }

        .quick-info-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .quick-info-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .info-icon {
          width: 40px;
          height: 40px;
          background: rgba(47, 80, 106, 0.1);
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .info-text {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          color: var(--primary);
          font-weight: 600;
        }

        .event-tags-display {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .event-tag-badge {
          background: #e3f2fd;
          color: #1976d2;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid #bbdefb;
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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Mobile responsiveness */
        @media (max-width: 1024px) {
          .event-layout {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .event-info-column {
            padding-right: 0;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .nav-content {
            flex-direction: column;
            gap: 1rem;
          }

          .event-title {
            font-size: 1.875rem;
          }

          .event-quick-meta {
            flex-direction: column;
          }

          .account-banner {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to get background image based on sport type
function getSportBackground(sportType) {
  // Always return the placeholder image
  return assetUrls['placeholder.png'];
}

export default EventDetail;
