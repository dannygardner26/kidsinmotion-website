import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';

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
    // If user already has a complete profile, redirect to dashboard
    if (userProfile && userProfile.firstName && userProfile.lastName && userProfile.username &&
        userProfile.userType && (userProfile.email || userProfile.phoneNumber)) {
      navigate('/dashboard');
      return;
    }

    // Pre-populate form with existing user data
    if (userProfile) {
      setFormData(prevData => ({
        ...prevData,
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        // Don't pre-fill username - user must create one
        phoneNumber: userProfile.phoneNumber || '',
        accountType: userProfile.userType || '',
        grade: userProfile.grade || '',
        school: userProfile.school || '',
        // Don't pre-fill password - user must create one
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
      // Link Firebase credentials for OAuth users
      if (userProfile?.email && formData.password) {
        try {
          const credential = EmailAuthProvider.credential(userProfile.email, formData.password);
          await linkWithCredential(auth.currentUser, credential);
          console.log('Firebase credentials linked successfully');
        } catch (credentialError) {
          console.warn('Failed to link credentials (may already exist):', credentialError);
          // Don't block profile completion if credential linking fails
        }
      }

      // Update profile in backend
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

      await apiService.updateUserProfile(profileData);

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
      return <span className="text-gray-500">🔄</span>;
    }
    if (usernameAvailable === true) {
      return <span className="text-green-500">✓</span>;
    }
    if (usernameAvailable === false) {
      return <span className="text-red-500">✗</span>;
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

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Just a few more details to get you started</p>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{getProgressPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Pre-filled Data Notice */}
          {userProfile?.email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 animate-slide-in">
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">ℹ️</span>
                <div>
                  <p className="text-blue-800 font-medium">Welcome back!</p>
                  <p className="text-blue-700 text-sm">
                    We've pre-filled some information from your Google account ({userProfile.email})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Form Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-slide-up">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    👤 Personal Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        } ${formData.firstName ? 'border-green-300 bg-green-50' : ''}`}
                        required
                      />
                      {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        } ${formData.lastName ? 'border-green-300 bg-green-50' : ''}`}
                        required
                      />
                      {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Username * {getUsernameStatusIcon()}
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          errors.username ? 'border-red-500' : 'border-gray-300'
                        } ${usernameAvailable === true ? 'border-green-300 bg-green-50' : ''}`}
                        placeholder="Choose a unique username"
                        required
                      />
                      {errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}
                      <p className="text-xs text-gray-500">3-20 characters, letters, numbers, hyphens, underscores only</p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
                        Account Type *
                      </label>
                      <select
                        id="accountType"
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          errors.accountType ? 'border-red-500' : 'border-gray-300'
                        } ${formData.accountType ? 'border-green-300 bg-green-50' : ''}`}
                        required
                      >
                        <option value="">Select Account Type</option>
                        <option value="PARENT">Parent</option>
                        <option value="VOLUNTEER">Volunteer</option>
                      </select>
                      {errors.accountType && <p className="text-red-500 text-xs">{errors.accountType}</p>}
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    🔒 Account Security
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password *
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        } ${formData.password && formData.password.length >= 6 ? 'border-green-300 bg-green-50' : ''}`}
                        required
                      />
                      {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                      <p className="text-xs text-gray-500">Minimum 6 characters</p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        } ${formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-300 bg-green-50' : ''}`}
                        required
                      />
                      {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    📞 Contact Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                        Phone Number {!userProfile?.email && '*'}
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                        } ${formData.phoneNumber && /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formData.phoneNumber) ? 'border-green-300 bg-green-50' : ''}`}
                        placeholder="(555) 123-4567"
                      />
                      {errors.phoneNumber && <p className="text-red-500 text-xs">{errors.phoneNumber}</p>}
                      {!userProfile?.email && <p className="text-xs text-gray-500">Required since no email provided</p>}
                    </div>

                    {userProfile?.email && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                          {userProfile.email}
                        </div>
                        <p className="text-xs text-gray-500">From your Google account</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Volunteer-specific fields */}
                {formData.accountType === 'VOLUNTEER' && (
                  <div className="animate-slide-in">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      🎓 Volunteer Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                          Grade *
                        </label>
                        <select
                          id="grade"
                          name="grade"
                          value={formData.grade}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                            errors.grade ? 'border-red-500' : 'border-gray-300'
                          } ${formData.grade ? 'border-green-300 bg-green-50' : ''}`}
                          required
                        >
                          <option value="">Select Grade</option>
                          <option value="9">9th Grade</option>
                          <option value="10">10th Grade</option>
                          <option value="11">11th Grade</option>
                          <option value="12">12th Grade</option>
                          <option value="College">College</option>
                        </select>
                        {errors.grade && <p className="text-red-500 text-xs">{errors.grade}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="school" className="block text-sm font-medium text-gray-700">
                          School *
                        </label>
                        <input
                          type="text"
                          id="school"
                          name="school"
                          value={formData.school}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                            errors.school ? 'border-red-500' : 'border-gray-300'
                          } ${formData.school ? 'border-green-300 bg-green-50' : ''}`}
                          placeholder="e.g., Great Valley High School"
                          required
                        />
                        {errors.school && <p className="text-red-500 text-xs">{errors.school}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Emergency Contact Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    🚨 Emergency Contact <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        id="emergencyContactName"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          errors.emergencyContactName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Full name"
                      />
                      {errors.emergencyContactName && <p className="text-red-500 text-xs">{errors.emergencyContactName}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="emergencyContactPhone"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          errors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="(555) 123-4567"
                      />
                      {errors.emergencyContactPhone && <p className="text-red-500 text-xs">{errors.emergencyContactPhone}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="emergencyContactRelationship" className="block text-sm font-medium text-gray-700">
                        Relationship
                      </label>
                      <input
                        type="text"
                        id="emergencyContactRelationship"
                        name="emergencyContactRelationship"
                        value={formData.emergencyContactRelationship}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          errors.emergencyContactRelationship ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Parent, Sibling"
                      />
                      {errors.emergencyContactRelationship && <p className="text-red-500 text-xs">{errors.emergencyContactRelationship}</p>}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isLoading || usernameAvailable === false}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isLoading || usernameAvailable === false
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Completing Profile...
                      </span>
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

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CompleteProfile;