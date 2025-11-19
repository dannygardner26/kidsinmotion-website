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
                        to={`/account/${user.username || user.firebaseUid || user.id}`}
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

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table >
          </div >
        )}
      </div >

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
                <Link to={`/account/${selectedUser.username}`} className="btn btn-primary">Edit Full Profile</Link>
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
    </div >
  );
};

export default UsersAndRegistrations;