import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { userProfile, fetchUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    accountType: '',
    grade: '',
    school: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    parentFirstName: '',
    parentLastName: '',
    parentPhoneNumber: '',
    parentEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // If user already has a complete profile, redirect to dashboard
    if (userProfile && userProfile.firstName && userProfile.lastName && userProfile.username && userProfile.userType) {
      navigate('/dashboard');
      return;
    }

    // Pre-populate form with existing user data
    if (userProfile) {
      setFormData(prevData => ({
        ...prevData,
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        username: userProfile.username || '',
        phoneNumber: userProfile.phoneNumber || '',
        accountType: userProfile.userType || '',
        grade: userProfile.grade || '',
        school: userProfile.school || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        zipCode: userProfile.zipCode || '',
        parentFirstName: userProfile.parentFirstName || '',
        parentLastName: userProfile.parentLastName || '',
        parentPhoneNumber: userProfile.parentPhoneNumber || '',
        parentEmail: userProfile.parentEmail || userProfile.email || '',
        emergencyContactName: userProfile.emergencyContactName || '',
        emergencyContactPhone: userProfile.emergencyContactPhone || '',
        emergencyContactRelationship: userProfile.emergencyContactRelationship || ''
      }));
    }
  }, [userProfile, navigate]);

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
    if (!formData.accountType.trim()) newErrors.accountType = 'Account type is required';

    // Username validation
    if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username is not available';
    }

    // Volunteer-specific validation
    if (formData.accountType === 'VOLUNTEER') {
      if (!formData.grade.trim()) newErrors.grade = 'Grade is required for volunteers';
      if (!formData.school.trim()) newErrors.school = 'School is required for volunteers';
    }

    // Phone number validation (optional)
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Parent information validation (for minors)
    if (formData.parentFirstName || formData.parentLastName || formData.parentPhoneNumber || formData.parentEmail) {
      if (!formData.parentFirstName.trim()) newErrors.parentFirstName = 'Parent first name is required when parent info is provided';
      if (!formData.parentLastName.trim()) newErrors.parentLastName = 'Parent last name is required when parent info is provided';
      if (!formData.parentPhoneNumber.trim()) newErrors.parentPhoneNumber = 'Parent phone number is required when parent info is provided';
      if (!formData.parentEmail.trim()) newErrors.parentEmail = 'Parent email is required when parent info is provided';
    }

    // Emergency contact validation
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
      await apiService.updateUserProfile(formData);

      // Refresh user profile
      await fetchUserProfile();

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getUsernameStatusIcon = () => {
    if (usernameCheckLoading) {
      return <i className="fas fa-spinner fa-spin text-muted"></i>;
    }
    if (usernameAvailable === true) {
      return <i className="fas fa-check text-success"></i>;
    }
    if (usernameAvailable === false) {
      return <i className="fas fa-times text-danger"></i>;
    }
    return null;
  };

  if (!userProfile) {
    return (
      <div className="container mt-4">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
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
              <h2 className="mb-0">Complete Your Profile</h2>
              <p className="text-muted mb-0">Please provide the following information to complete your account setup.</p>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <div className="section-header">
                  <h4>Personal Information</h4>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
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
                        className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
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
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="accountType">Account Type *</label>
                      <select
                        className={`form-control ${errors.accountType ? 'is-invalid' : ''}`}
                        id="accountType"
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleInputChange}
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

                {/* Volunteer-specific fields */}
                {formData.accountType === 'VOLUNTEER' && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="grade">Grade *</label>
                        <select
                          className={`form-control ${errors.grade ? 'is-invalid' : ''}`}
                          id="grade"
                          name="grade"
                          value={formData.grade}
                          onChange={handleInputChange}
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
                          className={`form-control ${errors.school ? 'is-invalid' : ''}`}
                          id="school"
                          name="school"
                          value={formData.school}
                          onChange={handleInputChange}
                          placeholder="e.g., Great Valley High School"
                          required
                        />
                        {errors.school && <div className="invalid-feedback">{errors.school}</div>}
                      </div>
                    </div>
                  </div>
                )}

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
                    {/* Empty column for layout */}
                  </div>
                </div>

                {/* Address Information */}
                <div className="section-header">
                  <h4>Address Information</h4>
                  <small className="text-muted">Optional but helpful for local events</small>
                </div>

                <div className="form-group">
                  <label htmlFor="address">Street Address</label>
                  <input
                    type="text"
                    className="form-control"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        className="form-control"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="state">State</label>
                      <input
                        type="text"
                        className="form-control"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="PA"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="zipCode">ZIP Code</label>
                      <input
                        type="text"
                        className="form-control"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Parent Information */}
                <div className="section-header">
                  <h4>Parent/Guardian Information</h4>
                  <small className="text-muted">Required for participants under 18</small>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="parentFirstName">Parent First Name</label>
                      <input
                        type="text"
                        className={`form-control ${errors.parentFirstName ? 'is-invalid' : ''}`}
                        id="parentFirstName"
                        name="parentFirstName"
                        value={formData.parentFirstName}
                        onChange={handleInputChange}
                      />
                      {errors.parentFirstName && <div className="invalid-feedback">{errors.parentFirstName}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="parentLastName">Parent Last Name</label>
                      <input
                        type="text"
                        className={`form-control ${errors.parentLastName ? 'is-invalid' : ''}`}
                        id="parentLastName"
                        name="parentLastName"
                        value={formData.parentLastName}
                        onChange={handleInputChange}
                      />
                      {errors.parentLastName && <div className="invalid-feedback">{errors.parentLastName}</div>}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="parentPhoneNumber">Parent Phone Number</label>
                      <input
                        type="tel"
                        className={`form-control ${errors.parentPhoneNumber ? 'is-invalid' : ''}`}
                        id="parentPhoneNumber"
                        name="parentPhoneNumber"
                        value={formData.parentPhoneNumber}
                        onChange={handleInputChange}
                        placeholder="(555) 123-4567"
                      />
                      {errors.parentPhoneNumber && <div className="invalid-feedback">{errors.parentPhoneNumber}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="parentEmail">Parent Email</label>
                      <input
                        type="email"
                        className={`form-control ${errors.parentEmail ? 'is-invalid' : ''}`}
                        id="parentEmail"
                        name="parentEmail"
                        value={formData.parentEmail}
                        onChange={handleInputChange}
                      />
                      {errors.parentEmail && <div className="invalid-feedback">{errors.parentEmail}</div>}
                    </div>
                  </div>
                </div>

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
                        className={`form-control ${errors.emergencyContactName ? 'is-invalid' : ''}`}
                        id="emergencyContactName"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                      />
                      {errors.emergencyContactName && <div className="invalid-feedback">{errors.emergencyContactName}</div>}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="emergencyContactPhone">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        className={`form-control ${errors.emergencyContactPhone ? 'is-invalid' : ''}`}
                        id="emergencyContactPhone"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleInputChange}
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
                        className={`form-control ${errors.emergencyContactRelationship ? 'is-invalid' : ''}`}
                        id="emergencyContactRelationship"
                        name="emergencyContactRelationship"
                        value={formData.emergencyContactRelationship}
                        onChange={handleInputChange}
                        placeholder="e.g., Parent, Sibling, Friend"
                      />
                      {errors.emergencyContactRelationship && <div className="invalid-feedback">{errors.emergencyContactRelationship}</div>}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading || usernameAvailable === false}
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Completing Profile...
                      </>
                    ) : (
                      'Complete Profile'
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

        .input-group-text {
          width: 40px;
          justify-content: center;
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