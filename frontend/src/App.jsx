import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import AuthProvider and useAuth

// Import pages
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import EventRegistration from './pages/EventRegistration';
import VolunteerSignup from './pages/VolunteerSignup';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import NotFound from './pages/NotFound';
import Layout from './components/Layout'; // Import Layout for consistent structure

// CSS
import './css/app.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Optional: Show a loading spinner or skeleton screen while checking auth state
    // Ensure Layout is used here if you want consistent header/footer during load
    return <Layout><div className="container mt-4 text-center"><p>Loading authentication...</p></div></Layout>;
  }

  if (!currentUser) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }

  return children; // Render the children (the protected page) if authenticated
};

// Component to prevent logged-in users from accessing login/register
const PublicRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <Layout><div className="container mt-4 text-center"><p>Loading authentication...</p></div></Layout>;
    }

    if (currentUser) {
        // Redirect logged-in users away from login/register to the dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children; // Render login/register if not logged in
}


const App = () => {
  return (
    <AuthProvider> {/* Wrap the entire app with AuthProvider */}
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/about" element={<About />} />

          {/* Routes only accessible when logged OUT */}
           <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
           <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />


          {/* Protected Routes - Require Login */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id/register"
            element={
              <ProtectedRoute>
                <EventRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id/volunteer"
            element={
              <ProtectedRoute>
                <VolunteerSignup />
              </ProtectedRoute>
            }
          />
          {/* Add other protected routes here */}


          {/* Catch-all Not Found Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;