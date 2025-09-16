import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [volunteerEvents, setVolunteerEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('registrations');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelItemId, setCancelItemId] = useState(null);
  const [cancelItemType, setCancelItemType] = useState(null);
  
  useEffect(() => {
    // Redirect if not logged in
    if (!authLoading && !currentUser) {
      navigate('/login');
      return;
    }
    
    // Fetch user data and registrations when user is available
    if (currentUser && userProfile) {
      fetchUserData();
    }
  }, [currentUser, userProfile, authLoading, navigate]);
  
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch child registrations
      const registrationsData = await apiService.getMyRegistrations();
      setRegisteredEvents(registrationsData);
      
      // Fetch volunteer sign-ups
      const volunteersData = await apiService.getMyVolunteerSignups();
      setVolunteerEvents(volunteersData);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openCancelModal = (id, type) => {
    setCancelItemId(id);
    setCancelItemType(type);
    setShowConfirmModal(true);
  };
  
  const closeCancelModal = () => {
    setShowConfirmModal(false);
    setCancelItemId(null);
    setCancelItemType(null);
  };
  
  const handleCancelRegistration = async () => {
    if (!cancelItemId || cancelItemType !== 'registration') return;
    
    try {
      await apiService.cancelRegistration(cancelItemId);
      
      // Update registrations list
      setRegisteredEvents(registeredEvents.filter(reg => reg.id !== cancelItemId));
      closeCancelModal();
      
    } catch (error) {
      console.error('Error canceling registration:', error);
      alert('Failed to cancel registration. Please try again.');
    }
  };
  
  const handleCancelVolunteer = async () => {
    if (!cancelItemId || cancelItemType !== 'volunteer') return;
    
    try {
      await apiService.cancelVolunteerSignup(cancelItemId);
      
      // Update volunteer list
      setVolunteerEvents(volunteerEvents.filter(vol => vol.id !== cancelItemId));
      closeCancelModal();
      
    } catch (error) {
      console.error('Error canceling volunteer sign-up:', error);
      alert('Failed to cancel volunteer sign-up. Please try again.');
    }
  };
  
  const handleConfirmCancel = () => {
    if (cancelItemType === 'registration') {
      handleCancelRegistration();
    } else if (cancelItemType === 'volunteer') {
      handleCancelVolunteer();
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="card error-card">
            <div className="card-body text-center">
              <div className="error-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2>Error</h2>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <section className="hero" style={{ minHeight: '30vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-bg" style={{ backgroundImage: 'url("/assets/placeholder.png")' }}></div>
        
        <div className="container hero-content">
          <h1>Welcome, {userProfile?.firstName || currentUser?.displayName || 'User'}!</h1>
          <p>Manage your events, registrations, and volunteer activities.</p>
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
      
      <div className="container mt-4">
        <div className="row">
          <div className="col-third">
            <div className="card profile-card mb-4 fade-in">
              <div className="card-header">
                <h3>Your Profile</h3>
              </div>
              <div className="card-body">
                <div className="profile-avatar">
                  {userProfile?.firstName?.charAt(0) || currentUser?.displayName?.charAt(0) || 'U'}{userProfile?.lastName?.charAt(0) || ''}
                </div>
                <div className="profile-info">
                  <p><strong>Name:</strong> {userProfile?.firstName || ''} {userProfile?.lastName || currentUser?.displayName || ''}</p>
                  <p><strong>Email:</strong> {userProfile?.email || currentUser?.email}</p>
                  <p><strong>Phone:</strong> {userProfile?.phoneNumber || 'Not provided'}</p>
                </div>
                <Link to="/profile/edit" className="btn btn-outline btn-block mt-3">
                  <i className="fas fa-user-edit mr-2"></i> Edit Profile
                </Link>
              </div>
            </div>
            
            <div className="card mb-4 fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="card-header">
                <h3>Quick Links</h3>
              </div>
              <div className="card-body">
                <div className="quick-links">
                  <Link to="/events" className="quick-link-item">
                    <div className="quick-link-icon">
                      <i className="fas fa-calendar-alt"></i>
                    </div>
                    <div className="quick-link-text">Browse Events</div>
                  </Link>
                  
                  <Link to="/volunteer" className="quick-link-item">
                    <div className="quick-link-icon" style={{ backgroundColor: 'var(--secondary)' }}>
                      <i className="fas fa-hands-helping"></i>
                    </div>
                    <div className="quick-link-text">Volunteer</div>
                  </Link>
                  
                  <Link to="/donate" className="quick-link-item">
                    <div className="quick-link-icon" style={{ backgroundColor: '#28a745' }}><i className="fas fa-donate"></i>
                    </div>
                    <div className="quick-link-text">Donate</div>
                  </Link>
                  
                  <Link to="/contact" className="quick-link-item">
                    <div className="quick-link-icon" style={{ backgroundColor: '#6c757d' }}>
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div className="quick-link-text">Contact Us</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-two-thirds">
            <div className="card activities-card fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="card-header tab-header">
                <ul className="nav-tabs">
                  <li 
                    className={`nav-tab ${activeTab === 'registrations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('registrations')}
                  >
                    <i className="fas fa-child mr-2"></i>
                    Your Child's Events
                  </li>
                  <li 
                    className={`nav-tab ${activeTab === 'volunteer' ? 'active' : ''}`}
                    onClick={() => setActiveTab('volunteer')}
                  >
                    <i className="fas fa-hands-helping mr-2"></i>
                    Your Volunteer Activities
                  </li>
                </ul>
              </div>
              <div className="card-body">
                {activeTab === 'registrations' && (
                  <div className="tab-content fade-in">
                    <h2>Your Child's Registered Events</h2>
                    
                    {registeredEvents.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-calendar-times"></i>
                        </div>
                        <p>You haven't registered your child for any events yet.</p>
                        <Link to="/events" className="btn btn-primary mt-3">Browse Events</Link>
                      </div>
                    ) : (
                      <div className="events-grid">
                        {registeredEvents.map(registration => {
                          const isPast = new Date(registration.event?.endDate) < new Date();
                          return (
                            <div className="event-card-container" key={registration.id}>
                              <div className={`event-card ${isPast ? 'past-event' : ''}`}>
                                <div className="event-date">
                                  <div className="date-month">
                                    {formatMonth(registration.event?.startDate)}
                                  </div>
                                  <div className="date-day">
                                    {formatDay(registration.event?.startDate)}
                                  </div>
                                </div>
                                <div className="event-details">
                                  <h4 className="event-title">{registration.event?.title || 'Unknown Event'}</h4>
                                  <div className="participant-name">
                                    {registration.childFirstName} {registration.childLastName}
                                  </div>
                                  <div className="event-location">
                                    <i className="fas fa-map-marker-alt mr-1"></i> {registration.event?.location}
                                  </div>
                                  <div className="event-status">
                                    {isPast ? (
                                      <span className="status-badge completed">Completed</span>
                                    ) : (
                                      <span className="status-badge upcoming">Upcoming</span>
                                    )}
                                  </div>
                                </div>
                                <div className="event-actions">
                                  <Link 
                                    to={`/events/${registration.eventId}`} 
                                    className="action-btn view-btn"
                                    title="View Event Details"
                                  >
                                    <i className="fas fa-eye"></i>
                                  </Link>
                                  
                                  {!isPast && (
                                    <button
                                      onClick={() => openCancelModal(registration.id, 'registration')}
                                      className="action-btn cancel-btn"
                                      title="Cancel Registration"
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'volunteer' && (
                  <div className="tab-content fade-in">
                    <h2>Your Volunteer Activities</h2>
                    
                    {volunteerEvents.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-hands"></i>
                        </div>
                        <p>You haven't signed up to volunteer for any events yet.</p>
                        <Link to="/volunteer" className="btn btn-secondary mt-3">Browse Volunteer Opportunities</Link>
                      </div>
                    ) : (
                      <div className="events-grid">
                        {volunteerEvents.map(volunteer => {
                          const isPast = new Date(volunteer.event?.endDate) < new Date();
                          return (
                            <div className="event-card-container" key={volunteer.id}>
                              <div className={`event-card volunteer-card ${isPast ? 'past-event' : ''}`}>
                                <div className="event-date">
                                  <div className="date-month">
                                    {formatMonth(volunteer.event?.startDate)}
                                  </div>
                                  <div className="date-day">
                                    {formatDay(volunteer.event?.startDate)}
                                  </div>
                                </div>
                                <div className="event-details">
                                  <h4 className="event-title">{volunteer.event?.title || 'Unknown Event'}</h4>
                                  <div className="volunteer-role">
                                    Volunteer Role: {volunteer.role || 'General Volunteer'}
                                  </div>
                                  <div className="event-location">
                                    <i className="fas fa-map-marker-alt mr-1"></i> {volunteer.event?.location}
                                  </div>
                                  <div className="event-status">
                                    {isPast ? (
                                      <span className="status-badge completed">Completed</span>
                                    ) : (
                                      <span className="status-badge status-${volunteer.status.toLowerCase()}">{volunteer.status}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="event-actions">
                                  <Link 
                                    to={`/events/${volunteer.eventId}`} 
                                    className="action-btn view-btn"
                                    title="View Event Details"
                                  >
                                    <i className="fas fa-eye"></i>
                                  </Link>
                                  
                                  {!isPast && volunteer.status !== 'CANCELED' && (
                                    <button
                                      onClick={() => openCancelModal(volunteer.id, 'volunteer')}
                                      className="action-btn cancel-btn"
                                      title="Cancel Volunteer Signup"
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Confirm Cancellation</h3>
              <button className="modal-close" onClick={closeCancelModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel this {cancelItemType === 'registration' ? 'registration' : 'volunteer signup'}?</p>
              <p className="text-danger"><strong>Note:</strong> This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeCancelModal}>
                No, Keep It
              </button>
              <button className="btn btn-danger" onClick={handleConfirmCancel}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom CSS for this page */}
      <style>{`
        .profile-card {
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
        }
        
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 600;
          margin: 0 auto 1.5rem;
        }
        
        .profile-info {
          text-align: center;
        }
        
        .profile-info p {
          margin-bottom: 0.5rem;
        }
        
        .quick-links {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        
        .quick-link-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          text-decoration: none;
          color: var(--text);
        }
        
        .quick-link-item:hover {
          background-color: #f8f8f8;
          transform: translateY(-5px);
        }
        
        .quick-link-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          margin-bottom: 0.8rem;
          transition: transform 0.3s ease;
        }
        
        .quick-link-item:hover .quick-link-icon {
          transform: scale(1.1);
        }
        
        .quick-link-text {
          font-weight: 600;
          text-align: center;
        }
        
        .activities-card {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .tab-header {
          padding: 0;
        }
        
        .nav-tabs {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          border-bottom: 1px solid #eee;
        }
        
        .nav-tab {
          padding: 1rem 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          border-bottom: 3px solid transparent;
        }
        
        .nav-tab.active {
          background-color: white;
          border-bottom-color: var(--primary);
          color: var(--primary);
          font-weight: 600;
        }
        
        .nav-tab:hover:not(.active) {
          background-color: #f8f8f8;
        }
        
        .tab-content {
          padding: 1.5rem;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .empty-icon {
          font-size: 3rem;
          color: #ddd;
          margin-bottom: 1.5rem;
        }
        
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        
        .event-card {
          display: flex;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          background-color: white;
          height: 100%;
        }
        
        .event-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }
        
        .event-card.past-event {
          opacity: 0.7;
        }
        
        .event-date {
          width: 70px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: var(--primary);
          color: white;
          padding: 1rem 0;
        }
        
        .volunteer-card .event-date {
          background-color: var(--secondary);
        }
        
        .date-month {
          font-size: 0.8rem;
          text-transform: uppercase;
          font-weight: 600;
        }
        
        .date-day {
          font-size: 1.8rem;
          font-weight: 700;
        }
        
        .event-details {
          flex: 1;
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }
        
        .event-title {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        
        .participant-name, .volunteer-role {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .event-location {
          font-size: 0.85rem;
          color: var(--text-light);
          margin-bottom: 0.5rem;
        }
        
        .event-status {
          margin-top: auto;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-badge.upcoming {
          background-color: #e6f7ff;
          color: #0c6eb9;
        }
        
        .status-badge.completed {
          background-color: #f0f0f0;
          color: #999;
        }
        
        .status-badge.confirmed {
          background-color: #e6fffa;
          color: #0a866c;
        }
        
        .status-badge.pending {
          background-color: #fff7e6;
          color: #b97800;
        }
        
        .event-actions {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          padding: 0.5rem;
          background-color: #f8f8f8;
        }
        
        .action-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          color: white;
        }
        
        .view-btn {
          background-color: var(--primary);
        }
        
        .cancel-btn {
          background-color: var(--secondary);
        }
        
        .action-btn:hover {
          transform: scale(1.1);
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }
        
        .modal-container {
          width: 90%;
          max-width: 500px;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: #f8f8f8;
          border-bottom: 1px solid #eee;
        }
        
        .modal-header h3 {
          margin: 0;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: var(--text-light);
          transition: color 0.3s ease;
        }
        
        .modal-close:hover {
          color: var(--secondary);
        }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1rem;
          background-color: #f8f8f8;
          border-top: 1px solid #eee;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
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
        
        .error-card {
          text-align: center;
        }
        
        .error-icon {
          font-size: 3rem;
          color: var(--secondary);
          margin-bottom: 1rem;
        }
        
        .mr-1 {
          margin-right: 0.25rem;
        }
        
        .mr-2 {
          margin-right: 0.5rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @media (max-width: 992px) {
          .events-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
        }
        
        @media (max-width: 768px) {
          .nav-tabs {
            flex-direction: column;
          }
          
          .nav-tab {
            padding: 0.8rem 1rem;
            border-bottom: none;
            border-left: 3px solid transparent;
          }
          
          .nav-tab.active {
            border-bottom: none;
            border-left-color: var(--primary);
          }
          
          .events-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
};

// Helper functions for formatting dates
function formatMonth(dateString) {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'short' });
}

function formatDay(dateString) {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  return date.getDate();
}

export default Dashboard;
