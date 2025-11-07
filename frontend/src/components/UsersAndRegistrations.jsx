import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';

const getTeamDisplayName = (team) => {
  const teamNames = {
    'TEAM_COACH': 'Coach',
    'TEAM_SOCIAL_MEDIA': 'Social Media',
    'TEAM_FUNDRAISING': 'Fundraising',
    'TEAM_EVENT_COORDINATION': 'Event Coordination'
  };
  return teamNames[team] || team.replace('TEAM_', '').replace(/_/g, ' ');
};

const UsersAndRegistrations = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    resumeLink: '',
    portfolioLink: '',
    userType: '',
    teams: []
  });

  // Admin action states
  const [actionLoading, setActionLoading] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Account type change modal state
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [accountTypeUser, setAccountTypeUser] = useState(null);
  const [newAccountType, setNewAccountType] = useState('');
  const [accountTypeWarnings, setAccountTypeWarnings] = useState([]);

  // Test account reset state
  const [isResettingTestAccounts, setIsResettingTestAccounts] = useState(false);

  useEffect(() => {
    fetchAllData();

    // Set up auto-refresh every 30 seconds to ensure admin sees latest data
    const interval = setInterval(() => {
      console.log('Auto-refreshing admin data...');
      fetchAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const usersData = await apiService.getAllUsers().catch(err => {
        console.warn('Failed to fetch users:', err);
        return { users: [] };
      });

      console.log('Admin fetched users for management:', usersData);
      // Extract users array from response object
      const usersArray = usersData.users || usersData || [];
      setUsers(Array.isArray(usersArray) ? usersArray : []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleViewUserProfile = (user) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const handleCloseUserProfile = () => {
    setSelectedUser(null);
    setShowUserProfile(false);
  };

  const handleUserRoleUpdate = async (userId, newRoles) => {
    try {
      // This would need a backend endpoint to update user roles
      // For now, just show a notification
      showNotification(`Role update functionality coming soon. Would update user ${userId} to roles: ${newRoles.join(', ')}`, 'info');
    } catch (error) {
      console.error('Error updating user roles:', error);
      showNotification('Failed to update user roles: ' + error.message, 'error');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      resumeLink: user.resumeLink || '',
      portfolioLink: user.portfolioLink || '',
      userType: user.userType || 'PARENT',
      teams: user.teams || []
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTeamToggle = (teamName) => {
    setEditForm(prev => ({
      ...prev,
      teams: prev.teams.includes(teamName)
        ? prev.teams.filter(team => team !== teamName)
        : [...prev.teams, teamName]
    }));
  };


  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      await apiService.updateUserAccount(editingUser.id, editForm);

      // Update the local state
      setUsers(users.map(user =>
        user.id === editingUser.id
          ? { ...user, ...editForm }
          : user
      ));

      setShowEditModal(false);
      setEditingUser(null);
      showNotification('User account updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating user account:', error);
      showNotification('Failed to update user account: ' + error.message, 'error');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditForm({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      resumeLink: '',
      portfolioLink: '',
      userType: '',
      teams: []
    });
  };

  // Admin action handlers
  const handleAdminAction = (user, action) => {
    if (action === 'changeType') {
      setAccountTypeUser(user);
      setNewAccountType(user.userType || 'PARENT');
      setAccountTypeWarnings([]);
      setShowAccountTypeModal(true);
    } else if (action === 'delete') {
      setDeleteUser(user);
      setDeleteReason('');
      setShowDeleteModal(true);
    } else {
      setConfirmAction({
        user,
        action,
        title: getActionTitle(action),
        message: getActionMessage(user, action),
        buttonText: getActionButtonText(action),
        buttonClass: getActionButtonClass(action)
      });
      setShowConfirmModal(true);
    }
  };

  const getActionTitle = (action) => {
    switch (action) {
      case 'ban': return 'Ban User';
      case 'unban': return 'Unban User';
      case 'verify': return 'Verify Email';
      case 'changeType': return 'Change Account Type';
      default: return 'Confirm Action';
    }
  };

  const getActionMessage = (user, action) => {
    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email;
    switch (action) {
      case 'delete': return `Are you sure you want to permanently delete ${userName}? This will remove their account, event registrations, and all associated data. This action cannot be undone.`;
      case 'verify': return `Are you sure you want to manually verify ${userName}'s email address?`;
      case 'changeType': return `Are you sure you want to change ${userName}'s account type?`;
      default: return 'Are you sure you want to perform this action?';
    }
  };

  const getActionButtonText = (action) => {
    switch (action) {
      case 'delete': return 'Delete User';
      case 'verify': return 'Verify Email';
      case 'changeType': return 'Change Type';
      default: return 'Confirm';
    }
  };

  const getActionButtonClass = (action) => {
    switch (action) {
      case 'delete': return 'btn-danger';
      case 'verify': return 'btn-info';
      case 'changeType': return 'btn-warning';
      default: return 'btn-primary';
    }
  };

  const executeAdminAction = async () => {
    if (!confirmAction) return;

    const { user, action } = confirmAction;
    setActionLoading(prev => ({ ...prev, [user.id]: true }));

    try {
      let result;
      switch (action) {
        case 'delete':
          // This will be handled by the modal, not inline
          result = { message: 'Delete initiated' };
          break;
        case 'verify':
          result = await apiService.verifyUserEmail(user.id);
          break;
        case 'changeType':
          // This will be handled by the modal, not inline
          result = { message: 'Account type change initiated' };
          break;
        default:
          throw new Error('Unknown action');
      }

      // Update local state based on action type since backend only returns message
      setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === user.id) {
          switch (action) {
            case 'delete':
              // User will be removed from the list, this won't actually run
              return u;
            case 'verify':
              return { ...u, emailVerified: true };
            case 'changeType':
              const newType = prompt('Enter new account type (PARENT, VOLUNTEER, ADMIN):');
              return { ...u, userType: newType?.toUpperCase() };
            default:
              return u;
          }
        }
        return u;
      }));

      showNotification(result.message || 'Action completed successfully', 'success');
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (error) {
      console.error('Admin action error:', error);
      showNotification('Failed to execute action: ' + error.message, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [user.id]: false }));
    }
  };

  // Account type change handlers
  const handleAccountTypeChange = async () => {
    if (!accountTypeUser || !newAccountType) return;

    setActionLoading(prev => ({ ...prev, [accountTypeUser.id]: true }));

    try {
      const result = await apiService.changeUserAccountType(accountTypeUser.id, newAccountType);

      // Update local state
      setUsers(prevUsers => prevUsers.map(u =>
        u.id === accountTypeUser.id ? { ...u, userType: newAccountType } : u
      ));

      showNotification(result.message || 'Account type changed successfully', 'success');

      if (result.warnings && result.warnings.length > 0) {
        // Show warnings in a notification
        setTimeout(() => {
          showNotification(`Warnings: ${result.warnings.join(', ')}`, 'info');
        }, 2000);
      }

      setShowAccountTypeModal(false);
      setAccountTypeUser(null);
      setNewAccountType('');
      setAccountTypeWarnings([]);
    } catch (error) {
      console.error('Account type change error:', error);
      showNotification('Failed to change account type: ' + error.message, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [accountTypeUser.id]: false }));
    }
  };

  // Delete user handler
  const handleDeleteUser = async () => {
    if (!deleteUser || !deleteReason.trim()) return;

    setActionLoading(prev => ({ ...prev, [deleteUser.id]: true }));

    try {
      const result = await apiService.deleteUser(deleteUser.id, deleteReason);

      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(u => u.id !== deleteUser.id));

      showNotification(result.message || 'User deleted successfully', 'success');

      setShowDeleteModal(false);
      setDeleteUser(null);
      setDeleteReason('');
    } catch (error) {
      console.error('Delete user error:', error);
      showNotification('Failed to delete user: ' + error.message, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [deleteUser.id]: false }));
    }
  };

  const handleResetTestAccounts = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to reset test accounts?\n\n' +
      'This will DELETE and RECREATE the following accounts:\n' +
      '• parent@gmail.com (and all related participant records)\n' +
      '• volunteer@gmail.com (and all related volunteer records)\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) {
      return; // User cancelled
    }

    setIsResettingTestAccounts(true);
    try {
      const response = await apiService.resetTestAccounts();

      // Check response.success to determine outcome
      if (response.success) {
        // Show success message with account details
        const accountCount = response.createdAccounts?.length || 0;
        const accountsList = response.createdAccounts?.map(acc => acc.email).join(', ') || '';
        showNotification(
          `Successfully reset ${accountCount} test account(s): ${accountsList}`,
          'success'
        );
      } else {
        // Show error notification with list of errors
        const errorSummary = response.errors?.join('; ') || 'Unknown error occurred';
        showNotification(
          `Test account reset failed: ${errorSummary}`,
          'error'
        );
      }

      // Refresh the user list to show the updated test accounts
      await fetchAllData();
    } catch (error) {
      console.error('Reset test accounts error:', error);
      showNotification('Failed to reset test accounts: ' + error.message, 'error');
    } finally {
      setIsResettingTestAccounts(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users and registrations...</p>
      </div>
    );
  }

  return (
    <div className="users-registrations-container">
      <div className="section-header">
        <h2>User Management</h2>
        <p>Manage user roles, permissions, and account status</p>
        <div className="header-actions">
          <button
            onClick={handleResetTestAccounts}
            className="btn btn-warning"
            disabled={isResettingTestAccounts || isLoading}
            title="Deletes and recreates parent@gmail.com and volunteer@gmail.com test accounts"
          >
            {isResettingTestAccounts ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Resetting...
              </>
            ) : (
              <>
                <i className="fas fa-redo mr-2"></i>
                Reset Test Accounts
              </>
            )}
          </button>
          <button
            onClick={() => {
              console.log('Manual refresh triggered');
              fetchAllData();
            }}
            className="btn btn-secondary"
          >
            <i className="fas fa-refresh mr-2"></i>
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            <i className={`fas ${
              notification.type === 'success' ? 'fa-check-circle' :
              notification.type === 'error' ? 'fa-exclamation-circle' :
              'fa-info-circle'
            }`}></i>
            <span>{notification.message}</span>
            <button
              className="notification-close"
              onClick={() => setNotification(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="sub-tabs">
        <div className="tab-info">
          <h3>All Users ({users.length})</h3>
          <p>Click on any user name to view their full profile</p>
        </div>
      </div>

      <div className="users-table-container">
        <h3>Registered Users</h3>
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>User Type</th>
                    <th>Teams</th>
                    <th>Joined</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className={user.isBanned ? 'banned-row' : ''}>
                      <td>
                        <Link
                          to={`/account/${user.username}`}
                          className="user-name-link"
                          title="Edit user profile"
                        >
                          {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || 'N/A'}
                          {user.isBanned && <span className="banned-badge">(Banned)</span>}
                        </Link>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`user-type-badge ${user.userType?.toLowerCase()}`}>
                          {user.userType || 'PARENT'}
                        </span>
                      </td>
                      <td>
                        <div className="teams-list">
                          {user.teams && user.teams.length > 0 ? (
                            user.teams.map((team, index) => (
                              <span key={index} className="team-badge">
                                {getTeamDisplayName(team)}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">None</span>
                          )}
                        </div>
                      </td>
                      <td>{user.createdTimestamp ? new Date(user.createdTimestamp).toLocaleDateString() : 'N/A'}</td>
                      <td>{user.lastLoginTimestamp ? new Date(user.lastLoginTimestamp).toLocaleDateString() : 'Never'}</td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/account/${user.username}`}
                            className="btn btn-sm btn-primary"
                          >
                            Edit Profile
                          </Link>


                          <button
                            onClick={() => handleAdminAction(user, 'delete')}
                            className="btn btn-sm btn-danger"
                            disabled={actionLoading[user.id]}
                            title="Delete user and all associated data"
                          >
                            <i className="fas fa-trash"></i>
                          </button>

                          <button
                            onClick={() => handleAdminAction(user, 'changeType')}
                            className="btn btn-sm btn-warning"
                            disabled={actionLoading[user.id]}
                            title="Change account type"
                          >
                            <i className="fas fa-user-cog"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseUserProfile}>
          <div className="modal-content user-profile-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Profile: {selectedUser.firstName && selectedUser.lastName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.name || 'N/A'}</h3>
              <button className="modal-close" onClick={handleCloseUserProfile}>×</button>
            </div>
            <div className="modal-body">
              <div className="profile-section">
                <h4>Personal Information</h4>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Name:</label>
                    <span>{selectedUser.firstName && selectedUser.lastName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.name || 'N/A'}</span>
                  </div>
                  <div className="profile-item">
                    <label>Email:</label>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="profile-item">
                    <label>Phone:</label>
                    <span>{selectedUser.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="profile-item">
                    <label>User Type:</label>
                    <span className={`user-type-badge ${selectedUser.userType?.toLowerCase()}`}>
                      {selectedUser.userType || 'PARENT'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4>Account Details</h4>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Firebase UID:</label>
                    <span className="small-text">{selectedUser.firebaseUid || 'N/A'}</span>
                  </div>
                  <div className="profile-item">
                    <label>Joined:</label>
                    <span>{selectedUser.createdTimestamp ? new Date(selectedUser.createdTimestamp).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="profile-item">
                    <label>Last Login:</label>
                    <span>{selectedUser.lastLoginTimestamp ? new Date(selectedUser.lastLoginTimestamp).toLocaleDateString() : 'Never'}</span>
                  </div>
                  <div className="profile-item">
                    <label>Email Verified:</label>
                    <span className={`status-badge ${selectedUser.emailVerified ? 'verified' : 'unverified'}`}>
                      {selectedUser.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h4>Team Memberships</h4>
                <div className="teams-list">
                  {selectedUser.teams && selectedUser.teams.length > 0 ? (
                    selectedUser.teams.map((team, index) => (
                      <span key={index} className="team-role-badge">
                        {getTeamDisplayName(team)}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted">No team assignments</span>
                  )}
                </div>
              </div>

              {(selectedUser.resumeLink || selectedUser.portfolioLink) && (
                <div className="profile-section">
                  <h4>Links</h4>
                  <div className="profile-links">
                    {selectedUser.resumeLink && (
                      <a href={selectedUser.resumeLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                        <i className="fas fa-file-pdf mr-2"></i>Resume
                      </a>
                    )}
                    {selectedUser.portfolioLink && (
                      <a href={selectedUser.portfolioLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                        <i className="fas fa-external-link-alt mr-2"></i>Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => handleEditUser(selectedUser)}>
                Edit User
              </button>
              <button className="btn btn-secondary" onClick={handleCloseUserProfile}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User Account</h3>
              <button className="modal-close" onClick={handleCancelEdit}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={editForm.firstName}
                  onChange={handleEditFormChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={editForm.lastName}
                  onChange={handleEditFormChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditFormChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editForm.phoneNumber}
                  onChange={handleEditFormChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Resume Link</label>
                <input
                  type="url"
                  name="resumeLink"
                  value={editForm.resumeLink}
                  onChange={handleEditFormChange}
                  className="form-input"
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label>Portfolio Link</label>
                <input
                  type="url"
                  name="portfolioLink"
                  value={editForm.portfolioLink}
                  onChange={handleEditFormChange}
                  className="form-input"
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label>User Type</label>
                <select
                  name="userType"
                  value={editForm.userType}
                  onChange={handleEditFormChange}
                  className="form-input"
                >
                  <option value="PARENT">Parent</option>
                  <option value="VOLUNTEER">Volunteer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label>Team Assignments</label>
                <div className="roles-checkboxes">
                  {['TEAM_COACH', 'TEAM_SOCIAL_MEDIA', 'TEAM_FUNDRAISING', 'TEAM_EVENT_COORDINATION'].map((team) => (
                    <label key={team} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.teams.includes(team)}
                        onChange={() => handleTeamToggle(team)}
                      />
                      <span>{getTeamDisplayName(team)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleCancelEdit} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveUser} className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Action Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{confirmAction.title}</h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '14px',
                color: '#856404'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                <strong>Warning:</strong> This action will take effect immediately.
              </div>
              <p>{confirmAction.message}</p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-secondary"
                disabled={actionLoading[confirmAction.user?.id]}
              >
                Cancel
              </button>
              <button
                onClick={executeAdminAction}
                className={`btn ${confirmAction.buttonClass}`}
                disabled={actionLoading[confirmAction.user?.id]}
              >
                {actionLoading[confirmAction.user?.id] ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                    Processing...
                  </>
                ) : (
                  confirmAction.buttonText
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Type Change Modal */}
      {showAccountTypeModal && accountTypeUser && (
        <div className="modal-overlay" onClick={() => setShowAccountTypeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Account Type</h3>
              <button className="modal-close" onClick={() => setShowAccountTypeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '14px',
                color: '#856404'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                <strong>Warning:</strong> Changing account type may affect existing registrations and permissions.
              </div>

              <div className="form-group">
                <label>User:</label>
                <span>
                  {accountTypeUser.firstName && accountTypeUser.lastName
                    ? `${accountTypeUser.firstName} ${accountTypeUser.lastName}`
                    : accountTypeUser.email}
                </span>
              </div>

              <div className="form-group">
                <label>Current Type:</label>
                <span className={`user-type-badge ${accountTypeUser.userType?.toLowerCase()}`}>
                  {accountTypeUser.userType || 'PARENT'}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="newAccountType">New Account Type:</label>
                <select
                  id="newAccountType"
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value)}
                  className="form-input"
                >
                  <option value="PARENT">Parent</option>
                  <option value="VOLUNTEER">Volunteer</option>
                  <option value="ADMIN">Admin</option>
                  <option value="ATHLETE">Athlete</option>
                </select>
              </div>

              {accountTypeWarnings.length > 0 && (
                <div style={{
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  padding: '15px',
                  borderRadius: '4px',
                  marginTop: '15px',
                  fontSize: '14px',
                  color: '#721c24'
                }}>
                  <strong>Potential Issues:</strong>
                  <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
                    {accountTypeWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowAccountTypeModal(false)}
                className="btn btn-secondary"
                disabled={actionLoading[accountTypeUser?.id]}
              >
                Cancel
              </button>
              <button
                onClick={handleAccountTypeChange}
                className="btn btn-warning"
                disabled={actionLoading[accountTypeUser?.id] || newAccountType === accountTypeUser.userType}
              >
                {actionLoading[accountTypeUser?.id] ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                    Changing...
                  </>
                ) : (
                  'Change Account Type'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && deleteUser && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete User</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '14px',
                color: '#721c24'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                <strong>Warning:</strong> This will permanently delete the user's account, all event registrations, and associated data. This action cannot be undone.
              </div>

              <div className="form-group">
                <label>User:</label>
                <span>
                  {deleteUser.firstName && deleteUser.lastName
                    ? `${deleteUser.firstName} ${deleteUser.lastName}`
                    : deleteUser.email}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="deleteReason">Reason for Deletion (Required):</label>
                <select
                  id="deleteReason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select a reason...</option>
                  <option value="User requested account deletion">User requested account deletion</option>
                  <option value="Duplicate account">Duplicate account</option>
                  <option value="Violation of Terms of Service">Violation of Terms of Service</option>
                  <option value="Inappropriate behavior">Inappropriate behavior</option>
                  <option value="Spam or abusive content">Spam or abusive content</option>
                  <option value="Security concerns">Security concerns</option>
                  <option value="Data cleanup">Data cleanup</option>
                  <option value="Administrative decision">Administrative decision</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
                disabled={actionLoading[deleteUser?.id]}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="btn btn-danger"
                disabled={actionLoading[deleteUser?.id] || !deleteReason.trim()}
              >
                {actionLoading[deleteUser?.id] ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .users-registrations-container {
          width: 100%;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .section-header h2 {
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .header-actions .btn {
          white-space: nowrap;
        }

        .sub-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 1rem;
        }

        .sub-tab-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .sub-tab-btn:hover {
          background: #f3f4f6;
        }

        .sub-tab-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .table-responsive {
          overflow-x: auto;
          margin-top: 1rem;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .data-table th,
        .data-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .data-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #374151;
        }

        .data-table tr:hover {
          background-color: #f9fafb;
        }

        .user-type-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .user-type-badge.parent {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .user-type-badge.volunteer {
          background-color: #d1fae5;
          color: #065f46;
        }

        .user-type-badge.admin {
          background-color: #fef3c7;
          color: #92400e;
        }

        .roles-list {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .role-badge {
          padding: 0.125rem 0.375rem;
          background-color: #e5e7eb;
          color: #374151;
          border-radius: 3px;
          font-size: 0.6rem;
          font-weight: 500;
        }

        .teams-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .team-role-badge {
          padding: 0.125rem 0.375rem;
          background-color: #f3e5f5;
          color: #4a148c;
          border-radius: 3px;
          font-size: 0.6rem;
          font-weight: 500;
          border: 1px solid #9c27b0;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-badge.approved {
          background-color: #d1fae5;
          color: #065f46;
        }

        .status-badge.rejected {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .status-badge.confirmed {
          background-color: #d1fae5;
          color: #065f46;
        }

        .status-badge.accepted {
          background-color: #d1fae5;
          color: #065f46;
        }

        .food-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .food-badge.yes {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .food-badge.no {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .action-buttons {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .btn-danger {
          background-color: #dc3545;
          border-color: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background-color: #c82333;
          border-color: #bd2130;
        }

        .btn-success {
          background-color: #28a745;
          border-color: #28a745;
          color: white;
        }

        .btn-success:hover {
          background-color: #218838;
          border-color: #1e7e34;
        }

        .btn-info {
          background-color: #17a2b8;
          border-color: #17a2b8;
          color: white;
        }

        .btn-info:hover {
          background-color: #138496;
          border-color: #117a8b;
        }

        .btn-warning {
          background-color: #ffc107;
          border-color: #ffc107;
          color: #212529;
        }

        .btn-warning:hover {
          background-color: #e0a800;
          border-color: #d39e00;
        }

        .btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          line-height: 1.5;
          border-radius: 0.2rem;
        }

        .text-muted {
          color: #6b7280;
        }

        .small {
          font-size: 0.875rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          color: #2f506a;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: #374151;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(47, 80, 106, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .sub-tabs {
            flex-direction: column;
          }

          .data-table {
            font-size: 0.875rem;
          }

          .data-table th,
          .data-table td {
            padding: 0.5rem;
          }

          .action-buttons {
            flex-direction: column;
          }
        }

        .roles-checkboxes {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .checkbox-label:hover {
          background-color: #f3f4f6;
        }

        .checkbox-label input[type="checkbox"] {
          margin: 0;
          cursor: pointer;
        }

        .checkbox-label span {
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-select {
          padding: 0.25rem 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          font-size: 0.75rem;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }

        .status-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .admin-notes {
          max-width: 200px;
          font-size: 0.8rem;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .experience-info {
          font-size: 0.8rem;
          line-height: 1.3;
        }

        .experience-info div {
          margin-bottom: 0.25rem;
        }

        .team-badge {
          padding: 0.25rem 0.5rem;
          background-color: #e0f2fe;
          color: #0277bd;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        /* User Profile Modal Styles */
        .user-name-link {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          text-decoration: underline;
          font-weight: 600;
          padding: 0;
          margin: 0;
          transition: color 0.2s ease;
        }

        .user-name-link:hover {
          color: var(--primary-dark);
        }

        .user-profile-modal {
          max-width: 600px;
          width: 90vw;
          max-height: 80vh;
          overflow-y: auto;
        }

        .profile-section {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #eee;
        }

        .profile-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .profile-section h4 {
          color: var(--primary);
          margin-bottom: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .profile-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .profile-item label {
          font-weight: 600;
          color: var(--text);
          font-size: 0.9rem;
        }

        .profile-item span {
          color: #666;
        }

        .small-text {
          font-family: monospace;
          font-size: 0.8rem;
          word-break: break-all;
        }

        .profile-links {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .status-badge.verified {
          background-color: #d4edda;
          color: #155724;
        }

        .status-badge.unverified {
          background-color: #f8d7da;
          color: #721c24;
        }

        .tab-info {
          text-align: center;
          padding: 1rem;
        }

        .tab-info h3 {
          margin-bottom: 0.5rem;
          color: var(--primary);
        }

        .tab-info p {
          color: #666;
          margin: 0;
        }

        .banned-row {
          opacity: 0.6;
          background-color: #fef2f2;
        }

        .banned-badge {
          color: #dc2626;
          font-weight: 600;
          font-size: 0.75rem;
          margin-left: 8px;
          padding: 2px 6px;
          background-color: #fee2e2;
          border-radius: 3px;
          border: 1px solid #fecaca;
        }

        /* Notification Styles */
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1050;
          min-width: 300px;
          max-width: 500px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: slideInFromRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .notification-success {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(21, 128, 61, 0.95) 100%);
          color: white;
        }

        .notification-error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(185, 28, 28, 0.95) 100%);
          color: white;
        }

        .notification-info {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(29, 78, 216, 0.95) 100%);
          color: white;
        }

        .notification-content {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          gap: 12px;
          position: relative;
        }

        .notification-content i {
          font-size: 20px;
          flex-shrink: 0;
        }

        .notification-content span {
          flex: 1;
          font-weight: 500;
          line-height: 1.4;
        }

        .notification-close {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
          flex-shrink: 0;
        }

        .notification-close:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        @keyframes slideInFromRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .notification {
            top: 10px;
            right: 10px;
            left: 10px;
            min-width: unset;
            max-width: unset;
          }

          .sub-tabs {
            flex-wrap: wrap;
            gap: 0.25rem;
          }

          .sub-tab-btn {
            font-size: 0.875rem;
            padding: 0.375rem 0.75rem;
          }

          .admin-notes {
            max-width: 150px;
          }
        }
      `}</style>
    </div>
  );
};

export default UsersAndRegistrations;