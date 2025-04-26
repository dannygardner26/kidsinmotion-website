import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth } from '../firebaseConfig'; // Import the auth instance
import Layout from '../components/Layout';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Renamed for clarity
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get('redirect') || '/dashboard';

  // Check auth state on mount
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect.
        console.log("User already signed in:", user);
        navigate(redirectUrl, { replace: true });
      } else {
        // User is signed out.
        console.log("User not signed in.");
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      // This gives you a Google Access Token. You can use it to access the Google API.
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      console.log("Google Sign in successful:", user);
      // Navigation is handled by onAuthStateChanged effect
    } catch (error) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      // const email = error.customData.email;
      // The AuthCredential type that was used.
      // const credential = GoogleAuthProvider.credentialFromError(error);
      console.error('Google Sign in error:', errorCode, errorMessage);
      setError(errorMessage || 'Google Sign-in failed.');
      setIsLoading(false); // Set loading false only on error
    }
     // No finally block needed for setIsLoading(false) here, as it's handled by the effect or error catch
  };

  // Render loading state or the login form
  if (isLoading && !error) { // Show loading only if not already errored out
      return <Layout><div className="container mt-4 text-center"><p>Loading...</p></div></Layout>;
  }


  return (
    <Layout>
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-6 offset-md-3"> {/* Adjusted column for better centering */}
            <div className="card shadow-sm"> {/* Added shadow for better UI */}
              <div className="card-header bg-primary text-white"> {/* Styled header */}
                <h1 className="mb-0">Login</h1>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEmailPasswordLogin}>
                  <div className="form-group mb-3"> {/* Added margin bottom */}
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required // Added HTML5 required
                    />
                    {formErrors.email && (
                      <div className="invalid-feedback">{formErrors.email}</div>
                    )}
                  </div>

                  <div className="form-group mb-3"> {/* Added margin bottom */}
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required // Added HTML5 required
                    />
                    {formErrors.password && (
                      <div className="invalid-feedback">{formErrors.password}</div>
                    )}
                  </div>

                  <div className="d-grid gap-2 mb-3"> {/* Use d-grid for full-width button */}
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : 'Login with Email'}
                    </button>
                  </div>
                </form>

                 <div className="text-center mb-3"> {/* Added margin bottom */}
                   <span className="text-muted">OR</span>
                 </div>

                 <div className="d-grid gap-2 mb-3"> {/* Use d-grid for full-width button */}
                   <button onClick={handleGoogleSignIn} className="btn btn-danger" disabled={isLoading}> {/* Google uses red */}
                     {isLoading ? 'Signing in...' : 'Sign in with Google'}
                   </button>
                 </div>

                <div className="mt-3 text-center">
                  <p>Don't have an account? <Link to="/register">Register</Link></p>
                  {/* Add Forgot Password link if needed */}
                  {/* <p><Link to="/forgot-password">Forgot your password?</Link></p> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;