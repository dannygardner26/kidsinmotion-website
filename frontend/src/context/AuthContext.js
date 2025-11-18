import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { apiService } from '../services/api';
import firestoreUserService from '../services/firestoreUserService';

const AuthContext = createContext();

// Utility function to compute if profile completion is needed
const computeNeedsProfileCompletion = (profile, user = null) => {
  // Admin accounts are exempt from profile completion requirements
  if (profile?.userType === 'ADMIN' || user?.email === 'kidsinmotion0@gmail.com' || user?.email === 'danny@dannygardner.com') {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Admin account - no profile completion needed:', profile?.userType, user?.email);
    }
    return false;
  }

  // Test accounts are exempt from profile completion requirements
  if (user?.email === 'parent@test.com' || user?.email === 'volunteer@test.com') {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Test account - no profile completion needed:', user?.email);
    }
    return false;
  }

  const hasRequiredFields = profile?.firstName && profile?.lastName;
  const hasContact = profile?.email || profile?.phoneNumber;
  const validUserTypes = ['PARENT', 'VOLUNTEER', 'ADMIN'];
  const hasValidUserType = profile?.userType && validUserTypes.includes(profile.userType.toUpperCase());

  // For OAuth users (registrationSource: 'oauth'), require profile completion if missing anything
  if (profile?.registrationSource === 'oauth') {
    if (!hasRequiredFields || !hasContact || !hasValidUserType) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('OAuth user needs profile completion:', {
          hasRequiredFields,
          hasContact,
          hasValidUserType,
          userType: profile?.userType
        });
      }
      return true;
    }
  } else {
    // For regular registration users, they should have already provided everything during registration
    // Only require completion if truly missing critical fields (firstName, lastName, email)
    if (!hasRequiredFields || !hasContact) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Regular registration user missing critical fields:', {
          hasRequiredFields,
          hasContact,
          registrationSource: profile?.registrationSource
        });
      }
      return true;
    }

    // Regular registration users should have already selected PARENT/VOLUNTEER during signup
    // No additional profile completion needed for account type
  }

  // All non-admin, non-test users must have complete profiles
  // If we reach this point, user has all required fields and contact info
  if (process.env.NODE_ENV !== 'production') {
    console.log('Profile completion check - all requirements met:', {
      hasRequiredFields,
      hasContact,
      userType: profile?.userType,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      email: profile?.email,
      phoneNumber: profile?.phoneNumber,
      needsCompletion: false
    });
  }

  return false;
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
        // Enhanced user validation to prevent 400 errors from corrupted accounts
        const isUserReady = user.uid &&
                           user.email &&
                           typeof user.getIdToken === 'function' &&
                           user.uid.length > 10 && // Valid UID should be longer than 10 chars
                           user.email.includes('@'); // Basic email validation

        if (!isUserReady && retryCount < 3) {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Firebase user not fully ready, waiting 200ms (attempt ${retryCount + 1}/3)...`);
            console.log('User validation:', {
              hasUid: !!user.uid,
              hasEmail: !!user.email,
              hasGetIdToken: typeof user.getIdToken === 'function',
              uidLength: user.uid?.length,
              validEmail: user.email?.includes('@')
            });
          }
          await new Promise(resolve => setTimeout(resolve, 200));
          return syncUserWithBackend(user, isGoogleOAuth, retryCount + 1);
        }

        // If user is still not ready after retries, this might be a corrupted account
        if (!isUserReady) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('User account appears corrupted or incomplete:', {
              uid: user.uid,
              email: user.email,
              hasGetIdToken: typeof user.getIdToken === 'function'
            });
          }

          // Force sign out corrupted user and clear auth data
          try {
            await logout();
          } catch (logoutError) {
            console.warn('Error during corrupted user logout:', logoutError);
            // Force reload to clear state
            window.location.reload();
          }
          return;
        }

        // Validate the token before proceeding to catch auth/internal-error early
        try {
          await user.getIdToken(false); // Test token without forcing refresh
        } catch (tokenError) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Token validation failed during sync, attempting refresh:', tokenError);
          }

          try {
            await user.getIdToken(true); // Force refresh
          } catch (refreshError) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('Token refresh failed, account may be corrupted:', refreshError);
            }
            await logout();
            return;
          }
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
          // Don't set authReady here - wait for the actual auth state
          if (process.env.NODE_ENV !== 'production') {
            console.log("Using cached user profile:", parsed);
          }

          // REMOVED: Backend sync operations that were corrupting auth tokens
          // All user management is now handled purely through Firebase
          if (process.env.NODE_ENV !== 'production') {
            console.log("Using cached profile only - no backend sync");
          }

          // Return early since we're using cached data
          return;
        }

        // No cached profile - create minimal Firebase-only profile
        if (process.env.NODE_ENV !== 'production') {
          console.log("No cached profile, creating Firebase-only profile...");
        }

        // Create default profile for new users only
        const defaultProfile = {
          firebaseUid: user.uid,
          email: user.email,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          // Username field removed
          userType: 'USER',
          roles: ['ROLE_USER'],
          emailVerified: user.emailVerified,
          needsOnboarding: isGoogleOAuth ? true : false, // OAuth users need onboarding, regular registration users don't
          registrationSource: isGoogleOAuth ? 'oauth' : 'password',
          hasPassword: !isGoogleOAuth, // Track if user has password
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };

        // Automatically grant admin privileges to specific emails
        if (user.email === 'kidsinmotion0@gmail.com' || user.email === 'danny@dannygardner.com') {
          defaultProfile.userType = 'ADMIN';
          defaultProfile.roles = ['ROLE_USER', 'ROLE_ADMIN'];
          defaultProfile.needsOnboarding = false; // Admins skip onboarding
          if (process.env.NODE_ENV !== 'production') {
            console.log("Automatically granted admin privileges to:", user.email);
          }
        }

        // Store user in Firestore and get back the actual profile (existing or new)
        let actualProfile;
        try {
          actualProfile = await firestoreUserService.ensureUserExists(user, defaultProfile);
          if (process.env.NODE_ENV !== 'production') {
            console.log("User profile from Firestore:", actualProfile);
            console.log("Is existing user?", actualProfile.createdAt !== defaultProfile.createdAt);
          }
        } catch (error) {
          console.error("Error storing user in Firestore:", error);
          // Fall back to default profile if Firestore fails
          actualProfile = defaultProfile;
        }

        // Use the actual profile from Firestore (which preserves existing data)
        setUserProfile(actualProfile);

        // Check if profile completion is needed
        const needsCompletion = computeNeedsProfileCompletion(actualProfile, user);
        setNeedsProfileCompletion(needsCompletion);

        // Redirect to profile completion for users who need it
        if (needsCompletion) {
          // Only redirect if not already on profile completion page
          const currentPath = window.location.pathname;

          // Use firebaseUid for account path
          const accountPath = `/account/${user.uid}`;

          if (!currentPath.includes('/account/') && !currentPath.includes('?complete=true')) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('Redirecting to profile completion:', accountPath, 'for user with userType:', actualProfile?.userType);
            }

            // Show user-friendly message about profile completion
            const isOAuth = actualProfile?.registrationSource === 'oauth';
            const message = isOAuth
              ? 'Welcome to Kids in Motion! Let\'s finish setting up your account so you can register for events and receive important updates...'
              : 'Finishing your account setup to connect you with events and activities...';

            // You could show a toast notification here if you have a notification system
            console.log(message);

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
          console.log("Firebase-only profile created:", profile);
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

        // Don't prevent login if backend sync fails - but wait for auth state to be properly set
        // Don't set authReady here - let the auth state change handler do it
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

        // Use Firebase-only profile for test admin user (no backend sync)
        setUserProfile({
          ...userData,
          roles: userData.roles || ['ROLE_USER', 'ROLE_ADMIN']
        });

        if (process.env.NODE_ENV !== 'production') {
          console.log("Test admin user profile set (Firebase-only):", userData);
        }

        setAuthReady(true);
        setLoading(false);
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

        if (process.env.NODE_ENV !== 'production') {
          console.log("Setting currentUser to:", user ? { uid: user.uid, email: user.email } : null);
        }

        setCurrentUser(user);

        if (user) {
          // Track the last known UID for targeted cache cleanup on logout
          lastUidRef.current = user.uid;

          // Ensure user object is fully populated before proceeding
          if (!user.uid || !user.email) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('Firebase user object incomplete, waiting for full initialization:', {
                hasUid: !!user.uid,
                hasEmail: !!user.email
              });
            }
            // Skip this auth state change and wait for a complete user object
            return;
          }

          // Check if this is a restored session vs a fresh login
          const isRestoredSession = !isGoogleOAuthLogin;

          if (isRestoredSession && process.env.NODE_ENV !== 'production') {
            console.log("Restored session detected - trusting Firebase's built-in token validation");
          }

          // Validate token before proceeding with backend sync
          let tokenValid = false;
          try {
            // Test token validity by attempting to get fresh token
            await user.getIdToken(false); // Don't force refresh, just validate existing
            tokenValid = true;
            if (process.env.NODE_ENV !== 'production') {
              console.log("Token validation successful");
            }
          } catch (tokenError) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn("Token validation failed:", tokenError);
            }

            // Try to refresh the token once
            try {
              await user.getIdToken(true); // Force refresh
              tokenValid = true;
              if (process.env.NODE_ENV !== 'production') {
                console.log("Token refresh successful");
              }
            } catch (refreshError) {
              if (process.env.NODE_ENV !== 'production') {
                console.error("Token refresh failed, signing out:", refreshError);
              }
              await logout();
              return;
            }
          }

          if (!tokenValid) {
            if (process.env.NODE_ENV !== 'production') {
              console.log("Invalid token, signing out");
            }
            await logout();
            return;
          }

          // Add initialization delay to prevent race condition with Firebase Auth's internal initialization
          if (process.env.NODE_ENV !== 'production') {
            console.log("Waiting 300ms for Firebase Auth to complete initialization...");
          }

          // Store timeout for cleanup
          syncTimeoutRef.current = setTimeout(async () => {
            try {
              if (process.env.NODE_ENV !== 'production') {
                console.log("Initialization delay complete, syncing user with backend...");
              }

              await syncUserWithBackend(user, isGoogleOAuthLogin);
              setIsGoogleOAuthLogin(false); // Reset flag after use

              // Update verification status
              setIsEmailVerified(user.emailVerified);

              // Only set authReady after currentUser is properly set and user is valid
              // Add a small delay to ensure currentUser state has updated in React
              setTimeout(() => {
                if (process.env.NODE_ENV !== 'production') {
                  console.log("Auth setup complete with valid user:", { uid: user.uid, email: user.email });
                }
                setAuthReady(true);
                setLoading(false);
              }, 100);
            } catch (syncError) {
              if (process.env.NODE_ENV !== 'production') {
                console.error("Backend sync failed:", syncError);
              }
              // Still set auth ready to allow app to load, but ensure currentUser is set
              setTimeout(() => {
                setAuthReady(true);
                setLoading(false);
              }, 100);
            }

            // Verify that Firebase auth keys exist in localStorage after successful login
            if (process.env.NODE_ENV !== 'production') {
              const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
              const authUserKey = `firebase:authUser:${apiKey}:[DEFAULT]`;
              const persistenceKey = `firebase:persistence:${apiKey}:[DEFAULT]`;
              const userProfileKey = `userProfile_${user.uid}`;

              const authUserExists = !!localStorage.getItem(authUserKey);
              const persistenceExists = !!localStorage.getItem(persistenceKey);
              const profileCacheExists = !!localStorage.getItem(userProfileKey);

              const firebaseKeysPresent = [authUserExists, persistenceExists].filter(Boolean).length;

              console.log('Login persistence verification:', {
                firebaseAuthUser: authUserExists,
                firebasePersistence: persistenceExists,
                profileCache: profileCacheExists,
                summary: `Firebase keys: ${firebaseKeysPresent}/2, Profile cache: ${profileCacheExists ? 'yes' : 'no'}`
              });

              // Warn if any critical keys are missing
              if (!authUserExists) {
                console.warn('⚠️ Warning: firebase:authUser key is missing - login may not persist');
              }
              if (!persistenceExists) {
                console.warn('⚠️ Warning: firebase:persistence key is missing - login may not persist');
              }
            }
          }, 500); // Increased from 300ms to 500ms to prevent 400 errors
        } else {
          const hadPreviousUser = Boolean(lastUidRef.current);

          if (hadPreviousUser) {
            // User explicitly signed out - perform targeted localStorage cleanup
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
              const userProfileKey = `userProfile_${lastUidRef.current}`;
              if (localStorage.getItem(userProfileKey)) {
                if (process.env.NODE_ENV !== 'production') {
                  console.log("Removing user profile cache on logout:", userProfileKey);
                }
                localStorage.removeItem(userProfileKey);
              }
            } catch (cleanupError) {
              console.warn("Error during logout localStorage cleanup:", cleanupError);
            }
          } else if (process.env.NODE_ENV !== 'production') {
            console.log("Auth resolved with no prior session - skipping firebase:* key cleanup");
          }

          lastUidRef.current = null;
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

  // Function to get the current user's ID token with improved error handling
  const getIdToken = async (forceRefresh = false) => {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken(forceRefresh);
        return token;
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error("Error getting ID token:", error);
        }

        // Handle specific auth errors
        if (error.code === 'auth/user-token-expired' ||
            error.code === 'auth/internal-error' ||
            error.code === 'auth/network-request-failed') {

          // Try one more time with forced refresh before giving up
          if (!forceRefresh) {
            try {
              const refreshedToken = await currentUser.getIdToken(true);
              return refreshedToken;
            } catch (refreshError) {
              if (process.env.NODE_ENV !== 'production') {
                console.error("Token refresh also failed, signing out:", refreshError);
              }
              await logout();
              return null;
            }
          } else {
            // Already tried refresh, sign out
            await logout();
            return null;
          }
        }
        return null;
      }
    }
    return null;
  };


  const updateProfile = async (profileData) => {
    try {
      // Firebase-only profile update (no backend sync)
      const updatedProfile = {
        ...userProfile,
        ...profileData,
        updatedAt: new Date().toISOString()
      };

      setUserProfile(updatedProfile);

      // Cache the updated profile
      localStorage.setItem(`userProfile_${currentUser.uid}`, JSON.stringify(updatedProfile));

      // Update in Firestore for admin dashboard
      try {
        await firestoreUserService.updateUser(currentUser.uid, updatedProfile);
        if (process.env.NODE_ENV !== 'production') {
          console.log("Profile updated in Firestore for admin dashboard");
        }
      } catch (error) {
        console.error("Error updating profile in Firestore:", error);
        // Don't block the profile update if Firestore fails
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log("Profile updated (Firebase-only):", updatedProfile);
      }

      return updatedProfile;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Failed to update profile:", error);
      }
      throw error;
    }
  };

  // Verification helper methods - now using custom SendGrid system
  const sendEmailVerification = async () => {
    if (!currentUser) throw new Error('No user logged in');

    setVerificationLoading(true);
    try {
      // Use our custom backend SendGrid verification system
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          email: currentUser.email,
          name: currentUser.displayName || 'User'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Check for rate limiting or other specific errors
        if (response.status === 429) {
          throw new Error('Too many verification requests. Please wait before requesting another.');
        }
        throw new Error(errorData.error || 'Failed to send verification email');
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('Custom email verification sent via SendGrid');
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error sending custom email verification:', error);
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

      // Phone verification is handled separately via Firebase SMS
      // For now, assume not verified (can be updated when SMS verification is implemented)
      setIsPhoneVerified(false);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error refreshing verification status:', error);
      }
    }
  };

  const fetchUserProfile = async () => {
    if (!currentUser) return null;

    try {
      // Use cached profile or create minimal Firebase profile
      const cachedProfile = localStorage.getItem(`userProfile_${currentUser.uid}`);
      let profile;

      if (cachedProfile) {
        profile = JSON.parse(cachedProfile);
      } else {
        // Create minimal profile from Firebase user
        profile = {
          uid: currentUser.uid,
          email: currentUser.email,
          firstName: currentUser.displayName?.split(' ')[0] || '',
          lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
          // Username field removed
          userType: 'USER',
          roles: ['ROLE_USER'],
          emailVerified: currentUser.emailVerified,
          needsOnboarding: false, // Default to false for existing users
          hasPassword: true, // Assume existing users have passwords
          createdAt: new Date().toISOString()
        };

        // Auto-admin for specific emails
        if (currentUser.email === 'kidsinmotion0@gmail.com' || currentUser.email === 'danny@dannygardner.com') {
          profile.userType = 'ADMIN';
          profile.roles = ['ROLE_USER', 'ROLE_ADMIN'];
          profile.needsOnboarding = false;
        }

        localStorage.setItem(`userProfile_${currentUser.uid}`, JSON.stringify(profile));
      }

      setUserProfile(profile);

      // Check if profile completion is needed
      setNeedsProfileCompletion(computeNeedsProfileCompletion(profile, currentUser));

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
