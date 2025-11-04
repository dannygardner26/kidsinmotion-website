import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const ProfileEdit = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { userProfile: currentUserProfile, authReady, loading: authLoading } = useAuth();

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
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    profileVisibility: 'PUBLIC'
  });
  const [originalUsername, setOriginalUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameCooldown, setUsernameCooldown] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Check if current user can edit this profile (only after auth is ready)
  const canEdit = authReady && currentUserProfile && (
    currentUserProfile.username === username ||
    currentUserProfile.userType === 'ADMIN'
  );

  const isAdmin = currentUserProfile?.userType === 'ADMIN';
  const isSelfEdit = currentUserProfile?.username === username;

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
  }, [username, canEdit, navigate, authReady, authLoading]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUserByUsername(username);
      const userData = response.user;

      setProfileData(userData);
      setOriginalUsername(userData.username);

      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        username: userData.username || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        userType: userData.userType || 'USER',
        isBanned: userData.isBanned || false,
        isEmailVerified: userData.isEmailVerified || false,
        emergencyContactName: userData.emergencyContactName || '',
        emergencyContactPhone: userData.emergencyContactPhone || '',
        emergencyContactRelationship: userData.emergencyContactRelationship || '',
        profileVisibility: userData.profileVisibility || 'PUBLIC'
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
    } catch (error) {
      console.error('Error fetching profile data:', error);
      alert('Failed to load profile data');
      navigate('/dashboard');
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

    // Check if admin is editing another user's profile
    const isAdminEditingOther = isAdmin && !isSelfEdit;

    // Required fields - relaxed for admin editing others
    if (!isAdminEditingOther && !formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!isAdminEditingOther && !formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';

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
      // Prepare data for submission (only include allowed fields)
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        phoneNumber: formData.phoneNumber,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelationship: formData.emergencyContactRelationship,
        profileVisibility: formData.profileVisibility
      };

      // Include email for admin editing others when changed
      if (isAdmin && !isSelfEdit && formData.email !== profileData.email) {
        updateData.email = formData.email;
      }

      // Update basic profile fields
      await apiService.updateUserProfileByUsername(username, updateData);

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
      }

      setSuccessMessage('Profile updated successfully!');
      setOriginalUsername(formData.username);

      // Refresh profile data to reflect admin changes
      await fetchProfileData();

      // If username changed, redirect to new URL
      if (formData.username !== username) {
        setTimeout(() => {
          navigate(`/edit/${formData.username}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Profile Not Found</h4>
          <p>The profile you're looking for doesn't exist.</p>
          <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-0">
                    {isSelfEdit ? 'Edit Your Profile' : `Edit ${profileData.firstName} ${profileData.lastName}'s Profile`}
                  </h2>
                  <p className="text-muted mb-0">
                    {isAdmin && !isSelfEdit ? 'Admin editing mode - additional fields available' : 'Update your profile information'}
                  </p>
                </div>
                <div>
                  <Link
                    to={`/profile/${username}`}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    <i className="fas fa-eye mr-1"></i>
                    View Profile
                  </Link>
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

              <form onSubmit={handleSubmit}>
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
                      <label htmlFor="phoneNumber">Phone Number</label>
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
                    <div className="form-group">
                      <label htmlFor="profileVisibility">Profile Visibility</label>
                      <select
                        className="form-control"
                        id="profileVisibility"
                        name="profileVisibility"
                        value={formData.profileVisibility}
                        onChange={handleInputChange}
                      >
                        <option value="PUBLIC">Public - Anyone can view</option>
                        <option value="PRIVATE">Private - Only me</option>
                      </select>
                    </div>
                  </div>
                </div>

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
                  <Link
                    to={`/profile/${username}`}
                    className="btn btn-outline-secondary ml-2"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProfileEdit;