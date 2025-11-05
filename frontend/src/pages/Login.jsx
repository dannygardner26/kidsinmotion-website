import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, onAuthStateChanged } from "firebase/auth";
import { auth } from '../firebaseConfig'; // Import the auth instance
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';


const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsGoogleOAuthLogin } = useAuth();
  // No more tabs - single input field
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const googleButtonDivRef = useRef(null);

  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get('redirect') || '/dashboard';

  // Clear errors when identifier changes
  useEffect(() => {
    if (identifier) {
      setFormErrors({});
      setError(null);
    }
  }, [identifier]);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User signed in, navigating:", user);
        navigate(redirectUrl, { replace: true });
      } else {
        console.log("User not signed in.");
        setIsLoading(false); // Ensure loading is false if no user
      }
    });
    return () => unsubscribe();
  }, [navigate, redirectUrl]);

  const validateForm = () => {
    const errors = {};
    if (!identifier.trim()) {
      errors.identifier = 'Email, username, or phone number is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const normalizedIdentifier = identifier.trim().toLowerCase();

      // Check if this is the test admin login
      const testAdminEmails = ['kidsinmotion0@gmail.com', 'kidsinmotion@gmail.com'];
      if (testAdminEmails.includes(normalizedIdentifier) && password === 'admin123') {
        // Use test login endpoint
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/test-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedIdentifier,
            password: password
          })
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('Test admin login successful:', userData);

          // Store user data in localStorage (temporary for development)
          localStorage.setItem('testUser', JSON.stringify(userData));
          localStorage.setItem('isTestAdmin', 'true');

          // Navigate to dashboard
          navigate('/dashboard');
          return;
        } else {
          throw new Error('Test admin login failed');
        }
      }

      // Get email from identifier using backend API
      const identifierResponse = await apiService.loginWithIdentifier(normalizedIdentifier);

      if (!identifierResponse.exists) {
        setError('No account found with that username, email, or phone number');
        return;
      }

      const email = identifierResponse.email;

      // Use Firebase authentication with resolved email
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Email/Password Sign in successful:", userCredential.user);
      // Navigation is handled by onAuthStateChanged effect
    } catch (error) {
      console.error('Login error:', error);

      // Convert Firebase error codes to user-friendly messages
      let userMessage = 'Login failed. Please check your credentials.';
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            userMessage = 'Invalid email or password. Please check your credentials and try again.';
            break;
          case 'auth/invalid-email':
            userMessage = 'Please enter a valid email address.';
            break;
          case 'auth/user-disabled':
            userMessage = 'This account has been disabled. Please contact support.';
            break;
          case 'auth/too-many-requests':
            userMessage = 'Too many failed login attempts. Please try again later.';
            break;
          case 'auth/network-request-failed':
            userMessage = 'Network error. Please check your internet connection and try again.';
            break;
          default:
            userMessage = 'Login failed. Please try again or contact support if the problem persists.';
            break;
        }
      }

      setError(userMessage);
      setIsLoading(false);
    }
    // No finally block needed for setIsLoading(false) here, as it's handled by the effect or error catch
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address');
      return;
    }

    setResetError('');
    setIsLoading(true);

    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess(true);
      setTimeout(() => {
        setShowPasswordReset(false);
        setResetSuccess(false);
        setResetEmail('');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send password reset email. Please try again.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }

      setResetError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (response) => {
    setIsLoading(true);
    setError(null);
    console.log("Google Sign-In response:", response);
    try {
      // Flag this as a Google OAuth login
      setIsGoogleOAuthLogin(true);

      const idToken = response.credential;
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      // Navigation is handled by onAuthStateChanged effect
      // setIsLoading(false) will be handled by onAuthStateChanged or error
    } catch (error) {
      console.error('Google Sign in error:', error);
      setError(error.message || 'Google Sign-in failed.');
      setIsLoading(false);
    }
  };

  const handleTestLogin = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(redirectUrl);
    } catch (error) {
      console.error('Test login error:', error);
      setError('Test login failed. Account may not exist yet.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (typeof window.google !== 'undefined' && window.google.accounts && googleButtonDivRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: "839796180413-30kvc5flvdeo29pks8r9kkf1jr67ccju.apps.googleusercontent.com",
            callback: handleGoogleSignIn,
          });
          window.google.accounts.id.renderButton(
            googleButtonDivRef.current,
            { theme: "outline", size: "large", type: "standard", text: "signin_with" }
          );
          if (process.env.NODE_ENV !== 'production') {
            console.log("Google Sign-In initialized successfully");
          }
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error("Error initializing Google Sign-In:", error);
          }
        }
      } else {
        // Retry after a short delay if Google script hasn't loaded yet
        if (process.env.NODE_ENV !== 'production') {
          console.log("Google GSI not ready, retrying in 500ms...");
        }
        setTimeout(initializeGoogleSignIn, 500);
      }
    };

    // Try to initialize immediately
    initializeGoogleSignIn();

    // Also listen for the script load event
    const handleGoogleScriptLoad = () => {
      initializeGoogleSignIn();
    };

    // Add event listener for when the script loads
    if (typeof window.google === 'undefined') {
      window.addEventListener('load', handleGoogleScriptLoad);
    }

    return () => {
      window.removeEventListener('load', handleGoogleScriptLoad);
    };
  }, []); // Run once on mount

  // Initial loading state before Firebase auth check completes (optional, can be brief)
  // The onAuthStateChanged will set isLoading to false if no user is found.
  // If a user IS found, it navigates, so this loading state might not be visible for long.
  // Consider if a global loading indicator is better if auth check is slow.
  // For now, the existing isLoading logic should cover most cases.
  // if (isLoading && !error) { 
  //     return <><div className="container mt-4 text-center"><p>Loading...</p></div></>;
  // }


  return (
    <>
      {/* Use flexbox for centering */}
      <div className="container mt-4 flex justify-center items-start min-h-[calc(100vh-200px)]" style={{ marginTop: '6rem' }}> 
        {/* Adjust min-height based on header/footer */}
        <div className="w-full max-w-md"> {/* Control the width of the card */}
            <div className="card"> {/* Use theme card style (shadow included) */}
              <div className="card-header"> {/* Use theme card-header style */}
                {/* Ensure h1 color contrasts with header bg if needed, theme handles white text */}
                <h1 className="text-2xl font-bold text-center mb-0">Login</h1> 
              </div>
              <div className="card-body">
                {error && (
                  // Use Tailwind for alert, leveraging theme colors
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}

                {/* Login Form */}
                  <form onSubmit={handleEmailPasswordLogin}>
                    {/* Use theme form-group */}
                    <div className="form-group">
                      <label htmlFor="identifier">Email, Username, or Phone</label>
                      <input
                        type="text"
                        id="identifier"
                        placeholder="Enter your email, username, or phone number"
                        className={`form-control ${formErrors.identifier ? 'is-invalid' : ''}`}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                      />
                      {formErrors.identifier && (
                        <div className="invalid-feedback">{formErrors.identifier}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <input
                        type="password"
                        id="password"
                        className={`form-control ${formErrors.password ? 'border-red-500' : ''}`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      {formErrors.password && (
                        <p className="text-red-500 text-xs italic mt-1">{formErrors.password}</p>
                      )}
                    </div>

                    {/* Forgot Password Link */}
                    <div className="text-right mt-2">
                      <button
                        type="button"
                        onClick={() => setShowPasswordReset(true)}
                        className="text-blue-600 text-sm hover:text-blue-800"
                      >
                        Forgot your password?
                      </button>
                    </div>

                    <div className="mt-4">
                      <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                      </button>
                    </div>
                  </form>

                {/* Divider */}
                <div className="my-4 text-center">
                  <span className="text-xs uppercase text-gray-400 font-semibold">OR</span>
                </div>

                {/* Google Sign-in Button */}
                <div className="mb-4 text-center">
                  <div id="googleSignInButtonDiv" ref={googleButtonDivRef}>
                    <div className="text-center text-sm text-gray-500 p-3">
                      <span>Loading Google Sign-In...</span>
                    </div>
                  </div>
                  {isLoading && (
                    <div className="text-center text-sm text-gray-500 mt-2">
                      <span>Processing Google Sign-In...</span>
                    </div>
                  )}
                </div>

                {/* Test Account Buttons - Only in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 mb-4">
                    <div className="text-center text-xs uppercase text-gray-400 font-semibold mb-3">
                      Quick Test Accounts
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestLogin('parent@gmail.com', 'parent')}
                        className="w-full px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        disabled={isLoading}
                      >
                        Test Parent
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestLogin('volunteer@gmail.com', 'volunteer')}
                        className="w-full px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        disabled={isLoading}
                      >
                        Test Volunteer
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 text-center mt-2">
                      For testing purposes only
                    </div>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link 
                      to="/register" 
                      className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                      style={{ display: 'inline-block', padding: '0.25rem', position: 'relative', zIndex: 10 }} // Ensure clickability
                    >
                      Register
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        {/* Removed extra closing div */}
      </div>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Reset Password</h3>

            {resetSuccess ? (
              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                color: '#155724',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                Password reset instructions sent to {resetEmail}! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handlePasswordReset}>
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="resetEmail" style={{ display: 'block', marginBottom: '5px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {resetError && (
                  <div style={{
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    color: '#721c24',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    fontSize: '14px'
                  }}>
                    {resetError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setResetError('');
                      setResetEmail('');
                    }}
                    disabled={isLoading}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #ccc',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      backgroundColor: '#007bff',
                      color: 'white',
                      borderRadius: '4px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.6 : 1
                    }}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
