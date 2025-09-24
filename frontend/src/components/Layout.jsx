import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assetUrls } from '../utils/firebaseAssets';
import { useNotifications } from '../context/NotificationContext';
import InboxModal from './InboxModal';

const Layout = ({ children }) => {
  const { currentUser, userProfile, logout, loading } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);

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

  // Animate elements on scroll - Temporarily disabled to fix React DOM errors
  useEffect(() => {
    // Simple fallback: just add visible class to all animation elements immediately
    const timeoutId = setTimeout(() => {
      try {
        const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
        animatedElements.forEach(el => {
          if (el) {
            el.classList.add('visible');
          }
        });
      } catch (error) {
        console.warn('Animation setup error:', error);
      }
    }, 100);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && event.target && !event.target.closest('.dropdown')) {
        setDropdownOpen(false);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('click', handleClickOutside);
      return () => {
        try {
          document.removeEventListener('click', handleClickOutside);
        } catch (error) {
          console.warn('Error removing click listener:', error);
        }
      };
    }
  }, [dropdownOpen]);

  // Add/remove body class based on transparent header pages
  useEffect(() => {
    const transparentPages = location.pathname === '/' || location.pathname === '/events' || location.pathname === '/about';

    // Simple body class management without timeouts
    if (document.body) {
      if (transparentPages) {
        document.body.classList.add('transparent-header-page-body');
      } else {
        document.body.classList.remove('transparent-header-page-body');
      }
    }

    // Cleanup - remove on unmount only
    return () => {
      if (document.body) {
        document.body.classList.remove('transparent-header-page-body');
      }
    };
  }, [location.pathname]);

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

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const isHomePage = location.pathname === '/';
  const hasTransparentHeader = location.pathname === '/' || location.pathname === '/events' || location.pathname === '/about';

  return (
    <div>
      {/* Header with scroll animation */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${hasTransparentHeader && !isScrolled ? 'navbar-transparent' : ''}`}>
        <div className="container navbar-container">
          <Link to="/" className="navbar-logo">
            <img src={assetUrls['realKIMlogo-transparent.png']} alt="Kids in Motion" width="60" height="60" />
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
            <li className="navbar-item">
              <Link to="/volunteer" className={`navbar-link ${location.pathname === '/volunteer' ? 'active' : ''}`}>
                Volunteer
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

            {/* Inbox Button */}
            <li className="navbar-item">
              <button
                onClick={() => setInboxOpen(true)}
                className="navbar-link"
                style={{
                  position: 'relative'
                }}
              >
                Inbox
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </li>

            {!loading && (
              currentUser ? (
                <li className="navbar-item">
                  <div className={`dropdown ${dropdownOpen ? 'show' : ''}`}>
                    <button
                      className="navbar-link dropdown-toggle"
                      onClick={toggleDropdown}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {currentUser.displayName || currentUser.email}
                      <span style={{ fontSize: '0.8rem' }}>{dropdownOpen ? '▲' : '▼'}</span>
                    </button>
                    <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`} style={{
                      display: dropdownOpen ? 'block' : 'none',
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      backgroundColor: 'white',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      minWidth: '160px',
                      zIndex: '1000',
                      marginTop: '0.5rem'
                    }}>
                      <Link className="dropdown-item" to="/dashboard" style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        color: '#333',
                        textDecoration: 'none',
                        borderBottom: '1px solid #eee'
                      }}>
                        <i className="fas fa-user mr-2"></i>
                        My Profile
                      </Link>
                      <button onClick={handleLogout} className="dropdown-item" style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.75rem 1rem',
                        color: '#333',
                        textDecoration: 'none',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}>
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        Logout
                      </button>
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

      <footer className="footer" id="main-footer">
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
                  <img src={assetUrls['realKIMlogo-transparent.png']} alt="Kids in Motion" width="60" height="60" />
                </Link>
              </div>
              <p className="mb-2">Empowering every kid to play and learn through sports.</p>
              <div className="footer-social">
                <a href="https://www.facebook.com/profile.php?id=61568245202675" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://www.instagram.com/kids_in_motion0/" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
            
            <div className="col-third">
              <h4 style={{ color: 'white' }}>Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/events">Upcoming Events</Link></li>
                <li><a href="https://venmo.com/ryanspiess22" target="_blank" rel="noopener noreferrer">Support Our Mission</a></li>
                <li><Link to="/about">About Us</Link></li>
              </ul>
            </div>
            
            <div className="col-third">
              <h4 style={{ color: 'white' }}>Contact Us</h4>
              <ul className="footer-links">
                <li><i className="fas fa-envelope mr-2"></i> kidsinmotion0@gmail.com</li>
                <li><i className="fas fa-phone mr-2"></i> (484) 885-6284</li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Kids in Motion. All rights reserved.</p>
          </div>
        </div>
      </footer>


      {/* Inbox Modal */}
      <InboxModal
        isOpen={inboxOpen}
        onClose={() => setInboxOpen(false)}
      />
    </div>
  );
};

export default Layout;
