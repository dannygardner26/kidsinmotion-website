import React, { useMemo, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const BASE_USER_CATEGORIES = [
  { id: 'all', label: 'All Users', description: 'Everyone in the system' },
  { id: 'parents', label: 'Parents', description: 'Users who have registered children' },
  { id: 'volunteers', label: 'Volunteers', description: 'Users with volunteer applications' },
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
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [categoryRecipients, setCategoryRecipients] = useState({});
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState({});

  // Fetch events for dynamic categories
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await apiService.getAllEvents();
        setEvents(eventsData || []);
      } catch (error) {
        console.error('Failed to fetch events for messaging categories:', error);
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Create dynamic user categories including event-specific ones
  const USER_CATEGORIES = useMemo(() => {
    const categories = [...BASE_USER_CATEGORIES];

    if (!loadingEvents && events.length > 0) {
      // Add event-specific categories
      events.forEach(event => {
        // Parents registered for this event
        categories.push({
          id: `event-parents-${event.id}`,
          label: `Parents - ${event.name}`,
          description: `Parents with children registered for "${event.name}"`,
          eventId: event.id,
          eventName: event.name
        });

        // Volunteers registered for this event
        categories.push({
          id: `event-volunteers-${event.id}`,
          label: `Volunteers - ${event.name}`,
          description: `Volunteers signed up for "${event.name}"`,
          eventId: event.id,
          eventName: event.name
        });
      });
    }

    return categories;
  }, [events, loadingEvents]);

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

  const fetchRecipients = async (categoryId) => {
    if (categoryRecipients[categoryId] || loadingRecipients[categoryId]) {
      return; // Already loaded or loading
    }

    setLoadingRecipients(prev => ({ ...prev, [categoryId]: true }));

    try {
      const response = await apiService.getRecipientPreview(categoryId);
      setCategoryRecipients(prev => ({
        ...prev,
        [categoryId]: response.recipients || []
      }));
    } catch (error) {
      console.error(`Failed to fetch recipients for category ${categoryId}:`, error);
      setCategoryRecipients(prev => ({
        ...prev,
        [categoryId]: []
      }));
    } finally {
      setLoadingRecipients(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      const newCategories = (() => {
        if (categoryId === 'all') {
          return prev.includes('all') ? [] : ['all'];
        }
        const withoutAll = prev.filter(id => id !== 'all');
        return withoutAll.includes(categoryId)
          ? withoutAll.filter(id => id !== categoryId)
          : [...withoutAll, categoryId];
      })();

      // Fetch recipients for newly selected categories
      newCategories.forEach(catId => {
        if (catId !== 'all' && !prev.includes(catId)) {
          fetchRecipients(catId);
        }
      });

      return newCategories;
    });
  };

  const toggleChannel = (channelId) => {
    if (channelId === 'all') {
      setChannels(['inbox', 'email', 'phone']);
      return;
    }

    setChannels(prev => {
      if (prev.includes(channelId)) {
        // Don't allow unchecking inbox if it's the only channel selected
        if (channelId === 'inbox' && prev.length === 1) {
          return prev; // Keep inbox selected
        }
        return prev.filter(id => id !== channelId);
      } else {
        return [...prev, channelId];
      }
    });
  };

  const toggleRecipient = (recipientId) => {
    setSelectedRecipients(prev => {
      return prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId];
    });
  };

  const selectAllRecipients = (categoryId) => {
    const recipients = categoryRecipients[categoryId] || [];
    const recipientIds = recipients.map(r => r.firebaseUid || r.email).filter(Boolean);

    setSelectedRecipients(prev => {
      const newSelected = [...prev];
      recipientIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      return newSelected;
    });
  };

  const deselectAllRecipients = (categoryId) => {
    const recipients = categoryRecipients[categoryId] || [];
    const recipientIds = recipients.map(r => r.firebaseUid || r.email).filter(Boolean);

    setSelectedRecipients(prev =>
      prev.filter(id => !recipientIds.includes(id))
    );
  };

  const buildPayload = () => ({
    subject: subject.trim(),
    message: message.trim(),
    deliveryChannels: channels,
    directEmails: mode === 'emails' ? parsedEmails : [],
    categories: mode === 'categories' ? selectedCategories : [],
    selectedRecipients: selectedRecipients.length > 0 ? selectedRecipients : [],
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

            {loadingEvents && (
              <div className="loading-categories">
                <i className="fas fa-spinner fa-spin"></i> Loading event categories...
              </div>
            )}

            <div className="category-grid">
              {/* Base categories */}
              {BASE_USER_CATEGORIES.map(category => {
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

              {/* Event-specific categories */}
              {!loadingEvents && events.length > 0 && (
                <>
                  <div className="category-section-divider">
                    <h5>Event-Specific Categories</h5>
                  </div>
                  {events.map(event => (
                    <React.Fragment key={event.id}>
                      {/* Parents for this event */}
                      {(() => {
                        const categoryId = `event-parents-${event.id}`;
                        const isChecked = selectedCategories.includes(categoryId);
                        return (
                          <label key={categoryId} className={`category-card event-category ${isChecked ? 'checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCategory(categoryId)}
                            />
                            <span>
                              <strong>Parents - {event.name}</strong>
                              <small>Parents with children registered for "{event.name}"</small>
                            </span>
                          </label>
                        );
                      })()}

                      {/* Volunteers for this event */}
                      {(() => {
                        const categoryId = `event-volunteers-${event.id}`;
                        const isChecked = selectedCategories.includes(categoryId);
                        return (
                          <label key={categoryId} className={`category-card event-category ${isChecked ? 'checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCategory(categoryId)}
                            />
                            <span>
                              <strong>Volunteers - {event.name}</strong>
                              <small>Volunteers signed up for "{event.name}"</small>
                            </span>
                          </label>
                        );
                      })()}
                    </React.Fragment>
                  ))}
                </>
              )}
            </div>
            <div className="section-meta">
              {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
              {!loadingEvents && events.length > 0 && (
                <span> • {events.length} event{events.length === 1 ? '' : 's'} loaded</span>
              )}
            </div>
          </section>
        )}

        {/* Recipient Preview Section */}
        {mode === 'categories' && selectedCategories.length > 0 && (
          <section className="panel-section">
            <h4>Recipient Preview</h4>
            <p className="section-hint">Review and optionally select specific recipients from your chosen categories.</p>

            {selectedCategories.map(categoryId => {
              const category = USER_CATEGORIES.find(c => c.id === categoryId);
              const recipients = categoryRecipients[categoryId] || [];
              const isLoading = loadingRecipients[categoryId];
              const categorySelectedCount = recipients.filter(r =>
                selectedRecipients.includes(r.firebaseUid || r.email)
              ).length;

              if (!category) return null;

              return (
                <div key={categoryId} className="recipient-category">
                  <div className="recipient-category-header">
                    <h5>{category.label}</h5>
                    {isLoading ? (
                      <span className="loading-indicator">
                        <i className="fas fa-spinner fa-spin"></i> Loading...
                      </span>
                    ) : (
                      <div className="recipient-actions">
                        <span className="recipient-count">
                          {categorySelectedCount > 0 ? `${categorySelectedCount} of ` : ''}{recipients.length} recipient{recipients.length === 1 ? '' : 's'}
                        </span>
                        {recipients.length > 0 && (
                          <>
                            <button
                              type="button"
                              className="btn-link"
                              onClick={() => selectAllRecipients(categoryId)}
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              className="btn-link"
                              onClick={() => deselectAllRecipients(categoryId)}
                            >
                              Deselect All
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {!isLoading && recipients.length > 0 && (
                    <div className="recipient-list">
                      {recipients.map(recipient => {
                        const recipientId = recipient.firebaseUid || recipient.email;
                        const isSelected = selectedRecipients.includes(recipientId);

                        return (
                          <label key={recipientId} className={`recipient-item ${isSelected ? 'selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRecipient(recipientId)}
                            />
                            <div className="recipient-info">
                              <div className="recipient-name">
                                {recipient.displayName || 'Unknown User'}
                              </div>
                              <div className="recipient-contact">
                                {recipient.email && <span className="email">{recipient.email}</span>}
                                {recipient.phoneNumber && <span className="phone">{recipient.phoneNumber}</span>}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {!isLoading && recipients.length === 0 && (
                    <div className="no-recipients">
                      <i className="fas fa-users"></i>
                      <p>No recipients found for this category.</p>
                    </div>
                  )}
                </div>
              );
            })}

            {selectedRecipients.length > 0 && (
              <div className="selected-recipients-summary">
                <strong>{selectedRecipients.length} specific recipient{selectedRecipients.length === 1 ? '' : 's'} selected</strong>
                <p className="section-hint">When specific recipients are selected, the message will only be sent to them (not all users in the selected categories).</p>
              </div>
            )}
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
          <p className="section-hint">Choose where this announcement should be delivered. <strong>Inbox messages are always reliable</strong> and delivered instantly to users' accounts.</p>
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

        .loading-categories {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          color: #6b7280;
          font-style: italic;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .category-section-divider {
          grid-column: 1 / -1;
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
          margin-top: 1rem;
        }

        .category-section-divider h5 {
          margin: 0 0 1rem 0;
          color: #374151;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .event-category {
          border-left: 4px solid #f59e0b;
        }

        .event-category.checked {
          border-left-color: var(--primary);
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
