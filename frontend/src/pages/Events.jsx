import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', or 'all'
  const [sportFilter, setSportFilter] = useState('all');
  const [sportTypes, setSportTypes] = useState([]);
  
  useEffect(() => {
    fetchEvents();
  }, [filter, sportFilter]);
  
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      let url = '/api/events';
      
      if (filter === 'upcoming') {
        url = '/api/events/upcoming';
      } else if (filter === 'past') {
        url = '/api/events/past';
      }
      
      const response = await fetch(url);
      if (response.ok) {
        let data = await response.json();
        
        // Apply sport type filter if needed
        if (sportFilter !== 'all') {
          data = data.filter(event => event.sportType === sportFilter);
        }
        
        setEvents(data);
        
        // Extract unique sport types for filter
        if (filter !== 'past') {
          const types = [...new Set(data.map(event => event.sportType))];
          setSportTypes(types);
        }
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
  
  return (
    <Layout>
      {/* Hero Section with Parallax */}
      <section className="hero" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-bg" style={{ backgroundImage: 'url("/assets/placeholder.png")' }}></div>
        
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
                      <h3>Sport Type</h3>
                      <div className="form-group">
                        <label htmlFor="sportFilter">Sport</label>
                        <select 
                          id="sportFilter" 
                          className="form-control"
                          value={sportFilter}
                          onChange={(e) => setSportFilter(e.target.value)}
                        >
                          <option value="all">All Sports</option>
                          {sportTypes.map(sport => (
                            <option key={sport} value={sport}>{sport}</option>
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
            <div className="row">
              {events.map((event, index) => (
                <div 
                  className="col-half mb-3 fade-in" 
                  key={event.id} 
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="card event-card">
                    <div className="card-header">
                      <h3>{event.title}</h3>
                    </div>
                    <div className="card-body">
                      <div className="event-meta">
                        <p><i className="far fa-calendar"></i> {formatDate(event.startDate)}</p>
                        <p><i className="fas fa-map-marker-alt"></i> {event.location}</p>
                        <p><i className="fas fa-running"></i> {event.sportType}</p>
                        <p><i className="fas fa-users"></i> Available Spots: {event.maxParticipants - (event.participantCount || 0)}</p>
                        {event.needsVolunteers && (
                          <p><i className="fas fa-hand-helping"></i> Volunteers Needed: {event.volunteerCountNeeded}</p>
                        )}
                      </div>
                      <p>{event.description}</p>
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
              <img src="/assets/placeholder.png" alt="No events found" style={{ maxWidth: '200px', margin: '2rem auto' }} />
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
      <style jsx>{`
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
    </Layout>
  );
};

export default Events;
