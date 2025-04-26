import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from '../firebaseConfig'; // Import the auth instance
import Layout from '../components/Layout';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'PARENT' // Default role
  });

  const [isLoading, setIsLoading] = useState(false); // Renamed for clarity
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // No need for useEffect to check token, Firebase handles auth state persistence

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = {};
    const { firstName, lastName, email, password, confirmPassword, phoneNumber } = formData;

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!phoneNumber.trim()) { // Basic check, consider more robust validation
        errors.phoneNumber = 'Phone number is required';
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
      //    You'll need an endpoint that accepts the Firebase UID and other form data.
      const profileData = {
          firebaseUid: user.uid, // Send Firebase UID to link accounts
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email, // Email might be redundant if UID is primary key
          phoneNumber: formData.phoneNumber,
          role: formData.role
      };

      const backendResponse = await fetch('/api/users/register-profile', { // TODO: Replace with your actual backend endpoint
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              // Include Authorization header if needed, e.g., sending the Firebase ID token
              // 'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify(profileData)
      });

      if (!backendResponse.ok) {
          // Handle backend error - maybe delete the Firebase user or prompt user
          const backendErrorData = await backendResponse.json();
          console.error("Backend profile creation failed:", backendErrorData);
          // Consider deleting the Firebase user if backend registration fails critically
          // await user.delete(); // Requires recent sign-in, might need re-authentication
          throw new Error(backendErrorData.message || 'Failed to save user profile information.');
      }

      console.log("Backend profile created successfully.");

      // 4. Redirect on successful registration (Firebase auth state change might also handle this)
      navigate('/dashboard'); // Redirect to dashboard after successful registration

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

  return (
    <Layout>
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-8 offset-md-2"> {/* Adjusted column for better centering */}
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h1 className="mb-0">Create an Account</h1>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate> {/* Added noValidate to rely on custom validation */}
                  <h3 className="mb-3">Personal Information</h3>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="firstName">First Name*</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          className={`form-control ${formErrors.firstName ? 'is-invalid' : ''}`}
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                        {formErrors.firstName && (
                          <div className="invalid-feedback">{formErrors.firstName}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="lastName">Last Name*</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          className={`form-control ${formErrors.lastName ? 'is-invalid' : ''}`}
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                        {formErrors.lastName && (
                          <div className="invalid-feedback">{formErrors.lastName}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="email">Email*</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    {formErrors.email && (
                      <div className="invalid-feedback">{formErrors.email}</div>
                    )}
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="phoneNumber">Phone Number*</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      className={`form-control ${formErrors.phoneNumber ? 'is-invalid' : ''}`}
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="XXX-XXX-XXXX"
                      required
                    />
                    {formErrors.phoneNumber && (
                      <div className="invalid-feedback">{formErrors.phoneNumber}</div>
                    )}
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="role">I am registering as a:</label>
                    <select
                      id="role"
                      name="role"
                      className="form-select" // Use form-select for Bootstrap 5
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="PARENT">Parent/Guardian</option>
                      <option value="VOLUNTEER">Volunteer</option>
                      {/* Add other roles if necessary */}
                    </select>
                  </div>

                  <h3 className="mt-4 mb-3">Account Security</h3>

                  <div className="form-group mb-3">
                    <label htmlFor="password">Password*</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    {formErrors.password && (
                      <div className="invalid-feedback">{formErrors.password}</div>
                    )}
                    <small className="form-text text-muted">Password must be at least 6 characters long.</small>
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="confirmPassword">Confirm Password*</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      className={`form-control ${formErrors.confirmPassword ? 'is-invalid' : ''}`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    {formErrors.confirmPassword && (
                      <div className="invalid-feedback">{formErrors.confirmPassword}</div>
                    )}
                  </div>

                  <div className="form-check mb-3"> {/* Use form-check for Bootstrap 5 */}
                    <input className="form-check-input" type="checkbox" value="" id="termsCheck" required />
                    <label className="form-check-label" htmlFor="termsCheck">
                      I agree to the <Link to="/terms" target="_blank">Terms and Conditions</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link>.
                    </label>
                  </div>

                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </div>
                </form>

                <div className="mt-3 text-center">
                  <p>Already have an account? <Link to="/login">Login</Link></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Register;