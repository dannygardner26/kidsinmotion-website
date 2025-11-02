import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';

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
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const EventVolunteers = lazy(() => import('./pages/EventVolunteers'));
const EventRegistrations = lazy(() => import('./pages/EventRegistrations'));
const EventStats = lazy(() => import('./pages/EventStats'));
const EventCheckIn = lazy(() => import('./pages/EventCheckIn'));
const EventOverview = lazy(() => import('./pages/EventOverview'));
const VolunteerEventView = lazy(() => import('./pages/VolunteerEventView'));
const ParentEventView = lazy(() => import('./pages/ParentEventView'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

// CSS
import './css/app.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="container mt-4 text-center"><p>Loading authentication...</p></div>;
  }

  if (!currentUser) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }

  return children;
};

// Verified Route Component - requires verification for certain actions
const VerifiedRoute = ({ children }) => {
  const { currentUser, loading, isVerified } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="container mt-4 text-center"><p>Loading authentication...</p></div>;
  }

  if (!currentUser) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }

  if (!isVerified) {
    return <Navigate to="/dashboard?verify=true" replace />;
  }

  return children;
};

// Component to prevent logged-in users from accessing login/register
const PublicRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="container mt-4 text-center"><p>Loading authentication...</p></div>;
    }

    if (currentUser) {
        // Check for redirect parameter in URL
        const urlParams = new URLSearchParams(location.search);
        const redirectTo = urlParams.get('redirect') || '/dashboard';
        return <Navigate to={redirectTo} replace />;
    }

    return children;
}

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Layout>
            <Suspense fallback={
              <div className="container mt-4">
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading...</p>
                </div>
              </div>
            }>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />

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
                    <VerifiedRoute>
                      <EventRegistration />
                    </VerifiedRoute>
                  }
                />
                <Route
                  path="/events/:id/volunteer"
                  element={
                    <VerifiedRoute>
                      <VolunteerSignup />
                    </VerifiedRoute>
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
                <Route
                  path="/admin/events/edit/:id"
                  element={
                    <ProtectedRoute>
                      <CreateEvent />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/events/:id/volunteers"
                  element={
                    <ProtectedRoute>
                      <EventVolunteers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/events/:id/participants"
                  element={
                    <ProtectedRoute>
                      <EventRegistrations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/events/:id/stats"
                  element={
                    <ProtectedRoute>
                      <EventStats />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/events/:id/checkin"
                  element={
                    <ProtectedRoute>
                      <EventCheckIn />
                    </ProtectedRoute>
                  }
                />

                {/* New Event View Routes */}
                <Route
                  path="/events/:id/volunteer-view"
                  element={
                    <ProtectedRoute>
                      <VolunteerEventView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/:id/parent-view"
                  element={
                    <ProtectedRoute>
                      <ParentEventView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/events/:id/overview"
                  element={
                    <ProtectedRoute>
                      <EventOverview />
                    </ProtectedRoute>
                  }
                />

                {/* User Profile Route */}
                <Route
                  path="/profile/:username"
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all Not Found Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;

