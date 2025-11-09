import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Calendar as CalendarIcon, Clock, MapPin, Users, RefreshCw } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { assetUrls } from '../utils/firebaseAssets';
import firestoreEventService from '../services/firestoreEventService';
import { formatAgeRange } from '../utils/eventFormatters';

const Events = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', or 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  
  useEffect(() => {
    fetchEvents();
  }, [filter]);

  // Re-filter events when search or tag filters change
  useEffect(() => {
    // This will trigger a re-render when search or tags change
  }, [searchQuery, selectedTags]);

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

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );

    try {
      let data = [];

      // Try to fetch data with timeout
      const fetchPromise = (async () => {
        try {
          if (filter === 'upcoming') {
            data = await apiService.getUpcomingEvents();
          } else {
            data = await apiService.getEvents();
          }

          // If no events from API, try Firestore
          if (!data || data.length === 0) {
            data = await firestoreEventService.getEvents();
          }
        } catch (apiError) {
          data = await firestoreEventService.getEvents();
        }
        return data;
      })();

      // Race between fetch and timeout
      data = await Promise.race([fetchPromise, timeoutPromise]);

      // Filter events based on filter setting
      if (filter === 'upcoming') {
        data = data.filter(event => new Date(event.date) >= new Date());
      } else if (filter === 'past') {
        data = data.filter(event => new Date(event.date) < new Date());
      }




      setEvents(data);

      // Extract unique tags from all events for dynamic filtering
      const allTags = data.flatMap(event =>
        event.tags ? event.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      );
      const uniqueTags = [...new Set(allTags)];
      setAvailableTags(uniqueTags);

    } catch (error) {
      console.error('Events: Error fetching events:', error);
      // Set empty array if there's an error to ensure UI doesn't break
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date and time for display
  const formatDate = (dateString, startTime, endTime) => {
    const date = new Date(dateString);
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    let formattedDate = date.toLocaleDateString(undefined, dateOptions);

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
    } else if (formattedStartTime) {
      formattedDate += ` • ${formattedStartTime}`;
    }

    return formattedDate;
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setFilter('upcoming');
  };

  // Toggle tag selection
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedTags.length > 0 || filter !== 'upcoming';

  // Filter events display for the new design
  const filteredEvents = events.filter(event => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!(event.name && event.name.toLowerCase().includes(query)) &&
          !(event.description && event.description.toLowerCase().includes(query))) {
        return false;
      }
    }

    // Tag filter
    if (selectedTags.length > 0) {
      // Parse event tags from the event.tags string
      const eventTags = event.tags ? event.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

      // Check if event has any of the selected tags
      if (!selectedTags.some(tag => eventTags.includes(tag))) {
        return false;
      }
    }

    return true;
  });
  
  return (
    <div className="events-page">
      {/* Content Container */}
      <div className="events-content">
        {/* Modern Filter Bar */}
        <div className="filter-bar">
        <div className="container">
          <div className="filter-content">
            {/* Page Title and Search Row */}
            <div className="filter-row">
              {/* Page Title */}
              <div className="page-title">
                <h1>Event Dashboard</h1>
              </div>
              {/* Search Input */}
              <div className="search-input-container">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search events by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>


              {/* Time Period Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="upcoming">Upcoming Events</option>
                <option value="past">Past Events</option>
                <option value="all">All Events</option>
              </select>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="clear-filters-btn"
                >
                  <X size={16} />
                  Clear
                </button>
              )}

              {/* Refresh Button */}
              <button
                onClick={() => {
                  setIsLoading(true);
                  fetchEvents();
                }}
                className="refresh-btn-filter"
                disabled={isLoading}
                title="Refresh Events"
              >
                <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
                Refresh
              </button>
            </div>

            {/* Tag Filter Row */}
            <div className="tag-filter-row">
              <p className="tag-filter-label">Filter by tags:</p>
              <div className="tag-container">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-badge ${
                      selectedTags.includes(tag) ? 'tag-badge-selected' : 'tag-badge-outline'
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <section className="section">
        <div className="container">
          {!currentUser && filter !== 'past' && (
            <div className="account-requirement-banner fade-in" style={{ marginBottom: '2rem' }}>
              <div className="banner-icon">
                <i className="fas fa-info-circle"></i>
              </div>
              <div className="banner-content">
                <h3>Account Required</h3>
                <p>To register for events, you need a Kids in Motion account. Log in or create one to get started.</p>
              </div>
              <div className="banner-actions">
                <Link to="/login" className="btn btn-primary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-outline">
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="container">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading events...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="events-grid">
              {filteredEvents.map((event, index) => (
                <div
                  className="event-card-wrapper fade-in"
                  key={event.id}
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="modern-event-card">
                    <div className="event-card-content">
                      {/* Title */}
                      <h3 className="event-title">{event.name}</h3>

                      {/* Date & Time */}
                      <div className="event-meta-section">
                        <div className="event-meta-item">
                          <CalendarIcon size={18} className="meta-icon" />
                          <span className="meta-text">{formatDate(event.date, event.startTime, event.endTime)}</span>
                        </div>
                        {event.location && (
                          <div className="event-meta-item">
                            <MapPin size={18} className="meta-icon secondary" />
                            <span className="meta-text">{event.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Age Range */}
                      <div className="event-meta-item">
                        <Users size={18} className="meta-icon" />
                        <span className="meta-text">{formatAgeRange(event)}</span>
                      </div>

                      {/* Description */}
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}

                      {/* Event Tags */}
                      {event.tags && event.tags.trim() && (
                        <div className="event-tag-display">
                          {event.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                            <span key={tag} className="event-tag-badge">{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="event-tags">
                        {event.capacity && Number(event.capacity) > 0 && (
                          <span className="event-tag">Capacity: {event.capacity}</span>
                        )}
                        {event.price !== null && event.price !== undefined && event.price !== '' && parseFloat(event.price) > 0 && (
                          <span className="event-tag">${event.price}</span>
                        )}
                      </div>

                      {/* Register Button */}
                      {filter !== 'past' && (
                        <>
                          {!currentUser && (
                            <span className="login-required-badge">
                              <i className="fas fa-lock"></i> Login Required
                            </span>
                          )}
                          <Link
                            to={currentUser ? `/events/${event.id}/register` : `/login?redirect=/events/${event.id}/register`}
                            className="register-btn"
                          >
                            {currentUser ? 'Register Now' : 'Login to Register'}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-events-container">
              <div className="no-events-icon">📅</div>
              <p className="no-events-text">No events found matching your filters</p>
              <button onClick={handleClearFilters} className="clear-all-btn">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Modern Events Page Styles */}
      <style>{`
        .events-page {
          min-height: 100vh;
        }

        .events-content {
          padding-top: 0;
        }

        .refresh-btn-filter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--primary);
          color: white;
          border: 1px solid var(--primary);
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .refresh-btn-filter:hover:not(:disabled) {
          background: rgba(47, 80, 106, 0.9);
          transform: translateY(-1px);
        }

        .refresh-btn-filter:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .filter-bar {
          background-color: white;
          border-bottom: 1px solid rgba(47, 80, 106, 0.15);
          padding: 1.5rem 0;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .filter-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .filter-row {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        @media (min-width: 768px) {
          .filter-row {
            flex-direction: row;
            align-items: center;
          }
        }

        .page-title {
          display: flex;
          align-items: center;
          margin-right: 2rem;
        }

        .page-title h1 {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--primary);
          margin: 0;
          white-space: nowrap;
        }

        @media (max-width: 767px) {
          .page-title {
            margin-right: 0;
            margin-bottom: 0.5rem;
          }

          .page-title h1 {
            font-size: 1.5rem;
          }
        }

        .search-input-container {
          position: relative;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 0.75rem 0.75rem 2.5rem;
          border: 1px solid rgba(47, 80, 106, 0.15);
          border-radius: 0.5rem;
          font-size: 1rem;
          background-color: white;
          transition: all 0.15s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.1);
        }

        .filter-select {
          padding: 0.75rem;
          border: 1px solid rgba(47, 80, 106, 0.15);
          border-radius: 0.5rem;
          background-color: white;
          font-size: 1rem;
          min-width: 10rem;
          transition: all 0.15s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.1);
        }

        .clear-filters-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: 1px solid var(--secondary);
          border-radius: 0.5rem;
          background-color: white;
          color: var(--secondary);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .clear-filters-btn:hover {
          background-color: var(--secondary);
          color: white;
        }

        .tag-filter-row {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        @media (min-width: 768px) {
          .tag-filter-row {
            flex-direction: row;
            align-items: center;
          }
        }

        .tag-filter-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          white-space: nowrap;
        }

        .tag-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .tag-badge-selected {
          background-color: var(--primary);
          color: white;
        }

        .tag-badge-selected:hover {
          background-color: rgba(47, 80, 106, 0.9);
        }

        .tag-badge-outline {
          border: 1px solid rgba(47, 80, 106, 0.15);
          background-color: white;
          color: var(--foreground);
        }

        .tag-badge-outline:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .events-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          padding-bottom: 1.5rem;
        }

        @media (min-width: 768px) {
          .events-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .events-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .event-card-wrapper {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease;
        }

        .event-card-wrapper.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .modern-event-card {
          background-color: white;
          border: 1px solid rgba(47, 80, 106, 0.15);
          border-radius: 0.75rem;
          overflow: hidden;
          transition: all 0.15s ease;
          height: 100%;
        }

        .modern-event-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        }

        .event-card-content {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
        }

        .event-title {
          color: var(--primary);
          font-size: 1.125rem;
          font-weight: 500;
          margin: 0;
          line-height: 1.5;
        }

        .event-meta-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .event-meta-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .meta-icon {
          color: var(--primary);
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .meta-icon.secondary {
          color: var(--secondary);
        }

        .meta-text {
          font-size: 0.875rem;
          color: var(--primary);
          line-height: 1.25;
        }

        .event-description {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.625;
          margin: 0;
        }

        .event-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .event-tag {
          background-color: rgba(47, 80, 106, 0.1);
          color: var(--primary);
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .register-btn {
          width: 100%;
          background-color: var(--secondary);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 9999px;
          text-decoration: none;
          text-align: center;
          font-weight: 500;
          transition: all 0.15s ease;
          margin-top: auto;
        }

        .register-btn:hover {
          background-color: rgba(230, 79, 80, 0.9);
          color: white;
          text-decoration: none;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
          gap: 1rem;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(47, 80, 106, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
        }

        .no-events-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
          gap: 1rem;
        }

        .no-events-icon {
          font-size: 4rem;
          opacity: 0.5;
        }

        .no-events-text {
          color: #6b7280;
          margin: 0;
        }

        .clear-all-btn {
          color: #2563eb;
          background: none;
          border: none;
          text-decoration: underline;
          cursor: pointer;
          font-size: 1rem;
        }

        .clear-all-btn:hover {
          color: #1d4ed8;
        }

        .event-tag-display {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 0.75rem 0;
        }

        .event-tag-badge {
          background-color: #e3f2fd;
          color: #1976d2;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid #bbdefb;
        }

        .account-requirement-banner {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-left: 4px solid var(--primary);
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .banner-icon {
          flex-shrink: 0;
          font-size: 2.5rem;
          color: var(--primary);
        }

        .banner-content {
          flex: 1;
        }

        .banner-content h3 {
          margin: 0 0 0.5rem 0;
          color: var(--primary);
          font-size: 1.3rem;
        }

        .banner-content p {
          margin: 0;
          color: #1976d2;
        }

        .banner-actions {
          display: flex;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .login-required-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          background-color: rgba(47, 80, 106, 0.1);
          color: var(--primary);
          padding: 0.375rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: auto;
        }

        .login-required-badge i {
          font-size: 0.625rem;
        }

        @media (max-width: 768px) {
          .account-requirement-banner {
            flex-direction: column;
            text-align: center;
          }

          .banner-actions {
            flex-direction: column;
            width: 100%;
          }

          .banner-actions .btn {
            width: 100%;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Events;
