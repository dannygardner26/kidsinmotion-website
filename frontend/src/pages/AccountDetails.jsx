import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import firestoreUserService from '../services/firestoreUserService';
import AccountTypeSelector from '../components/AccountTypeSelector';
import { sendPasswordResetEmail, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const AccountDetails = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile: currentUserProfile, authReady, loading: authLoading, currentUser, updateProfile } = useAuth();
  const [authRetryCount, setAuthRetryCount] = useState(0);

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
    password: '',
    emailOptedOut: false
  });
  const [originalUsername, setOriginalUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameCooldown, setUsernameCooldown] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [pendingAccountType, setPendingAccountType] = useState('');
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');

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
                    (currentUser && currentUser.email && username === currentUser.email.split('@')[0]) ||
                    (currentUser && currentUser.uid && username === currentUser.uid) ||
                    (username === 'default' && currentUser);

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

      // For Firebase-only users, fetch fresh data from Firestore to ensure we have the latest
      if (isSelfEdit && currentUser) {
        let userData;

        try {
          // Try to get fresh data from Firestore first
          const freshUserData = await firestoreUserService.getUser(currentUser.uid);

          if (freshUserData) {
            // Use fresh Firestore data
            userData = {
              ...freshUserData,
              username: freshUserData.username || freshUserData.email?.split('@')[0] || ''
            };
            console.log('Loaded fresh profile data from Firestore:', userData);
          } else {
            // Fallback to AuthContext profile or create minimal profile
            userData = currentUserProfile ? {
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

            console.log('Using fallback profile data:', userData);
          }
        } catch (error) {
          console.error('Error loading fresh profile data:', error);
          // Fallback to AuthContext profile
          userData = currentUserProfile || {
            uid: currentUser.uid,
            email: currentUser.email,
            firstName: currentUser.displayName?.split(' ')[0] || '',
            lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
            username: currentUser.email?.split('@')[0] || '',
            userType: 'USER',
            roles: ['ROLE_USER'],
            emailVerified: currentUser.emailVerified || false
          };
        }

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
        password: '',
        emailOptedOut: userData.emailOptedOut || false
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
        // For non-self edits (admin viewing other users), fetch the user's profile
        const isCurrentUserAdmin = currentUserProfile?.userType === 'ADMIN' ||
                                 currentUserProfile?.roles?.includes('ROLE_ADMIN') ||
                                 currentUser?.email === 'kidsinmotion0@gmail.com' ||
                                 currentUser?.email === 'danny@dannygardner.com';

        if (!isCurrentUserAdmin) {
          throw new Error('Profile not found or access denied');
        }

        console.log('Admin fetching other user profile for username:', username);

        // Handle undefined username for OAuth users
        if (!username || username === 'undefined') {
          throw new Error('Invalid username parameter');
        }

        // First try fetching by username from Firestore
        try {
          const userData = await firestoreUserService.fetchUserByUsername(username);
          if (userData) {
            console.log('Loaded user profile for admin view:', userData);
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
              password: '',
              emailOptedOut: userData.emailOptedOut || false
            });
            setProfileData(userData);
            setOriginalUsername(userData.username);
          } else {
            throw new Error('User not found');
          }
        } catch (fetchError) {
          console.error('Failed to fetch user profile for admin view:', fetchError);
          throw new Error('Profile not found or access denied');
        }
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
      // If it's the same as original username, it's available (no change)
      if (username === originalUsername) {
        setUsernameAvailable(true);
        return;
      }

      // Check against all users in Firestore to ensure uniqueness
      const allUsers = await firestoreUserService.getAllUsers();
      const existingUser = allUsers.find(user =>
        user.username === username && user.firebaseUid !== currentUser?.uid
      );

      const available = !existingUser;
      setUsernameAvailable(available);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`Username "${username}" availability check:`, available ? 'Available' : 'Taken');
      }
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

  const scrollToError = (fieldName) => {
    const errorElement = document.querySelector(`[data-field="${fieldName}"]`) ||
                        document.querySelector(`[name="${fieldName}"]`) ||
                        document.querySelector(`#${fieldName}`);
    if (errorElement) {
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      errorElement.focus();
      // Add temporary red outline
      errorElement.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.3)';
      errorElement.style.borderColor = '#dc3545';
      setTimeout(() => {
        errorElement.style.boxShadow = '';
        errorElement.style.borderColor = '';
      }, 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check username availability before submitting
    if (formData.username !== originalUsername && usernameAvailable === false) {
      const errorMsg = 'This username is already taken. Please choose a different one.';
      setErrors({ username: errorMsg });
      scrollToError('username');
      return;
    }

    if (!validateForm()) {
      // Find first error field and scroll to it
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        scrollToError(firstErrorField);
      }
      return;
    }

    setIsSaving(true);
    setSuccessMessage('');
    setAuthRetryCount(0); // Reset retry count on new submission

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
        emergencyContactRelationship: formData.emergencyContactRelationship,
        emailOptedOut: formData.emailOptedOut
      };

      // Include email for admin editing others when changed
      if (isAdmin && !isSelfEdit && formData.email !== profileData.email) {
        updateData.email = formData.email;
      }

      // Handle Firebase users vs backend users differently
      // For Firebase users editing themselves, ALWAYS use Firebase path
      // This handles both profile completion (?complete=true) and regular editing (?edit=true)
      const searchParams = new URLSearchParams(location.search);
      const completeParam = searchParams.get('complete');
      const editParam = searchParams.get('edit');
      const isProfileCompletion = completeParam === 'true';
      const isProfileEdit = editParam === 'true';

      // If user is not loaded yet, prevent save action
      if (!authReady || authLoading) {
        setErrors({ general: 'Authentication is still loading. Please wait and try again.' });
        return;
      }

      // If currentUser is still undefined after auth is ready, this indicates a timing issue
      if (!currentUser) {
        console.error('currentUser is undefined even though auth is ready. Auth state:', {
          authReady,
          authLoading,
          currentUserProfile: !!currentUserProfile,
          retryCount: authRetryCount
        });

        // Retry up to 3 times with increasing delays
        if (authRetryCount < 3) {
          setErrors({ general: `Authentication is initializing. Retrying in ${1 + authRetryCount} second(s)...` });
          setTimeout(() => {
            setAuthRetryCount(prev => prev + 1);
            setErrors({}); // Clear error to trigger retry
            handleSubmit(e); // Retry form submission
          }, (1 + authRetryCount) * 1000);
        } else {
          setErrors({ general: 'Authentication error. Please refresh the page and try again.' });
        }
        return;
      }

      const isFirebaseUser = currentUser && currentUser.uid;

      // Special handling for username changes during profile completion/editing
      const isUsernameChange = formData.username !== username;
      const isFirebaseUserWithUsernameChange = isFirebaseUser && isUsernameChange && (isProfileCompletion || isProfileEdit);

      // Use Firebase path if:
      // 1. Firebase user editing themselves, OR
      // 2. Firebase user in completion/edit mode, OR
      // 3. Firebase user changing username during completion/edit
      const shouldUseFirebasePath = isFirebaseUser && (
        isSelfEdit ||
        isProfileCompletion ||
        isProfileEdit ||
        isFirebaseUserWithUsernameChange
      );

      // Log every step
      console.log('URL and params:', {
        fullURL: window.location.href,
        search: location.search,
        completeParam: completeParam,
        editParam: editParam,
        isProfileCompletion: isProfileCompletion,
        isProfileEdit: isProfileEdit
      });
      console.log('User checks:', {
        currentUser: currentUser,
        currentUserUID: currentUser?.uid,
        currentUserProfileUsername: currentUserProfile?.username,
        urlUsername: username,
        isFirebaseUser: isFirebaseUser
      });

      console.log('Save conditions:', {
        isSelfEdit: isSelfEdit,
        currentUser: !!currentUser,
        currentUserUid: currentUser?.uid,
        currentUserProfile: !!currentUserProfile,
        username: username,
        formDataUsername: formData.username,
        isUsernameChange: isUsernameChange,
        isProfileCompletion: isProfileCompletion,
        isProfileEdit: isProfileEdit,
        isFirebaseUser: isFirebaseUser,
        isFirebaseUserWithUsernameChange: isFirebaseUserWithUsernameChange,
        shouldUseFirebase: shouldUseFirebasePath,
        actualPath: shouldUseFirebasePath ? 'FIREBASE' : 'BACKEND',
        urlParams: location.search
      });
      console.log('Detailed breakdown:', {
        'isFirebaseUser': isFirebaseUser,
        'isSelfEdit': isSelfEdit,
        'isProfileCompletion': isProfileCompletion,
        'isProfileEdit': isProfileEdit,
        'isUsernameChange': isUsernameChange,
        'isFirebaseUserWithUsernameChange': isFirebaseUserWithUsernameChange,
        'Final shouldUseFirebase': shouldUseFirebasePath
      });

      if (shouldUseFirebasePath) {
        console.log('Taking Firebase path for profile update');
        try {
          // Firebase user - update profile in Firestore and context
          // Create profile object from current data or use existing profile
          const baseProfile = currentUserProfile || {
            uid: currentUser.uid,
            firebaseUid: currentUser.uid,
            email: currentUser.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            userType: formData.userType || 'USER',
            createdAt: new Date().toISOString()
          };

          const updatedProfile = {
            ...baseProfile,
            ...updateData,
            uid: currentUser.uid,
            firebaseUid: currentUser.uid,
            email: formData.email, // Include email changes for Firebase users
            updatedAt: new Date().toISOString()
          };

          // Use AuthContext updateProfile which handles both Firestore and localStorage
          const finalUpdatedProfile = await updateProfile(updatedProfile);

          // Update local profile data
          setProfileData(finalUpdatedProfile);

          console.log('Firebase profile updated successfully');
        } catch (error) {
          console.error('Firebase update failed, falling back to backend:', error);
          throw error; // Re-throw to prevent fallback to backend
        }
      } else {
        console.log('Taking backend path for profile update');
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

      // Refresh profile data only for admin changes or actual backend users
      // Skip refresh for Firebase users editing themselves
      if (!isSelfEdit && isAdmin) {
        await fetchProfileData();
      }

      // For Firebase users who just completed profile setup, redirect to dashboard
      // Use the searchParams already declared above
      const isProfileCompletionRedirect = searchParams.get('complete') === 'true';

      if (isProfileCompletionRedirect && isSelfEdit) {
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
      password: '',
      emailOptedOut: profileData.emailOptedOut || false
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

  const handleAccountTypeChange = (newType) => {
    if (newType !== formData.userType && isSelfEdit) {
      setPendingAccountType(newType);
      setShowAccountTypeModal(true);
    } else {
      setFormData(prev => ({ ...prev, userType: newType }));
    }
  };

  const confirmAccountTypeChange = async () => {
    try {
      setIsSaving(true);

      // Clear all registrations and children for this user
      if (currentUser && currentUserProfile) {
        await firestoreUserService.clearUserRegistrations(currentUser.uid);

        // Update the user type
        const updatedProfile = {
          ...currentUserProfile,
          userType: pendingAccountType,
          children: [], // Clear children array
        };

        await firestoreUserService.updateUser(currentUser.uid, updatedProfile);

        setFormData(prev => ({ ...prev, userType: pendingAccountType }));
        setProfileData(updatedProfile);
        setSuccessMessage(`Account type changed to ${pendingAccountType}. All previous registrations have been cleared.`);
      }

      setShowAccountTypeModal(false);
      setPendingAccountType('');
    } catch (error) {
      console.error('Error changing account type:', error);
      setErrors({ general: 'Failed to change account type. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      if (currentUser && currentUser.email) {
        await sendPasswordResetEmail(auth, currentUser.email);
        setSuccessMessage('Password reset email sent! Check your inbox.');
      } else {
        setErrors({ general: 'Unable to send password reset email. No email address found.' });
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      setErrors({ general: 'Failed to send password reset email. Please try again.' });
    }
  };

  const handleEmailChange = async () => {
    try {
      setIsSaving(true);

      if (!newEmail || !newEmail.includes('@')) {
        setErrors({ email: 'Please enter a valid email address.' });
        return;
      }

      if (currentUser) {
        // Update email in Firebase Auth
        await updateEmail(currentUser, newEmail);

        // Update email in Firestore
        await firestoreUserService.updateUser(currentUser.uid, { email: newEmail });

        // Update local state
        setFormData(prev => ({ ...prev, email: newEmail }));
        if (profileData) {
          setProfileData({ ...profileData, email: newEmail });
        }

        setSuccessMessage('Email address updated successfully!');
        setShowEmailChangeModal(false);
        setNewEmail('');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/requires-recent-login') {
        setErrors({ general: 'Please sign out and sign back in before changing your email address.' });
      } else {
        setErrors({ general: 'Failed to update email address. Please try again.' });
      }
    } finally {
      setIsSaving(false);
    }
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
    <div style={{
      display: 'block',
      visibility: 'visible',
      opacity: 1,
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px 0',
      color: '#333'
    }}>
      <div className="container">
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
            <div className="col-12 col-md-8 col-lg-6">
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                color: '#333'
              }}>
                <div style={{
                  backgroundColor: '#2f506a',
                  color: 'white',
                  padding: '15px 20px',
                  borderRadius: '8px 8px 0 0'
                }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h2 className="mb-0" style={{color: 'white', fontSize: '1.5rem', fontWeight: 'bold'}}>
                        {isEditMode
                          ? (isSelfEdit ? 'Edit Account Details' : `Edit ${profileData.firstName} ${profileData.lastName}'s Account`)
                          : (isSelfEdit ? 'Account Details' : `${profileData.firstName} ${profileData.lastName}'s Account`)
                        }
                      </h2>
                      <p className="mb-0" style={{opacity: 0.8}}>
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
                          className="btn btn-sm"
                          style={{backgroundColor: 'white', color: '#2f506a', border: '1px solid #ddd'}}
                        >
                          <i className="fas fa-times mr-1"></i>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: '20px',
                  color: '#333',
                  backgroundColor: 'white'
                }}>
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

                  {/* Email Preferences */}
                  <div className="section-header">
                    <h4>Email Preferences</h4>
                  </div>

                  <div className="row mb-3">
                    <div className="col-12">
                      <div className="info-card">
                        <label className="info-label">General Emails</label>
                        <div className="info-value">
                          {formData.emailOptedOut ? (
                            <span className="badge badge-secondary">
                              <i className="fas fa-times-circle mr-1"></i>
                              Opted Out
                            </span>
                          ) : (
                            <span className="badge badge-success">
                              <i className="fas fa-check-circle mr-1"></i>
                              Opted In
                            </span>
                          )}
                        </div>
                        <div className="info-description">
                          You {formData.emailOptedOut ? 'have opted out of' : 'will receive'} general announcements and newsletters.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-12">
                      <div className="info-card">
                        <label className="info-label">Event Communications</label>
                        <div className="info-value">
                          <span className="badge badge-info">
                            <i className="fas fa-calendar-check mr-1"></i>
                            Required for Events
                          </span>
                        </div>
                        <div className="info-description">
                          <strong>All users MUST receive event-related emails</strong> (registration confirmations, reminders, cancellations) to participate in events.
                          This cannot be disabled for your safety and to ensure you receive critical event information.
                        </div>
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
                          disabled={!isAdmin && !isEditMode}
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                        {(!isAdmin && !isEditMode) && (
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
                            onClick={handlePasswordReset}
                          >
                            <i className="fas fa-key mr-1"></i>
                            Reset Password
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm mb-2"
                            onClick={() => setShowEmailChangeModal(true)}
                          >
                            <i className="fas fa-envelope mr-1"></i>
                            Change Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Type Switching for existing users */}
                  {isSelfEdit && formData.userType && formData.userType !== 'USER' && formData.userType !== 'user' && (
                    <>
                      <div className="section-header">
                        <h4>Account Type</h4>
                        <small className="text-muted">Change your account type (this will clear all registrations)</small>
                      </div>

                      <div className="row">
                        <div className="col-md-12">
                          <div className="account-type-section">
                            <div className="current-type-display">
                              <i className="fas fa-user-check text-success me-2"></i>
                              <span>Current Account Type: <strong className="text-dark">{formData.userType}</strong></span>
                            </div>
                            <div className="account-type-buttons mt-3">
                              <div className="d-grid gap-2 d-md-flex">
                                <button
                                  type="button"
                                  className={`btn ${formData.userType === 'PARENT' ? 'btn-success' : 'btn-outline-success'} flex-md-fill me-md-2`}
                                  onClick={() => handleAccountTypeChange('PARENT')}
                                  disabled={formData.userType === 'PARENT'}
                                >
                                  <i className="fas fa-users me-2"></i>
                                  Parent/Guardian
                                  {formData.userType === 'PARENT' && <i className="fas fa-check ms-2"></i>}
                                </button>
                                <button
                                  type="button"
                                  className={`btn ${formData.userType === 'VOLUNTEER' ? 'btn-success' : 'btn-outline-success'} flex-md-fill`}
                                  onClick={() => handleAccountTypeChange('VOLUNTEER')}
                                  disabled={formData.userType === 'VOLUNTEER'}
                                >
                                  <i className="fas fa-hands-helping me-2"></i>
                                  Volunteer
                                  {formData.userType === 'VOLUNTEER' && <i className="fas fa-check ms-2"></i>}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Account Type Selection for incomplete profiles */}
                  {isSelfEdit && (formData.userType === 'USER' || formData.userType === 'user' || !formData.userType) && (
                    <>
                      <div className="section-header">
                        <h4>Complete Your Account Setup</h4>
                        <div className="alert alert-info">
                          <i className="fas fa-info-circle me-2"></i>
                          <strong>Almost there!</strong> We need a bit more information to complete your account setup.
                          Please select whether you're joining as a parent/guardian or as a volunteer to help us
                          provide you with the most relevant information and opportunities.
                        </div>
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

                  {/* Email Preferences */}
                  <div className="section-header">
                    <h4>Email Preferences</h4>
                    <small className="text-muted">Control which types of emails you receive</small>
                  </div>

                  <div className="row">
                    <div className="col-12">
                      <div className="form-group">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="emailOptedOut"
                            name="emailOptedOut"
                            checked={formData.emailOptedOut}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label" htmlFor="emailOptedOut">
                            <strong>Opt out of general emails</strong>
                            <small className="form-text text-muted d-block">
                              Check this to stop receiving general announcements, newsletters, and marketing emails.
                            </small>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12">
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle mr-2"></i>
                        <strong>Important:</strong> All users MUST receive event-related emails (registration confirmations, reminders, cancellations) to participate in events.
                        This ensures you receive critical safety and scheduling information.
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
                      title={
                        formData.username !== originalUsername && usernameAvailable === false
                          ? 'Please choose an available username before saving'
                          : ''
                      }
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
                    {formData.username !== originalUsername && usernameAvailable === false && (
                      <div className="text-danger small mt-2">
                        <i className="fas fa-exclamation-triangle mr-1"></i>
                        Username "{formData.username}" is already taken. Please choose a different username.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn ml-2"
                      style={{backgroundColor: 'white', color: '#2f506a', border: '1px solid #ddd'}}
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
        </div>

      {/* Account Type Change Confirmation Modal */}
      {showAccountTypeModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                  Change Account Type
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAccountTypeModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <strong>Warning:</strong> Changing your account type will permanently delete:
                </div>
                <ul className="list-unstyled">
                  <li><i className="fas fa-times text-danger me-2"></i>All event registrations (volunteering commitments or child enrollments)</li>
                  <li><i className="fas fa-times text-danger me-2"></i>All children's profiles associated with your account</li>
                  <li><i className="fas fa-times text-danger me-2"></i>Your attendance history</li>
                </ul>
                <p className="text-muted mb-0">
                  Are you sure you want to change from <strong>{formData.userType}</strong> to <strong>{pendingAccountType}</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  style={{backgroundColor: 'white', color: '#2f506a', border: '1px solid #ddd'}}
                  onClick={() => setShowAccountTypeModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmAccountTypeChange}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Changing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>
                      Yes, Change Account Type
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .account-type-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid #e9ecef;
        }

        .current-type-display {
          font-size: 1rem;
          margin-bottom: 0;
        }

        .account-type-buttons .btn {
          font-weight: 500;
          border-radius: 6px;
          transition: all 0.3s ease;
          min-height: 50px;
        }

        .account-type-buttons .btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .account-type-buttons .btn:disabled {
          cursor: not-allowed;
          opacity: 1;
        }

        @media (max-width: 768px) {
          .account-type-buttons .d-md-flex {
            gap: 0.5rem !important;
          }
        }
      `}</style>

      {/* Email Change Modal */}
      {showEmailChangeModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-envelope text-primary me-2"></i>
                  Change Email Address
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEmailChangeModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  You'll need to verify your new email address after changing it.
                </div>
                <div className="form-group">
                  <label htmlFor="newEmail">New Email Address</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    id="newEmail"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter your new email address"
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                <p className="text-muted small mb-0">
                  Current email: <strong>{currentUser?.email}</strong>
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  style={{backgroundColor: 'white', color: '#2f506a', border: '1px solid #ddd'}}
                  onClick={() => setShowEmailChangeModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleEmailChange}
                  disabled={isSaving || !newEmail}
                >
                  {isSaving ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
                      Update Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDetails;