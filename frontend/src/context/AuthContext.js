import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Adjust path as necessary

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading until auth state is determined

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State Changed:", user ? `User UID: ${user.uid}` : "No user");
      setCurrentUser(user);
      setLoading(false); // Auth state determined, stop loading
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


  const value = {
    currentUser,
    loading,
    logout,
    getIdToken // Provide function to get token
  };

  // Don't render children until loading is false to prevent rendering protected routes prematurely
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};