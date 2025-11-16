import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import firestoreUserService from '../services/firestoreUserService';
import AccountTypeSelector from '../components/AccountTypeSelector';

const AccountDetails = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile: currentUserProfile, authReady, loading: authLoading, user: currentUser } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phoneNumber: '',
    userType: '',
    isBanned: false,
    isEmailVerified: false,
    phoneVerified: false,
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    profileVisibility: 'PUBLIC',
    password: ''
  });
  const [originalUsername, setOriginalUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameCooldown, setUsernameCooldown] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // View/Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  // Check if current user can edit this profile (only after auth is ready)
  const canEdit = authReady && currentUserProfile && (
    currentUserProfile.username === username ||
    currentUserProfile.userType === 'ADMIN' ||
    // Allow access if user is trying to access their own account via email prefix
    (currentUser && currentUser.email && username === currentUser.email.split('@')[0])
  );

  const isAdmin = currentUserProfile?.userType === 'ADMIN';
  const isSelfEdit = currentUserProfile?.username === username ||
                    (currentUser && currentUser.email && username === currentUser.email.split('@')[0]);

  // Check URL parameters for initial edit mode
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editParam = searchParams.get('edit');
    const completeParam = searchParams.get('complete');

    if (editParam === 'true' || completeParam === 'true') {
      setIsEditMode(true);
    }
  }, [location.search]);

  useEffect(() => {
    // Don't redirect until auth is ready
    if (!authReady || authLoading) {
      return;
    }

    if (!canEdit) {
      navigate('/dashboard');
      return;
    }

    fetchProfileData();
  }, [username, canEdit, navigate, authReady, authLoading, currentUserProfile, currentUser]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);

      // For Firebase-only users, use current user profile from context or create minimal profile
      if (isSelfEdit && (currentUserProfile || currentUser)) {
        const userData = currentUserProfile ? {
          ...currentUserProfile,
          username: currentUserProfile.username || currentUserProfile.email?.split('@')[0] || ''
        } : {
          // Create minimal profile for new Firebase users
          uid: currentUser.uid,
          email: currentUser.email,
          firstName: currentUser.displayName?.split(' ')[0] || '',
          lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
          username: currentUser.email?.split('@')[0] || '',
          userType: 'USER',
          roles: ['ROLE_USER'],
          emailVerified: currentUser.emailVerified || false
        };

        setProfileData(userData);
        setOriginalUsername(userData.username);

        // For Firebase users, assume they don't need password setup
        setNeedsPasswordSetup(false);

        // If user needs profile completion, automatically enable edit mode
        const needsCompletion = !userData.firstName || !userData.lastName ||
                               userData.userType === 'USER' || userData.userType === 'user' || !userData.userType;
        if (needsCompletion && isSelfEdit) {
          setIsEditMode(true);
        }

        setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        username: userData.username || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        userType: userData.userType || 'USER',
        isBanned: userData.isBanned || false,
        isEmailVerified: userData.isEmailVerified || false,
        phoneVerified: userData.phoneVerified || false,
        emergencyContactName: userData.emergencyContactName || '',
        emergencyContactPhone: userData.emergencyContactPhone || '',
        emergencyContactRelationship: userData.emergencyContactRelationship || '',
        password: ''
      });

        // Set username cooldown info
        if (userData.usernameLastChangedAt) {
          const lastChangedDate = new Date(userData.usernameLastChangedAt);
          const cooldownEndDate = new Date(lastChangedDate.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days
          const now = new Date();

          if (now < cooldownEndDate) {
            const remainingDays = Math.ceil((cooldownEndDate - now) / (24 * 60 * 60 * 1000));
            setUsernameCooldown({
              active: true,
              remainingDays,
              cooldownEndDate: cooldownEndDate.toLocaleDateString()
            });
          } else {
            setUsernameCooldown({ active: false });
          }
        } else {
          setUsernameCooldown({ active: false });
        }
      } else {
        // For non-self edits, we don't have access to other users' data in Firebase-only mode
        throw new Error('Profile not found or access denied');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setErrors({ general: 'Failed to load profile data: ' + error.message });
      // Don't navigate away, let user try again
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Check username availability in real-time
    if (name === 'username' && value !== originalUsername && value.length >= 3) {
      checkUsernameAvailability(value);
    } else if (name === 'username' && value === originalUsername) {
      setUsernameAvailable(true);
    } else if (name === 'username' && value.length < 3) {
      setUsernameAvailable(null);
    }
  };

  const checkUsernameAvailability = async (username) => {
    setUsernameCheckLoading(true);
    try {
      // For Firebase-only users, skip backend username checks
      // Assume username is available if it's different from original
      const available = username !== originalUsername;
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

    // Check if admin is editing another user's profile
    const isAdminEditingOther = isAdmin && !isSelfEdit;

    // Required fields - relaxed for admin editing others
    if (!isAdminEditingOther && !formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!isAdminEditingOther && !formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';

    // UserType validation for self-editing users who need to complete profile
    if (isSelfEdit && (formData.userType === 'USER' || formData.userType === 'user' || !formData.userType)) {
      newErrors.userType = 'Please select whether you are a Parent or Volunteer';
    }

    // Password validation for OAuth users
    if (needsPasswordSetup && !formData.password.trim()) {
      newErrors.password = 'Password is required for account setup';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Require either email or phone number (bypass for admin editing others when no contact changes)
    const isAdminEditingWithoutContactChanges = (isAdmin && !isSelfEdit) &&
      (formData.email === profileData?.email) &&
      (formData.phoneNumber === profileData?.phoneNumber);

    if (!isAdminEditingWithoutContactChanges && !formData.email.trim() && !formData.phoneNumber.trim()) {
      newErrors.email = 'Either email or phone number is required';
      newErrors.phoneNumber = 'Either email or phone number is required';
    }

    // Username validation
    if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    } else if (formData.username !== originalUsername && usernameAvailable === false) {
      newErrors.username = 'Username is not available';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSuccessMessage('');

    try {
      // Set password for OAuth users first if needed
      if (needsPasswordSetup && formData.password) {
        await apiService.setUserPassword(formData.password);
        setNeedsPasswordSetup(false);
      }

      // Prepare data for submission (only include allowed fields)
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        phoneNumber: formData.phoneNumber,
        userType: formData.userType,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelationship: formData.emergencyContactRelationship
      };

      // Include email for admin editing others when changed
      if (isAdmin && !isSelfEdit && formData.email !== profileData.email) {
        updateData.email = formData.email;
      }

      // Handle Firebase users vs backend users differently
      if (isSelfEdit && currentUser && currentUserProfile) {
        // Firebase user - update profile in Firestore and context
        const updatedProfile = {
          ...currentUserProfile,
          ...updateData,
          uid: currentUser.uid
        };

        // Update in Firestore for admin dashboard visibility
        await firestoreUserService.updateUser(currentUser.uid, updatedProfile);

        // Update local profile data
        setProfileData(updatedProfile);

        // The AuthContext will be updated via its real-time listeners
        console.log('Firebase profile updated successfully');
      } else {
        // Backend user - use API
        await apiService.updateUserProfileByUsername(username, updateData);
      }

      // Admin-only operations using specific endpoints
      if (isAdmin && !isSelfEdit) {
        const userId = profileData.firebaseUid;

        // Handle user type change
        if (formData.userType !== profileData.userType) {
          await apiService.changeUserAccountType(userId, formData.userType);
        }

        // Handle ban status change
        if (formData.isBanned !== profileData.isBanned) {
          if (formData.isBanned) {
            await apiService.banUser(userId, 'Admin action', 'Account banned by administrator');
          } else {
            await apiService.unbanUser(userId);
          }
        }

        // Handle email verification change
        if (formData.isEmailVerified !== profileData.isEmailVerified && formData.isEmailVerified) {
          await apiService.verifyUserEmail(userId);
        }

        // Handle phone verification change
        if (formData.phoneVerified !== profileData.phoneVerified && formData.phoneVerified) {
          await apiService.adminVerifyPhone(userId);
        }
      }

      setSuccessMessage('Account updated successfully!');
      setOriginalUsername(formData.username);
      setIsEditMode(false);

      // Refresh profile data for admin changes or backend users
      if (!isSelfEdit || !currentUser || !currentUserProfile) {
        await fetchProfileData();
      }

      // For Firebase users who just completed profile setup, redirect to dashboard
      const searchParams = new URLSearchParams(location.search);
      const isProfileCompletion = searchParams.get('complete') === 'true';

      if (isProfileCompletion && isSelfEdit) {
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
        return;
      }

      // If username changed, redirect to new URL
      if (formData.username !== username) {
        setTimeout(() => {
          navigate(`/account/${formData.username}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setFormData({
      firstName: profileData.firstName || '',
      lastName: profileData.lastName || '',
      username: profileData.username || '',
      email: profileData.email || '',
      phoneNumber: profileData.phoneNumber || '',
      userType: profileData.userType || 'USER',
      isBanned: profileData.isBanned || false,
      isEmailVerified: profileData.isEmailVerified || false,
      phoneVerified: profileData.phoneVerified || false,
      emergencyContactName: profileData.emergencyContactName || '',
      emergencyContactPhone: profileData.emergencyContactPhone || '',
      emergencyContactRelationship: profileData.emergencyContactRelationship || '',
      password: ''
    });
    setErrors({});
    setSuccessMessage('');
  };

  const getUsernameStatusIcon = () => {
    if (usernameCheckLoading) {
      return <i className="fas fa-spinner fa-spin text-muted"></i>;
    }
    if (usernameAvailable === true || formData.username === originalUsername) {
      return <i className="fas fa-check text-success"></i>;
    }
    if (usernameAvailable === false) {
      return <i className="fas fa-times text-danger"></i>;
    }
    return null;
  };

  // Show loading while auth is not ready or profile is loading
  if (!authReady || authLoading || isLoading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading account details...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Account Not Found</h4>
          <p>The account you're looking for doesn't exist.</p>
          <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Account Details
          </li>
        </ol>
      </nav>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-0">
                    {isEditMode
                      ? (isSelfEdit ? 'Edit Account Details' : `Edit ${profileData.firstName} ${profileData.lastName}'s Account`)
                      : (isSelfEdit ? 'Account Details' : `${profileData.firstName} ${profileData.lastName}'s Account`)
                    }
                  </h2>
                  <p className="text-muted mb-0">
                    {isEditMode
                      ? (isAdmin && !isSelfEdit ? 'Admin editing mode - additional fields available' : 'Update your account information')
                      : 'View and manage your account information'
                    }
                  </p>
                </div>
                <div>
                  {!isEditMode ? (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="btn btn-primary btn-sm"
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Edit Account
                    </button>
                  ) : (
                    <button
                      onClick={handleCancel}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      <i className="fas fa-times mr-1"></i>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              {successMessage && (
                <div className="alert alert-success">
                  <i className="fas fa-check-circle mr-2"></i>
                  {successMessage}
                </div>
              )}

              {errors.general && (
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  {errors.general}
                </div>
              )}

              {needsPasswordSetup && isEditMode && (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle mr-2"></i>
                  <strong>Complete your account setup:</strong> Set a password so you can also login with email/password in addition to Google sign-in.
                </div>
              )}

              {!isEditMode ? (
                // VIEW MODE
                <div>
                  {/* Personal Information */}
                  <div className="section-header">
                    <h4>Personal Information</h4>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <div className="info-card">
                        <label className="info-label">First Name</label>
                        <div className="info-value">{profileData.firstName || 'Not provided'}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="info-card">
                        <label className="info-label">Last Name</label>
                        <div className="info-value">{profileData.lastName || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <div className="info-card">
                        <label className="info-label">Username</label>
                        <div className="info-value">{profileData.username}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="info-card">
                        <label className="info-label">Email Address</label>
                        <div className="info-value">
                          {profileData.email}
                          {profileData.isEmailVerified ? (
                            <span className="badge badge-success ml-2">
                              <i className="fas fa-check-circle mr-1"></i>
                              Verified
                            </span>
                          ) : (
                            <span className="badge badge-warning ml-2">
                              <i className="fas fa-exclamation-triangle mr-1"></i>
                              Not Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <div className="info-card">
                        <label className="info-label">Phone Number</label>
                        <div className="info-value">
                          {profileData.phoneNumber || 'Not provided'}
                          {profileData.phoneNumber && (
                            profileData.phoneVerified ? (
                              <span className="badge badge-success ml-2">
                                <i className="fas fa-check-circle mr-1"></i>
                                Verified
                              </span>
                            ) : (
                              <span className="badge badge-warning ml-2">
                                <i className="fas fa-exclamation-triangle mr-1"></i>
                                Not Verified
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="info-card">
                        <label className="info-label">Account Type</label>
                        <div className="info-value">{profileData.userType}</div>
                      </div>
                    </div>
                  </div>


                  {/* Emergency Contact */}
                  <div className="section-header">
                    <h4>Emergency Contact</h4>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-4">
                      <div className="info-card">
                        <label className="info-label">Contact Name</label>
                        <div className="info-value">{profileData.emergencyContactName || 'Not provided'}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="info-card">
                        <label className="info-label">Contact Phone</label>
                        <div className="info-value">{profileData.emergencyContactPhone || 'Not provided'}</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="info-card">
                        <label className="info-label">Relationship</label>
                        <div className="info-value">{profileData.emergencyContactRelationship || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // EDIT MODE
                <form onSubmit={handleSubmit}>
                  {/* Password setup for OAuth users */}
                  {needsPasswordSetup && (
                    <>
                      <div className="section-header">
                        <h4>Account Setup</h4>
                        <small className="text-muted">Complete your account setup by setting a password</small>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="password">Set Password *</label>
                            <input
                              type="password"
                              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                              id="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              required
                              placeholder="Choose a secure password"
                            />
                            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                            <small className="form-text text-muted">
                              Password must be at least 6 characters long.
                            </small>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Personal Information */}
                  <div className="section-header">
                    <h4>Personal Information</h4>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="firstName">First Name{(!isAdmin || isSelfEdit) ? ' *' : ''}</label>
                        <input
                          type="text"
                          className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required={!isAdmin || isSelfEdit}
                        />
                        {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="lastName">Last Name{(!isAdmin || isSelfEdit) ? ' *' : ''}</label>
                        <input
                          type="text"
                          className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required={!isAdmin || isSelfEdit}
                        />
                        {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="username">Username *</label>
                        <div className="input-group">
                          <input
                            type="text"
                            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                          />
                          <div className="input-group-append">
                            <span className="input-group-text">
                              {getUsernameStatusIcon()}
                            </span>
                          </div>
                          {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                        </div>
                        <small className="form-text text-muted">
                          Username can only contain letters, numbers, hyphens, and underscores.
                        </small>
                        {usernameCooldown?.active && (
                          <div className="alert alert-warning mt-2 mb-0 py-2 px-3">
                            <i className="fas fa-clock mr-2"></i>
                            <small>
                              <strong>Username Change Cooldown:</strong> You can change your username again in {usernameCooldown.remainingDays} day{usernameCooldown.remainingDays !== 1 ? 's' : ''} (after {usernameCooldown.cooldownEndDate}).
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                          type="email"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isAdmin || isSelfEdit}
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                        {(!isAdmin || isSelfEdit) && (
                          <small className="form-text text-muted">
                            Email address cannot be changed here.
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="phoneNumber">
                          Phone Number
                          {profileData?.phoneVerified ? (
                            <span className="badge badge-success ml-2">
                              <i className="fas fa-check-circle mr-1"></i>
                              Verified
                            </span>
                          ) : profileData?.phoneNumber ? (
                            <span className="badge badge-danger ml-2">
                              <i className="fas fa-times-circle mr-1"></i>
                              Not Verified
                            </span>
                          ) : null}
                        </label>
                        <input
                          type="tel"
                          className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="(555) 123-4567"
                        />
                        {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="account-actions">
                        <label className="info-label">Account Management</label>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm mb-2"
                            onClick={() => alert('Password reset functionality coming soon')}
                          >
                            <i className="fas fa-key mr-1"></i>
                            Reset Password
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm mb-2"
                            onClick={() => alert('Email change functionality coming soon')}
                          >
                            <i className="fas fa-envelope mr-1"></i>
                            Change Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Type Selection for incomplete profiles */}
                  {isSelfEdit && (formData.userType === 'USER' || formData.userType === 'user' || !formData.userType) && (
                    <>
                      <div className="section-header">
                        <h4>Complete Your Profile</h4>
                        <small className="text-muted">Please select your account type to continue</small>
                      </div>

                      <div className="row">
                        <div className="col-md-12">
                          <AccountTypeSelector
                            onSelect={(type) => {
                              setFormData(prev => ({ ...prev, userType: type }));
                              setErrors(prev => ({ ...prev, userType: null }));
                            }}
                            selectedType={formData.userType === 'USER' || formData.userType === 'user' ? null : formData.userType}
                          />
                          {errors.userType && (
                            <div className="alert alert-danger mt-2">
                              {errors.userType}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Admin-only fields */}
                  {isAdmin && !isSelfEdit && (
                    <>
                      <div className="section-header admin-section">
                        <h4>Admin Controls</h4>
                        <small className="text-muted">These fields are only visible to administrators</small>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="userType">Account Type</label>
                            <select
                              className="form-control"
                              id="userType"
                              name="userType"
                              value={formData.userType}
                              onChange={handleInputChange}
                            >
                              <option value="PARENT">Parent</option>
                              <option value="VOLUNTEER">Volunteer</option>
                              <option value="ATHLETE">Athlete</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <div className="form-check mt-4">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="isEmailVerified"
                                name="isEmailVerified"
                                checked={formData.isEmailVerified}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label" htmlFor="isEmailVerified">
                                Email Verified
                              </label>
                            </div>
                            <div className="form-check mt-2">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="phoneVerified"
                                name="phoneVerified"
                                checked={formData.phoneVerified || false}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label" htmlFor="phoneVerified">
                                Phone Verified
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-12">
                          <div className="form-group">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="isBanned"
                                name="isBanned"
                                checked={formData.isBanned}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label text-danger" htmlFor="isBanned">
                                <strong>Ban this user</strong> - User will not be able to access the platform
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Emergency Contact */}
                  <div className="section-header">
                    <h4>Emergency Contact</h4>
                    <small className="text-muted">Someone to contact in case of emergency</small>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="emergencyContactName">Emergency Contact Name</label>
                        <input
                          type="text"
                          className="form-control"
                          id="emergencyContactName"
                          name="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="emergencyContactPhone">Emergency Contact Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          id="emergencyContactPhone"
                          name="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={handleInputChange}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="emergencyContactRelationship">Relationship</label>
                        <input
                          type="text"
                          className="form-control"
                          id="emergencyContactRelationship"
                          name="emergencyContactRelationship"
                          value={formData.emergencyContactRelationship}
                          onChange={handleInputChange}
                          placeholder="e.g., Parent, Sibling, Friend"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSaving || (formData.username !== originalUsername && usernameAvailable === false)}
                    >
                      {isSaving ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-outline-secondary ml-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .container {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          min-height: 100vh;
          padding-top: 2rem;
          padding-bottom: 2rem;
        }

        .card {
          background: white;
          border: none;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(47, 80, 106, 0.12);
          overflow: hidden;
        }

        .card-header {
          background: linear-gradient(135deg, var(--primary) 0%, #3a5674 100%);
          border: none;
          color: white;
          padding: 2rem;
        }

        .card-header h2 {
          color: white;
          margin: 0;
          font-weight: 600;
        }

        .card-body {
          padding: 2.5rem;
        }

        .btn {
          border-radius: 8px;
          font-weight: 500;
          padding: 0.6rem 1.5rem;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), #3a5674);
          border: none;
          box-shadow: 0 4px 15px rgba(47, 80, 106, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(47, 80, 106, 0.4);
        }

        .form-control {
          border: 2px solid #e9ecef;
          border-radius: 10px;
          padding: 0.8rem 1rem;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .form-control:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(47, 80, 106, 0.1);
          transform: translateY(-1px);
        }
        .info-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          min-height: 80px;
          transition: all 0.3s ease;
        }

        .info-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(47, 80, 106, 0.1);
        }

        .info-label {
          font-weight: 600;
          color: var(--primary);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          color: #2c3e50;
          font-size: 1.1rem;
          font-weight: 500;
          word-break: break-word;
        }

        .section-header {
          border-bottom: 3px solid var(--primary);
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          position: relative;
        }

        .section-header::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          width: 60px;
          height: 3px;
          background: var(--secondary);
          border-radius: 2px;
        }

        .section-header h4 {
          color: var(--primary);
          margin-bottom: 0.5rem;
          font-size: 1.4rem;
          font-weight: 600;
        }

        .admin-section {
          border-bottom-color: #dc3545;
        }

        .admin-section h4 {
          color: #dc3545;
        }

        .form-actions {
          border-top: 2px solid #e9ecef;
          padding-top: 2rem;
          margin-top: 3rem;
          text-align: center;
        }

        .account-actions {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .badge {
          font-size: 0.75rem;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-weight: 600;
        }

        .badge-success {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
        }

        .badge-warning {
          background: linear-gradient(135deg, #ffc107, #ff8f00);
          color: white;
        }

        .alert {
          border: none;
          border-radius: 12px;
          padding: 1.25rem;
          font-weight: 500;
        }

        .alert-success {
          background: linear-gradient(135deg, #d4edda, #c3e6cb);
          color: #155724;
        }

        .alert-danger {
          background: linear-gradient(135deg, #f8d7da, #f5c6cb);
          color: #721c24;
        }

        @media (max-width: 768px) {
          .container {
            padding-top: 1rem;
            padding-bottom: 1rem;
          }

          .card-header,
          .card-body {
            padding: 1.5rem;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountDetails;