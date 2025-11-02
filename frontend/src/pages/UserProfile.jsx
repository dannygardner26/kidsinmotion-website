import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import ProfileAvatar from '../components/ProfileAvatar';
import ConnectionsSection from '../components/ConnectionsSection';

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username, currentUser]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getUserByUsername(username);
      setProfileUser(response.user);

      const isOwn = currentUser && response.user.firebaseUid === currentUser.uid;
      setIsOwnProfile(isOwn);

      if (!isOwn && currentUser) {
        try {
          const connectionResp = await apiService.getConnectionStatus(response.user.firebaseUid);
          setConnectionStatus(connectionResp.status);
        } catch (err) {
          console.warn('Failed to fetch connection status:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionAction = async (action) => {
    if (!currentUser || !profileUser) return;

    try {
      let response;
      switch (action) {
        case 'send':
          response = await apiService.sendConnectionRequest(profileUser.firebaseUid);
          setConnectionStatus('PENDING_OUTGOING');
          break;
        case 'accept':
          response = await apiService.respondToConnectionRequest(profileUser.firebaseUid, 'ACCEPTED');
          setConnectionStatus('CONNECTED');
          break;
        case 'decline':
          response = await apiService.respondToConnectionRequest(profileUser.firebaseUid, 'DECLINED');
          setConnectionStatus(null);
          break;
        case 'remove':
          response = await apiService.removeConnection(profileUser.firebaseUid);
          setConnectionStatus(null);
          break;
        case 'cancel':
          response = await apiService.cancelConnectionRequest(profileUser.firebaseUid);
          setConnectionStatus(null);
          break;
        default:
          return;
      }
    } catch (err) {
      console.error('Connection action error:', err);
    }
  };

  const getConnectionButton = () => {
    if (isOwnProfile || !currentUser) return null;

    switch (connectionStatus) {
      case 'CONNECTED':
        return (
          <button
            onClick={() => handleConnectionAction('remove')}
            className="btn btn-outline-danger btn-sm"
          >
            <i className="fas fa-user-minus mr-2"></i>
            Remove Connection
          </button>
        );
      case 'PENDING_OUTGOING':
        return (
          <button
            onClick={() => handleConnectionAction('cancel')}
            className="btn btn-outline-secondary btn-sm"
          >
            <i className="fas fa-clock mr-2"></i>
            Cancel Request
          </button>
        );
      case 'PENDING_INCOMING':
        return (
          <div className="d-flex gap-2">
            <button
              onClick={() => handleConnectionAction('accept')}
              className="btn btn-success btn-sm"
            >
              <i className="fas fa-check mr-2"></i>
              Accept
            </button>
            <button
              onClick={() => handleConnectionAction('decline')}
              className="btn btn-outline-secondary btn-sm"
            >
              <i className="fas fa-times mr-2"></i>
              Decline
            </button>
          </div>
        );
      default:
        return (
          <button
            onClick={() => handleConnectionAction('send')}
            className="btn btn-primary btn-sm"
          >
            <i className="fas fa-user-plus mr-2"></i>
            Connect
          </button>
        );
    }
  };

  const canViewPrivateInfo = () => {
    return isOwnProfile || connectionStatus === 'CONNECTED' || profileUser?.privacySettings?.profileVisibility === 'PUBLIC';
  };

  const canViewContactInfo = () => {
    return isOwnProfile ||
           (connectionStatus === 'CONNECTED' && profileUser?.privacySettings?.contactInfoVisibility !== 'PRIVATE') ||
           profileUser?.privacySettings?.contactInfoVisibility === 'PUBLIC';
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Profile Not Found</h4>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <h4>Profile Not Found</h4>
          <p>The user profile you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body text-center">
              <ProfileAvatar user={profileUser} size="2xl" className="mb-3" />

              <h3 className="card-title">
                {canViewPrivateInfo()
                  ? `${profileUser.firstName} ${profileUser.lastName}`
                  : profileUser.username || 'Private User'
                }
              </h3>

              <p className="text-muted mb-3">@{profileUser.username}</p>

              <div className="mb-3">
                <span className={`badge badge-${profileUser.userType?.toLowerCase() || 'secondary'}`}>
                  {profileUser.userType || 'USER'}
                </span>
              </div>

              {getConnectionButton()}

              {canViewPrivateInfo() && (
                <div className="mt-4">
                  <div className="profile-stats">
                    <div className="stat-item">
                      <strong>{profileUser.connectionsCount || 0}</strong>
                      <small className="d-block text-muted">Connections</small>
                    </div>
                    <div className="stat-item">
                      <strong>{profileUser.eventsAttended || 0}</strong>
                      <small className="d-block text-muted">Events</small>
                    </div>
                    <div className="stat-item">
                      <strong>{new Date(profileUser.createdTimestamp || Date.now()).getFullYear()}</strong>
                      <small className="d-block text-muted">Joined</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <a
                    className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => { e.preventDefault(); setActiveTab('profile'); }}
                  >
                    Profile
                  </a>
                </li>
                {canViewPrivateInfo() && (
                  <li className="nav-item">
                    <a
                      className={`nav-link ${activeTab === 'connections' ? 'active' : ''}`}
                      href="#"
                      onClick={(e) => { e.preventDefault(); setActiveTab('connections'); }}
                    >
                      Connections
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div className="card-body">
              {activeTab === 'profile' && (
                <div className="profile-info">
                  {canViewPrivateInfo() ? (
                    <>
                      <div className="row mb-3">
                        <div className="col-sm-4"><strong>Email:</strong></div>
                        <div className="col-sm-8">
                          {canViewContactInfo() ? profileUser.email : 'Private'}
                        </div>
                      </div>

                      {profileUser.phoneNumber && (
                        <div className="row mb-3">
                          <div className="col-sm-4"><strong>Phone:</strong></div>
                          <div className="col-sm-8">
                            {canViewContactInfo() ? profileUser.phoneNumber : 'Private'}
                          </div>
                        </div>
                      )}

                      <div className="row mb-3">
                        <div className="col-sm-4"><strong>User Type:</strong></div>
                        <div className="col-sm-8">{profileUser.userType || 'Parent'}</div>
                      </div>

                      {profileUser.userType === 'VOLUNTEER' && (
                        <>
                          {profileUser.grade && (
                            <div className="row mb-3">
                              <div className="col-sm-4"><strong>Grade:</strong></div>
                              <div className="col-sm-8">{profileUser.grade}</div>
                            </div>
                          )}
                          {profileUser.school && (
                            <div className="row mb-3">
                              <div className="col-sm-4"><strong>School:</strong></div>
                              <div className="col-sm-8">{profileUser.school}</div>
                            </div>
                          )}
                        </>
                      )}

                      <div className="row mb-3">
                        <div className="col-sm-4"><strong>Joined:</strong></div>
                        <div className="col-sm-8">
                          {new Date(profileUser.createdTimestamp || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <i className="fas fa-lock fa-3x text-muted mb-3"></i>
                      <h5>Private Profile</h5>
                      <p className="text-muted">
                        This user's profile is private. Send a connection request to view their information.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'connections' && canViewPrivateInfo() && (
                <ConnectionsSection userId={profileUser.firebaseUid} isOwnProfile={isOwnProfile} />
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .profile-stats {
          display: flex;
          justify-content: space-around;
          padding: 1rem 0;
          border-top: 1px solid #e9ecef;
        }

        .stat-item {
          text-align: center;
        }

        .badge-parent {
          background-color: #007bff;
        }

        .badge-volunteer {
          background-color: #28a745;
        }

        .badge-admin {
          background-color: #ffc107;
          color: #212529;
        }
      `}</style>
    </div>
  );
};

export default UserProfile;