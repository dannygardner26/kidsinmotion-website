import React, { useState, useEffect } from 'react';
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
      <section className="hero">
        <div className="container">
          <h1>Events & Clinics</h1>
          <p>Explore our upcoming sports clinics and events. Registration is free for all participants.</p>
        </div>
      </section>
      
      <section className="container mt-4">
        <div className="row mb-4">
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
          <div className="text-center">
            <p>Loading events...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="row">
            {events.map(event => (
              <div className="col-half mb-3" key={event.id}>
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
                    <a href={`/events/${event.id}`} className="btn btn-primary">View Details</a>
                    {filter !== 'past' && (
                      <a href={`/events/${event.id}/register`} className="btn btn-secondary ml-2">Register</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p>No events found matching your criteria.</p>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Events;