import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FirebaseImage from './FirebaseImage';
import Inbox, { useInboxCount } from './Inbox';

const Layout = ({ children }) => {
  const { currentUser, userProfile, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const unreadCount = useInboxCount();

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.dropdown')) {
        setDropdownOpen(false);
      }
      if (inboxOpen && !event.target.closest('.inbox-dropdown')) {
        setInboxOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, inboxOpen]);

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
    setDropdownOpen(false);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      setMenuOpen(false);
      setDropdownOpen(false);
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

<<<<<<< HEAD
=======
  const closeMenu = () => {
    setMenuOpen(false);
  };

>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
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
<<<<<<< HEAD
              <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
=======
              <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`} onClick={closeMenu}>
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                Home
              </Link>
            </li>
            <li className="navbar-item">
<<<<<<< HEAD
              <Link to="/events" className={`navbar-link ${location.pathname.includes('/events') ? 'active' : ''}`}>
=======
              <Link to="/events" className={`navbar-link ${location.pathname.includes('/events') ? 'active' : ''}`} onClick={closeMenu}>
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                Events
              </Link>
            </li>
            <li className="navbar-item">
<<<<<<< HEAD
              <Link to="/about" className={`navbar-link ${location.pathname === '/about' ? 'active' : ''}`}>
=======
              <Link to="/about" className={`navbar-link ${location.pathname === '/about' ? 'active' : ''}`} onClick={closeMenu}>
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                About Us
              </Link>
            </li>
            {currentUser && (
              <li className="navbar-item">
<<<<<<< HEAD
                <Link to="/dashboard" className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
=======
                <Link to="/dashboard" className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={closeMenu}>
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                  Dashboard
                </Link>
              </li>
            )}
            {currentUser && userProfile?.roles?.includes('ROLE_ADMIN') && (
              <li className="navbar-item">
<<<<<<< HEAD
                <Link to="/admin" className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}>
=======
                <Link to="/admin" className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`} onClick={closeMenu}>
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                  Admin
                </Link>
              </li>
            )}
            
            {!loading && (
              currentUser ? (
                <>
                  <li className="navbar-item">
                    <div className={`dropdown inbox-dropdown ${inboxOpen ? 'open' : ''}`}>
                      <button className="navbar-link inbox-trigger" onClick={() => setInboxOpen(!inboxOpen)}>
                        <i className="fas fa-inbox mr-2"></i>
                        Inbox
                        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                      </button>
                      <div className={`dropdown-menu inbox-dropdown-menu ${inboxOpen ? 'show' : ''}`}>
                        <Inbox isOpen={inboxOpen} onClose={() => setInboxOpen(false)} isDropdown={true} />
                      </div>
                    </div>
                  </li>
                  <li className="navbar-item">
                    <div className={`dropdown ${dropdownOpen ? 'open' : ''}`}>
                      <button className="navbar-link dropdown-toggle" onClick={toggleDropdown}>
                        {currentUser.displayName || currentUser.email}
                        <i className={`fas fa-chevron-down dropdown-arrow ${dropdownOpen ? 'open' : ''}`}></i>
                      </button>
                      <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                        <button type="button" onClick={handleManageProfile} className="dropdown-item">
                          <i className="fas fa-user mr-2"></i>Manage Profile
                        </button>
                        <div className="dropdown-divider"></div>
                        <button type="button" onClick={handleLogout} className="dropdown-item">
                          <i className="fas fa-sign-out-alt mr-2"></i>Logout
                        </button>
                      </div>
                    </div>
                  </li>
                </>
              ) : (
                <>
<<<<<<< HEAD
                  <li className="navbar-item">
                    <Link to="/login" className={`navbar-link ${location.pathname === '/login' ? 'active' : ''}`}>
=======
                  {/* Inbox for unregistered users */}
                  <li className="navbar-item">
                    <div className={`dropdown inbox-dropdown ${inboxOpen ? 'open' : ''}`}>
                      <button className="navbar-link inbox-trigger" onClick={() => setInboxOpen(!inboxOpen)}>
                        <i className="fas fa-inbox mr-2"></i>
                        Inbox
                        <span className="unread-badge">1</span>
                      </button>
                      <div className={`dropdown-menu inbox-dropdown-menu ${inboxOpen ? 'show' : ''}`}>
                        <div className="guest-inbox-container">
                          <div className="inbox-header">
                            <h5>Welcome to Kids in Motion!</h5>
                          </div>
                          <div className="inbox-message">
                            <div className="message-item guest-welcome-message">
                              <div className="message-header">
                                <span className="message-title">Join Our Community</span>
                                <span className="message-date">Now</span>
                              </div>
                              <div className="message-content">
                                <p><strong>Welcome!</strong> Create an account to:</p>
                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                                  <li>Register for sports clinics</li>
                                  <li>Receive important updates</li>
                                  <li>Track your participation</li>
                                  <li>Connect with our community</li>
                                </ul>
                                <div style={{ marginTop: '1rem' }}>
                                  <Link
                                    to="/register"
                                    className="btn btn-primary"
                                    style={{
                                      width: '100%',
                                      textAlign: 'center',
                                      textDecoration: 'none',
                                      display: 'block',
                                      padding: '0.75rem'
                                    }}
                                    onClick={() => setInboxOpen(false)}
                                  >
                                    Sign Up Today!
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="navbar-item">
                    <Link to="/login" className={`navbar-link ${location.pathname === '/login' ? 'active' : ''}`} onClick={closeMenu}>
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
                      Login
                    </Link>
                  </li>
                  <li className="navbar-item">
<<<<<<< HEAD
                    <Link to="/register" className="btn btn-secondary">Register</Link>
=======
                    <Link to="/register" className="btn btn-secondary" onClick={closeMenu}>Register</Link>
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
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
                <li><a href="https://account.venmo.com/u/ryanspiess22" target="_blank" rel="noopener noreferrer">Support Our Mission</a></li>
                <li><Link to="/about">About Us</Link></li>
              </ul>
            </div>

            <div className="col-third">
              <h4 style={{ color: 'white' }}>Contact Us</h4>
              <ul className="footer-links" style={{ listStyle: 'none' }}>
                <li><strong>Email:</strong> kidsinmotion0@gmail.com</li>
                <li><strong>Phone:</strong> (484) 885-6284</li>
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
