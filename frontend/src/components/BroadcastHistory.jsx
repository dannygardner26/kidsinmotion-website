import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const BroadcastHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchBroadcastHistory();
  }, []);

  const fetchBroadcastHistory = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBroadcastHistory();
      if (Array.isArray(response)) {
        setHistory(response);
      } else {
        setHistory(response.history || []);
      }
      setError('');
    } catch (err) {
      setError('Failed to load broadcast history: ' + err.message);
      console.error('Error fetching broadcast history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (broadcast) => {
    try {
      await apiService.downloadBroadcastReceipt(broadcast.id);
    } catch (err) {
      setError('Failed to download receipt: ' + err.message);
      console.error('Error downloading receipt:', err);
    }
  };

  const handleViewDetails = async (broadcast) => {
    try {
      const details = await apiService.getBroadcastDetails(broadcast.id);
      setSelectedBroadcast(details);
      setShowDetails(true);
    } catch (err) {
      setError('Failed to load broadcast details: ' + err.message);
      console.error('Error fetching broadcast details:', err);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatChannels = (channels) => {
    if (!channels || channels.length === 0) return 'None';
    return Array.from(channels).map(channel => {
      switch (channel) {
        case 'inbox': return 'Inbox';
        case 'email': return 'Email';
        case 'sms': return 'SMS';
        case 'phone': return 'SMS';
        default: return channel;
      }
    }).join(', ');
  };

  if (loading) {
    return (
      <div className="broadcast-history-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Loading broadcast history...</span>
      </div>
    );
  }

  return (
    <div className="broadcast-history">
      <div className="panel-card">
        <div className="panel-header">
          <h3>Broadcast History</h3>
          <p>View past broadcasts and download delivery receipts</p>
          {history.length > 0 && (
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={fetchBroadcastHistory}
            >
              <i className="fas fa-refresh"></i> Refresh
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        {history.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-history"></i>
            <h4>No Broadcast History</h4>
            <p>Your broadcast messages will appear here after you send them.</p>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Sent By</th>
                  <th>Date</th>
                  <th>Recipients</th>
                  <th>Channels</th>
                  <th>Delivered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map(broadcast => (
                  <tr key={broadcast.id}>
                    <td className="subject-cell">
                      <div className="subject-content">
                        <strong>{broadcast.subject}</strong>
                        {broadcast.message && (
                          <div className="message-preview">
                            {broadcast.message.length > 100
                              ? broadcast.message.substring(0, 100) + '...'
                              : broadcast.message}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{broadcast.initiatorName}</td>
                    <td>{formatTimestamp(broadcast.sentTimestamp)}</td>
                    <td className="center">{broadcast.totalRecipients}</td>
                    <td>{formatChannels(broadcast.requestedChannels)}</td>
                    <td className="delivery-summary">
                      <div className="delivery-stats">
                        {broadcast.emailSent > 0 && (
                          <span className="delivery-stat">
                            <i className="fas fa-envelope"></i> {broadcast.emailSent}
                          </span>
                        )}
                        {broadcast.smsSent > 0 && (
                          <span className="delivery-stat">
                            <i className="fas fa-mobile-alt"></i> {broadcast.smsSent}
                          </span>
                        )}
                        {broadcast.inboxSent > 0 && (
                          <span className="delivery-stat">
                            <i className="fas fa-inbox"></i> {broadcast.inboxSent}
                          </span>
                        )}
                        {(broadcast.warnings > 0 || broadcast.failures > 0) && (
                          <span className="delivery-stat warning">
                            <i className="fas fa-exclamation-triangle"></i>
                            {broadcast.warnings + broadcast.failures}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleViewDetails(broadcast)}
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success ml-1"
                        onClick={() => handleDownloadReceipt(broadcast)}
                        title="Download Receipt"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broadcast Details Modal */}
      {showDetails && selectedBroadcast && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Broadcast Details</h4>
              <button
                className="modal-close"
                onClick={() => setShowDetails(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h5>Message Information</h5>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Subject:</label>
                    <span>{selectedBroadcast.subject}</span>
                  </div>
                  <div className="detail-item">
                    <label>Sent By:</label>
                    <span>{selectedBroadcast.initiatorName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Sent Date:</label>
                    <span>{formatTimestamp(selectedBroadcast.sentTimestamp)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Channels:</label>
                    <span>{formatChannels(selectedBroadcast.requestedChannels)}</span>
                  </div>
                </div>
                <div className="detail-item full-width">
                  <label>Message:</label>
                  <div className="message-content">{selectedBroadcast.message}</div>
                </div>
              </div>

              <div className="detail-section">
                <h5>Delivery Summary</h5>
                <div className="delivery-grid">
                  <div className="delivery-item">
                    <i className="fas fa-inbox"></i>
                    <div>
                      <strong>Inbox Messages</strong>
                      <span>{selectedBroadcast.inboxSent} sent, {selectedBroadcast.inboxSkipped} skipped</span>
                    </div>
                  </div>
                  <div className="delivery-item">
                    <i className="fas fa-envelope"></i>
                    <div>
                      <strong>Email Messages</strong>
                      <span>{selectedBroadcast.emailSent} sent, {selectedBroadcast.emailSkipped} skipped</span>
                    </div>
                  </div>
                  <div className="delivery-item">
                    <i className="fas fa-mobile-alt"></i>
                    <div>
                      <strong>SMS Messages</strong>
                      <span>{selectedBroadcast.smsSent} sent, {selectedBroadcast.smsSkipped} skipped</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedBroadcast.categoryCounts && Object.keys(selectedBroadcast.categoryCounts).length > 0 && (
                <div className="detail-section">
                  <h5>Recipients by Category</h5>
                  <div className="category-counts">
                    {Object.entries(selectedBroadcast.categoryCounts).map(([category, count]) => (
                      <div key={category} className="category-count">
                        <span className="category-name">{category}</span>
                        <span className="category-value">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBroadcast.warnings && selectedBroadcast.warnings.length > 0 && (
                <div className="detail-section">
                  <h5>Warnings</h5>
                  <ul className="warnings-list">
                    {selectedBroadcast.warnings.map((warning, index) => (
                      <li key={index} className="warning-item">
                        <i className="fas fa-exclamation-triangle"></i>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedBroadcast.failures && selectedBroadcast.failures.length > 0 && (
                <div className="detail-section">
                  <h5>Delivery Failures</h5>
                  <div className="failures-list">
                    {selectedBroadcast.failures.map((failure, index) => (
                      <div key={index} className="failure-item">
                        <div className="failure-channel">
                          <i className={`fas ${failure.channel === 'email' ? 'fa-envelope' : 'fa-mobile-alt'}`}></i>
                          {failure.channel}
                        </div>
                        <div className="failure-reason">{failure.reason}</div>
                        <div className="failure-recipient">
                          {failure.recipient && typeof failure.recipient === 'object'
                            ? Object.values(failure.recipient).join(', ')
                            : failure.recipient || 'Unknown'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline-success"
                onClick={() => handleDownloadReceipt(selectedBroadcast)}
              >
                <i className="fas fa-download"></i> Download Receipt
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .broadcast-history {
          margin-top: 2rem;
        }

        .broadcast-history-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: #666;
        }

        .broadcast-history-loading i {
          margin-right: 0.5rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #666;
        }

        .empty-state i {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #ddd;
        }

        .empty-state h4 {
          margin-bottom: 0.5rem;
          color: #333;
        }

        .history-table-container {
          overflow-x: auto;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .history-table th,
        .history-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .history-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #333;
        }

        .history-table tr:hover {
          background-color: #f8f9fa;
        }

        .subject-cell {
          max-width: 250px;
        }

        .subject-content strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .message-preview {
          font-size: 0.85em;
          color: #666;
          line-height: 1.3;
        }

        .center {
          text-align: center;
        }

        .delivery-summary {
          min-width: 120px;
        }

        .delivery-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .delivery-stat {
          display: inline-flex;
          align-items: center;
          font-size: 0.875em;
          color: #28a745;
        }

        .delivery-stat.warning {
          color: #ffc107;
        }

        .delivery-stat i {
          margin-right: 0.25rem;
        }

        .actions-cell {
          white-space: nowrap;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #ddd;
        }

        .modal-header h4 {
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #666;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .detail-section {
          margin-bottom: 1.5rem;
        }

        .detail-section h5 {
          margin-bottom: 1rem;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 0.5rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-item.full-width {
          grid-column: 1 / -1;
        }

        .detail-item label {
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: #555;
        }

        .message-content {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          white-space: pre-wrap;
        }

        .delivery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .delivery-item {
          display: flex;
          align-items: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .delivery-item i {
          font-size: 1.5rem;
          margin-right: 1rem;
          color: #007bff;
        }

        .delivery-item strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .category-counts {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.5rem;
        }

        .category-count {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .warnings-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .warning-item {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          background: #fff3cd;
          margin-bottom: 0.5rem;
          border-radius: 4px;
        }

        .warning-item i {
          margin-right: 0.5rem;
          color: #856404;
        }

        .failures-list {
          display: grid;
          gap: 0.5rem;
        }

        .failure-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          padding: 0.75rem;
          background: #f8d7da;
          border-radius: 4px;
          align-items: center;
        }

        .failure-channel {
          display: flex;
          align-items: center;
          font-weight: 600;
        }

        .failure-channel i {
          margin-right: 0.5rem;
        }

        .failure-reason {
          color: #721c24;
        }

        .failure-recipient {
          font-family: monospace;
          font-size: 0.875em;
          color: #666;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #ddd;
        }
      `}</style>
    </div>
  );
};

export default BroadcastHistory;