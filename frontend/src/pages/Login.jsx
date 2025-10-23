import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../firebaseConfig'; // Import the auth instance


const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const googleButtonDivRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get('redirect') || '/dashboard';

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
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
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
      // Check if this is the test admin login
      const normalizedEmail = email.trim().toLowerCase();
      const testAdminEmails = ['kidsinmotion0@gmail.com', 'kidsinmotion@gmail.com'];
      if (testAdminEmails.includes(normalizedEmail) && password === 'admin123') {
        // Use test login endpoint
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/test-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
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

      // Fall back to Firebase authentication for other users
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Email/Password Sign in successful:", userCredential.user);
      // Navigation is handled by onAuthStateChanged effect
    } catch (error) {
      console.error('Login error:', error);

      // Convert Firebase error codes to user-friendly messages
      let errorMessage = 'Login failed. Please check your credentials.';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address. Please register first.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please try again.';
          break;
        default:
          if (error.message.includes('network-request-failed')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else if (error.message.includes('internal-error')) {
            errorMessage = 'A server error occurred. Please try again later.';
          }
          break;
      }

      setError(errorMessage);
      setIsLoading(false);
    }
    // No finally block needed for setIsLoading(false) here, as it's handled by the effect or error catch
  };

  const handleGoogleSignIn = async (response) => {
    setIsLoading(true);
    setError(null);
    console.log("Google Sign-In response:", response);
    try {
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      setResetMessage('Please enter your email address.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setResetMessage('');

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
    } catch (error) {
      console.error('Password reset error:', error);

      let errorMessage = 'Failed to send password reset email. Please try again.';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address. Please check the email or register for a new account.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many password reset attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          if (error.message.includes('network-request-failed')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          }
          break;
      }

      setResetMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetMessage('');
    setResetEmail('');
    setError(null);
  };

  useEffect(() => {
    if (typeof window.google !== 'undefined' && window.google.accounts && googleButtonDivRef.current) {
      window.google.accounts.id.initialize({
        client_id: "839796180413-i0uvjtqpus9rj5pnvk7jngb31n6qvco4.apps.googleusercontent.com",
        callback: handleGoogleSignIn,
      });
      window.google.accounts.id.renderButton(
        googleButtonDivRef.current,
        { theme: "outline", size: "large", type: "standard", text: "signin_with" } 
      );
      // Optional: google.accounts.id.prompt(); // For One Tap sign-in
    } else {
      // Handle case where Google script might not be loaded yet or div isn't rendered
      // This might require a retry mechanism or ensuring script loads before component mount
      console.log("Google GSI not ready or div not available yet.");
    }
    // Cleanup function for GSI if needed, though renderButton doesn't return a cleanup
    // For prompt, one might use google.accounts.id.cancel()
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
      <div className="container mt-4 flex justify-center items-start min-h-[calc(100vh-200px)]"> 
        {/* Adjust min-height based on header/footer */}
        <div className="w-full max-w-md"> {/* Control the width of the card */}
            <div className="card"> {/* Use theme card style (shadow included) */}
              <div className="card-header"> {/* Use theme card-header style */}
                {/* Ensure h1 color contrasts with header bg if needed, theme handles white text */}
                <h1 className="text-2xl font-bold text-center mb-0">
                  {showForgotPassword ? 'Reset Password' : 'Login'}
                </h1>
              </div>
              <div className="card-body">
                {!showForgotPassword ? (
                  // Login Form
                  <>
                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                      </div>
                    )}

                    <form onSubmit={handleEmailPasswordLogin}>
                      <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          className={`form-control ${formErrors.email ? 'border-red-500' : ''}`}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-xs italic mt-1">{formErrors.email}</p>
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

                      <div className="mt-4">
                        <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                          {isLoading ? 'Logging in...' : 'Login with Email'}
                        </button>
                      </div>

                      <div className="mt-3 text-center">
                        <button
                          type="button"
                          className="text-sm text-indigo-600 hover:text-indigo-500 hover:underline focus:outline-none"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Forgot your password?
                        </button>
                      </div>
                    </form>

                    <div className="my-4 text-center">
                      <span className="text-xs uppercase text-gray-400 font-semibold">OR</span>
                    </div>

                    <div className="mb-4 flex justify-center">
                       <div id="googleSignInButtonDiv" ref={googleButtonDivRef}></div>
                    </div>
                    {isLoading && (
                       <div className="text-center text-sm text-gray-500">
                           <span>Processing Google Sign-In...</span>
                       </div>
                    )}

                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link
                          to="/register"
                          className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                          style={{ display: 'inline-block', padding: '0.25rem', position: 'relative', zIndex: 10 }}
                        >
                          Register
                        </Link>
                      </p>
                    </div>
                  </>
                ) : (
                  // Forgot Password Form
                  <>
                    {resetMessage && (
                      <div className={`border px-4 py-3 rounded relative mb-4 ${
                        resetMessage.includes('sent') ?
                        'bg-green-100 border-green-400 text-green-700' :
                        'bg-red-100 border-red-400 text-red-700'
                      }`} role="alert">
                        <span className="block sm:inline">{resetMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleForgotPassword}>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Enter your email address and we'll send you a link to reset your password.
                        </p>
                      </div>

                      <div className="form-group">
                        <label htmlFor="resetEmail">Email</label>
                        <input
                          type="email"
                          id="resetEmail"
                          className="form-control"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          placeholder="Enter your email address"
                        />
                      </div>

                      <div className="mt-4">
                        <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                          {isLoading ? 'Sending...' : 'Send Reset Email'}
                        </button>
                      </div>
                    </form>

                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        className="text-sm text-indigo-600 hover:text-indigo-500 hover:underline focus:outline-none"
                        onClick={handleBackToLogin}
                      >
                        Back to Login
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        {/* Removed extra closing div */}
      </div>
    </>
  );
};

export default Login;
