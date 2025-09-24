import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, onAuthStateChanged } from "firebase/auth";
import { auth } from '../firebaseConfig'; // Import the auth instance
import Layout from '../components/Layout';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
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
      if (email === 'kidsinmotion0@gmail.com' && password === 'admin123') {
        console.log('Using test admin login...');

        // Use test login endpoint
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/test-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
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
      setError(error.message || 'Login failed. Please check your credentials.');
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
  //     return <Layout><div className="container mt-4 text-center"><p>Loading...</p></div></Layout>;
  // }


  return (
    <Layout>
      {/* Use flexbox for centering */}
      <div className="container mt-4 flex justify-center items-start min-h-[calc(100vh-200px)]"> 
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

                <form onSubmit={handleEmailPasswordLogin}>
                  {/* Use theme form-group */}
                  <div className="form-group"> 
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      // Use theme form-control
                      className={`form-control ${formErrors.email ? 'border-red-500' : ''}`} 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                    {formErrors.email && (
                      // Simple error text styling
                      <p className="text-red-500 text-xs italic mt-1">{formErrors.email}</p> 
                    )}
                  </div>

                  {/* Use theme form-group */}
                  <div className="form-group"> 
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      // Use theme form-control
                      className={`form-control ${formErrors.password ? 'border-red-500' : ''}`} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                    {formErrors.password && (
                      // Simple error text styling
                      <p className="text-red-500 text-xs italic mt-1">{formErrors.password}</p> 
                    )}
                  </div>

                  {/* Use theme button styles, add w-full for block display */}
                  <div className="mt-4"> 
                    <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : 'Login with Email'}
                    </button>
                  </div>
                </form>

                 <div className="my-4 text-center">
                   <span className="text-xs uppercase text-gray-400 font-semibold">OR</span>
                 </div>

                 {/* Google Sign-in Button - Rendered by Google Identity Services */}
                 <div className="mb-4 flex justify-center">
                    <div id="googleSignInButtonDiv" ref={googleButtonDivRef}></div>
                    {/* The Google button will be rendered here. Ensure this div is visible. */}
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
    </Layout>
  );
};

export default Login;
