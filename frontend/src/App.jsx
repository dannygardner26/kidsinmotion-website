import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import AuthProvider and useAuth
import Layout from './components/Layout'; // Import Layout for consistent structure

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const EventRegistration = lazy(() => import('./pages/EventRegistration'));
const VolunteerSignup = lazy(() => import('./pages/VolunteerSignup'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));

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
        <Suspense fallback={
          <Layout>
            <div className="container mt-4">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
            </div>
          </Layout>
        }>
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
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/new"
            element={
              <ProtectedRoute>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          {/* Add other protected routes here */}


          {/* Catch-all Not Found Route */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
};

export default App;

// Add global styles for loading spinner
const globalStyles = `
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(47, 80, 106, 0.3);
  border-radius: 50%;
  border-top-color: var(--primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

// Inject styles if not already present
if (!document.querySelector('#global-loading-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'global-loading-styles';
  styleSheet.textContent = globalStyles;
  document.head.appendChild(styleSheet);
}