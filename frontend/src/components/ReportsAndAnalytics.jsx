import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReportsAndAnalytics = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.userType === 'ADMIN';

  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    totalVolunteers: 0,
    recentEvents: [],
    usersByType: { PARENT: 0, VOLUNTEER: 0, ADMIN: 0 },
    registrationsByMonth: [],
    upcomingEvents: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Fetch basic data that's available to all users
      const eventsData = await apiService.getEvents().catch(() => []);
      const events = Array.isArray(eventsData) ? eventsData : [];

      let usersData = [];
      let volunteers = [];
      let totalRegistrations = 0;
      let registrationsByMonth = {};
      let usersByType = { PARENT: 0, VOLUNTEER: 0, ADMIN: 0 };

      if (isAdmin) {
        // Admin-only data fetching
        const [adminUsersData, adminVolunteersData] = await Promise.all([
          apiService.getAllUsers().catch(() => []),
          apiService.getAllVolunteerEmployees().catch(() => [])
        ]);

        usersData = Array.isArray(adminUsersData) ? adminUsersData : [];
        volunteers = Array.isArray(adminVolunteersData) ? adminVolunteersData : [];

        // Calculate user types for admins
        usersByType = (usersData || []).reduce((acc, user) => {
          const type = user.userType || 'PARENT';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, { PARENT: 0, VOLUNTEER: 0, ADMIN: 0 });

        // Get total registrations across all events (admin-only)
        const participantResults = await Promise.all(
          events.map(event =>
            apiService.getEventParticipants(event.id)
              .catch(err => {
                console.warn(`Failed to fetch participants for event ${event.id}`);
                return [];
              })
          )
        );

        participantResults.forEach(participants => {
          totalRegistrations += participants.length;

          // Group by month with date guards
          participants.forEach(participant => {
            if (participant.registrationDate) {
              try {
                const month = new Date(participant.registrationDate).toLocaleString('default', { month: 'long', year: 'numeric' });
                registrationsByMonth[month] = (registrationsByMonth[month] || 0) + 1;
              } catch (dateError) {
                console.warn('Invalid registration date:', participant.registrationDate);
              }
            }
          });
        });
      }

      // Sort events by date
      const sortedEvents = (events || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      const recentEvents = sortedEvents.slice(0, 5);

      // Get upcoming events
      const now = new Date();
      const upcomingEvents = (events || [])
        .filter(event => new Date(event.date) > now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

      setAnalytics({
        totalUsers: usersData.length,
        totalEvents: events.length,
        totalRegistrations,
        totalVolunteers: volunteers.length,
        recentEvents,
        usersByType,
        registrationsByMonth: Object.entries(registrationsByMonth).map(([month, count]) => ({ month, count })),
        upcomingEvents
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = (dataType) => {
    // Simple CSV export functionality
    let csvContent = '';
    let filename = '';

    switch (dataType) {
      case 'users':
        csvContent = 'Type,Count\n';
        Object.entries(analytics.usersByType).forEach(([type, count]) => {
          csvContent += `${type},${count}\n`;
        });
        filename = 'users_report.csv';
        break;
      case 'events':
        csvContent = 'Event Name,Date,Registrations\n';
        analytics.recentEvents.forEach(event => {
          csvContent += `"${event.name}","${new Date(event.date).toLocaleDateString()}","${event.registrationCount || 0}"\n`;
        });
        filename = 'events_report.csv';
        break;
      case 'registrations':
        csvContent = 'Month,Registrations\n';
        analytics.registrationsByMonth.forEach(({ month, count }) => {
          csvContent += `"${month}",${count}\n`;
        });
        filename = 'registrations_report.csv';
        break;
      default:
        return;
    }

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading reports and analytics...</p>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="section-header">
        <h2>Reports & Analytics</h2>
        <div className="header-actions">
          <button
            onClick={() => fetchAnalyticsData()}
            className="btn btn-secondary"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {!isAdmin && (
        <div className="admin-only-banner">
          <div className="banner-icon">🔒</div>
          <div className="banner-content">
            <h4>Limited Access</h4>
            <p>Complete reports and analytics are available to administrators only. You can view public event information below.</p>
          </div>
        </div>
      )}

      <div className="report-tabs">
        <button
          className={`report-tab-btn ${selectedReport === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedReport('overview')}
        >
          Overview
        </button>
        <button
          className={`report-tab-btn ${selectedReport === 'events' ? 'active' : ''}`}
          onClick={() => setSelectedReport('events')}
        >
          Events
        </button>
      </div>

      {selectedReport === 'overview' && (
        <div className="overview-section">
          <div className="stats-grid">
            {/* Public stat - always visible */}
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <h3>{analytics.totalEvents}</h3>
                <p>Total Events</p>
              </div>
            </div>

            {/* Admin-only stats */}
            {isAdmin && (
              <>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>{analytics.totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>{analytics.totalRegistrations}</h3>
                    <p>Total Registrations</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🙋‍♀️</div>
                  <div className="stat-content">
                    <h3>{analytics.totalVolunteers}</h3>
                    <p>Volunteer Applications</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="overview-grid">
            <div className="overview-card">
              <h4>Upcoming Events</h4>
              {analytics.upcomingEvents.length === 0 ? (
                <p>No upcoming events scheduled.</p>
              ) : (
                <ul className="event-list">
                  {analytics.upcomingEvents.map(event => (
                    <li key={event.id}>
                      <strong>{event.name}</strong>
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Admin-only user distribution */}
            {isAdmin && (
              <div className="overview-card">
                <h4>User Distribution</h4>
                <div className="user-distribution">
                  {Object.entries(analytics.usersByType).map(([type, count]) => (
                    <div key={type} className="distribution-item">
                      <span className="type-label">{type}</span>
                      <span className="type-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {selectedReport === 'events' && (
        <div className="events-report-section">
          <div className="report-header">
            <h3>Event Statistics</h3>
            {isAdmin && (
              <button
                onClick={() => exportData('events')}
                className="btn btn-primary"
              >
                Export CSV
              </button>
            )}
          </div>

          <div className="events-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentEvents.map(event => (
                  <tr key={event.id}>
                    <td>{event.name}</td>
                    <td>{new Date(event.date).toLocaleDateString()}</td>
                    <td>{event.location || 'TBD'}</td>
                    <td>{event.capacity || 'Unlimited'}</td>
                    <td>
                      <span className={`status-badge ${new Date(event.date) > new Date() ? 'upcoming' : 'past'}`}>
                        {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      <style>{`
        .reports-container {
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

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .report-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 1rem;
        }

        .report-tab-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .report-tab-btn:hover {
          background: #f3f4f6;
        }

        .report-tab-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-content h3 {
          margin: 0;
          font-size: 2rem;
          font-weight: bold;
          color: var(--primary);
        }

        .stat-content p {
          margin: 0;
          color: #6b7280;
          font-weight: 500;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .overview-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .overview-card h4 {
          margin: 0 0 1rem 0;
          color: var(--primary);
        }

        .event-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .event-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .event-list li:last-child {
          border-bottom: none;
        }

        .user-distribution {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .distribution-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 4px;
        }

        .type-label {
          font-weight: 500;
        }

        .type-count {
          background: var(--primary);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: bold;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .user-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .user-stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .user-stat-card h4 {
          margin: 0;
          font-size: 2rem;
          color: var(--primary);
        }

        .user-stat-card p {
          margin: 0.5rem 0;
          font-weight: 600;
          color: #374151;
        }

        .percentage {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .report-table th,
        .report-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .report-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #374151;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.upcoming {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .status-badge.past {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .stat-summary {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .stat-summary h4 {
          margin: 0;
          color: var(--primary);
          font-size: 1.5rem;
        }

        .stat-summary p {
          margin: 0.5rem 0 0 0;
          color: #6b7280;
        }

        .monthly-breakdown {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .monthly-breakdown h4 {
          margin: 0 0 1rem 0;
          color: var(--primary);
        }

        .monthly-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .monthly-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 4px;
        }

        .monthly-item .count {
          font-weight: 600;
          color: var(--primary);
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

        .admin-only-banner {
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .banner-icon {
          font-size: 2rem;
          opacity: 0.9;
        }

        .banner-content h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .banner-content p {
          margin: 0;
          opacity: 0.9;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .report-tabs {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .overview-grid {
            grid-template-columns: 1fr;
          }

          .user-stats-grid {
            grid-template-columns: 1fr;
          }

          .report-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .report-table {
            font-size: 0.875rem;
          }

          .report-table th,
          .report-table td {
            padding: 0.5rem;
          }

          .admin-only-banner {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
          }

          .banner-icon {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsAndAnalytics;