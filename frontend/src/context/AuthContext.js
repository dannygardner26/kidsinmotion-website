import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { apiService } from '../services/api';

const AuthContext = createContext();

// Utility function to compute if profile completion is needed
const computeNeedsProfileCompletion = (profile, user = null) => {
  // Admin accounts are exempt from profile completion requirements
  if (profile?.userType === 'ADMIN') {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Admin account - no profile completion needed:', profile.userType);
    }
    return false;
  }

  const hasRequiredFields = profile?.username && profile?.firstName && profile?.lastName;
  const hasContact = profile?.email || profile?.phoneNumber;

  if (!hasRequiredFields) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Missing required fields:', { username: !!profile?.username, firstName: !!profile?.firstName, lastName: !!profile?.lastName });
    }
    return true;
  }

  if (!hasContact) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Missing contact info:', { email: !!profile?.email, phoneNumber: !!profile?.phoneNumber });
    }
    return true;
  }

  // Check if OAuth user needs password setup
  const isOAuthUser = !profile?.hasPassword; // This would need to be added to the API response
  if (isOAuthUser && process.env.NODE_ENV !== 'production') {
    console.log('OAuth user needs password setup');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('Profile completion check:', {
      hasRequiredFields,
      hasContact,
      isOAuthUser,
      needsCompletion: isOAuthUser
    });
  }

  return isOAuthUser;
};

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

  // Profile completion state
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  // Track pending sync timeouts for cleanup
  const syncTimeoutRef = React.useRef(null);

  // Track last known UID for targeted cache cleanup on logout
  const lastUidRef = React.useRef(null);

  const syncUserWithBackend = async (user, isGoogleOAuth = false, retryCount = 0) => {
    if (user) {
      try {
        // Verify Firebase user object is fully initialized before making API calls
        const isUserReady = user.uid && user.email && typeof user.getIdToken === 'function';
        if (!isUserReady && retryCount < 3) {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Firebase user not fully ready, waiting 200ms (attempt ${retryCount + 1}/3)...`);
          }
          await new Promise(resolve => setTimeout(resolve, 200));
          return syncUserWithBackend(user, isGoogleOAuth, retryCount + 1);
        }

        // Check for cached profile first to speed up loading
        const cachedProfile = localStorage.getItem(`userProfile_${user.uid}`);
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);

          // Apply admin privileges if needed
          if (user.email === 'kidsinmotion0@gmail.com' || user.email === 'danny@dannygardner.com') {
            parsed.userType = 'ADMIN';
            parsed.roles = ['ROLE_USER', 'ROLE_ADMIN'];
          }

          // Use cached profile immediately for instant UI rendering
          setUserProfile(parsed);
          setAuthReady(true);
          if (process.env.NODE_ENV !== 'production') {
            console.log("Using cached user profile:", parsed);
          }

          // Background refresh - non-blocking, wrapped in its own try-catch
          (async () => {
            try {
              if (process.env.NODE_ENV !== 'production') {
                console.log("Starting background profile refresh...");
              }
              await apiService.syncUser();
              const freshProfile = await apiService.getUserProfile();

              // Apply admin privileges to fresh profile
              if (user.email === 'kidsinmotion0@gmail.com' || user.email === 'danny@dannygardner.com') {
                freshProfile.userType = 'ADMIN';
                freshProfile.roles = ['ROLE_USER', 'ROLE_ADMIN'];
              }

              setUserProfile(freshProfile);
              localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(freshProfile));
              if (process.env.NODE_ENV !== 'production') {
                console.log("Background profile refresh completed:", freshProfile);
              }
            } catch (bgError) {
              // Background sync failures are non-critical - just log them
              if (process.env.NODE_ENV !== 'production') {
                console.warn("Background profile refresh failed (non-critical):", bgError);
              }
            }
          })();

          // Return early since we're using cached data
          return;
        }

        // No cached profile - sync with backend (creates/initializes user if needed)
        if (process.env.NODE_ENV !== 'production') {
          console.log("No cached profile, syncing with backend...");
        }
        await apiService.syncUser();

        // Fetch user profile from backend
        const profile = await apiService.getUserProfile();

        // Automatically grant admin privileges to specific emails
        if (user.email === 'kidsinmotion0@gmail.com' || user.email === 'danny@dannygardner.com') {
          profile.userType = 'ADMIN';
          profile.roles = ['ROLE_USER', 'ROLE_ADMIN'];
          if (process.env.NODE_ENV !== 'production') {
            console.log("Automatically granted admin privileges to:", user.email);
          }
        }

        setUserProfile(profile);

        // For Google OAuth, redirect to profile completion after backend sync
        if (isGoogleOAuth && profile.username) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('Redirecting OAuth user to profile completion:', profile.username);
          }
          window.location.href = `/account/${profile.username}?complete=true`;
          return;
        }

        // Check if profile completion is needed
        const needsCompletion = computeNeedsProfileCompletion(profile);
        setNeedsProfileCompletion(needsCompletion);

        // Redirect to profile completion for users who need it
        if (needsCompletion && profile.username && !isGoogleOAuth) {
          // Only redirect if not already on profile completion page
          const currentPath = window.location.pathname;
          const accountPath = `/account/${profile.username}`;

          if (!currentPath.includes('/account/') && !currentPath.includes('?complete=true')) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('Redirecting to profile completion:', accountPath);
            }
            setTimeout(() => {
              window.location.href = `${accountPath}?complete=true`;
            }, 1000); // Small delay to allow UI to load
          }
        }

        // Update verification status
        const emailVerified = user.emailVerified;
        const phoneVerified = profile.phoneVerified || false;
        setIsEmailVerified(emailVerified);
        setIsPhoneVerified(phoneVerified);

        // Cache the profile for faster future loads
        localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profile));

        if (process.env.NODE_ENV !== 'production') {
          console.log("User synced with backend:", profile);
        }
      } catch (error) {
        // Enhanced error handling for auth initialization issues
        const isAuthError = error.code === 'auth/internal-error' ||
                           error.code === 'auth/network-request-failed' ||
                           error.message?.includes('not fully initialized');

        if (isAuthError && retryCount < 2) {
          // Retry with exponential backoff for auth initialization errors
          const backoffDelay = retryCount === 0 ? 500 : 1000;
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Auth initialization error detected, retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/2)...`);
          }
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          return syncUserWithBackend(user, isGoogleOAuth, retryCount + 1);
        }

        if (process.env.NODE_ENV !== 'production') {
          console.error("Failed to sync user with backend:", error);
          console.error("Error code:", error.code);
          console.error("Retry count:", retryCount);
        }

        // Don't prevent login if backend sync fails - allow app to load with cached data or without profile
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
        if (process.env.NODE_ENV !== 'production') {
          console.log("Found test admin user in localStorage:", userData);
        }

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
            if (process.env.NODE_ENV !== 'production') {
              console.log("Test admin user synced with backend:", profile);
            }
          } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
              console.error("Failed to sync test admin user with backend:", error);
            }
            // Use cached user data as fallback
            setUserProfile({
              ...userData,
              roles: userData.roles || ['ROLE_USER', 'ROLE_ADMIN']
            });
          }
          setAuthReady(true);
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
      if (process.env.NODE_ENV !== 'production') {
        console.warn("Firebase auth loading timeout - setting loading to false");
      }
      setAuthReady(true);
      setLoading(false);
    }, 10000); // Increased timeout to 10 seconds

    try {
      // Listen for authentication state changes
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log("Auth State Changed:", user ? `User UID: ${user.uid}` : "No user");
        }

        clearTimeout(loadingTimeout);
        setCurrentUser(user);

        if (user) {
          // Track the last known UID for targeted cache cleanup on logout
          lastUidRef.current = user.uid;
          // Check if this is a restored session vs a fresh login
          const isRestoredSession = !isGoogleOAuthLogin;

          if (isRestoredSession && process.env.NODE_ENV !== 'production') {
            console.log("Restored session detected, checking token validity...");

            // For restored sessions, verify the token is still valid
            try {
              await user.getIdToken(true); // Force token refresh
              console.log("Token validation successful for restored session");
            } catch (tokenError) {
              console.warn("Token validation failed for restored session:", tokenError);
              // If token is invalid, clear auth state and don't proceed
              if (tokenError.code === 'auth/network-request-failed' ||
                  tokenError.code === 'auth/user-token-expired' ||
                  tokenError.code === 'auth/invalid-user-token') {
                console.log("Clearing invalid auth state...");

                // Targeted removal of Firebase auth keys instead of localStorage.clear()
                // This preserves other app data while cleaning up invalid auth state
                try {
                  const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
                  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;

                  let removedCount = 0;

                  // Attempt targeted removal with exact keys
                  if (apiKey && projectId) {
                    const firebaseKeysToRemove = [
                      `firebase:authUser:${apiKey}:[DEFAULT]`,
                      `firebase:host:${projectId}.firebaseapp.com`,
                      `firebase:host:${projectId}.web.app`,
                      `firebase:persistence:${apiKey}:[DEFAULT]`,
                      `firebase:authTokenSyncURL:${apiKey}:[DEFAULT]`,
                      `firebase:pendingRedirect:${apiKey}:[DEFAULT]`
                    ];

                    firebaseKeysToRemove.forEach(key => {
                      if (localStorage.getItem(key)) {
                        if (process.env.NODE_ENV !== 'production') {
                          console.log("Removing Firebase auth key:", key);
                        }
                        localStorage.removeItem(key);
                        removedCount++;
                      }
                    });
                  }

                  // Fallback: prefix-based deletion if env vars are missing or no keys were removed
                  if (!apiKey || !projectId || removedCount === 0) {
                    if (process.env.NODE_ENV !== 'production') {
                      console.log("Using fallback prefix-based deletion for firebase: keys");
                    }
                    Object.keys(localStorage).forEach(key => {
                      if (key.startsWith('firebase:')) {
                        if (process.env.NODE_ENV !== 'production') {
                          console.log("Removing Firebase key (fallback):", key);
                        }
                        localStorage.removeItem(key);
                      }
                    });
                  }

                  // Also remove user profile cache
                  const userProfileKey = `userProfile_${user?.uid}`;
                  if (localStorage.getItem(userProfileKey)) {
                    if (process.env.NODE_ENV !== 'production') {
                      console.log("Removing user profile cache:", userProfileKey);
                    }
                    localStorage.removeItem(userProfileKey);
                  }
                } catch (cleanupError) {
                  console.warn("Error during targeted localStorage cleanup:", cleanupError);
                }

                setCurrentUser(null);
                setUserProfile(null);
                setAuthReady(true);
                setLoading(false);
                return;
              }
            }
          }

          // Add initialization delay to prevent race condition with Firebase Auth's internal initialization
          // Firebase Auth needs time to complete its accounts:lookup call before we can safely make API requests
          if (process.env.NODE_ENV !== 'production') {
            console.log("Waiting 300ms for Firebase Auth to complete initialization...");
          }

          // Store timeout for cleanup
          syncTimeoutRef.current = setTimeout(async () => {
            if (process.env.NODE_ENV !== 'production') {
              console.log("Initialization delay complete, syncing user with backend...");
            }

            await syncUserWithBackend(user, isGoogleOAuthLogin);
            setIsGoogleOAuthLogin(false); // Reset flag after use

            // Update verification status
            setIsEmailVerified(user.emailVerified);

            setAuthReady(true);
            setLoading(false);
          }, 300); // Reduced delay since we're validating tokens first
        } else {
          // User is logged out - perform targeted localStorage cleanup
          // Instead of localStorage.clear(), only remove Firebase auth keys and user profile cache
          // This preserves other app data (preferences, settings, etc.)
          try {
            const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
            const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;

            let removedCount = 0;

            // Attempt targeted removal with exact keys
            if (apiKey && projectId) {
              const firebaseKeysToRemove = [
                `firebase:authUser:${apiKey}:[DEFAULT]`,
                `firebase:host:${projectId}.firebaseapp.com`,
                `firebase:host:${projectId}.web.app`,
                `firebase:persistence:${apiKey}:[DEFAULT]`,
                `firebase:authTokenSyncURL:${apiKey}:[DEFAULT]`,
                `firebase:pendingRedirect:${apiKey}:[DEFAULT]`
              ];

              firebaseKeysToRemove.forEach(key => {
                if (localStorage.getItem(key)) {
                  if (process.env.NODE_ENV !== 'production') {
                    console.log("Removing Firebase auth key on logout:", key);
                  }
                  localStorage.removeItem(key);
                  removedCount++;
                }
              });
            }

            // Fallback: prefix-based deletion if env vars are missing or no keys were removed
            if (!apiKey || !projectId || removedCount === 0) {
              if (process.env.NODE_ENV !== 'production') {
                console.log("Using fallback prefix-based deletion for firebase: keys");
              }
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('firebase:')) {
                  if (process.env.NODE_ENV !== 'production') {
                    console.log("Removing Firebase key (fallback):", key);
                  }
                  localStorage.removeItem(key);
                }
              });
            }

            // Remove only the current user's profile cache using tracked UID
            if (lastUidRef.current) {
              const userProfileKey = `userProfile_${lastUidRef.current}`;
              if (localStorage.getItem(userProfileKey)) {
                if (process.env.NODE_ENV !== 'production') {
                  console.log("Removing user profile cache on logout:", userProfileKey);
                }
                localStorage.removeItem(userProfileKey);
              }
            }
          } catch (cleanupError) {
            console.warn("Error during logout localStorage cleanup:", cleanupError);
          }

          setUserProfile(null);
          setIsEmailVerified(false);
          setIsPhoneVerified(false);
          setAuthReady(true);
          setLoading(false);
        }
      });

      // Cleanup subscription on unmount
      return () => {
        clearTimeout(loadingTimeout);
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        unsubscribe();
      };
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Firebase auth initialization failed:", error);
      }
      clearTimeout(loadingTimeout);
      setAuthReady(true);
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
        if (process.env.NODE_ENV !== 'production') {
          console.log("Test admin signed out successfully.");
        }
        return;
      }

      // Regular Firebase logout
      await signOut(auth);
      if (process.env.NODE_ENV !== 'production') {
        console.log("User signed out successfully.");
      }
      // currentUser will be set to null by onAuthStateChanged listener
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Logout failed:", error);
      }
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
        if (process.env.NODE_ENV !== 'production') {
          console.error("Error getting ID token:", error);
        }
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
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to update profile:", error);
      }
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
      if (process.env.NODE_ENV !== 'production') {
        console.log('Email verification sent');
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error sending email verification:', error);
      }
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
      if (process.env.NODE_ENV !== 'production') {
        console.log('Password reset email sent');
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error sending password reset email:', error);
      }
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
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error refreshing verification status:', error);
      }
    }
  };

  const fetchUserProfile = async () => {
    if (!currentUser) return null;

    try {
      const profile = await apiService.getUserProfile();
      setUserProfile(profile);

      // Check if profile completion is needed
      setNeedsProfileCompletion(computeNeedsProfileCompletion(profile));

      // Update cache
      localStorage.setItem(`userProfile_${currentUser.uid}`, JSON.stringify(profile));

      return profile;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error fetching user profile:', error);
      }
      throw error;
    }
  };

  const isProfileComplete = () => {
    if (!userProfile) return false;

    // Check for required fields for profile completion
    return Boolean(
      userProfile.firstName &&
      userProfile.lastName &&
      userProfile.username &&
      (userProfile.email || userProfile.phoneNumber)
    );
  };

  // Phone verification methods
  const sendPhoneVerification = async () => {
    try {
      setVerificationLoading(true);
      const result = await apiService.sendPhoneVerification();
      return result;
    } catch (error) {
      console.error('Error sending phone verification:', error);
      throw error;
    } finally {
      setVerificationLoading(false);
    }
  };

  const verifyPhoneCode = async (code) => {
    try {
      setVerificationLoading(true);
      const result = await apiService.verifyPhoneCode(code);
      // Refresh verification status after successful verification
      await refreshVerificationStatus();
      return result;
    } catch (error) {
      console.error('Error verifying phone code:', error);
      throw error;
    } finally {
      setVerificationLoading(false);
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
    sendPhoneVerification,
    verifyPhoneCode,
    sendPasswordResetEmail,
    refreshVerificationStatus,
    // Profile completion
    fetchUserProfile,
    isProfileComplete,
    needsProfileCompletion
  };

  // Don't render children until loading is false to prevent rendering protected routes prematurely
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};