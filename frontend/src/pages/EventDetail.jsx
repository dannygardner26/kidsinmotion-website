import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format duration
  const formatDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffHours = Math.round((end - start) / (1000 * 60 * 60));
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mt-4">
          <p>Loading event details...</p>
        </div>
      </Layout>
    );
  }
  
  if (error || !event) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="card">
            <div className="card-body">
              <h2>Error</h2>
              <p>{error || 'Event not found'}</p>
              <a href="/events" className="btn btn-primary">Back to Events</a>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  const isPastEvent = new Date(event.endDate) < new Date();
  
  return (
    <Layout>
      <div className="container mt-4">
        <div className="card mb-4">
          <div className="card-header">
            <h1>{event.title}</h1>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-two-thirds">
                <h3>About This Event</h3>
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
                <ul>
                  <li>Water bottle</li>
                  <li>Comfortable athletic clothes</li>
                  <li>Appropriate footwear for {event.sportType.toLowerCase()}</li>
                  {event.sportType === 'BASEBALL' && (
                    <li>Baseball glove (if you have one, we'll provide if needed)</li>
                  )}
                  {event.sportType === 'SOCCER' && (
                    <li>Shin guards (if you have them, we'll provide if needed)</li>
                  )}
                </ul>
              </div>
              
              <div className="col-third">
                <div className="card">
                  <div className="card-header">
                    <h3>Registration</h3>
                  </div>
                  <div className="card-body">
                    {isPastEvent ? (
                      <p>This event has already taken place.</p>
                    ) : (
                      <>
                        <p><strong>Available Spots:</strong> {event.availableSpots || 0}</p>
                        {event.availableSpots > 0 ? (
                          isLoggedIn ? (
                            <a href={`/events/${event.id}/register`} className="btn btn-primary btn-block mb-2">
                              Register Your Child
                            </a>
                          ) : (
                            <>
                              <p>Please login to register your child for this event.</p>
                              <a href={`/login?redirect=/events/${event.id}`} className="btn btn-primary btn-block mb-2">
                                Login to Register
                              </a>
                            </>
                          )
                        ) : (
                          <p className="text-danger">This event is currently full.</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {event.needsVolunteers && !isPastEvent && (
                  <div className="card mt-3">
                    <div className="card-header">
                      <h3>Volunteer</h3>
                    </div>
                    <div className="card-body">
                      <p><strong>Volunteers Needed:</strong> {event.volunteersNeeded || 0}</p>
                      {event.volunteersNeeded > 0 ? (
                        isLoggedIn ? (
                          <a href={`/events/${event.id}/volunteer`} className="btn btn-secondary btn-block">
                            Sign Up to Volunteer
                          </a>
                        ) : (
                          <>
                            <p>Please login to sign up as a volunteer.</p>
                            <a href={`/login?redirect=/events/${event.id}`} className="btn btn-secondary btn-block">
                              Login to Volunteer
                            </a>
                          </>
                        )
                      ) : (
                        <p>We have all the volunteers we need for this event!</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="card mt-3">
                  <div className="card-header">
                    <h3>Share</h3>
                  </div>
                  <div className="card-body">
                    <button className="btn btn-outline btn-block mb-2">
                      <i className="fab fa-facebook-f mr-2"></i> Share on Facebook
                    </button>
                    <button className="btn btn-outline btn-block mb-2">
                      <i className="fab fa-twitter mr-2"></i> Share on Twitter
                    </button>
                    <button className="btn btn-outline btn-block">
                      <i className="fas fa-envelope mr-2"></i> Share via Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {!isPastEvent && (
          <div className="card mb-4">
            <div className="card-header">
              <h2>Frequently Asked Questions</h2>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <h4>What age groups is this event for?</h4>
                <p>Our events are generally designed for children ages 6-14, but specific age requirements may vary by event. Please contact us if you have questions about your child's eligibility.</p>
              </div>
              
              <div className="mb-3">
                <h4>Do I need to bring equipment?</h4>
                <p>While we encourage participants to bring their own equipment if they have it, we will provide all necessary equipment for those who need it.</p>
              </div>
              
              <div className="mb-3">
                <h4>What if my child has special needs?</h4>
                <p>We strive to make our events inclusive for all children. Please note any special needs during registration, and we'll do our best to accommodate them.</p>
              </div>
              
              <div>
                <h4>What if it rains?</h4>
                <p>In case of inclement weather, we will notify all registered participants of any changes via email. We may reschedule the event or move it to an indoor location if available.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventDetail;