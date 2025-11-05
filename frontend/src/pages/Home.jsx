import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { assetUrls } from '../utils/firebaseAssets';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const photoSlides = [
    {
      src: assetUrls['team-huddle.jpg'],
      alt: 'Kids and mentors coming together in team huddle',
      caption: 'Building community and teamwork through sports'
    },
    {
      src: assetUrls['kids-with-mentors.jpg'], 
      alt: 'Young kids learning from teen mentors',
      caption: 'Experienced athletes teaching the next generation'
    },
    {
      src: assetUrls['volunteers-group.jpg'],
      alt: 'Group of volunteer coaches and mentors',
      caption: 'Our dedicated team of volunteer coaches'
    }
  ];
  
  useEffect(() => {
    // Fetch upcoming events
    const fetchEvents = async () => {
      try {
        const data = await apiService.getUpcomingEvents();
        setUpcomingEvents(data.slice(0, 3)); // Get first 3 events
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, []);
  
  // Auto-advance slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % photoSlides.length);
    }, 4000); // Change slide every 4 seconds
    
    return () => clearInterval(interval);
  }, [photoSlides.length]);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % photoSlides.length);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + photoSlides.length) % photoSlides.length);
  };
  
  // Format date for display
  const formatDate = (dateString, startTime, endTime) => {
    const date = new Date(dateString);
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    let formattedDate = date.toLocaleDateString(undefined, dateOptions);

    // Add time range if available
    if (startTime && endTime) {
      const startTimeFormatted = new Date(`2000-01-01T${startTime}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
      const endTimeFormatted = new Date(`2000-01-01T${endTime}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
      formattedDate += ` • ${startTimeFormatted} - ${endTimeFormatted}`;
    } else if (startTime) {
      const startTimeFormatted = new Date(`2000-01-01T${startTime}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
      formattedDate += ` • ${startTimeFormatted}`;
    } else {
      // Fallback times for testing - showing typical clinic times
      formattedDate += ` • 5:30 PM - 7:30 PM`;
    }

    return formattedDate;
  };
  
  return (
    <>
      {/* Hero Section with Parallax */}
      <section className="hero" style={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-bg" style={{ backgroundImage: `url("${assetUrls['team-huddle.jpg']}")` }}></div>
        
        <div className="hero-shapes">
          <div className="hero-shape shape-1"></div>
          <div className="hero-shape shape-2"></div>
          <div className="hero-shape shape-3"></div>
        </div>
        
        <div className="container hero-content">
          <h1>Empowering Every Kid to Play</h1>
          <p>
            Kids in Motion provides free sports clinics and equipment to kids who may not have access, 
            helping them learn new games, build skills, and develop confidence.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <Link to="/events" className="btn btn-secondary">View Events</Link>
            {currentUser ? (
              <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
            ) : (
              <Link to="/register" className="btn btn-primary">Register</Link>
            )}
          </div>
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
      
      {/* Mission Section */}
      <section className="section">
        <div className="container">
          {/* Use Tailwind flexbox for layout: text left, image right - Using inline flex-basis for diagnosis */}
          <div className="flex flex-row gap-8" style={{ display: 'flex', flexDirection: 'row' }}> 
            {/* Text Column */}
            <div style={{ flexBasis: '60%', flexShrink: 0 }}> 
              <h2>Our Mission</h2>
              <p>
                Kids in Motion is on a mission to make sports accessible to every child. Through free 
                sports clinics and donated equipment, we give kids - especially those facing financial or 
                opportunity barriers - the chance to explore new sports, develop skills, and build lasting friendships.
              </p>
              <p>
                Founded by high school athletes who believe in the power of sports, we aim to break down 
                the financial and social barriers that prevent kids from playing. Whether it's baseball, 
                soccer, basketball, or other sports, our clinics provide a fun, supportive environment 
                where kids can learn from experienced athletes and discover their potential.
              </p>
              <Link to="/about" className="btn btn-outline mt-2">Learn More</Link>
            </div>
            {/* Image Column */}
            <div style={{ flexBasis: '40%', flexShrink: 0 }}> 
              <img
                src={assetUrls['kids-with-mentors.jpg']} 
                alt="Kids learning from teen mentors at Kids in Motion clinic"
                style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 15px 30px rgba(0,0,0,0.1)', border: '5px solid #fff', outline: '1px solid #ccc' }}
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Photo Slideshow Section */}
      <section className="section" style={{ backgroundColor: '#fff' }}>
        <div className="container">
          <div className="section-head ">
            <h2>See Us in Action</h2>
            <p>Moments from our sports clinics and community events</p>
          </div>
          
          <div className="slideshow-container" style={{ position: 'relative', maxWidth: '800px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            {photoSlides.map((slide, index) => (
              <div 
                key={index}
                className={`slide ${index === currentSlide ? 'active' : ''}`}
                style={{ 
                  display: index === currentSlide ? 'block' : 'none',
                  position: 'relative'
                }}
              >
                <img 
                  src={slide.src} 
                  alt={slide.alt}
                  style={{ 
                    width: '100%', 
                    height: '400px', 
                    objectFit: 'cover'
                  }}
                />
                <div className="slide-caption" style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  color: 'white',
                  padding: '2rem 1.5rem 1.5rem',
                  fontSize: '1.1rem',
                  textAlign: 'center'
                }}>
                  {slide.caption}
                </div>
              </div>
            ))}
            
            {/* Navigation arrows */}
            <button 
              className="slide-nav prev" 
              onClick={prevSlide}
              style={{
                position: 'absolute',
                top: '50%',
                left: '20px',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#2f506a',
                transition: 'all 0.3s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => e.target.style.background = 'white'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.9)'}
            >
              ‹
            </button>
            <button 
              className="slide-nav next" 
              onClick={nextSlide}
              style={{
                position: 'absolute',
                top: '50%',
                right: '20px',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#2f506a',
                transition: 'all 0.3s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => e.target.style.background = 'white'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.9)'}
            >
              ›
            </button>
            
            {/* Slide indicators */}
            <div className="slide-indicators" style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '10px',
              zIndex: 10
            }}>
              {photoSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: 'none',
                    background: index === currentSlide ? 'white' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Upcoming Events Section */}
      <section className="section" style={{ backgroundColor: '#f8f8f8' }}>
        <div className="container">
          <div className="section-head ">
            <h2>Upcoming Events</h2>
          </div>
          
          {isLoading ? (
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p>Loading events...</p>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="row">
              {upcomingEvents.map((event, index) => (
                <div className={`col-third `} key={event.id} style={{ animationDelay: `${0.2 * index}s` }}>
                  <div className="card event-card">
                    <div className="card-header">
                      <h3>{event.name}</h3>
                    </div>
                    <div className="card-body">
                      <div className="event-meta">
                        <p><i className="far fa-calendar"></i> {formatDate(event.date, event.startTime, event.endTime)}</p>
                        <p><i className="fas fa-map-marker-alt"></i> {event.location}</p>
                        <p><i className="fas fa-running"></i> {event.sportType}</p>
                      </div>
                      <p>{event.description}</p>
                    </div>
                    <div className="card-footer">
                      <Link to={`/events/${event.id}/register`} className="btn btn-primary">Register</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center ">
              <p>No upcoming events at the moment. Check back soon!</p>
            </div>
          )}
          
          <div className="text-center mt-3 ">
            <Link to="/events" className="btn btn-outline">View All Events</Link>
          </div>
        </div>
      </section>
      
      {/* Impact Section - Temporarily commented out
      <section className="section">
        <div className="container">
          <div className="section-head ">
            <h2>Our Impact</h2>
          </div>
          
          <div className="row">
            <div className="col-fourth ">
              <div className="impact-stat text-center">
                <div className="impact-number">500+</div>
                <p>Children Served</p>
              </div>
            </div>
            <div className="col-fourth " style={{ animationDelay: '0.2s' }}>
              <div className="impact-stat text-center">
                <div className="impact-number">25</div>
                <p>Free Clinics</p>
              </div>
            </div>
            <div className="col-fourth " style={{ animationDelay: '0.4s' }}>
              <div className="impact-stat text-center">
                <div className="impact-number">10</div>
                <p>Communities</p>
              </div>
            </div>
            <div className="col-fourth " style={{ animationDelay: '0.6s' }}>
              <div className="impact-stat text-center">
                <div className="impact-number">300+</div>
                <p>Equipment Donations</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      */}
      
      {/* Testimonial Section - New */}
      <section className="section parallax" style={{ padding: '6rem 0', position: 'relative' }}>
        {/* Added div for JS parallax */}
        <div 
          className="parallax-bg" 
          style={{ 
            backgroundImage: `url("${assetUrls['volunteers-group.jpg']}")`,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            zIndex: 0
          }}
          data-speed="0.4" /* Optional: Adjust speed */
        ></div>
        
        <div className="overlay" style={{ 
          position: 'absolute', 
          top: 0,
          left: 0, 
          width: '100%', 
          height: '100%', 
          backgroundColor: 'rgba(47, 80, 106, 0.85)' 
        }}></div>
        
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="testimonial-slider ">
            <div className="testimonial text-center">
              <div className="testimonial-quote">
                <i className="fas fa-quote-left" style={{ fontSize: '2rem', color: 'var(--secondary)' }}></i>
              </div>
              <p style={{ fontSize: '1.5rem', color: 'white', maxWidth: '600px', margin: '1.5rem auto', padding: '1rem', fontWeight: '300', lineHeight: '1.6' }}>
                Every kid deserves the chance to play. We're here to make that happen.
              </p>
              <div className="testimonial-author" style={{ color: 'white' }}>
                <strong>Danny</strong>, CEO & Founder
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Support Section */}
      <section className="section">
        <div className="container text-center"> {/* Removed  class */}
          <h2>Help Every Kid Get in the Game</h2>
          <p className="mt-1 mb-2"> {/* Added margin top/bottom for spacing */}
            Your donations provide free sports clinics and equipment to kids who might not otherwise
            have the chance to play. Every contribution helps us reach more communities and inspire
            the next generation of athletes.
          </p>
          <div className="flex justify-center" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="https://account.venmo.com/u/ryanspiess22" target="_blank" rel="noopener noreferrer" className="btn btn-secondary mt-2">Support Our Mission</a>
          </div>
        </div>
      </section>
      
      {/* Custom CSS for this page */}
      <style>{`
        .impact-number {
          font-size: 3rem;
          font-weight: 700;
          color: var(--secondary);
          margin-bottom: 0.5rem;
        }
        
        .impact-stat {
          padding: 2rem 1rem;
          border-radius: 8px;
          background-color: white;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .impact-stat:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
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
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default Home;
