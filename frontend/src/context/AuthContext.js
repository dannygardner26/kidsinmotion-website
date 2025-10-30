import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { apiService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [isGoogleOAuthLogin, setIsGoogleOAuthLogin] = useState(false);

  // Verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const syncUserWithBackend = async (user, isGoogleOAuth = false) => {
    if (user) {
      try {
        // Check for cached profile first to speed up loading
        const cachedProfile = localStorage.getItem(`userProfile_${user.uid}`);
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);

          // Apply admin privileges if needed
          if (user.email === 'kidsinmotion0@gmail.com' || user.email === 'danny@dannygardner.com') {
            parsed.userType = 'ADMIN';
            parsed.roles = ['ROLE_USER', 'ROLE_ADMIN'];
          }

          // Use cached profile immediately, then refresh in background
          setUserProfile(parsed);
          setAuthReady(true);
          console.log("Using cached user profile:", parsed);
        }

        // For Google OAuth, check if user exists first
        if (isGoogleOAuth) {
          try {
            await apiService.checkUser();
            // User exists, proceed with sync
          } catch (error) {
            console.log("checkUser error:", error);
            // Check if it's a 404 response with user info
            if (error.response && error.response.status === 404) {
              let userInfo = null;
              try {
                userInfo = error.response.data;
              } catch (parseError) {
                console.warn("Could not parse user info from error response");
              }

              if (userInfo && userInfo.firstName) {
                // Store user info for registration pre-fill
                localStorage.setItem('pendingRegistration', JSON.stringify({
                  firstName: userInfo.firstName,
                  lastName: userInfo.lastName,
                  email: userInfo.email,
                  fromGoogleOAuth: true
                }));
              }
              // Sign out the user and redirect to registration
              await auth.signOut();
              window.location.href = '/register?oauth=google';
              return;
            }
            throw error;
          }
        }

        // Sync user with backend
        await apiService.syncUser();

        // Fetch user profile from backend
        const profile = await apiService.getUserProfile();

        // Automatically grant admin privileges to specific emails
        if (user.email === 'kidsinmotion0@gmail.com' || user.email === 'danny@dannygardner.com') {
          profile.userType = 'ADMIN';
          profile.roles = ['ROLE_USER', 'ROLE_ADMIN'];
          console.log("Automatically granted admin privileges to:", user.email);
        }

        setUserProfile(profile);

        // Update verification status
        const emailVerified = user.emailVerified;
        const phoneVerified = profile.phoneVerified || false;
        setIsEmailVerified(emailVerified);
        setIsPhoneVerified(phoneVerified);

        // Cache the profile for faster future loads
        localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profile));

        console.log("User synced with backend:", profile);
      } catch (error) {
        console.error("Failed to sync user with backend:", error);
        // Don't prevent login if backend sync fails
        if (!authReady) {
          setAuthReady(true); // Still allow app to load
        }
      }
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // Check for test admin user in localStorage first
    const checkTestUser = () => {
      const testUser = localStorage.getItem('testUser');
      const isTestAdmin = localStorage.getItem('isTestAdmin');

      if (testUser && isTestAdmin === 'true') {
        const userData = JSON.parse(testUser);
        console.log("Found test admin user in localStorage:", userData);

        // Create a mock Firebase user object
        const mockUser = {
          uid: 'test-admin-uid',
          email: userData.email,
          displayName: `${userData.firstName} ${userData.lastName}`
        };

        setCurrentUser(mockUser);

        // Sync test admin user with backend
        const syncTestUser = async () => {
          try {
            await apiService.syncUser();
            const profile = await apiService.getUserProfile();
            setUserProfile(profile);
            console.log("Test admin user synced with backend:", profile);
          } catch (error) {
            console.error("Failed to sync test admin user with backend:", error);
            // Use cached user data as fallback
            setUserProfile({
              ...userData,
              roles: userData.roles || ['ROLE_USER', 'ROLE_ADMIN']
            });
          }
          setLoading(false);
        };

        syncTestUser();
        return true;
      }
      return false;
    };

    // If test user found, don't proceed with Firebase auth
    if (checkTestUser()) {
      return;
    }

    // Add a timeout to ensure loading state doesn't last forever
    const loadingTimeout = setTimeout(() => {
      console.warn("Firebase auth loading timeout - setting loading to false");
      setLoading(false);
    }, 5000);

    try {
      // Listen for authentication state changes
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log("Auth State Changed:", user ? `User UID: ${user.uid}` : "No user");
        setCurrentUser(user);

        if (user) {
          await syncUserWithBackend(user, isGoogleOAuthLogin);
          setIsGoogleOAuthLogin(false); // Reset flag after use

          // Update verification status
          setIsEmailVerified(user.emailVerified);
        } else {
          setUserProfile(null);
          setIsEmailVerified(false);
          setIsPhoneVerified(false);
        }
        
        clearTimeout(loadingTimeout);
        setAuthReady(true);
        setLoading(false);
      });

      // Cleanup subscription on unmount
      return () => {
        clearTimeout(loadingTimeout);
        unsubscribe();
      };
    } catch (error) {
      console.error("Firebase auth initialization failed:", error);
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    setLoading(true); // Optional: show loading state during logout
    try {
      // Check if this is a test admin user
      const isTestAdmin = localStorage.getItem('isTestAdmin');

      if (isTestAdmin === 'true') {
        // Test admin logout
        localStorage.removeItem('testUser');
        localStorage.removeItem('isTestAdmin');
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
        console.log("Test admin signed out successfully.");
        return;
      }

      // Regular Firebase logout
      await signOut(auth);
      console.log("User signed out successfully.");
      // currentUser will be set to null by onAuthStateChanged listener
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(false); // Stop loading on error
      // Handle logout error (e.g., show a message to the user)
    }
    // setLoading(false) is handled by the onAuthStateChanged listener when user becomes null
  };

  // Function to get the current user's ID token
  const getIdToken = async () => {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken(true); // Force refresh token if needed
        return token;
      } catch (error) {
        console.error("Error getting ID token:", error);
        // Handle error, maybe force logout or re-authentication
        if (error.code === 'auth/user-token-expired' || error.code === 'auth/internal-error') {
           await logout(); // Force logout if token is invalid/expired
        }
        return null;
      }
    }
    return null;
  };


  const updateProfile = async (profileData) => {
    try {
      await apiService.updateUserProfile(profileData);
      const updatedProfile = await apiService.getUserProfile();
      setUserProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  };

  // Verification helper methods
  const sendEmailVerification = async () => {
    if (!currentUser) throw new Error('No user logged in');

    setVerificationLoading(true);
    try {
      const { sendEmailVerification } = await import('firebase/auth');
      await sendEmailVerification(currentUser);
      console.log('Email verification sent');
    } catch (error) {
      console.error('Error sending email verification:', error);
      throw error;
    } finally {
      setVerificationLoading(false);
    }
  };

  const sendPasswordResetEmail = async (email) => {
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('../firebaseConfig');
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  const refreshVerificationStatus = async () => {
    if (!currentUser) return;

    try {
      await currentUser.reload();
      const emailVerified = currentUser.emailVerified;
      setIsEmailVerified(emailVerified);

      // Also refresh profile to get phone verification status
      const profile = await apiService.getUserProfile();
      const phoneVerified = profile.phoneVerified || false;
      setIsPhoneVerified(phoneVerified);
    } catch (error) {
      console.error('Error refreshing verification status:', error);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    authReady, // New flag for faster UI rendering
    logout,
    updateProfile,
    getIdToken, // Provide function to get token
    syncUserWithBackend, // For manual sync if needed
    setIsGoogleOAuthLogin, // For flagging Google OAuth logins
    // Verification properties and methods
    isEmailVerified,
    isPhoneVerified,
    isVerified: isEmailVerified || isPhoneVerified,
    verificationLoading,
    sendEmailVerification,
    sendPasswordResetEmail,
    refreshVerificationStatus
  };

  // Don't render children until loading is false to prevent rendering protected routes prematurely
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};