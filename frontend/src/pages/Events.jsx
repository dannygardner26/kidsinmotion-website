import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { apiService } from '../services/api';
import { assetUrls } from '../utils/firebaseAssets';
import firestoreEventService from '../services/firestoreEventService';

const Events = () => {
  console.log('Events component is loading!');
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
    console.log('Events: Starting fetchEvents with filter:', filter);
    setIsLoading(true);
    try {
      let data;

      try {
        if (filter === 'upcoming') {
          console.log('Events: Fetching upcoming events...');
          data = await apiService.getUpcomingEvents();
        } else {
          console.log('Events: Fetching all events...');
          data = await apiService.getEvents();
        }

        // If no events from API, try Firestore
        if (!data || data.length === 0) {
          console.log('Events: No events from API, trying Firestore...');
          data = await firestoreEventService.getEvents();
        }
      } catch (apiError) {
        console.log('Events: API failed, using Firestore directly:', apiError);
        data = await firestoreEventService.getEvents();
      }

      // Filter events based on filter setting
      if (filter === 'upcoming') {
        data = data.filter(event => new Date(event.date) >= new Date());
      } else if (filter === 'past') {
        data = data.filter(event => new Date(event.date) < new Date());
      }

      console.log('Events: Received data:', data);
      console.log('Events: First event details:', data[0] ? {
        name: data[0].name,
        date: data[0].date,
        startTime: data[0].startTime,
        endTime: data[0].endTime,
        ageGroup: data[0].ageGroup,
        fullEventObject: data[0]
      } : 'No events');
      
      // Apply age group filter if needed
      if (sportFilter !== 'all') {
        data = data.filter(event => event.ageGroup === sportFilter);
      }

      console.log('Events: Setting events data, length:', data.length);
      setEvents(data);

      // Extract unique age groups for filter
      if (filter !== 'past') {
        const types = [...new Set(data.map(event => event.ageGroup).filter(Boolean))];
        console.log('Events: Age groups found:', types);
        setSportTypes(types);
      }
    } catch (error) {
      console.error('Events: Error fetching events:', error);
      // Set empty array if there's an error to ensure UI doesn't break
      setEvents([]);
      setSportTypes(['All Age Groups']);
    } finally {
      console.log('Events: Setting loading to false');
      setIsLoading(false);
    }
  };
  
  // Format date and time for display
  const formatDate = (dateString, startTime, endTime) => {
    const date = new Date(dateString);
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    let formattedDate = date.toLocaleDateString(undefined, dateOptions);

    // Debug logging for time values
    console.log('=== ENHANCED TIME DEBUG ===');
    console.log('formatDate called with:', {
      dateString,
      startTime,
      endTime,
      startTimeType: typeof startTime,
      endTimeType: typeof endTime,
      startTimeValue: startTime,
      endTimeValue: endTime,
      startTimeJSON: JSON.stringify(startTime),
      endTimeJSON: JSON.stringify(endTime),
      startTimeIsNull: startTime === null,
      endTimeIsNull: endTime === null,
      startTimeIsUndefined: startTime === undefined,
      endTimeIsUndefined: endTime === undefined,
      startTimeFalsy: !startTime,
      endTimeFalsy: !endTime
    });

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
      console.log('Added actual times:', formattedStartTime, '-', formattedEndTime);
    } else if (formattedStartTime) {
      formattedDate += ` • ${formattedStartTime}`;
      console.log('Added start time only:', formattedStartTime);
    } else {
      // Only show fallback if no times were provided at all
      console.log('No valid times found, showing date only');
    }

    return formattedDate;
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
                  <div className="row mt-3">
                    <div className="col">
                      <button
                        onClick={() => {
                          setIsLoading(true);
                          fetchEvents();
                        }}
                        className="btn btn-outline"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="loading-spinner-small"></div>
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-sync-alt"></i>
                            Refresh Events
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {(() => {
            console.log('Events render: isLoading:', isLoading, 'events.length:', events.length, 'events:', events);
            return null;
          })()}
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
                      <h3>{event.name}</h3>
                    </div>
                    <div className="card-body">
                      <div className="event-meta">
                        <p><i className="far fa-calendar"></i> {formatDate(event.date, event.startTime, event.endTime)}</p>
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
                      </div>
                      <p>{event.description}</p>
                    </div>
                    <div className="card-footer">
                      {filter !== 'past' && (
                        <Link to={`/events/${event.id}/register`} className="btn btn-primary">Register</Link>
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
        .row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .col-half {
          flex: 0 0 calc(50% - 0.5rem);
          max-width: calc(50% - 0.5rem);
        }

        @media (max-width: 768px) {
          .col-half {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }

        .loading-spinner {
          display: inline-block;
          width: 50px;
          height: 50px;
          border: 3px solid rgba(47, 80, 106, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
        }

        .loading-spinner-small {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(47, 80, 106, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .ml-2 {
          margin-left: 0.5rem;
        }

        .mb-3 {
          margin-bottom: 1rem;
        }
      `}</style>
    </>
  );
};

export default Events;
