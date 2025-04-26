import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

const Layout = ({ children }) => {
  const { currentUser, logout, loading } = useAuth(); // Get currentUser and logout function
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to home page after logout
      navigate('/');
      console.log('Logout successful, navigating to home.');
    } catch (error) {
      console.error('Failed to log out:', error);
      // Optionally show an error message to the user
    }
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm"> {/* Added Bootstrap classes */}
        <div className="container"> {/* Use container for better alignment */}
          <Link to="/" className="navbar-brand"> {/* Use Link */}
            Kids in Motion
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0"> {/* Use Bootstrap nav classes */}
              <li className="nav-item">
                <Link to="/" className="nav-link">Home</Link> {/* Use Link */}
              </li>
              <li className="nav-item">
                <Link to="/events" className="nav-link">Events</Link> {/* Use Link */}
              </li>
              {/* Consider if Volunteer link should be public or protected */}
              {/* <li className="nav-item">
                <Link to="/volunteer" className="nav-link">Volunteer</Link>
              </li> */}
              <li className="nav-item">
                <Link to="/about" className="nav-link">About Us</Link> {/* Use Link */}
              </li>
              {currentUser && ( // Show Dashboard only if logged in
                <li className="nav-item">
                  <Link to="/dashboard" className="nav-link">Dashboard</Link> {/* Use Link */}
                </li>
              )}
            </ul>
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0"> {/* Right-aligned items */}
              {!loading && ( // Only render auth links when loading is complete
                currentUser ? (
                  <>
                    <li className="nav-item dropdown">
                       <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                         {currentUser.displayName || currentUser.email}
                       </a>
                       <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                         <li><Link className="dropdown-item" to="/profile">My Profile</Link></li> {/* Example link */}
                         <li><hr className="dropdown-divider" /></li>
                         <li><button onClick={handleLogout} className="dropdown-item" style={{ cursor: 'pointer' }}>Logout</button></li>
                       </ul>
                     </li>
                  </>
                ) : (
                  <>
                    <li className="nav-item">
                      <Link to="/login" className="nav-link">Login</Link> {/* Use Link */}
                    </li>
                    <li className="nav-item">
                      <Link to="/register" className="btn btn-primary ms-lg-2">Register</Link> {/* Use Link */}
                    </li>
                  </>
                )
              )}
              {loading && ( // Optional: Show loading indicator in navbar
                 <li className="nav-item">
                    <span className="navbar-text">Loading...</span>
                 </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <main className="container mt-4"> {/* Added container and margin */}
        {children}
      </main>

      <footer className="footer mt-auto py-3 bg-light"> {/* Basic footer styling */}
         <div className="container">
           <div className="row">
             <div className="col-md-4 mb-3">
               <h5>Kids in Motion</h5>
               <p className="text-muted small">Empowering every kid to play and learn through sports.</p>
             </div>
             <div className="col-md-4 mb-3">
               <h5>Quick Links</h5>
               <ul className="list-unstyled text-small">
                 <li><Link to="/events" className="text-muted">Upcoming Events</Link></li>
                 {/* <li><Link to="/volunteer" className="text-muted">Volunteer Opportunities</Link></li> */}
                 <li><Link to="/about" className="text-muted">About Us</Link></li>
                 {/* <li><Link to="/contact" className="text-muted">Contact Us</Link></li> */}
               </ul>
             </div>
             <div className="col-md-4 mb-3">
               <h5>Connect</h5>
               {/* Add social links if needed */}
               <p className="text-muted small">Follow us on social media!</p>
             </div>
           </div>
           <div className="text-center text-muted small mt-3">
             &copy; {new Date().getFullYear()} Kids in Motion. All rights reserved.
           </div>
         </div>
       </footer>
    </div>
  );
};

export default Layout;