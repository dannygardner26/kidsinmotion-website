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
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth State Changed:", user ? `User UID: ${user.uid}` : "No user");
      setCurrentUser(user);
      
      if (user) {
        await syncUserWithBackend(user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const logout = async () => {
    setLoading(true); // Optional: show loading state during logout
    try {
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
      {!loading && children}
    </AuthContext.Provider>
  );
};