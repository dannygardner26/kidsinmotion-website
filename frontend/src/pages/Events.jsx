import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { apiService } from '../services/api';
import { assetUrls } from '../utils/firebaseAssets';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', or 'all'
  const [sportFilter, setSportFilter] = useState('all');
  const [sportTypes, setSportTypes] = useState([]);
  
  useEffect(() => {
    fetchEvents();
  }, [filter, sportFilter]);

  // Trigger intersection observer after content loads
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        const animatedElements = document.querySelectorAll('.fade-in');
        animatedElements.forEach(el => {
          if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add('visible');
          }
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isLoading, events]);
  
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      let data;
      
      if (filter === 'upcoming') {
        data = await apiService.getUpcomingEvents();
      } else {
        data = await apiService.getEvents();
        
        // Filter past events if needed
        if (filter === 'past') {
          data = data.filter(event => new Date(event.date) < new Date());
        }
      }
      
      // Apply sport type filter if needed
      if (sportFilter !== 'all') {
        data = data.filter(event => event.ageGroup === sportFilter);
      }
      
      setEvents(data);
      
      // Extract unique age groups for filter
      if (filter !== 'past') {
        const types = [...new Set(data.map(event => event.ageGroup).filter(Boolean))];
        setSportTypes(types);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format target audience for display
  const formatTargetAudience = (targetAudienceJson) => {
    if (!targetAudienceJson) return null;

    try {
      const audiences = JSON.parse(targetAudienceJson);
      const audienceLabels = {
        'all': 'All Users',
        'parents': 'Parents',
        'volunteers': 'Volunteers',
        'approved': 'Approved Volunteers',
        'pending': 'Pending Applications',
        'coaches': 'Coaches',
        'event-coordinators': 'Event Coordinators',
        'social-media': 'Social Media Team'
      };

      return audiences.map(id => audienceLabels[id] || id).join(', ');
    } catch (e) {
      return null;
    }
  };
  
  return (
    <>
      {/* Hero Section with Parallax */}
      <section className="hero" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-bg" style={{ backgroundImage: `url("${assetUrls['placeholder.png']}")` }}></div>
        
        <div className="container hero-content">
          <h1>Events & Clinics</h1>
          <p>Explore our upcoming sports clinics and events. Registration is free for all participants.</p>
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
          <div className="row mb-4 fade-in">
            <div className="col">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col-half">
                      <h3>Filter Events</h3>
                      <div className="form-group">
                        <label htmlFor="timeFilter">Time Period</label>
                        <select 
                          id="timeFilter" 
                          className="form-control" 
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                        >
                          <option value="upcoming">Upcoming Events</option>
                          <option value="past">Past Events</option>
                          <option value="all">All Events</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="col-half">
                      <h3>Age Group</h3>
                      <div className="form-group">
                        <label htmlFor="sportFilter">Age Group</label>
                        <select 
                          id="sportFilter" 
                          className="form-control"
                          value={sportFilter}
                          onChange={(e) => setSportFilter(e.target.value)}
                        >
                          <option value="all">All Age Groups</option>
                          {sportTypes.map(ageGroup => (
                            <option key={ageGroup} value={ageGroup}>{ageGroup}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center fade-in">
              <div className="loading-spinner"></div>
              <p>Loading events...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="row events-container">
              {events.map((event, index) => (
                <div
                  className="col-half mb-3 fade-in"
                  key={event.id}
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="card event-card">
                    <div className="card-header">
                      <h3 className="event-title">{event.name}</h3>
                    </div>
                    <div className="card-body">
                      <div className="event-meta event-details">
                        <p><i className="far fa-calendar"></i> {formatDate(event.date)}</p>
                        <p><i className="fas fa-map-marker-alt"></i> {event.location || 'TBD'}</p>
                        {event.ageGroup && (
                          <p><i className="fas fa-child"></i> {event.ageGroup}</p>
                        )}
                        {event.capacity && (
                          <p><i className="fas fa-users"></i> Capacity: {event.capacity}</p>
                        )}
                        {event.price && event.price > 0 && (
                          <p><i className="fas fa-dollar-sign"></i> ${event.price}</p>
                        )}
                        {formatTargetAudience(event.targetAudience) && (
                          <p><i className="fas fa-user-tag"></i> For: {formatTargetAudience(event.targetAudience)}</p>
                        )}
                      </div>
                      <p className="event-description">{event.description}</p>
                    </div>
                    <div className="card-footer">
                      <Link to={`/events/${event.id}`} className="btn btn-primary">View Details</Link>
                      {filter !== 'past' && (
                        <Link to={`/events/${event.id}/register`} className="btn btn-secondary ml-2">Register</Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center fade-in">
              <div style={{ fontSize: '72px', color: 'var(--primary)', marginBottom: '1rem' }}>
                No Events
              </div>
              <p>No events found matching your criteria.</p>
              <button onClick={() => {
                setFilter('upcoming');
                setSportFilter('all');
              }} className="btn btn-outline mt-2">
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>
      
      {/* Custom CSS for this page */}
      <style>{`
        .loading-spinner {
          display: inline-block;
          width: 50px;
          height: 50px;
          border: 3px solid rgba(47, 80, 106, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .ml-2 {
          margin-left: 0.5rem;
        }
      `}</style>
    </>
  );
};

export default Events;
