import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { assetUrls } from '../utils/firebaseAssets';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [volunteerEvents, setVolunteerEvents] = useState([]);
  const [volunteerApplicationStatus, setVolunteerApplicationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null); // Will be set based on user type

  // Admin-specific state
  const [volunteerApplications, setVolunteerApplications] = useState([]);
  const [allChildEvents, setAllChildEvents] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // Determine user type based on email or role
  const isVolunteer = () => {
    if (!userProfile) return false;

    // Check if user has volunteer role or email suggests volunteer account
    const email = userProfile.email || currentUser?.email || '';

    return email.toLowerCase().includes('volunteer') ||
           userProfile.roles?.includes('ROLE_VOLUNTEER') ||
           userProfile.accountType === 'volunteer';
  };

  // Determine if user is Kids in Motion admin
  const isAdmin = () => {
    if (!userProfile) return false;

    const email = userProfile.email || currentUser?.email || '';

    // Admin detection: kidsinmotion emails or specific admin roles
    return email.toLowerCase().includes('kidsinmotion') ||
           userProfile.roles?.includes('ROLE_ADMIN') ||
           userProfile.accountType === 'admin';
  };

  // Format team names properly (remove dashes, capitalize)
  const formatTeamName = (teamSlug) => {
    if (!teamSlug) return '';
    return teamSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelItemId, setCancelItemId] = useState(null);
  const [cancelItemType, setCancelItemType] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  
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
      const userIsVolunteer = isVolunteer();
      const userIsAdmin = isAdmin();

      if (userIsAdmin) {
        // For admins: fetch volunteer applications and all child events
        await fetchAdminData();

        // Set default tab for admins
        if (!activeTab) setActiveTab('applications');
      } else if (userIsVolunteer) {
        // For volunteers: fetch volunteer activities and application status
        try {
          const volunteersData = await apiService.getMyVolunteerSignups();
          setVolunteerEvents(volunteersData);
        } catch (error) {
          console.log('No volunteer activities found:', error.message);
          setVolunteerEvents([]);
        }

        // Check for volunteer application status (from localStorage for now)
        // This would ideally come from your backend API
        const savedApplication = localStorage.getItem(`volunteer_draft_${currentUser.uid}`);
        if (savedApplication) {
          const appData = JSON.parse(savedApplication);
          // If application has been submitted (has selectedCategories), show as submitted
          const hasCompletedApplication = appData.selectedCategories && appData.selectedCategories.length > 0;
          setVolunteerApplicationStatus({
            status: hasCompletedApplication ? 'submitted' : 'draft',
            submittedAt: appData.submittedAt || appData.lastSaved,
            teams: (appData.selectedCategories || []).map(team => formatTeamName(team))
          });
        }

        // Set default tab for volunteers based on their status
        if (!activeTab) {
          // If no application or draft application, show application tab first
          if (!savedApplication) {
            setActiveTab('application');
          } else {
            const appData = JSON.parse(savedApplication);
            if (appData.status === 'draft' && (!appData.selectedCategories || appData.selectedCategories.length === 0)) {
              setActiveTab('application');
            } else {
              setActiveTab('volunteer');
            }
          }
        }
      } else {
        // For parents: fetch child registrations
        try {
          const registrationsData = await apiService.getMyRegistrations();
          setRegisteredEvents(registrationsData);
        } catch (error) {
          console.log('No registrations found:', error.message);
          setRegisteredEvents([]);
        }

        // Set default tab for parents
        if (!activeTab) setActiveTab('registrations');
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      // Fetch volunteer applications from localStorage (would be API in production)
      const applications = await loadAllVolunteerApplications();
      setVolunteerApplications(applications);

      // Fetch all child events/registrations
      try {
        const allRegistrations = await apiService.getMyRegistrations(); // This would be getAllRegistrations for admin
        setAllChildEvents(allRegistrations);
      } catch (error) {
        console.log('No child events found:', error.message);
        setAllChildEvents([]);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const loadAllVolunteerApplications = async () => {
    // In a real app, this would be an API call to get all applications
    // For now, we'll simulate by checking localStorage for saved applications
    const applications = [];

    // This is a simplified version - in production you'd have an admin API endpoint
    // For now, we'll create some mock data based on localStorage patterns
    try {
      // Check if there are any volunteer applications in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('volunteer_draft_')) {
          const appData = JSON.parse(localStorage.getItem(key));
          if (appData && appData.selectedCategories && appData.selectedCategories.length > 0) {
            applications.push({
              id: key.replace('volunteer_draft_', ''),
              ...appData,
              status: 'submitted', // Mark as submitted if they have selected categories
              applicantName: `${appData.firstName || 'Unknown'} ${appData.lastName || 'Applicant'}`,
              submittedAt: appData.submittedAt || appData.lastSaved || new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading volunteer applications:', error);
    }

    return applications;
  };

  const approveApplication = async (applicationId) => {
    // Update application status in localStorage (would be API call in production)
    const key = `volunteer_draft_${applicationId}`;
    const appData = JSON.parse(localStorage.getItem(key) || '{}');
    appData.status = 'approved';
    appData.approvedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(appData));

    // Update state
    setVolunteerApplications(prev =>
      prev.map(app =>
        app.id === applicationId
          ? { ...app, status: 'approved', approvedAt: new Date().toISOString() }
          : app
      )
    );
    setShowApplicationModal(false);
  };

  const rejectApplication = async (applicationId, reason = '') => {
    // Update application status in localStorage (would be API call in production)
    const key = `volunteer_draft_${applicationId}`;
    const appData = JSON.parse(localStorage.getItem(key) || '{}');
    appData.status = 'rejected';
    appData.rejectedAt = new Date().toISOString();
    appData.rejectionReason = reason;
    localStorage.setItem(key, JSON.stringify(appData));

    // Update state
    setVolunteerApplications(prev =>
      prev.map(app =>
        app.id === applicationId
          ? { ...app, status: 'rejected', rejectedAt: new Date().toISOString(), rejectionReason: reason }
          : app
      )
    );
    setShowApplicationModal(false);
  };

  const openApplicationModal = (application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const closeApplicationModal = () => {
    setSelectedApplication(null);
    setShowApplicationModal(false);
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

  const startEditingProfile = () => {
    setEditProfileData({
      firstName: userProfile?.firstName || '',
      lastName: userProfile?.lastName || '',
      phoneNumber: (userProfile?.phoneNumber && typeof userProfile.phoneNumber === 'string' && userProfile.phoneNumber.trim().toLowerCase() !== 'pending') ? userProfile.phoneNumber : ''
    });
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setIsEditingProfile(false);
    setEditProfileData({
      firstName: '',
      lastName: '',
      phoneNumber: ''
    });
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setEditProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfileChanges = async () => {
    try {
      setProfileUpdateLoading(true);
      await apiService.updateUserProfile(editProfileData);

      // Refresh user profile data
      window.location.reload(); // Simple reload to refresh all user data

    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile: ' + error.message);
    } finally {
      setProfileUpdateLoading(false);
    }
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
      <>
        <div className="container mt-4">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
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
      </>
    );
  }
  
  return (
    <>
      <section className="hero" style={{ minHeight: '30vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-bg" style={{ backgroundImage: `url("${assetUrls['placeholder.png']}")` }}></div>
        
        <div className="container hero-content">
          <h1>Welcome, {userProfile?.firstName || currentUser?.displayName?.split(' ')[0] || 'User'}!</h1>
          <p>{isAdmin()
            ? "Manage volunteer applications, review submissions, and oversee all Kids in Motion programs."
            : isVolunteer()
            ? "Manage your volunteer activities and team applications."
            : "Discover amazing sports programs and register your kids for upcoming events."
          }</p>
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
            <div className="card profile-card mb-4 ">
              <div className="card-header">
                <h3>Your Profile</h3>
              </div>
              <div className="card-body">
                <div className="profile-avatar">
                  {userProfile?.firstName?.charAt(0) || currentUser?.displayName?.charAt(0) || 'U'}{userProfile?.lastName?.charAt(0) || ''}
                </div>
                <div className="profile-info">
                  {!isEditingProfile ? (
                    <>
                      <p><strong>Name:</strong> {userProfile?.firstName || ''} {userProfile?.lastName || currentUser?.displayName || ''}</p>
                      <p><strong>Email:</strong> {userProfile?.email || currentUser?.email}</p>
                      <p><strong>Phone:</strong> {(userProfile?.phoneNumber && typeof userProfile.phoneNumber === 'string' && userProfile.phoneNumber.trim().toLowerCase() !== 'pending') ? userProfile.phoneNumber : 'Not provided'}</p>
                    </>
                  ) : (
                    <div className="edit-profile-form">
                      <div className="form-group">
                        <label><strong>First Name:</strong></label>
                        <input
                          type="text"
                          name="firstName"
                          value={editProfileData.firstName}
                          onChange={handleProfileInputChange}
                          className="form-control"
                          placeholder="First Name"
                        />
                      </div>
                      <div className="form-group">
                        <label><strong>Last Name:</strong></label>
                        <input
                          type="text"
                          name="lastName"
                          value={editProfileData.lastName}
                          onChange={handleProfileInputChange}
                          className="form-control"
                          placeholder="Last Name"
                        />
                      </div>
                      <div className="form-group">
                        <label><strong>Phone:</strong></label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={editProfileData.phoneNumber}
                          onChange={handleProfileInputChange}
                          className="form-control"
                          placeholder="Phone Number"
                        />
                      </div>
                      <p><strong>Email:</strong> {userProfile?.email || currentUser?.email} <small>(cannot be changed)</small></p>
                    </div>
                  )}
                </div>
                {!isEditingProfile ? (
                  <button onClick={startEditingProfile} className="btn btn-outline btn-block mt-3">
                    <i className="fas fa-user-edit mr-2"></i> Edit Profile
                  </button>
                ) : (
                  <div className="edit-profile-actions">
                    <button
                      onClick={saveProfileChanges}
                      className="btn btn-primary btn-block mt-3"
                      disabled={profileUpdateLoading}
                    >
                      {profileUpdateLoading ? (
                        <>
                          <div className="loading-spinner-small"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i> Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelEditingProfile}
                      className="btn btn-outline btn-block mt-2"
                      disabled={profileUpdateLoading}
                    >
                      <i className="fas fa-times mr-2"></i> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card mb-4 ">
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

                  {isVolunteer() ? (
                    <Link to="/volunteer-application" className="quick-link-item">
                      <div className="quick-link-icon" style={{ backgroundColor: 'var(--secondary)' }}>
                        <i className="fas fa-hands-helping"></i>
                      </div>
                      <div className="quick-link-text">Team Application</div>
                    </Link>
                  ) : (
                    <Link to="/about" className="quick-link-item">
                      <div className="quick-link-icon" style={{ backgroundColor: 'var(--secondary)' }}>
                        <i className="fas fa-info-circle"></i>
                      </div>
                      <div className="quick-link-text">About Programs</div>
                    </Link>
                  )}

                  <a href="https://account.venmo.com/u/ryanspiess22" target="_blank" rel="noopener noreferrer" className="quick-link-item">
                    <div className="quick-link-icon" style={{ backgroundColor: '#28a745' }}><i className="fas fa-donate"></i>
                    </div>
                    <div className="quick-link-text">Support Kids</div>
                  </a>

                  {!isVolunteer() && (
                    <Link to="/volunteer" className="quick-link-item">
                      <div className="quick-link-icon" style={{ backgroundColor: '#fbbf24' }}>
                        <i className="fas fa-heart"></i>
                      </div>
                      <div className="quick-link-text">Join Our Team</div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-two-thirds">
            <div className="card activities-card ">
              <div className="card-header tab-header">
                <ul className="nav-tabs">
                  {isAdmin() && (
                    <>
                      <li
                        className={`nav-tab ${activeTab === 'applications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('applications')}
                      >
                        <i className="fas fa-clipboard-list mr-2"></i>
                        Volunteer Applications
                      </li>
                      <li
                        className={`nav-tab ${activeTab === 'child-events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('child-events')}
                      >
                        <i className="fas fa-child mr-2"></i>
                        Child Events
                      </li>
                    </>
                  )}
                  {!isVolunteer() && !isAdmin() && (
                    <li
                      className={`nav-tab ${activeTab === 'registrations' ? 'active' : ''}`}
                      onClick={() => setActiveTab('registrations')}
                    >
                      <i className="fas fa-child mr-2"></i>
                      Your Child's Events
                    </li>
                  )}
                  {isVolunteer() && !isAdmin() && (
                    <>
                      <li
                        className={`nav-tab ${activeTab === 'volunteer' ? 'active' : ''}`}
                        onClick={() => setActiveTab('volunteer')}
                      >
                        <i className="fas fa-hands-helping mr-2"></i>
                        Your Volunteer Activities
                      </li>
                      <li
                        className={`nav-tab ${activeTab === 'application' ? 'active' : ''}`}
                        onClick={() => setActiveTab('application')}
                      >
                        <i className="fas fa-file-alt mr-2"></i>
                        Team Application Status
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <div className="card-body">
                {activeTab === 'registrations' && (
                  <div className="tab-content ">
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

                {activeTab === 'application' && isVolunteer() && (
                  <div className="tab-content ">
                    <h2>Team Application Status</h2>

                    {!volunteerApplicationStatus ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-clipboard-list"></i>
                        </div>
                        <p>You haven't submitted a team application yet.</p>
                        <p className="text-muted">Apply to join one of our volunteer teams to help make a difference!</p>
                        <Link to="/volunteer" className="btn btn-primary mt-3">
                          <i className="fas fa-plus mr-2"></i>Apply for Teams
                        </Link>
                      </div>
                    ) : (
                      <div className="application-status-card">
                        <div className={`status-header status-${volunteerApplicationStatus.status.toLowerCase()}`}>
                          <div className="status-icon">
                            <i className={`fas ${
                              volunteerApplicationStatus.status === 'submitted' ? 'fa-paper-plane' :
                              volunteerApplicationStatus.status === 'approved' ? 'fa-check-circle' :
                              volunteerApplicationStatus.status === 'denied' ? 'fa-times-circle' :
                              volunteerApplicationStatus.status === 'pending' ? 'fa-clock' :
                              'fa-edit'
                            }`}></i>
                          </div>
                          <div className="status-text">
                            <div className="status-title-container">
                              <h3>Application {
                                volunteerApplicationStatus.status === 'submitted' ? 'Submitted' :
                                volunteerApplicationStatus.status.charAt(0).toUpperCase() + volunteerApplicationStatus.status.slice(1)
                              }</h3>
                              {volunteerApplicationStatus.status === 'submitted' && (
                                <span className="pending-status-badge">PENDING</span>
                              )}
                            </div>
                            {volunteerApplicationStatus.submittedAt && (
                              <p>
                                {volunteerApplicationStatus.status === 'draft' ? 'Last saved: ' : 'Submitted: '}
                                {new Date(volunteerApplicationStatus.submittedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="application-details">
                          <h4>Applied Teams:</h4>
                          <div className="teams-list">
                            {volunteerApplicationStatus.teams.map((team, index) => (
                              <span key={index} className="team-badge">{team}</span>
                            ))}
                          </div>

                          {volunteerApplicationStatus.status === 'draft' && (
                            <div className="application-actions mt-3">
                              <Link to="/volunteer-application" className="btn btn-primary">
                                <i className="fas fa-edit mr-2"></i>Continue Application
                              </Link>
                            </div>
                          )}

                          {volunteerApplicationStatus.status === 'submitted' && (
                            <div className="application-actions mt-3">
                              <Link to="/volunteer-application" className="btn btn-outline">
                                <i className="fas fa-edit mr-2"></i>Edit Application
                              </Link>
                            </div>
                          )}

                          {volunteerApplicationStatus.status === 'denied' && (
                            <div className="application-actions mt-3">
                              <Link to="/volunteer-application" className="btn btn-secondary">
                                <i className="fas fa-redo mr-2"></i>Reapply for Teams
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'volunteer' && (
                  <div className="tab-content ">
                    <h2>Your Volunteer Dashboard</h2>

                    {/* Application Status Summary for volunteers */}
                    {isVolunteer() && volunteerApplicationStatus && (
                      <div className="volunteer-status-summary mb-4">
                        <div className={`status-pill status-${volunteerApplicationStatus.status.toLowerCase()}`}>
                          <i className={`fas ${
                            volunteerApplicationStatus.status === 'approved' ? 'fa-check-circle' :
                            volunteerApplicationStatus.status === 'submitted' ? 'fa-paper-plane' :
                            volunteerApplicationStatus.status === 'pending' ? 'fa-clock' :
                            volunteerApplicationStatus.status === 'denied' ? 'fa-times-circle' :
                            'fa-edit'
                          }`}></i>
                          Team Application: {volunteerApplicationStatus.status.charAt(0).toUpperCase() + volunteerApplicationStatus.status.slice(1)}
                        </div>
                      </div>
                    )}

                    <h3>Volunteer Events & Training</h3>
                    <p className="text-muted mb-3">Events for your volunteer teams and organization-wide activities</p>

                    {volunteerEvents.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-calendar-check"></i>
                        </div>
                        <p>No volunteer events available at this time.</p>
                        <p className="text-muted">Check back soon for training sessions and volunteer activities!</p>
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
                                      <span className={`status-badge ${(volunteer.status || 'submitted').toLowerCase()}`}>
                                        {volunteer.status || 'Submitted'}
                                      </span>
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

                {/* Admin: Volunteer Applications Tab */}
                {activeTab === 'applications' && isAdmin() && (
                  <div className="tab-content">
                    <h2>Volunteer Applications</h2>
                    <p className="text-muted mb-3">Review and manage volunteer team applications</p>

                    {volunteerApplications.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-clipboard-list"></i>
                        </div>
                        <p>No volunteer applications found.</p>
                        <p className="text-muted">Applications will appear here when volunteers submit team applications.</p>
                      </div>
                    ) : (
                      <div className="applications-grid">
                        {volunteerApplications.map((application, index) => (
                          <div key={application.id} className="application-card">
                            <div className="application-header">
                              <h4>{application.applicantName}</h4>
                              <span className={`status-pill ${application.status.toLowerCase()}`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                            <div className="application-details">
                              <p><strong>Email:</strong> {application.email}</p>
                              <p><strong>Phone:</strong> {application.phone}</p>
                              <p><strong>Applied Teams:</strong></p>
                              <div className="teams-list">
                                {application.selectedCategories?.map((team, idx) => (
                                  <span key={idx} className="team-badge">{formatTeamName(team)}</span>
                                ))}
                              </div>
                              <p><strong>Submitted:</strong> {new Date(application.submittedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="application-actions">
                              <button
                                onClick={() => openApplicationModal(application)}
                                className="btn btn-primary btn-sm"
                              >
                                <i className="fas fa-eye mr-1"></i>
                                Review
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Admin: Child Events Tab */}
                {activeTab === 'child-events' && isAdmin() && (
                  <div className="tab-content">
                    <h2>Child Events Overview</h2>
                    <p className="text-muted mb-3">Monitor all child registrations and events</p>

                    {allChildEvents.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-child"></i>
                        </div>
                        <p>No child event registrations found.</p>
                        <p className="text-muted">Event registrations will appear here when parents register their children.</p>
                      </div>
                    ) : (
                      <div className="events-grid">
                        {allChildEvents.map(registration => {
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
                                    <strong>Child:</strong> {registration.childFirstName} {registration.childLastName}
                                  </div>
                                  <div className="parent-info">
                                    <strong>Parent:</strong> {registration.parentEmail}
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
      
      {/* Application Review Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-container application-modal">
            <div className="modal-header">
              <h3>Review Application - {selectedApplication.applicantName}</h3>
              <button className="modal-close" onClick={closeApplicationModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="application-review">
                <div className="applicant-info">
                  <h4>Applicant Information</h4>
                  <div className="info-grid">
                    <div><strong>Name:</strong> {selectedApplication.applicantName}</div>
                    <div><strong>Email:</strong> {selectedApplication.email}</div>
                    <div><strong>Phone:</strong> {selectedApplication.phone}</div>
                    <div><strong>Grade:</strong> {selectedApplication.grade || 'Not provided'}</div>
                    <div><strong>School:</strong> {selectedApplication.school || 'Not provided'}</div>
                    <div><strong>Submitted:</strong> {new Date(selectedApplication.submittedAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="applied-teams">
                  <h4>Applied Teams</h4>
                  <div className="teams-list">
                    {selectedApplication.selectedCategories?.map((team, idx) => (
                      <span key={idx} className="team-badge">{formatTeamName(team)}</span>
                    ))}
                  </div>
                </div>

                <div className="motivation">
                  <h4>Motivation</h4>
                  <p>{selectedApplication.motivation || 'No motivation provided'}</p>
                </div>

                {selectedApplication.dynamicAnswers && Object.keys(selectedApplication.dynamicAnswers).length > 0 && (
                  <div className="team-answers">
                    <h4>Team-Specific Answers</h4>
                    {Object.entries(selectedApplication.dynamicAnswers).map(([team, answer]) => (
                      <div key={team} className="team-answer">
                        <h5>{formatTeamName(team)}</h5>
                        <p>{answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="contact-preferences">
                  <h4>Contact Preferences</h4>
                  <p>{selectedApplication.preferredContact?.join(', ') || 'None specified'}</p>
                  {selectedApplication.preferredContactOther && (
                    <p><strong>Other:</strong> {selectedApplication.preferredContactOther}</p>
                  )}
                </div>

                {selectedApplication.portfolioLink && (
                  <div className="portfolio">
                    <h4>Portfolio/Website</h4>
                    <a href={selectedApplication.portfolioLink} target="_blank" rel="noopener noreferrer">
                      {selectedApplication.portfolioLink}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer application-actions">
              {selectedApplication.status === 'submitted' && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => approveApplication(selectedApplication.id)}
                  >
                    <i className="fas fa-check mr-1"></i>
                    Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => rejectApplication(selectedApplication.id)}
                  >
                    <i className="fas fa-times mr-1"></i>
                    Reject
                  </button>
                </>
              )}
              <button className="btn btn-outline" onClick={closeApplicationModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

        .edit-profile-form .form-group {
          margin-bottom: 1rem;
        }

        .edit-profile-form label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .edit-profile-form .form-control {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .edit-profile-form .form-control:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(47, 80, 106, 0.2);
        }

        .edit-profile-actions .btn {
          margin-top: 0.5rem;
        }

        .loading-spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-right: 0.5rem;
        }
        
        .error-icon {
          font-size: 3rem;
          color: var(--secondary);
          margin-bottom: 1rem;
        }

        /* Application Status Styles */
        .application-status-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .status-header {
          display: flex;
          align-items: center;
          padding: 1.5rem;
          background-color: #f8f9fa;
        }

        .status-header.status-draft {
          background-color: #e6f3ff;
          border-bottom: 2px solid #0ea5e9;
        }

        .status-header.status-submitted {
          background-color: #fff7e6;
          border-bottom: 2px solid #f59e0b;
        }

        .status-header.status-pending {
          background-color: #fff7e6;
          border-bottom: 2px solid #f59e0b;
        }

        .status-header.status-approved {
          background-color: #ecfdf5;
          border-bottom: 2px solid #10b981;
        }

        .status-header.status-denied {
          background-color: #fef2f2;
          border-bottom: 2px solid #ef4444;
        }

        .status-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
          font-size: 1.5rem;
        }

        .status-draft .status-icon {
          background-color: #0ea5e9;
          color: white;
        }

        .status-submitted .status-icon, .status-pending .status-icon {
          background-color: #f59e0b;
          color: white;
        }

        .status-approved .status-icon {
          background-color: #10b981;
          color: white;
        }

        .status-denied .status-icon {
          background-color: #ef4444;
          color: white;
        }

        .status-text h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
        }

        .status-text p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .application-details {
          padding: 1.5rem;
        }

        .application-details h4 {
          margin: 0 0 1rem 0;
          color: var(--primary);
        }

        .teams-list {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .team-badge {
          padding: 0.5rem 1rem;
          background-color: var(--primary);
          color: white;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .application-actions {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
        }

        .text-muted {
          color: #6b7280;
        }

        .volunteer-status-summary {
          margin-bottom: 2rem;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .status-pill i {
          margin-right: 0.5rem;
        }

        .status-pill.status-draft {
          background-color: #e6f3ff;
          color: #0c6eb9;
        }

        .status-pill.status-submitted,
        .status-pill.status-pending {
          background-color: #fff7e6;
          color: #b97800;
        }

        .status-pill.status-approved {
          background-color: #ecfdf5;
          color: #0a866c;
        }

        .status-pill.status-denied {
          background-color: #fef2f2;
          color: #dc2626;
        }

        .mb-3 {
          margin-bottom: 1rem;
        }

        .mb-4 {
          margin-bottom: 1.5rem;
        }
        
        .mr-1 {
          margin-right: 0.25rem;
        }
        
        .mr-2 {
          margin-right: 0.5rem;
        }

        /* Status title container for pending badge */
        .status-title-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .pending-status-badge {
          background-color: #fbbf24;
          color: #92400e;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        /* Additional status badge styles for volunteer activities */
        .status-badge.submitted {
          background-color: #dbeafe;
          color: #1e40af;
        }

        /* Admin-specific styles */
        .applications-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .application-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 1px solid #e5e7eb;
        }

        .application-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .application-header {
          display: flex;
          justify-content: between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .application-header h4 {
          margin: 0;
          color: var(--primary);
        }

        .application-details {
          margin-bottom: 1.5rem;
        }

        .application-details p {
          margin: 0.5rem 0;
          font-size: 0.9rem;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        /* Application modal styles */
        .application-modal {
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .application-review h4 {
          color: var(--primary);
          margin: 1.5rem 0 1rem 0;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 0.5rem;
        }

        .application-review h5 {
          color: var(--secondary);
          margin: 1rem 0 0.5rem 0;
          font-size: 1rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .info-grid div {
          padding: 0.5rem;
          background-color: #f9fafb;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .team-answer {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .team-answer p {
          margin: 0.5rem 0 0 0;
          line-height: 1.6;
        }

        .btn-success {
          background-color: #10b981;
          color: white;
          border: none;
        }

        .btn-success:hover {
          background-color: #059669;
        }

        .btn-danger {
          background-color: #ef4444;
          color: white;
          border: none;
        }

        .btn-danger:hover {
          background-color: #dc2626;
        }

        .parent-info {
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
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
    </>
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
