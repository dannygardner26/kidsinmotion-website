import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebaseConfig'; // Import the auth instance
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';


const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsGoogleOAuthLogin } = useAuth();
  const googleButtonDivRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'PARENT', // Default role
    agreeToTerms: false
  });

  const [isLoading, setIsLoading] = useState(false); // Renamed for clarity
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isGoogleOAuth, setIsGoogleOAuth] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(''); // '', 'checking', 'available', 'taken'
  const [usernameValidationTimer, setUsernameValidationTimer] = useState(null);

  // Check for Google OAuth registration data
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const isOAuthFlow = queryParams.get('oauth') === 'google';

    if (isOAuthFlow) {
      setIsGoogleOAuth(true);
      const pendingRegistration = localStorage.getItem('pendingRegistration');

      if (pendingRegistration) {
        try {
          const userInfo = JSON.parse(pendingRegistration);
          setFormData(prevState => ({
            ...prevState,
            firstName: userInfo.firstName || '',
            lastName: userInfo.lastName || '',
            email: userInfo.email || '',
            // Don't pre-fill password fields for OAuth users
            password: '',
            confirmPassword: ''
          }));
          // Clear the pending registration data
          localStorage.removeItem('pendingRegistration');
        } catch (error) {
          console.error('Error parsing pending registration data:', error);
        }
      }
    }
  }, [location]);

  // Username validation function
  const validateUsername = useCallback(async (username) => {
    if (!username || username.length < 3) {
      setUsernameStatus('');
      return;
    }

    setUsernameStatus('checking');
    try {
      const response = await apiService.validateUsername(username);
      setUsernameStatus(response.available ? 'available' : 'taken');
    } catch (error) {
      console.error('Username validation error:', error);
      setUsernameStatus('');
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (usernameValidationTimer) {
        clearTimeout(usernameValidationTimer);
      }
    };
  }, [usernameValidationTimer]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Handle username validation with debouncing
    if (name === 'username') {
      setUsernameStatus('');
      if (usernameValidationTimer) {
        clearTimeout(usernameValidationTimer);
      }

      if (value.trim().length >= 3) {
        const timer = setTimeout(() => {
          validateUsername(value.trim());
        }, 500);
        setUsernameValidationTimer(timer);
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    const { firstName, lastName, username, email, password, confirmPassword, phoneNumber, agreeToTerms } = formData;

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';

    // Username validation
    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    } else if (username.length < 3 || username.length > 20) {
      errors.username = 'Username must be 3-20 characters long';
    } else if (usernameStatus === 'taken') {
      errors.username = 'Username is already taken';
    }

    // Either email or phone is required
    if (!email.trim() && !phoneNumber.trim()) {
      errors.email = 'Either email or phone number is required';
      errors.phoneNumber = 'Either email or phone number is required';
    } else {
      if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
        errors.email = 'Email is invalid';
      }
    }

    // Only validate passwords for non-OAuth users
    if (!isGoogleOAuth) {
      if (!password) {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the Terms and Conditions and Privacy Policy';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isGoogleOAuth) {
        // For Google OAuth users, just sync with backend (they're already authenticated)
        const profileData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          phoneNumber: formData.phoneNumber,
          userType: formData.role,
          grade: formData.grade || null,
          school: formData.school || null
        };

        await apiService.syncUser();
        await apiService.updateUserProfile(profileData);

        console.log("Google OAuth user profile created successfully.");
        navigate('/dashboard');
      } else {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        console.log("Firebase user created:", user);

        // 2. Update Firebase profile (optional, but good practice for display name)
        await updateProfile(user, {
          displayName: `${formData.firstName} ${formData.lastName}`
        });
        console.log("Firebase profile updated with display name.");

        // 3. Send additional data to your backend to create the user profile
        const profileData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          phoneNumber: formData.phoneNumber,
          userType: formData.role,
          grade: formData.grade || null,
          school: formData.school || null
        };

        await apiService.syncUser();
        await apiService.updateUserProfile(profileData);

        console.log("Backend profile created successfully.");

        // 4. Send email verification
        try {
          const { sendEmailVerification } = await import('firebase/auth');
          await sendEmailVerification(user);
          console.log("Email verification sent successfully.");

          // Show success message
          alert("Account created successfully! Please check your email for verification link.");
        } catch (verificationError) {
          console.warn("Failed to send verification email:", verificationError);
          // Don't block registration if verification email fails
        }

        // 5. Redirect to dashboard with verification prompt
        navigate('/dashboard?verify=true');
      }

    } catch (error) {
      console.error('Registration error:', error);
      // Provide more specific Firebase error messages
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered. Please login or use a different email.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.message.includes('Failed to save user profile')) {
          errorMessage = error.message; // Use the specific backend error
      }
      setError(errorMessage);
      setIsLoading(false); // Ensure loading is stopped on error
    }
    // No finally block needed for setIsLoading(false) if navigation happens on success
  };

  const handleGoogleSignIn = async (response) => {
    setIsLoading(true);
    setError(null);
    console.log("Google Sign-In response:", response);
    try {
      // Flag this as a Google OAuth registration
      setIsGoogleOAuthLogin(true);

      const idToken = response.credential;
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      // Navigation is handled by Firebase auth state change
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
      navigate('/dashboard');
    } catch (error) {
      console.error('Test login error:', error);
      setError('Test login failed. Account may not exist yet.');
      setIsLoading(false);
    }
  };

  // Initialize Google Sign-In button
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
            { theme: "outline", size: "large", type: "standard", text: "signup_with" }
          );
          if (process.env.NODE_ENV !== 'production') {
            console.log("Google Sign-In initialized successfully on Register");
          }
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error("Error initializing Google Sign-In on Register:", error);
          }
        }
      } else {
        // Retry after a short delay if Google script hasn't loaded yet
        if (process.env.NODE_ENV !== 'production') {
          console.log("Google GSI not ready on Register, retrying in 500ms...");
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

  return (
    <>
      {/* Use flexbox for centering, allow more width for register form */}
      <div className="container mt-4 flex justify-center items-start min-h-[calc(100vh-200px)]"> 
        <div className="w-full max-w-xl"> {/* Increased max-width */}
            <div className="card"> {/* Use theme card style */}
              <div className="card-header"> {/* Use theme card-header style */}
                <h1 className="text-2xl font-bold text-center mb-0">Create an Account</h1>
              </div>
              <div className="card-body">
                {error && (
                  // Use Tailwind for alert
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}

                {isGoogleOAuth && (
                  <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">
                      <strong>Complete Your Google Account Registration:</strong> Please choose a username, select your role, and provide any additional information below. No password is required since you'll sign in with Google.
                    </span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <h3 className="text-lg font-bold mb-4 text-black">Personal Information</h3> 

                  {/* Use flexbox for row layout, gap for spacing */}
                  <div className="flex flex-wrap -mx-2 mb-3"> 
                    <div className="w-full md:w-1/2 px-2 mb-3 md:mb-0"> {/* Responsive width */}
                      <div className="form-group"> {/* Use theme form-group */}
                        <label htmlFor="firstName">First Name*</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          // Use theme form-control
                          className={`form-control ${formErrors.firstName ? 'border-red-500' : ''}`} 
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                        {formErrors.firstName && (
                          <p className="text-red-500 text-xs italic mt-1">{formErrors.firstName}</p>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-1/2 px-2"> {/* Responsive width */}
                      <div className="form-group"> {/* Use theme form-group */}
                        <label htmlFor="lastName">Last Name*</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          // Use theme form-control
                          className={`form-control ${formErrors.lastName ? 'border-red-500' : ''}`} 
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                        {formErrors.lastName && (
                          <p className="text-red-500 text-xs italic mt-1">{formErrors.lastName}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Username field */}
                  <div className="form-group">
                    <label htmlFor="username">Username*</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className={`form-control ${
                        formErrors.username
                          ? 'border-red-500'
                          : usernameStatus === 'available'
                          ? 'border-green-500'
                          : usernameStatus === 'taken'
                          ? 'border-red-500'
                          : ''
                      }`}
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter a unique username"
                      required
                    />
                    <small className="text-gray-500 text-xs">3–20 characters; letters, numbers, underscore, hyphen</small>

                    {/* Username validation feedback */}
                    {usernameStatus === 'checking' && (
                      <p className="text-blue-500 text-xs italic mt-1">Checking availability...</p>
                    )}
                    {usernameStatus === 'available' && (
                      <p className="text-green-500 text-xs italic mt-1">✓ Username is available</p>
                    )}
                    {usernameStatus === 'taken' && (
                      <p className="text-red-500 text-xs italic mt-1">Username is already taken</p>
                    )}
                    {formErrors.username && (
                      <p className="text-red-500 text-xs italic mt-1">{formErrors.username}</p>
                    )}
                  </div>

                  {/* Use theme form-group */}
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      // Use theme form-control
                      className={`form-control ${formErrors.email ? 'border-red-500' : ''}`} 
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-xs italic mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Use theme form-group */}
                  <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      // Use theme form-control
                      className={`form-control ${formErrors.phoneNumber ? 'border-red-500' : ''}`} 
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="XXX-XXX-XXXX"
                      required
                    />
                    {formErrors.phoneNumber && (
                      <p className="text-red-500 text-xs italic mt-1">{formErrors.phoneNumber}</p>
                    )}
                  </div>

                  {/* Use theme form-group */}
                  <div className="form-group">
                    <label htmlFor="role">I am registering as a:</label>
                    {/* Style select like form-control */}
                    <select
                      id="role"
                      name="role"
                      className="form-control"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="PARENT">Parent/Guardian</option>
                      <option value="VOLUNTEER">Volunteer</option>
                    </select>

                  </div>

                  {/* Conditional Grade and School fields for volunteers */}
                  {formData.role === 'VOLUNTEER' && (
                    <>
                      <div className="flex flex-wrap -mx-2 mb-3">
                        <div className="w-full md:w-1/3 px-2 mb-3 md:mb-0">
                          <div className="form-group">
                            <label htmlFor="grade">Grade*</label>
                            <select
                              id="grade"
                              name="grade"
                              className={`form-control ${formErrors.grade ? 'border-red-500' : ''}`}
                              value={formData.grade}
                              onChange={handleChange}
                              required
                            >
                              <option value="">Select grade...</option>
                              <option value="middleschool">Middle School</option>
                              <option value="9">9th Grade</option>
                              <option value="10">10th Grade</option>
                              <option value="11">11th Grade</option>
                              <option value="12">12th Grade</option>
                              <option value="college">College</option>
                              <option value="adult">Adult</option>
                            </select>
                            {formErrors.grade && (
                              <p className="text-red-500 text-xs italic mt-1">{formErrors.grade}</p>
                            )}
                          </div>
                        </div>

                        <div className="w-full md:w-2/3 px-2">
                          <div className="form-group">
                            <label htmlFor="school">School/Organization*</label>
                            <input
                              type="text"
                              id="school"
                              name="school"
                              className={`form-control ${formErrors.school ? 'border-red-500' : ''}`}
                              value={formData.school}
                              onChange={handleChange}
                              placeholder="e.g., Great Valley High School, Penn State, etc."
                              required
                            />
                            {formErrors.school && (
                              <p className="text-red-500 text-xs italic mt-1">{formErrors.school}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Only show password fields for non-OAuth users */}
                  {!isGoogleOAuth && (
                    <>
                      <h3 className="text-lg font-bold mt-6 mb-4 text-black">Account Security</h3>

                      {/* Use theme form-group */}
                      <div className="form-group">
                        <label htmlFor="password">Password*</label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          // Use theme form-control
                          className={`form-control ${formErrors.password ? 'border-red-500' : ''}`}
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                        {formErrors.password && (
                          <p className="text-red-500 text-xs italic mt-1">{formErrors.password}</p>
                        )}
                        {/* Use Tailwind for muted text */}
                        <small className="text-gray-500 text-xs">Password must be at least 6 characters long.</small>
                      </div>

                      {/* Use theme form-group */}
                      <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password*</label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          // Use theme form-control
                          className={`form-control ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                        {formErrors.confirmPassword && (
                          <p className="text-red-500 text-xs italic mt-1">{formErrors.confirmPassword}</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Agreement checkbox with validation */}
                  <div className="mt-4 mb-4">
                    <div className="flex items-start">
                      <input
                        className={`mr-2 mt-1 leading-tight ${formErrors.agreeToTerms ? 'border-red-500' : ''}`}
                        type="checkbox"
                        id="agreeToTerms"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        required
                      />
                      <label className="text-sm text-gray-600" htmlFor="agreeToTerms">
                        I agree to the <Link to="/terms" target="_blank" className="font-medium hover:underline">Terms and Conditions</Link> and <Link to="/privacy" target="_blank" className="font-medium hover:underline">Privacy Policy</Link>.
                      </label>
                    </div>
                    {formErrors.agreeToTerms && (
                      <p className="text-red-500 text-xs italic mt-1">{formErrors.agreeToTerms}</p>
                    )}
                  </div>

                  {/* Use theme button styles, add w-full */}
                  <div className="mt-6"> 
                    <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
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

                <div className="mt-4 text-center"> {/* Adjusted margin */}
                  <p className="text-sm text-gray-600">Already have an account? <Link to="/login" className="font-medium hover:underline">Login</Link></p>
                </div>
              </div>
            </div>
          </div> {/* Closing tag for w-full max-w-xl */}
        </div> 
      {/* Removed the extra closing div here */}
    </>
  );
};

export default Register;



