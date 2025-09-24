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
const VolunteerApplication = lazy(() => import('./pages/VolunteerApplication'));
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
    return <div className="container mt-4 text-center"><p>Loading authentication...</p></div>;
  }

  if (!currentUser) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
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
                <Route path="/volunteer" element={<VolunteerApplication />} />

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

