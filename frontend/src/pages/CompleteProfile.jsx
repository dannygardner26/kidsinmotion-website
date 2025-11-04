import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, fetchUserProfile, loading, authReady } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    accountType: '',
    grade: '',
    school: '',
    password: '',
    confirmPassword: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (loading || !authReady) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('CompleteProfile: Waiting for auth to be ready', { loading, authReady });
      }
      return;
    }

    // If no user is authenticated, don't proceed (ProtectedRoute should handle this)
    if (!currentUser) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('CompleteProfile: No current user found');
      }
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('CompleteProfile: Auth ready, checking profile completion', {
        currentUser: currentUser?.uid,
        userProfile: userProfile?.username
      });
    }

    // Admin accounts are exempt from profile completion
    if (userProfile?.userType === 'ADMIN') {
      navigate('/dashboard');
      return;
    }

    // If user already has a complete profile, redirect to dashboard
    if (userProfile && userProfile.firstName && userProfile.lastName && userProfile.username &&
        userProfile.userType && (userProfile.email || userProfile.phoneNumber)) {
      navigate('/dashboard');
      return;
    }

    // Check for pending OAuth registration data
    const pendingRegistration = localStorage.getItem('pendingRegistration');
    let oauthData = null;
    if (pendingRegistration) {
      try {
        oauthData = JSON.parse(pendingRegistration);
        // Clear it so it's only used once
        localStorage.removeItem('pendingRegistration');
      } catch (e) {
        console.warn('Failed to parse pending registration data');
      }
    }

    // Function to generate username from email
    const generateUsernameFromEmail = (email) => {
      if (!email) return '';
      // Remove everything after @ and remove dots/special chars
      return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    };

    // Pre-populate form with existing user data or OAuth data
    if (userProfile || oauthData) {
      const data = userProfile || {};
      setFormData(prevData => ({
        ...prevData,
        firstName: data.firstName || oauthData?.firstName || '',
        lastName: data.lastName || oauthData?.lastName || '',
        // Auto-generate username from email for OAuth users
        username: data.username || (oauthData?.email ? generateUsernameFromEmail(oauthData.email) : ''),
        phoneNumber: data.phoneNumber || '',
        accountType: data.userType || '',
        grade: data.grade || '',
        school: data.school || '',
        // Don't pre-fill password - user must create one
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactPhone: data.emergencyContactPhone || '',
        emergencyContactRelationship: data.emergencyContactRelationship || ''
      }));
    }
  }, [currentUser, userProfile, loading, authReady, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Check username availability in real-time
    if (name === 'username' && value.length >= 3) {
      checkUsernameAvailability(value);
    } else if (name === 'username') {
      setUsernameAvailable(null);
    }
  };

  const checkUsernameAvailability = async (username) => {
    if (username === userProfile?.username) {
      setUsernameAvailable(true);
      return;
    }

    setUsernameCheckLoading(true);
    try {
      const available = await apiService.checkUsernameAvailability(username);
      setUsernameAvailable(available);
    } catch (error) {
      console.error('Error checking username availability:', error);
      setUsernameAvailable(null);
    } finally {
      setUsernameCheckLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    if (!formData.accountType.trim()) newErrors.accountType = 'Account type is required';

    // Email OR phoneNumber required
    if (!userProfile?.email && !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Either email or phone number is required';
    }

    // Username validation
    if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username is not available';
    }

    // Password validation
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Volunteer-specific validation
    if (formData.accountType === 'VOLUNTEER') {
      if (!formData.grade.trim()) newErrors.grade = 'Grade is required for volunteers';
      if (!formData.school.trim()) newErrors.school = 'School is required for volunteers';
    }

    // Phone number validation (if provided)
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Emergency contact validation (optional)
    if (formData.emergencyContactName || formData.emergencyContactPhone || formData.emergencyContactRelationship) {
      if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required when emergency contact info is provided';
      if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required when emergency contact info is provided';
      if (!formData.emergencyContactRelationship.trim()) newErrors.emergencyContactRelationship = 'Emergency contact relationship is required when emergency contact info is provided';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // For OAuth users, attempt to link credentials but don't block on failure
      if (userProfile?.email && formData.password) {
        try {
          // Ensure we have a current user and refresh the token
          const currentUser = auth.currentUser;
          if (currentUser) {
            await currentUser.getIdToken(true); // Force refresh token
            const credential = EmailAuthProvider.credential(userProfile.email, formData.password);
            await linkWithCredential(currentUser, credential);
            console.log('Firebase credentials linked successfully');
          }
        } catch (credentialError) {
          console.warn('Failed to link credentials (may already exist):', credentialError);
          // Continue with profile completion even if linking fails
        }
      }

      // Update profile in backend with retry logic
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        phoneNumber: formData.phoneNumber,
        userType: formData.accountType,
        grade: formData.grade,
        school: formData.school,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelationship: formData.emergencyContactRelationship
      };

      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          await apiService.updateUserProfile(profileData);
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          console.warn(`Profile update attempt ${retryCount} failed:`, error);

          if (retryCount > maxRetries) {
            throw error; // Re-throw if all retries failed
          }

          // Wait before retry and refresh token
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (auth.currentUser) {
            await auth.currentUser.getIdToken(true);
          }
        }
      }

      // Refresh user profile
      const updatedProfile = await fetchUserProfile();

      if (process.env.NODE_ENV !== 'production') {
        console.log('Profile updated and refreshed:', updatedProfile);
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);

      let errorMessage = 'Failed to update profile. Please try again.';
      if (error.message === 'User not authenticated') {
        errorMessage = 'Authentication expired. Please log out and log back in.';
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getUsernameStatusIcon = () => {
    if (usernameCheckLoading) {
      return <i className="fas fa-spinner fa-spin text-gray-500"></i>;
    }
    if (usernameAvailable === true) {
      return <i className="fas fa-check text-green-500"></i>;
    }
    if (usernameAvailable === false) {
      return <i className="fas fa-times text-red-500"></i>;
    }
    return null;
  };

  const getProgressPercentage = () => {
    const requiredFields = ['firstName', 'lastName', 'username', 'password', 'confirmPassword', 'accountType'];
    const optionalFields = formData.accountType === 'VOLUNTEER' ? ['grade', 'school'] : [];
    const allFields = [...requiredFields, ...optionalFields];

    let filledFields = 0;
    requiredFields.forEach(field => {
      if (formData[field] && formData[field].trim()) filledFields++;
    });
    optionalFields.forEach(field => {
      if (formData[field] && formData[field].trim()) filledFields++;
    });

    return Math.round((filledFields / allFields.length) * 100);
  };

  // Show loading state while auth is not ready or while user profile is loading
  if (loading || !authReady || !currentUser) {
    return (
      <div className="container mt-4 text-center">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>
            {loading ? 'Loading authentication...' :
             !authReady ? 'Preparing session...' :
             'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="h2 mb-3">Complete Your Profile</h1>
            <p className="text-muted">Just a few more details to get you started</p>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="d-flex justify-content-between text-muted mb-2">
                <small>Progress</small>
                <small>{getProgressPercentage()}%</small>
              </div>
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${getProgressPercentage()}%` }}
                  aria-valuenow={getProgressPercentage()}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>

          {/* Pre-filled Data Notice */}
          {userProfile?.email && (
            <div className="alert alert-info d-flex align-items-center mb-4">
              <i className="fas fa-info-circle mr-3"></i>
              <div>
                <strong>Welcome back!</strong>
                <br />
                <small>We've pre-filled some information from your Google account ({userProfile.email})</small>
              </div>
            </div>
          )}

          {/* Main Form Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">Complete Your Profile</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Personal Information Section */}
                <div className="section-header">
                  <h4><i className="fas fa-user mr-2"></i>Personal Information</h4>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                        required
                      />
                      {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                        required
                      />
                      {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="username">Username * {getUsernameStatusIcon()}</label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                        placeholder="Choose a unique username"
                        required
                      />
                      {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                      <small className="form-text text-muted">3-20 characters, letters, numbers, hyphens, underscores only</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="accountType">Account Type *</label>
                      <select
                        id="accountType"
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleInputChange}
                        className={`form-control ${errors.accountType ? 'is-invalid' : ''}`}
                        required
                      >
                        <option value="">Select Account Type</option>
                        <option value="PARENT">Parent</option>
                        <option value="VOLUNTEER">Volunteer</option>
                      </select>
                      {errors.accountType && <div className="invalid-feedback">{errors.accountType}</div>}
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="section-header">
                  <h4><i className="fas fa-lock mr-2"></i>Account Security</h4>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="password">Password *</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        required
                      />
                      {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                      <small className="form-text text-muted">Minimum 6 characters</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password *</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        required
                      />
                      {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="section-header">
                  <h4><i className="fas fa-phone mr-2"></i>Contact Information</h4>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="phoneNumber">Phone Number {!userProfile?.email && '*'}</label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                        placeholder="(555) 123-4567"
                      />
                      {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
                      {!userProfile?.email && <small className="form-text text-muted">Required since no email provided</small>}
                    </div>
                  </div>
                  {userProfile?.email && (
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Email Address</label>
                        <div className="form-control-plaintext bg-light border rounded p-2">
                          {userProfile.email}
                        </div>
                        <small className="form-text text-muted">From your Google account</small>
                      </div>
                    </div>
                  )}
                </div>

                {/* Volunteer-specific fields */}
                {formData.accountType === 'VOLUNTEER' && (
                  <div>
                    <div className="section-header">
                      <h4><i className="fas fa-graduation-cap mr-2"></i>Volunteer Information</h4>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="grade">Grade *</label>
                          <select
                            id="grade"
                            name="grade"
                            value={formData.grade}
                            onChange={handleInputChange}
                            className={`form-control ${errors.grade ? 'is-invalid' : ''}`}
                            required
                          >
                            <option value="">Select Grade</option>
                            <option value="9">9th Grade</option>
                            <option value="10">10th Grade</option>
                            <option value="11">11th Grade</option>
                            <option value="12">12th Grade</option>
                            <option value="College">College</option>
                          </select>
                          {errors.grade && <div className="invalid-feedback">{errors.grade}</div>}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="school">School *</label>
                          <input
                            type="text"
                            id="school"
                            name="school"
                            value={formData.school}
                            onChange={handleInputChange}
                            className={`form-control ${errors.school ? 'is-invalid' : ''}`}
                            placeholder="e.g., Great Valley High School"
                            required
                          />
                          {errors.school && <div className="invalid-feedback">{errors.school}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Emergency Contact Section */}
                <div className="section-header">
                  <h4><i className="fas fa-exclamation-triangle mr-2"></i>Emergency Contact <small className="text-muted">(Optional)</small></h4>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="emergencyContactName">Contact Name</label>
                      <input
                        type="text"
                        id="emergencyContactName"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        className={`form-control ${errors.emergencyContactName ? 'is-invalid' : ''}`}
                        placeholder="Full name"
                      />
                      {errors.emergencyContactName && <div className="invalid-feedback">{errors.emergencyContactName}</div>}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="emergencyContactPhone">Phone Number</label>
                      <input
                        type="tel"
                        id="emergencyContactPhone"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleInputChange}
                        className={`form-control ${errors.emergencyContactPhone ? 'is-invalid' : ''}`}
                        placeholder="(555) 123-4567"
                      />
                      {errors.emergencyContactPhone && <div className="invalid-feedback">{errors.emergencyContactPhone}</div>}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="emergencyContactRelationship">Relationship</label>
                      <input
                        type="text"
                        id="emergencyContactRelationship"
                        name="emergencyContactRelationship"
                        value={formData.emergencyContactRelationship}
                        onChange={handleInputChange}
                        className={`form-control ${errors.emergencyContactRelationship ? 'is-invalid' : ''}`}
                        placeholder="e.g., Parent, Sibling"
                      />
                      {errors.emergencyContactRelationship && <div className="invalid-feedback">{errors.emergencyContactRelationship}</div>}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={isLoading || usernameAvailable === false}
                    className="btn btn-primary btn-lg btn-block"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Completing Profile...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check mr-2"></i>
                        Complete Profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .section-header {
          margin: 2rem 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #eee;
        }

        .section-header:first-child {
          margin-top: 0;
        }

        .section-header h4 {
          margin-bottom: 0.25rem;
          color: var(--primary);
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-actions {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

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
      `}</style>
    </div>
  );
};

export default CompleteProfile;