import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const AdminWebsiteStatistics = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is admin
  const isAdmin = userProfile?.roles?.includes('ROLE_ADMIN');

  useEffect(() => {
    if (isAdmin) {
      fetchStatistics();
    }
  }, [isAdmin]);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.adminGetStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError(error.message || 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-body text-center">
            <h2>Access Denied</h2>
            <p>You don't have permission to view website statistics.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mt-4">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger">
              <h4>Error Loading Statistics</h4>
              <p>{error}</p>
              <button onClick={fetchStatistics} className="btn btn-primary">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col">
          <h1>Website Statistics</h1>
          <p className="text-muted">Overview of your Kids in Motion website activity</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-card-body">
              <div className="stats-icon users">
                <i className="fas fa-users"></i>
              </div>
              <div className="stats-content">
                <div className="stats-number">{stats.totalUsers || 0}</div>
                <div className="stats-label">Total Users</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-card-body">
              <div className="stats-icon participants">
                <i className="fas fa-child"></i>
              </div>
              <div className="stats-content">
                <div className="stats-number">{stats.totalParticipants || 0}</div>
                <div className="stats-label">Event Registrations</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-card-body">
              <div className="stats-icon volunteers">
                <i className="fas fa-hands-helping"></i>
              </div>
              <div className="stats-content">
                <div className="stats-number">{stats.totalVolunteers || 0}</div>
                <div className="stats-label">Volunteer Signups</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="stats-card">
            <div className="stats-card-body">
              <div className="stats-icon events">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div className="stats-content">
                <div className="stats-number">
                  {(stats.totalParticipants || 0) + (stats.totalVolunteers || 0)}
                </div>
                <div className="stats-label">Total Activities</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="card-header">
              <h3>Recent Event Registrations</h3>
            </div>
            <div className="card-body">
              {stats.recentRegistrations && stats.recentRegistrations.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Child Name</th>
                        <th>Event</th>
                        <th>Parent</th>
                        <th>Age</th>
                        <th>Registration Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentRegistrations.map((registration, index) => (
                        <tr key={registration.id || index}>
                          <td>{registration.childName}</td>
                          <td>{registration.event?.name || 'Unknown Event'}</td>
                          <td>
                            {registration.parentUser
                              ? `${registration.parentUser.firstName} ${registration.parentUser.lastName}`
                              : 'Unknown Parent'}
                          </td>
                          <td>{registration.childAge || 'N/A'}</td>
                          <td>
                            {registration.registrationDate
                              ? new Date(registration.registrationDate).toLocaleDateString()
                              : 'Unknown'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-calendar-times fa-3x mb-3"></i>
                  <p>No recent registrations found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
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

        .stats-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stats-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .stats-card-body {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stats-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
          flex-shrink: 0;
        }

        .stats-icon.users {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .stats-icon.participants {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .stats-icon.volunteers {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .stats-icon.events {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .stats-content {
          flex: 1;
        }

        .stats-number {
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary);
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .stats-label {
          font-size: 0.9rem;
          color: #6c757d;
          font-weight: 500;
        }

        .table {
          margin-bottom: 0;
        }

        .table th {
          border-top: none;
          font-weight: 600;
          color: var(--primary);
          background-color: #f8f9fa;
        }

        .table-striped tbody tr:nth-of-type(odd) {
          background-color: rgba(0,0,0,.02);
        }

        .alert {
          border-radius: 8px;
        }

        .text-muted {
          color: #6c757d;
        }

        .py-4 {
          padding-top: 2rem;
          padding-bottom: 2rem;
        }

        .mb-3 {
          margin-bottom: 1rem;
        }

        .fa-3x {
          font-size: 3rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .stats-card-body {
            padding: 1rem;
            gap: 0.75rem;
          }

          .stats-icon {
            width: 50px;
            height: 50px;
            font-size: 1.25rem;
          }

          .stats-number {
            font-size: 1.5rem;
          }

          .table-responsive {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminWebsiteStatistics;