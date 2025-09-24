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

  const syncUserWithBackend = async (user) => {
    if (user) {
      try {
        // Sync user with backend
        await apiService.syncUser();
        
        // Fetch user profile from backend
        const profile = await apiService.getUserProfile();
        setUserProfile(profile);
        
        console.log("User synced with backend:", profile);
      } catch (error) {
        console.error("Failed to sync user with backend:", error);
        // Don't prevent login if backend sync fails
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
        setUserProfile({
          ...userData,
          roles: userData.roles || ['ROLE_USER', 'ROLE_ADMIN']
        });
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
      console.warn("Firebase auth loading timeout - setting loading to false");
      setLoading(false);
    }, 5000);

    try {
      // Listen for authentication state changes
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log("Auth State Changed:", user ? `User UID: ${user.uid}` : "No user");
        setCurrentUser(user);

        if (user) {
          await syncUserWithBackend(user);
        } else {
          setUserProfile(null);
        }
        
        clearTimeout(loadingTimeout);
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

  const value = {
    currentUser,
    userProfile,
    loading,
    logout,
    updateProfile,
    getIdToken, // Provide function to get token
    syncUserWithBackend // For manual sync if needed
  };

  // Don't render children until loading is false to prevent rendering protected routes prematurely
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};