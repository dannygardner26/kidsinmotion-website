import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const errors = {};
    const { firstName, lastName, email, password, confirmPassword, phoneNumber, agreeToTerms } = formData;

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
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
    if (!phoneNumber.trim()) { // Basic check, consider more robust validation
        errors.phoneNumber = 'Phone number is required';
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

  // Initialize Google Sign-In button
  useEffect(() => {
    if (typeof window.google !== 'undefined' && window.google.accounts && googleButtonDivRef.current) {
      window.google.accounts.id.initialize({
        client_id: "839796180413-i0uvjtqpus9rj5pnvk7jngb31n6qvco4.apps.googleusercontent.com",
        callback: handleGoogleSignIn,
      });
      window.google.accounts.id.renderButton(
        googleButtonDivRef.current,
        { theme: "outline", size: "large", type: "standard", text: "signup_with" }
      );
    } else {
      console.log("Google GSI not ready or div not available yet.");
    }
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
                      <strong>Complete Your Google Account Registration:</strong> Please select your role and provide any additional information below. No password is required since you'll sign in with Google.
                    </span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Use theme heading style */}
                  <h3 className="text-lg font-semibold mb-4 text-primary">Personal Information</h3> 

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

                  {/* Use theme form-group */}
                  <div className="form-group"> 
                    <label htmlFor="email">Email*</label>
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
                    <label htmlFor="phoneNumber">Phone Number*</label>
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
                      {/* Use theme heading style */}
                      <h3 className="text-lg font-semibold mt-6 mb-4 text-primary">Account Security</h3>

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



