import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const Home = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Fetch upcoming events
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events/upcoming');
        if (response.ok) {
          const data = await response.json();
          setUpcomingEvents(data.slice(0, 3)); // Get first 3 events
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, []);
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Empowering Every Kid to Play</h1>
          <p>
            Kids in Motion provides free sports clinics and equipment to kids who may not have access, helping them learn new games, build skills, and develop confidence.
          </p>
          <a href="/events" className="btn btn-secondary">Get Involved</a>
        </div>
      </section>
      
      {/* Mission Section */}
      <section className="container mt-4">
        <div className="row">
          <div className="col-half">
            <h2>Our Mission</h2>
            <p>
              Kids in Motion is on a mission to make sports accessible to every child. Through free sports clinics and donated equipment, we give kids—especially those facing financial or opportunity barriers—the chance to explore new sports, develop skills, and build lasting friendships.
            </p>
            <p>
              Founded by high school athletes who believe in the power of sports, we aim to break down the financial and social barriers that prevent kids from playing. Whether it's baseball, soccer, basketball, or other sports, our clinics provide a fun, supportive environment where kids can learn from experienced athletes and discover their potential.
            </p>
            <a href="/about" className="btn btn-outline mt-2">Learn More</a>
          </div>
          <div className="col-half">
            <img src="/img/team-photo.jpg" alt="Kids in Motion Team" style={{ width: '100%', borderRadius: '8px' }} />
          </div>
        </div>
      </section>
      
      {/* Upcoming Events Section */}
      <section className="container mt-4">
        <h2>Upcoming Events</h2>
        
        {isLoading ? (
          <p>Loading events...</p>
        ) : upcomingEvents.length > 0 ? (
          <div className="row">
            {upcomingEvents.map(event => (
              <div className="col-third" key={event.id}>
                <div className="card event-card">
                  <div className="card-header">
                    <h3>{event.title}</h3>
                  </div>
                  <div className="card-body">
                    <div className="event-meta">
                      <p><i className="far fa-calendar"></i> {formatDate(event.startDate)}</p>
                      <p><i className="fas fa-map-marker-alt"></i> {event.location}</p>
                      <p><i className="fas fa-running"></i> {event.sportType}</p>
                    </div>
                    <p>{event.description}</p>
                  </div>
                  <div className="card-footer">
                    <a href={`/events/${event.id}`} className="btn btn-primary">Learn More</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No upcoming events at the moment. Check back soon!</p>
        )}
        
        <div className="text-center mt-3">
          <a href="/events" className="btn btn-outline">View All Events</a>
        </div>
      </section>
      
      {/* Support Section */}
      <section className="container mt-4 mb-4">
        <div className="card">
          <div className="card-header">
            <h2 className="text-center">Help Every Kid Get in the Game</h2>
          </div>
          <div className="card-body text-center">
            <p>
              Your donations provide free sports clinics and equipment to kids who might not otherwise have the chance to play. Every contribution helps us reach more communities and inspire the next generation of athletes.
            </p>
            <a href="/donate" className="btn btn-secondary mt-2">Support Our Mission</a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;