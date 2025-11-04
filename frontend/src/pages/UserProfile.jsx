import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, userProfile } = useAuth();

  useEffect(() => {
    if (username) {
      // Check if viewing own profile
      const isOwnProfile = currentUser && userProfile && userProfile.username === username;

      if (isOwnProfile) {
        // Redirect to account details page for own profile
        navigate(`/account/${username}`, { replace: true });
      } else {
        // For other users' profiles, check if they have public visibility
        // For now, redirect to account details - can be enhanced later for public profiles
        navigate(`/account/${username}`, { replace: true });
      }
    }
  }, [username, currentUser, userProfile, navigate]);

  // This component now serves as a redirect to AccountDetails
  return (
    <div className="container mt-4">
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="sr-only">Redirecting...</span>
        </div>
        <p className="mt-2">Redirecting to account details...</p>
      </div>
    </div>
  );
};

export default UserProfile;