import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FirebaseImage from './FirebaseImage';

const Layout = ({ children }) => {
  const { currentUser, userProfile, logout, loading } = useAuth();
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

  const isTransparentHeaderPage = location.pathname === '/' || location.pathname === '/events' || location.pathname === '/about';

  // Add/remove body class based on transparent header pages
  useEffect(() => {
    if (isTransparentHeaderPage) {
      document.body.classList.add('transparent-header-page-body'); // Use a more generic class name
    } else {
      document.body.classList.remove('transparent-header-page-body');
    }
    // Cleanup on component unmount or path change
    return () => {
      document.body.classList.remove('transparent-header-page-body');
    };
  }, [location.pathname, isTransparentHeaderPage]); // Add isTransparentHeaderPage dependency

  const handleManageProfile = () => {
    setMenuOpen(false);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      setMenuOpen(false);
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

  const isHomePage = location.pathname === '/';

  // const isHomePage = location.pathname === '/'; // No longer needed directly here

  return (
    <div>
      {/* Header with scroll animation */}
      {/* Use isTransparentHeaderPage for the conditional class */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${isTransparentHeaderPage && !isScrolled ? 'navbar-transparent' : ''}`}>
        <div className="container navbar-container">
          <Link to="/" className="navbar-logo">
            <FirebaseImage src="realKIMlogo-transparent.png" alt="Kids in Motion" width={60} height={60} />
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
            {currentUser && userProfile?.roles?.includes('ROLE_ADMIN') && (
              <li className="navbar-item">
                <Link to="/admin" className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                  Admin
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
                      <button type="button" onClick={handleManageProfile} className="dropdown-item">Manage Profile</button>
                      <div className="dropdown-divider"></div>
                      <button type="button" onClick={handleLogout} className="dropdown-item">Logout</button>
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
              fill="#2f506a"
              fillOpacity="1"
              d="M0,64L60,58.7C120,53,240,43,360,48C480,53,600,75,720,75C840,75,960,53,1080,48C1200,43,1320,53,1380,58.7L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            ></path>
          </svg>
        </div>
        
        <div className="container footer-content">
          <div className="row">
            <div className="col-third">
              <div className="footer-logo">
                <Link to="/" className="navbar-logo" style={{ color: 'white' }}>
                  <FirebaseImage src="realKIMlogo-transparent.png" alt="Kids in Motion" width={60} height={60} />
                </Link>
              </div>
              <p className="mb-2">Empowering every kid to play and learn through sports.</p>
              <div className="footer-social">
                <a href="https://www.facebook.com/profile.php?id=61568245202675" className="social-icon" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://www.instagram.com/kids_in_motion0/" className="social-icon" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i>
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
