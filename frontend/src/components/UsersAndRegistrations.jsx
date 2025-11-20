import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import firestoreUserService from '../services/firestoreUserService';

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
      // Fetch users from both backend API and Firestore
      const [backendUsersData, firestoreUsers] = await Promise.allSettled([
        apiService.getAllUsers().catch(err => {
          console.warn('Failed to fetch backend users:', err);
          return { users: [] };
        }),
        firestoreUserService.getAllUsers().catch(err => {
          console.warn('Failed to fetch Firestore users:', err);
          return [];
        })
      ]);

      // Extract backend users
      const backendUsers = backendUsersData.status === 'fulfilled'
        ? (backendUsersData.value.users || backendUsersData.value || [])
        : [];

      // Extract Firestore users
      const firebaseUsers = firestoreUsers.status === 'fulfilled' ? firestoreUsers.value : [];

      console.log('Backend users:', backendUsers.length);
      console.log('Firebase users:', firebaseUsers.length);

      // Combine users, avoiding duplicates by email
      const allUsers = [...backendUsers];
      const backendEmails = new Set(backendUsers.map(u => u.email));

      // Add Firebase users that aren't already in backend
      firebaseUsers.forEach(user => {
        if (!backendEmails.has(user.email)) {
          // Convert Firebase user format to match backend format
          allUsers.push({
            ...user,
            // Add fields that admin dashboard expects
            createdTimestamp: user.createdAt,
            lastLoginTimestamp: user.lastLoginAt,
            // Mark as Firebase-only user
            source: 'firebase'
          });
        }
      });

      console.log('Combined users for admin dashboard:', allUsers.length);
      setUsers(Array.isArray(allUsers) ? allUsers : []);

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
      if (editingUser.source === 'firebase') {
        await firestoreUserService.updateUser(editingUser.id, editForm);
      } else {
        await apiService.updateUserAccount(editingUser.id, editForm);
      }

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
          if (user.source === 'firebase') {
            await firestoreUserService.updateUser(user.id, { emailVerified: true });
            result = { message: 'User email verified successfully (Firestore)' };
          } else {
            result = await apiService.verifyUserEmail(user.id);
          }
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
              // This is handled by modal
              return u;
            default:
              return u;
          }
        }
        return u;
      }));

      if (action !== 'delete' && action !== 'changeType') {
        showNotification(result.message || 'Action completed successfully', 'success');
        setShowConfirmModal(false);
        setConfirmAction(null);
      }
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
      let result;
      if (accountTypeUser.source === 'firebase') {
        await firestoreUserService.updateUser(accountTypeUser.id, { userType: newAccountType });
        result = { message: 'Account type changed successfully (Firestore)' };
      } else {
        result = await apiService.changeUserAccountType(accountTypeUser.id, newAccountType);
      }

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
      let result;
      if (deleteUser.source === 'firebase') {
        await firestoreUserService.deleteUser(deleteUser.id);
        result = { message: 'User deleted successfully (Firestore)' };
      } else {
        result = await apiService.deleteUser(deleteUser.id, deleteReason);
      }

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
            <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' :
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
                        to={`/account/${user.username || user.firebaseUid || user.id || user.email?.split('@')[0] || 'unknown'}`}
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
                          to={`/account/${user.username || user.firebaseUid || user.id || user.email?.split('@')[0] || 'unknown'}`}
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

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table >
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {
        showUserProfile && selectedUser && (
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
                      <span>{selectedUser.createdTimestamp ? new Date(selectedUser.createdTimestamp).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="profile-item">
                      <label>Last Login:</label>
                      <span>{selectedUser.lastLoginTimestamp ? new Date(selectedUser.lastLoginTimestamp).toLocaleString() : 'Never'}</span>
                    </div>
                    <div className="profile-item">
                      <label>Email Verified:</label>
                      <span className={`status-badge ${selectedUser.emailVerified ? 'success' : 'warning'}`}>
                        {selectedUser.emailVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedUser.teams && selectedUser.teams.length > 0 && (
                  <div className="profile-section">
                    <h4>Volunteer Teams</h4>
                    <div className="teams-list">
                      {selectedUser.teams.map((team, index) => (
                        <span key={index} className="team-badge">
                          {getTeamDisplayName(team)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUser.resumeLink && (
                  <div className="profile-section">
                    <h4>Resume</h4>
                    <a href={selectedUser.resumeLink} target="_blank" rel="noopener noreferrer" className="document-link">
                      <i className="fas fa-file-alt mr-2"></i> View Resume
                    </a>
                  </div>
                )}

                {selectedUser.portfolioLink && (
                  <div className="profile-section">
                    <h4>Portfolio</h4>
                    <a href={selectedUser.portfolioLink} target="_blank" rel="noopener noreferrer" className="document-link">
                      <i className="fas fa-external-link-alt mr-2"></i> View Portfolio
                    </a>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseUserProfile}>Close</button>
                <Link to={`/account/${selectedUser.username || selectedUser.firebaseUid || selectedUser.id || selectedUser.email?.split('@')[0] || 'unknown'}`} className="btn btn-primary">Edit Full Profile</Link>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit User Modal */}
      {
        showEditModal && editingUser && (
          <div className="modal-overlay" onClick={handleCancelEdit}>
            <div className="modal-content edit-user-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit User: {editingUser.firstName} {editingUser.lastName}</h3>
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
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditFormChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    className="form-control"
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={editForm.phoneNumber}
                    onChange={handleEditFormChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>User Type</label>
                  <select
                    name="userType"
                    value={editForm.userType}
                    onChange={handleEditFormChange}
                    className="form-control"
                  >
                    <option value="PARENT">Parent</option>
                    <option value="VOLUNTEER">Volunteer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Volunteer Teams</label>
                  <div className="teams-selection">
                    {['TEAM_COACH', 'TEAM_SOCIAL_MEDIA', 'TEAM_FUNDRAISING', 'TEAM_EVENT_COORDINATION'].map(team => (
                      <label key={team} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editForm.teams.includes(team)}
                          onChange={() => handleTeamToggle(team)}
                        />
                        {getTeamDisplayName(team)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveUser}>Save Changes</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Confirmation Modal */}
      {
        showConfirmModal && confirmAction && (
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{confirmAction.title}</h3>
                <button className="modal-close" onClick={() => setShowConfirmModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>{confirmAction.message}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                <button
                  className={`btn ${confirmAction.buttonClass}`}
                  onClick={executeAdminAction}
                  disabled={actionLoading[confirmAction.user.id]}
                >
                  {actionLoading[confirmAction.user.id] ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Processing...
                    </>
                  ) : confirmAction.buttonText}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete User Modal */}
      {
        showDeleteModal && deleteUser && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Delete User Account</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  <strong>Warning:</strong> This action is permanent and cannot be undone.
                </div>
                <p>
                  You are about to delete the account for <strong>{deleteUser.firstName} {deleteUser.lastName}</strong> ({deleteUser.email}).
                </p>
                <p>
                  This will remove:
                </p>
                <ul>
                  <li>User profile and login credentials</li>
                  <li>All event registrations and history</li>
                  <li>All volunteer records</li>
                  <li>Associated children profiles</li>
                </ul>

                <div className="form-group mt-3">
                  <label>Reason for deletion (required):</label>
                  <textarea
                    className="form-control"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Please provide a reason for deleting this user..."
                    rows="3"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteUser}
                  disabled={!deleteReason.trim() || actionLoading[deleteUser.id]}
                >
                  {actionLoading[deleteUser.id] ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash mr-2"></i>
                      Delete User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Account Type Change Modal */}
      {
        showAccountTypeModal && accountTypeUser && (
          <div className="modal-overlay" onClick={() => setShowAccountTypeModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Change Account Type</h3>
                <button className="modal-close" onClick={() => setShowAccountTypeModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>
                  Changing account type for <strong>{accountTypeUser.firstName} {accountTypeUser.lastName}</strong> ({accountTypeUser.email}).
                </p>

                <div className="alert alert-info">
                  <i className="fas fa-info-circle mr-2"></i>
                  Current Type: <strong>{accountTypeUser.userType}</strong>
                </div>

                <div className="form-group">
                  <label>New Account Type:</label>
                  <select
                    className="form-control"
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value)}
                  >
                    <option value="PARENT">PARENT</option>
                    <option value="VOLUNTEER">VOLUNTEER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                {newAccountType && newAccountType !== accountTypeUser.userType && (
                  <div className="alert alert-warning mt-3">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    <strong>Warning:</strong>
                    {newAccountType === 'PARENT' && accountTypeUser.userType === 'VOLUNTEER' && (
                      <p className="mb-0 mt-1">Changing from Volunteer to Parent will remove all volunteer team assignments.</p>
                    )}
                    {newAccountType === 'VOLUNTEER' && accountTypeUser.userType === 'PARENT' && (
                      <p className="mb-0 mt-1">Changing from Parent to Volunteer will remove all child registrations.</p>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAccountTypeModal(false)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={handleAccountTypeChange}
                  disabled={!newAccountType || newAccountType === accountTypeUser.userType || actionLoading[accountTypeUser.id]}
                >
                  {actionLoading[accountTypeUser.id] ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Updating...
                    </>
                  ) : 'Update Account Type'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      <style>{`
        .users-registrations-container {
          padding: 0;
        }

        .section-header {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
        }

        .section-header h2 {
          margin-bottom: 0.5rem;
          color: var(--primary);
        }

        .section-header p {
          color: #6c757d;
          margin-bottom: 1rem;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .sub-tabs {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .tab-info h3 {
          margin-bottom: 0.5rem;
          font-size: 1.25rem;
          color: var(--primary);
        }

        .tab-info p {
          margin: 0;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .users-table-container {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          margin-bottom: 2rem;
        }

        .users-table-container h3 {
          margin-bottom: 1.5rem;
          color: var(--primary);
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #e9ecef;
        }

        .table-responsive {
          overflow-x: auto;
          margin-top: 1rem;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .data-table thead {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
          color: white;
        }

        .data-table thead th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: none;
        }

        .data-table tbody tr {
          border-bottom: 1px solid #e9ecef;
          transition: all 0.2s ease;
        }

        .data-table tbody tr:hover {
          background-color: #f8f9fa;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .data-table tbody tr.banned-row {
          background-color: #fff5f5;
          opacity: 0.7;
        }

        .data-table tbody td {
          padding: 1rem;
          vertical-align: middle;
        }

        .user-name-link {
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .user-name-link:hover {
          color: var(--primary-light);
          text-decoration: underline;
        }

        .banned-badge {
          background: #dc3545;
          color: white;
          padding: 0.15rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-left: 0.5rem;
        }

        .user-type-badge {
          display: inline-block;
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .user-type-badge.admin {
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          color: white;
          box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
        }

        .user-type-badge.volunteer {
          background: linear-gradient(135deg, #28a745 0%, #218838 100%);
          color: white;
          box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
        }

        .user-type-badge.parent {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
        }

        .teams-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .team-badge {
          background: #e9ecef;
          color: var(--primary);
          padding: 0.25rem 0.65rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid #dee2e6;
        }

        .text-muted {
          color: #6c757d;
          font-style: italic;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .action-buttons .btn {
          padding: 0.4rem 0.75rem;
          font-size: 0.85rem;
          border-radius: 4px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .action-buttons .btn-sm {
          padding: 0.35rem 0.65rem;
          font-size: 0.8rem;
        }

        .action-buttons .btn-primary {
          background: var(--primary);
          color: white;
        }

        .action-buttons .btn-primary:hover {
          background: var(--primary-light);
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(47, 80, 106, 0.3);
        }

        .action-buttons .btn-danger {
          background: #dc3545;
          color: white;
        }

        .action-buttons .btn-danger:hover {
          background: #c82333;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(220, 53, 69, 0.3);
        }

        .action-buttons .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .action-buttons .btn i {
          margin-right: 0;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
          color: white;
          border-radius: 12px 12px 0 0;
        }

        .modal-header h3 {
          margin: 0;
          color: white;
          font-size: 1.25rem;
        }

        .modal-close {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e9ecef;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          background: #f8f9fa;
          border-radius: 0 0 12px 12px;
        }

        .profile-section {
          margin-bottom: 2rem;
        }

        .profile-section h4 {
          margin-bottom: 1rem;
          color: var(--primary);
          font-size: 1.1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e9ecef;
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
          color: #6c757d;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .profile-item span {
          color: var(--text);
          font-size: 1rem;
        }

        .small-text {
          font-size: 0.75rem;
          font-family: monospace;
          background: #f8f9fa;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.65rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.success {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.warning {
          background: #fff3cd;
          color: #856404;
        }

        .document-link {
          display: inline-flex;
          align-items: center;
          color: var(--primary);
          text-decoration: none;
          padding: 0.5rem 1rem;
          background: #f8f9fa;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .document-link:hover {
          background: #e9ecef;
          transform: translateX(4px);
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text);
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.1);
        }

        .teams-selection {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .checkbox-label:hover {
          background: #f8f9fa;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .alert {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border: 1px solid transparent;
        }

        .alert-danger {
          background: #f8d7da;
          border-color: #f5c6cb;
          color: #721c24;
        }

        .alert-info {
          background: #d1ecf1;
          border-color: #bee5eb;
          color: #0c5460;
        }

        .alert-warning {
          background: #fff3cd;
          border-color: #ffeeba;
          color: #856404;
        }

        .notification {
          position: fixed;
          top: 80px;
          right: 20px;
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1060;
          min-width: 300px;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .notification-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .notification-content i {
          font-size: 1.25rem;
        }

        .notification-success {
          border-left: 4px solid #28a745;
        }

        .notification-success i {
          color: #28a745;
        }

        .notification-error {
          border-left: 4px solid #dc3545;
        }

        .notification-error i {
          color: #dc3545;
        }

        .notification-info {
          border-left: 4px solid #17a2b8;
        }

        .notification-info i {
          color: #17a2b8;
        }

        .notification-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #6c757d;
          cursor: pointer;
          padding: 0;
          margin-left: auto;
        }

        .notification-close:hover {
          color: var(--text);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .users-table-container {
            padding: 1rem;
          }

          .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .data-table {
            font-size: 0.85rem;
          }

          .data-table thead th,
          .data-table tbody td {
            padding: 0.75rem 0.5rem;
          }

          .action-buttons {
            flex-direction: column;
            width: 100%;
          }

          .action-buttons .btn {
            width: 100%;
          }

          .profile-grid {
            grid-template-columns: 1fr;
          }

          .notification {
            left: 10px;
            right: 10px;
            min-width: auto;
          }

          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .header-actions .btn {
            width: 100%;
          }
        }

        /* Loading and Empty States */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
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

        .mr-2 {
          margin-right: 0.5rem;
        }

        .mt-3 {
          margin-top: 1rem;
        }

        .mb-0 {
          margin-bottom: 0;
        }

        .mt-1 {
          margin-top: 0.25rem;
        }

        .btn-warning {
          background: #ffc107;
          color: #212529;
        }

        .btn-warning:hover {
          background: #e0a800;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(255, 193, 7, 0.3);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #5a6268;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(108, 117, 125, 0.3);
        }

        .btn-info {
          background: #17a2b8;
          color: white;
        }

        .btn-info:hover {
          background: #138496;
        }

        .fa-spinner {
          animation: spin 1s linear infinite;
        }

        .fa-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default UsersAndRegistrations;
