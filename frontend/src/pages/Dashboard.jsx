import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [volunteerEvents, setVolunteerEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('registrations');
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Fetch user data and registrations
    fetchUserData(token);
  }, []);
  
  const fetchUserData = async (token) => {
    try {
      // Fetch user profile
      const profileResponse = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text(); // Try to get more details
        throw new Error(`Failed to fetch user profile: ${profileResponse.status} ${profileResponse.statusText}. ${errorText}`);
      }
      
      const userData = await profileResponse.json();
      setUser(userData);
      
      // Fetch child registrations
      const registrationsResponse = await fetch('/api/participants/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (registrationsResponse.ok) {
        const registrationsData = await registrationsResponse.json();
        setRegisteredEvents(registrationsData);
      }
      
      // Fetch volunteer sign-ups
      const volunteersResponse = await fetch('/api/volunteers/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (volunteersResponse.ok) {
        const volunteersData = await volunteersResponse.json();
        setVolunteerEvents(volunteersData);
      }
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.message);
      
      // If unauthorized, redirect to login
      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancelRegistration = async (participantId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/participants/${participantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel registration');
      }
      
      // Update registrations list
      setRegisteredEvents(registeredEvents.filter(reg => reg.id !== participantId));
      
    } catch (error) {
      console.error('Error canceling registration:', error);
      alert('Failed to cancel registration. Please try again.');
    }
  };
  
  const handleCancelVolunteer = async (volunteerId) => {
    if (!window.confirm('Are you sure you want to cancel this volunteer sign-up?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/volunteers/${volunteerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel volunteer sign-up');
      }
      
      // Update volunteer list
      setVolunteerEvents(volunteerEvents.filter(vol => vol.id !== volunteerId));
      
    } catch (error) {
      console.error('Error canceling volunteer sign-up:', error);
      alert('Failed to cancel volunteer sign-up. Please try again.');
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mt-4">
          <p>Loading your dashboard...</p>
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
      <div className="container mt-4">
        <div className="card mb-4">
          <div className="card-header">
            <h1>Welcome, {user?.firstName}!</h1>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-half">
                <h3>Your Profile</h3>
                <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Phone:</strong> {user?.phoneNumber || 'Not provided'}</p>
                <a href="/profile/edit" className="btn btn-outline">Edit Profile</a>
              </div>
              
              <div className="col-half">
                <h3>Quick Links</h3>
                <div className="row">
                  <div className="col-half">
                    <a href="/events" className="btn btn-primary btn-block mb-2">Browse Events</a>
                  </div>
                  <div className="col-half">
                    <a href="/volunteer" className="btn btn-secondary btn-block mb-2">Volunteer Opportunities</a>
                  </div>
                </div>
                <div className="row">
                  <div className="col-half">
                    <a href="/donate" className="btn btn-outline btn-block mb-2">Make a Donation</a>
                  </div>
                  <div className="col-half">
                    <a href="/contact" className="btn btn-outline btn-block mb-2">Contact Us</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <a 
                  className={`nav-link ${activeTab === 'registrations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('registrations')}
                  style={{ cursor: 'pointer' }}
                >
                  Your Child's Events
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className={`nav-link ${activeTab === 'volunteer' ? 'active' : ''}`}
                  onClick={() => setActiveTab('volunteer')}
                  style={{ cursor: 'pointer' }}
                >
                  Your Volunteer Activities
                </a>
              </li>
            </ul>
          </div>
          <div className="card-body">
            {activeTab === 'registrations' && (
              <>
                <h2>Your Child's Registered Events</h2>
                
                {registeredEvents.length === 0 ? (
                  <div className="text-center mt-4 mb-4">
                    <p>You haven't registered your child for any events yet.</p>
                    <a href="/events" className="btn btn-primary">Browse Events</a>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Child</th>
                          <th>Date</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registeredEvents.map(registration => {
                          const isPast = new Date(registration.event?.endDate) < new Date();
                          return (
                            <tr key={registration.id}>
                              <td>{registration.event?.title || 'Unknown Event'}</td>
                              <td>{registration.childFirstName} {registration.childLastName}</td>
                              <td>{formatDate(registration.event?.startDate)}</td>
                              <td>{registration.event?.location}</td>
                              <td>{isPast ? 'Completed' : 'Upcoming'}</td>
                              <td>
                                <a 
                                  href={`/events/${registration.eventId}`} 
                                  className="btn btn-sm btn-outline mr-1"
                                >
                                  View
                                </a>
                                {!isPast && (
                                  <button
                                    onClick={() => handleCancelRegistration(registration.id)}
                                    className="btn btn-sm btn-danger"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'volunteer' && (
              <>
                <h2>Your Volunteer Activities</h2>
                
                {volunteerEvents.length === 0 ? (
                  <div className="text-center mt-4 mb-4">
                    <p>You haven't signed up to volunteer for any events yet.</p>
                    <a href="/volunteer" className="btn btn-secondary">Browse Volunteer Opportunities</a>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Date</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {volunteerEvents.map(volunteer => {
                          const isPast = new Date(volunteer.event?.endDate) < new Date();
                          return (
                            <tr key={volunteer.id}>
                              <td>{volunteer.event?.title || 'Unknown Event'}</td>
                              <td>{formatDate(volunteer.event?.startDate)}</td>
                              <td>{volunteer.event?.location}</td>
                              <td>
                                {isPast ? 'Completed' : volunteer.status}
                              </td>
                              <td>
                                <a 
                                  href={`/events/${volunteer.eventId}`} 
                                  className="btn btn-sm btn-outline mr-1"
                                >
                                  View
                                </a>
                                {!isPast && volunteer.status !== 'CANCELED' && (
                                  <button
                                    onClick={() => handleCancelVolunteer(volunteer.id)}
                                    className="btn btn-sm btn-danger"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;