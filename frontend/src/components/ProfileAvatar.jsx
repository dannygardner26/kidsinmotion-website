import React from 'react';

const ProfileAvatar = ({ user, size = 'md', showOnlineStatus = false, className = '' }) => {
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '?';
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  const getAvatarColor = (name) => {
    if (!name) return '#6b7280';

    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308',
      '#84cc16', '#22c55e', '#10b981', '#14b8a6',
      '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
      '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs': return 'w-6 h-6 text-xs';
      case 'sm': return 'w-8 h-8 text-sm';
      case 'md': return 'w-12 h-12 text-base';
      case 'lg': return 'w-16 h-16 text-lg';
      case 'xl': return 'w-20 h-20 text-xl';
      case '2xl': return 'w-24 h-24 text-2xl';
      default: return 'w-12 h-12 text-base';
    }
  };

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.name || user?.email || 'Unknown';

  const initials = getInitials(user?.firstName, user?.lastName);
  const backgroundColor = getAvatarColor(displayName);

  return (
    <div className={`profile-avatar-container ${className}`}>
      <div
        className={`profile-avatar ${getSizeClasses()}`}
        style={{ backgroundColor }}
        title={displayName}
      >
        {user?.profilePictureUrl ? (
          <img
            src={user.profilePictureUrl}
            alt={displayName}
            className="avatar-image"
          />
        ) : (
          <span className="avatar-initials">{initials}</span>
        )}
      </div>

      {showOnlineStatus && (
        <div className={`online-status ${user?.isOnline ? 'online' : 'offline'}`}></div>
      )}

      <style>{`
        .profile-avatar-container {
          position: relative;
          display: inline-block;
        }

        .profile-avatar {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
          position: relative;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .profile-avatar:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .avatar-initials {
          user-select: none;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .online-status {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 25%;
          height: 25%;
          border-radius: 50%;
          border: 2px solid white;
          min-width: 8px;
          min-height: 8px;
        }

        .online-status.online {
          background-color: #22c55e;
        }

        .online-status.offline {
          background-color: #6b7280;
        }

        /* Size-specific adjustments */
        .profile-avatar.w-6.h-6 .online-status {
          width: 4px;
          height: 4px;
          border-width: 1px;
        }

        .profile-avatar.w-8.h-8 .online-status {
          width: 6px;
          height: 6px;
          border-width: 1px;
        }
      `}</style>
    </div>
  );
};

export default ProfileAvatar;