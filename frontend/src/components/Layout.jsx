import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { currentUser, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Animate elements on scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const handleIntersect = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    
    // Observe all elements with animation classes
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      if (animatedElements) {
        animatedElements.forEach(el => observer.unobserve(el));
      }
    };
  }, [location.pathname]); // Re-run when route changes

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      console.log('Logout successful, navigating to home.');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div>
      {/* Header with scroll animation */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-container">
          <Link to="/" className="navbar-logo">
            <svg width="40" height="40" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <path fill="#2f506a" d="M256 48c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 96c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48z"/>
              <path fill="#e64f50" d="M256 0c-70.7 0-128 57.3-128 128 0 70.7 57.3 128 128 128 70.7 0 128-57.3 128-128C384 57.3 326.7 0 256 0zm0 224c-52.9 0-96-43.1-96-96s43.1-96 96-96 96 43.1 96 96-43.1 96-96 96z"/>
              <path fill="#2f506a" d="M240 256v160c0 26.5 21.5 48 48 48s48-21.5 48-48V256h-96z"/>
              <path fill="#e64f50" d="M176 256v160c0 26.5 21.5 48 48 48s48-21.5 48-48V256h-96z"/>
            </svg>
            Kids in Motion
          </Link>
          
          <button 
            className={`navbar-toggler ${menuOpen ? 'open' : ''}`} 
            onClick={toggleMenu}
            aria-label="Toggle navigation"
          >
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <ul className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
            <li className="navbar-item">
              <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
                Home
              </Link>
            </li>
            <li className="navbar-item">
              <Link to="/events" className={`navbar-link ${location.pathname.includes('/events') ? 'active' : ''}`}>
                Events
              </Link>
            </li>
            <li className="navbar-item">
              <Link to="/about" className={`navbar-link ${location.pathname === '/about' ? 'active' : ''}`}>
                About Us
              </Link>
            </li>
            {currentUser && (
              <li className="navbar-item">
                <Link to="/dashboard" className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                  Dashboard
                </Link>
              </li>
            )}
            
            {!loading && (
              currentUser ? (
                <li className="navbar-item">
                  <div className="dropdown">
                    <button className="navbar-link dropdown-toggle">
                      {currentUser.displayName || currentUser.email}
                    </button>
                    <div className="dropdown-menu">
                      <Link className="dropdown-item" to="/profile">My Profile</Link>
                      <div className="dropdown-divider"></div>
                      <button onClick={handleLogout} className="dropdown-item">Logout</button>
                    </div>
                  </div>
                </li>
              ) : (
                <>
                  <li className="navbar-item">
                    <Link to="/login" className={`navbar-link ${location.pathname === '/login' ? 'active' : ''}`}>
                      Login
                    </Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/register" className="btn btn-secondary">Register</Link>
                  </li>
                </>
              )
            )}
          </ul>
        </div>
      </nav>

      <main>
        {children}
      </main>

      <footer className="footer">
        <div className="footer-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path
              fill="#ede9e7"
              fillOpacity="1"
              d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,74.7C1248,75,1344,53,1392,42.7L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            ></path>
          </svg>
        </div>
        
        <div className="container footer-content">
          <div className="row">
            <div className="col-third">
              <div className="footer-logo">
                <Link to="/" className="navbar-logo" style={{ color: 'white' }}>
                  <svg width="40" height="40" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                    <path fill="white" d="M256 48c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 96c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48z"/>
                    <path fill="#eb7172" d="M256 0c-70.7 0-128 57.3-128 128 0 70.7 57.3 128 128 128 70.7 0 128-57.3 128-128C384 57.3 326.7 0 256 0zm0 224c-52.9 0-96-43.1-96-96s43.1-96 96-96 96 43.1 96 96-43.1 96-96 96z"/>
                    <path fill="white" d="M240 256v160c0 26.5 21.5 48 48 48s48-21.5 48-48V256h-96z"/>
                    <path fill="#eb7172" d="M176 256v160c0 26.5 21.5 48 48 48s48-21.5 48-48V256h-96z"/>
                  </svg>
                  Kids in Motion
                </Link>
              </div>
              <p className="mb-2">Empowering every kid to play and learn through sports.</p>
              <div className="footer-social">
                <a href="#" className="social-icon">
                  <i className="fab fa-facebook-f"></i>
                </a><a href="#" className="social-icon">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="social-icon">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="social-icon">
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>
            
            <div className="col-third">
              <h4 style={{ color: 'white' }}>Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/events">Upcoming Events</Link></li>
                <li><Link to="/donate">Support Our Mission</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>
            
            <div className="col-third">
              <h4 style={{ color: 'white' }}>Contact Us</h4>
              <ul className="footer-links">
                <li><i className="fas fa-envelope mr-2"></i> info@kidsinmotion.org</li>
                <li><i className="fas fa-phone mr-2"></i> (555) 123-4567</li>
                <li><i className="fas fa-map-marker-alt mr-2"></i> 123 Sports Ave, Anytown USA</li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Kids in Motion. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Intersection Observer Script */}
      <script>
        {`
          // Animation scroll functions will run from useEffect
        `}
      </script>
    </div>
  );
};

export default Layout;
