import React, { useState, useEffect } from 'react';

const Layout = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, verify token validity here
      fetchUserProfile(token);
    }
  }, []);
  
  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsLoggedIn(true);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    window.location.href = '/';
  };
  
  return (
    <div>
      <nav className="navbar">
        <div className="container navbar-container">
          <a href="/" className="navbar-logo">
            Kids in Motion
          </a>
          
          <ul className="navbar-menu">
            <li className="navbar-item">
              <a href="/" className="navbar-link">Home</a>
            </li>
            <li className="navbar-item">
              <a href="/events" className="navbar-link">Events</a>
            </li>
            <li className="navbar-item">
              <a href="/volunteer" className="navbar-link">Volunteer</a>
            </li>
            <li className="navbar-item">
              <a href="/about" className="navbar-link">About Us</a>
            </li>
            {isLoggedIn ? (
              <>
                <li className="navbar-item">
                  <a href="/dashboard" className="navbar-link">Dashboard</a>
                </li>
                <li className="navbar-item">
                  <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                </li>
              </>
            ) : (
              <>
                <li className="navbar-item">
                  <a href="/login" className="navbar-link">Login</a>
                </li>
                <li className="navbar-item">
                  <a href="/register" className="btn btn-primary">Register</a>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
      
      <main>
        {children}
      </main>
      
      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-third">
              <h3>Kids in Motion</h3>
              <p>Empowering every kid to play and learn through sports.</p>
            </div>
            <div className="col-third">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="/events">Upcoming Events</a></li>
                <li><a href="/volunteer">Volunteer Opportunities</a></li>
                <li><a href="/about">About Us</a></li>
                <li><a href="/contact">Contact Us</a></li>
              </ul>
            </div>
            <div className="col-third">
              <h4>Connect With Us</h4>
              <div className="social-links">
                <a href="#" className="social-link">Facebook</a>
                <a href="#" className="social-link">Instagram</a>
                <a href="#" className="social-link">Twitter</a>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col text-center mt-4">
              <p>&copy; {new Date().getFullYear()} Kids in Motion. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;