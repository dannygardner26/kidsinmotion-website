import React, { useMemo, useState } from 'react';
import { apiService } from '../services/api';

const USER_CATEGORIES = [
  { id: 'all', label: 'All Users', description: 'Everyone in the system' },
  { id: 'parents', label: 'Parents', description: 'Users who have registered children' },
  { id: 'volunteers', label: 'Volunteers', description: 'Users with volunteer applications' },
  { id: 'approved', label: 'Approved Volunteers', description: 'Volunteers with approved applications' },
  { id: 'pending', label: 'Pending Applications', description: 'Volunteer applications awaiting review' },
  { id: 'coaches', label: 'Coaches', description: 'Volunteers on coaching teams' },
  { id: 'event-coordinators', label: 'Event Coordinators', description: 'Event coordination team members' },
  { id: 'social-media', label: 'Social Media Team', description: 'Social media team members' },
];

const CHANNEL_OPTIONS = [
  { id: 'inbox', label: 'On-Site Inbox', icon: 'fa-inbox' },
  { id: 'email', label: 'Email', icon: 'fa-envelope' },
  { id: 'phone', label: 'SMS/Text', icon: 'fa-mobile-alt' },
  { id: 'all', label: 'All Channels', icon: 'fa-broadcast-tower' },
];

const AdminMessaging = () => {
  const [mode, setMode] = useState('categories');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [emailList, setEmailList] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [channels, setChannels] = useState(['inbox']);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deliveryResult, setDeliveryResult] = useState(null);

  const parsedEmails = useMemo(() => {
    if (!emailList.trim()) {
      return [];
    }
    const parts = emailList
      .split(/[,;\n\s]+/)
      .map(entry => entry.trim().toLowerCase())
      .filter(entry => entry.length > 0);
    return Array.from(new Set(parts));
  }, [emailList]);

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (categoryId === 'all') {
        return prev.includes('all') ? [] : ['all'];
      }
      const withoutAll = prev.filter(id => id !== 'all');
      return withoutAll.includes(categoryId)
        ? withoutAll.filter(id => id !== categoryId)
        : [...withoutAll, categoryId];
    });
  };

  const toggleChannel = (channelId) => {
    if (channelId === 'all') {
      setChannels(['inbox', 'email', 'phone']);
      return;
    }
    setChannels(prev => (
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    ));
  };

  const buildPayload = () => ({
    subject: subject.trim(),
    message: message.trim(),
    deliveryChannels: channels,
    directEmails: mode === 'emails' ? parsedEmails : [],
    categories: mode === 'categories' ? selectedCategories : [],
  });

  const validatePayload = (payload) => {
    if (!payload.subject) {
      return 'Please provide a message subject/title.';
    }
    if (!payload.message) {
      return 'Please provide message content.';
    }
    if (payload.deliveryChannels.length === 0) {
      return 'Select at least one delivery channel.';
    }
    if (mode === 'emails' && payload.directEmails.length === 0) {
      return 'Enter one or more email addresses.';
    }
    if (mode === 'categories' && payload.categories.length === 0) {
      return 'Select at least one user category.';
    }
    return null;
  };

  const handleSend = async () => {
    const payload = buildPayload();
    const validationError = validatePayload(payload);

    setError(validationError || '');
    setSuccess('');
    setDeliveryResult(null);

    if (validationError) {
      return;
    }

    try {
      setSending(true);
      const response = await apiService.broadcastMessage(payload);
      setDeliveryResult(response);
      setSuccess(`Message queued for ${response.totalRecipients} recipient${response.totalRecipients === 1 ? '' : 's'}.`);
    } catch (err) {
      console.error('Failed to broadcast admin message:', err);
      setError(err?.message || 'Unable to send messages at this time.');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setEmailList('');
    setSelectedCategories([]);
    setChannels(['inbox']);
    setSuccess('');
    setError('');
    setDeliveryResult(null);
  };

  return (
    <div className="admin-messaging-panel">
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h2>Organization Messaging</h2>
            <p>Deliver announcements to targeted user groups via inbox, email, or SMS.</p>
          </div>
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-button ${mode === 'categories' ? 'active' : ''}`}
              onClick={() => setMode('categories')}
            >
              <i className="fas fa-users mr-2"></i>
              User Categories
            </button>
            <button
              type="button"
              className={`mode-button ${mode === 'emails' ? 'active' : ''}`}
              onClick={() => setMode('emails')}
            >
              <i className="fas fa-at mr-2"></i>
              Direct Emails
            </button>
          </div>
        </div>

        {mode === 'emails' && (
          <section className="panel-section">
            <h4>Direct Email Addresses</h4>
            <p className="section-hint">Enter email addresses separated by commas, semicolons, or line breaks.</p>
            <textarea
              className="form-control"
              rows={4}
              value={emailList}
              onChange={(event) => setEmailList(event.target.value)}
              placeholder="user1@example.com\nuser2@example.com"
            />
            <div className="section-meta">{parsedEmails.length} email{parsedEmails.length === 1 ? '' : 's'} detected</div>
          </section>
        )}

        {mode === 'categories' && (
          <section className="panel-section">
            <h4>User Categories</h4>
            <p className="section-hint">Select one or more audiences to include in this message.</p>
            <div className="category-grid">
              {USER_CATEGORIES.map(category => {
                const isChecked = selectedCategories.includes(category.id);
                return (
                  <label key={category.id} className={`category-card ${isChecked ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCategory(category.id)}
                    />
                    <span>
                      <strong>{category.label}</strong>
                      <small>{category.description}</small>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="section-meta">
              {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
            </div>
          </section>
        )}

        <section className="panel-section">
          <h4>Message Content</h4>
          <div className="form-group">
            <label htmlFor="admin-message-subject">Subject</label>
            <input
              id="admin-message-subject"
              type="text"
              className="form-control"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Eg: Volunteer Schedule Update"
            />
          </div>
          <div className="form-group">
            <label htmlFor="admin-message-body">Message</label>
            <textarea
              id="admin-message-body"
              className="form-control"
              rows={6}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Enter the announcement you would like to share..."
            />
            <div className="section-meta">{message.length} characters</div>
          </div>
        </section>

        <section className="panel-section">
          <h4>Delivery Channels</h4>
          <p className="section-hint">Choose where this announcement should be delivered.</p>
          <div className="channel-grid">
            {CHANNEL_OPTIONS.map(option => {
              const isChecked = option.id === 'all'
                ? channels.includes('inbox') && channels.includes('email') && channels.includes('phone')
                : channels.includes(option.id);
              return (
                <label key={option.id} className={`channel-card ${isChecked ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleChannel(option.id)}
                  />
                  <span>
                    <i className={`fas ${option.icon} mr-2`}></i>
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="section-meta">Active channels: {channels.join(', ') || 'none'}</div>
        </section>

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle mr-2"></i>
            {success}
          </div>
        )}

        {deliveryResult && (
          <section className="panel-section result-section">
            <h4>Delivery Summary</h4>
            <div className="result-grid">
              <div>
                <strong>Total Recipients</strong>
                <span>{deliveryResult.totalRecipients}</span>
              </div>
              <div>
                <strong>Inbox</strong>
                <span>{deliveryResult.inboxSent} sent / {deliveryResult.inboxSkipped} skipped</span>
              </div>
              <div>
                <strong>Email</strong>
                <span>{deliveryResult.emailSent} sent / {deliveryResult.emailSkipped} skipped</span>
              </div>
              <div>
                <strong>SMS</strong>
                <span>{deliveryResult.smsSent} sent / {deliveryResult.smsSkipped} skipped</span>
              </div>
            </div>

            {deliveryResult.warnings?.length ? (
              <div className="result-warning">
                <strong>Warnings</strong>
                <ul>
                  {deliveryResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {deliveryResult.directEmailsWithoutAccounts?.length ? (
              <div className="result-warning">
                <strong>Direct Emails Without Accounts</strong>
                <span>{deliveryResult.directEmailsWithoutAccounts.join(', ')}</span>
              </div>
            ) : null}

            {deliveryResult.failures?.length ? (
              <div className="result-warning">
                <strong>Delivery Issues</strong>
                <ul>
                  {deliveryResult.failures.slice(0, 10).map((failure, index) => (
                    <li key={`${failure.channel}-${index}`}>
                      <span className="badge">{failure.channel.toUpperCase()}</span>
                      {failure.reason}
                      {failure.recipient?.email ? ` — ${failure.recipient.email}` : ''}
                    </li>
                  ))}
                  {deliveryResult.failures.length > 10 && (
                    <li>+ {deliveryResult.failures.length - 10} additional issue(s)</li>
                  )}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        <div className="panel-actions">
          <button className="btn btn-secondary" type="button" onClick={resetForm} disabled={sending}>
            <i className="fas fa-undo mr-2"></i>Reset Form
          </button>
          <button className="btn btn-primary" type="button" onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <span className="loading-spinner-small"></span>
                Sending...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                Send Message
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .admin-messaging-panel {
          max-width: 960px;
          margin: 0 auto;
        }

        .panel-card {
          background-color: #ffffff;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 15px 40px rgba(15, 23, 42, 0.08);
          padding: 2.5rem;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 1.75rem;
          color: #1f2937;
        }

        .panel-header p {
          margin: 0.25rem 0 0;
          color: #6b7280;
        }

        .mode-toggle {
          display: flex;
          gap: 0.75rem;
        }

        .mode-button {
          border: 1px solid #d1d5db;
          background-color: #f9fafb;
          padding: 0.75rem 1.5rem;
          border-radius: 999px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          align-items: center;
        }

        .mode-button.active {
          background-color: var(--primary);
          color: #fff;
          border-color: var(--primary);
          box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2);
        }

        .panel-section {
          margin-bottom: 2rem;
          padding: 1.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background-color: #f8fafc;
        }

        .panel-section h4 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }

        .section-hint {
          margin: 0 0 1.25rem 0;
          color: #6b7280;
          font-size: 0.95rem;
        }

        .section-meta {
          margin-top: 0.75rem;
          color: #6b7280;
          font-size: 0.9rem;
          text-align: right;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }

        .category-card {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background-color: #fff;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .category-card.checked {
          border-color: var(--primary);
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.15);
        }

        .category-card input {
          margin-top: 0.4rem;
        }

        .category-card span {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .category-card small {
          color: #6b7280;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: block;
          color: #1f2937;
        }

        .form-control {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 0.85rem 1rem;
          font-size: 1rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
        }

        .channel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }

        .channel-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          background-color: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .channel-card.checked {
          border-color: var(--secondary);
          box-shadow: 0 8px 18px rgba(234, 88, 12, 0.15);
        }

        .alert {
          border-radius: 10px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
        }

        .alert-danger {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .alert-success {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .result-section .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .result-section .result-grid > div {
          background-color: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem;
        }

        .result-section strong {
          display: block;
          color: #111827;
        }

        .result-section span {
          color: #374151;
        }

        .result-warning {
          margin-top: 1rem;
          background-color: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 12px;
          padding: 1rem 1.25rem;
        }

        .result-warning ul {
          margin: 0.75rem 0 0;
          padding-left: 1.25rem;
        }

        .result-warning .badge {
          display: inline-block;
          background-color: var(--secondary);
          color: #fff;
          border-radius: 999px;
          padding: 0.15rem 0.75rem;
          margin-right: 0.5rem;
          font-size: 0.75rem;
          letter-spacing: 0.02em;
        }

        .panel-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .panel-actions .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          text-transform: none;
        }

        .loading-spinner-small {
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .panel-card {
            padding: 1.75rem;
          }

          .panel-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .mode-toggle {
            width: 100%;
            flex-direction: column;
          }

          .panel-actions {
            flex-direction: column;
          }

          .panel-actions .btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminMessaging;
