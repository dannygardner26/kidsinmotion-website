import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import UserDiscoveryCard from './UserDiscoveryCard';

const ConnectionsSection = ({ userId, isOwnProfile }) => {
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connections');

  useEffect(() => {
    fetchConnectionsData();
  }, [userId]);

  const fetchConnectionsData = async () => {
    try {
      setLoading(true);

      // Fetch connections
      const connectionsResponse = await apiService.getUserConnections(userId);
      setConnections(connectionsResponse.connections || []);

      if (isOwnProfile) {
        // Fetch pending requests for own profile
        const pendingResponse = await apiService.getPendingConnectionRequests();
        setPendingRequests(pendingResponse.requests || []);

        // Fetch suggested users
        const suggestedResponse = await apiService.getSuggestedConnections();
        setSuggestedUsers(suggestedResponse.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching connections data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionAction = async (targetUserId, action) => {
    try {
      let response;
      switch (action) {
        case 'send':
          response = await apiService.sendConnectionRequest(targetUserId);
          // Remove from suggested users
          setSuggestedUsers(prev => prev.filter(user => user.firebaseUid !== targetUserId));
          break;
        case 'accept':
          response = await apiService.respondToConnectionRequest(targetUserId, 'ACCEPTED');
          // Move from pending to connections
          const acceptedUser = pendingRequests.find(req => req.sender.firebaseUid === targetUserId);
          if (acceptedUser) {
            setConnections(prev => [...prev, acceptedUser.sender]);
            setPendingRequests(prev => prev.filter(req => req.sender.firebaseUid !== targetUserId));
          }
          break;
        case 'decline':
          response = await apiService.respondToConnectionRequest(targetUserId, 'DECLINED');
          setPendingRequests(prev => prev.filter(req => req.sender.firebaseUid !== targetUserId));
          break;
        case 'remove':
          response = await apiService.removeConnection(targetUserId);
          setConnections(prev => prev.filter(user => user.firebaseUid !== targetUserId));
          break;
        case 'cancel':
          response = await apiService.cancelConnectionRequest(targetUserId);
          // Add back to suggested users potentially
          fetchConnectionsData();
          break;
        default:
          return;
      }
    } catch (error) {
      console.error('Connection action error:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-2">Loading connections...</p>
      </div>
    );
  }

  return (
    <div className="connections-section">
      {isOwnProfile && (
        <ul className="nav nav-pills mb-3">
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'connections' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveTab('connections'); }}
            >
              Connections ({connections.length})
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveTab('pending'); }}
            >
              Requests ({pendingRequests.length})
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'discover' ? 'active' : ''}`}
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveTab('discover'); }}
            >
              Discover
            </a>
          </li>
        </ul>
      )}

      {activeTab === 'connections' && (
        <div className="connections-list">
          {connections.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <h5>No connections yet</h5>
              <p className="text-muted">
                {isOwnProfile
                  ? "Start building your network by discovering and connecting with other users."
                  : "This user hasn't made any connections yet."
                }
              </p>
            </div>
          ) : (
            <div className="row">
              {connections.map(user => (
                <div key={user.firebaseUid} className="col-md-6 mb-3">
                  <UserDiscoveryCard
                    user={user}
                    connectionStatus="CONNECTED"
                    onConnectionAction={handleConnectionAction}
                    showActions={isOwnProfile}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && isOwnProfile && (
        <div className="pending-requests">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-envelope fa-3x text-muted mb-3"></i>
              <h5>No pending requests</h5>
              <p className="text-muted">You don't have any pending connection requests.</p>
            </div>
          ) : (
            <div className="row">
              {pendingRequests.map(request => (
                <div key={request.id} className="col-md-6 mb-3">
                  <UserDiscoveryCard
                    user={request.sender}
                    connectionStatus="PENDING_INCOMING"
                    onConnectionAction={handleConnectionAction}
                    showActions={true}
                    requestDate={request.createdTimestamp}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'discover' && isOwnProfile && (
        <div className="discover-users">
          {suggestedUsers.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h5>No suggestions available</h5>
              <p className="text-muted">
                Check back later for new user suggestions based on your interests and activities.
              </p>
            </div>
          ) : (
            <>
              <h6 className="mb-3">Suggested connections</h6>
              <div className="row">
                {suggestedUsers.map(user => (
                  <div key={user.firebaseUid} className="col-md-6 mb-3">
                    <UserDiscoveryCard
                      user={user}
                      connectionStatus={null}
                      onConnectionAction={handleConnectionAction}
                      showActions={true}
                      showSuggestionReason={true}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .connections-section {
          width: 100%;
        }

        .nav-pills .nav-link.active {
          background-color: var(--primary);
          border-color: var(--primary);
        }

        .nav-pills .nav-link {
          color: var(--primary);
          margin-right: 0.5rem;
        }

        .nav-pills .nav-link:hover {
          color: var(--primary-dark);
        }
      `}</style>
    </div>
  );
};

export default ConnectionsSection;