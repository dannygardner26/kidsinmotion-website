import React from 'react';
import { Link } from 'react-router-dom';
import ProfileAvatar from './ProfileAvatar';

const UserDiscoveryCard = ({
  user,
  connectionStatus,
  onConnectionAction,
  showActions = true,
  requestDate,
  showSuggestionReason = false
}) => {

  const getConnectionButton = () => {
    if (!showActions) return null;

    switch (connectionStatus) {
      case 'CONNECTED':
        return (
          <button
            onClick={() => onConnectionAction(user.firebaseUid, 'remove')}
            className="btn btn-outline-danger btn-sm"
            title="Remove connection"
          >
            <i className="fas fa-user-minus"></i>
          </button>
        );
      case 'PENDING_OUTGOING':
        return (
          <button
            onClick={() => onConnectionAction(user.firebaseUid, 'cancel')}
            className="btn btn-outline-secondary btn-sm"
            title="Cancel request"
          >
            <i className="fas fa-clock"></i>
          </button>
        );
      case 'PENDING_INCOMING':
        return (
          <div className="btn-group" role="group">
            <button
              onClick={() => onConnectionAction(user.firebaseUid, 'accept')}
              className="btn btn-success btn-sm"
              title="Accept request"
            >
              <i className="fas fa-check"></i>
            </button>
            <button
              onClick={() => onConnectionAction(user.firebaseUid, 'decline')}
              className="btn btn-outline-secondary btn-sm"
              title="Decline request"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        );
      default:
        return (
          <button
            onClick={() => onConnectionAction(user.firebaseUid, 'send')}
            className="btn btn-primary btn-sm"
            title="Send connection request"
          >
            <i className="fas fa-user-plus"></i>
          </button>
        );
    }
  };

  const getSuggestionReason = () => {
    if (!showSuggestionReason) return null;

    // This could be based on shared events, mutual connections, etc.
    const reasons = [
      'Attended similar events',
      'Lives in the same area',
      'Has mutual connections',
      'Similar interests'
    ];

    // Simple random selection for demo - in real app this would come from backend
    const reason = reasons[Math.floor(Math.random() * reasons.length)];

    return (
      <small className="text-muted suggestion-reason">
        <i className="fas fa-lightbulb mr-1"></i>
        {reason}
      </small>
    );
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return <span className="badge badge-success badge-sm">Connected</span>;
      case 'PENDING_OUTGOING':
        return <span className="badge badge-warning badge-sm">Pending</span>;
      case 'PENDING_INCOMING':
        return <span className="badge badge-info badge-sm">Wants to connect</span>;
      default:
        return null;
    }
  };

  return (
    <div className="user-discovery-card">
      <div className="card h-100">
        <div className="card-body">
          <div className="d-flex align-items-start justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <ProfileAvatar user={user} size="md" className="mr-3" />
              <div>
                <h6 className="card-title mb-1">
                  <Link
                    to={`/profile/${user.username}`}
                    className="text-decoration-none"
                  >
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.username
                    }
                  </Link>
                </h6>
                <p className="text-muted small mb-0">@{user.username}</p>
              </div>
            </div>
            {getConnectionButton()}
          </div>

          {getStatusBadge()}

          <div className="user-info mt-2">
            <div className="d-flex align-items-center mb-1">
              <span className={`badge badge-${user.userType?.toLowerCase() || 'secondary'} mr-2`}>
                {user.userType || 'User'}
              </span>
              {user.userType === 'VOLUNTEER' && user.grade && (
                <small className="text-muted">{user.grade}</small>
              )}
            </div>

            {user.userType === 'VOLUNTEER' && user.school && (
              <p className="small text-muted mb-1">{user.school}</p>
            )}

            {connectionStatus === 'PENDING_INCOMING' && requestDate && (
              <small className="text-muted">
                <i className="fas fa-calendar mr-1"></i>
                Requested {new Date(requestDate).toLocaleDateString()}
              </small>
            )}

            {getSuggestionReason()}
          </div>

          {user.connectionsCount > 0 && (
            <div className="mt-2">
              <small className="text-muted">
                <i className="fas fa-users mr-1"></i>
                {user.connectionsCount} connection{user.connectionsCount !== 1 ? 's' : ''}
              </small>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .user-discovery-card .card {
          border: 1px solid #e9ecef;
          transition: all 0.2s ease;
          cursor: default;
        }

        .user-discovery-card .card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .user-discovery-card .card-title a {
          color: var(--text);
          font-weight: 600;
        }

        .user-discovery-card .card-title a:hover {
          color: var(--primary);
        }

        .badge-sm {
          font-size: 0.65rem;
          padding: 0.25rem 0.4rem;
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

        .suggestion-reason {
          display: block;
          margin-top: 0.25rem;
          font-style: italic;
        }

        .btn-group .btn {
          padding: 0.25rem 0.5rem;
        }

        .user-info {
          min-height: 60px;
        }
      `}</style>
    </div>
  );
};

export default UserDiscoveryCard;