import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import firestoreTimeslotService from '../../services/firestoreTimeslotService';
import firebaseRealtimeTimeslotService from '../../services/firebaseRealtimeTimeslotService';

const TimeslotListView = ({ eventId, eventDate, isLoggedIn = false, onSignupSuccess }) => {
  const { currentUser, userProfile } = useAuth();
  const [timeslots, setTimeslots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingUp, setSigningUp] = useState(null); // Track which slot is being signed up for
  const [userSignups, setUserSignups] = useState([]); // User's current signups for this event

  useEffect(() => {
    if (!eventId) return;

    setIsLoading(true);

    // Subscribe to real-time updates for timeslots with signups
    const unsubscribe = firebaseRealtimeTimeslotService.subscribeToEventTimeslotsWithSignups(
      eventId,
      (slotsWithSignups) => {
        setTimeslots(slotsWithSignups);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error loading timeslots:', err);
        setError('Failed to load timeslots');
        setIsLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [eventId]);

  // Load user's signups for this event
  useEffect(() => {
    if (!currentUser || !eventId) {
      setUserSignups([]);
      return;
    }

    const loadUserSignups = async () => {
      try {
        const signups = await firestoreTimeslotService.getUserTimeslotSignups(currentUser.uid, eventId);
        setUserSignups(signups);
      } catch (err) {
        console.error('Error loading user signups:', err);
      }
    };

    loadUserSignups();
  }, [currentUser, eventId, timeslots]); // Re-check when timeslots change

  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getAvailabilityColor = (slot) => {
    if (slot.isFull) return 'availability-red';
    if (slot.isAlmostFull) return 'availability-yellow';
    return 'availability-green';
  };

  const getAvailabilityText = (slot) => {
    if (slot.isFull) return 'FULL';
    return `${slot.available} spot${slot.available !== 1 ? 's' : ''} left`;
  };

  const isUserSignedUpForSlot = (slotId) => {
    return userSignups.some(signup => signup.timeslotId === slotId);
  };

  const getUserSignupForSlot = (slotId) => {
    return userSignups.find(signup => signup.timeslotId === slotId);
  };

  const handleSignup = async (slot) => {
    if (!currentUser || !userProfile) {
      setError('Please log in to sign up');
      return;
    }

    setSigningUp(slot.id);
    setError(null);

    try {
      await firestoreTimeslotService.signupForTimeslot(slot.id, eventId, {
        userId: currentUser.uid,
        email: userProfile.email || currentUser.email,
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phoneNumber: userProfile.phoneNumber || ''
      });

      // Refresh user signups
      const signups = await firestoreTimeslotService.getUserTimeslotSignups(currentUser.uid, eventId);
      setUserSignups(signups);

      if (onSignupSuccess) {
        onSignupSuccess(slot);
      }
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err.message || 'Failed to sign up');
    } finally {
      setSigningUp(null);
    }
  };

  const handleCancel = async (slot) => {
    const signup = getUserSignupForSlot(slot.id);
    if (!signup) return;

    setSigningUp(slot.id);
    setError(null);

    try {
      await firestoreTimeslotService.cancelTimeslotSignup(signup.id);

      // Refresh user signups
      const signups = await firestoreTimeslotService.getUserTimeslotSignups(currentUser.uid, eventId);
      setUserSignups(signups);
    } catch (err) {
      console.error('Error cancelling:', err);
      setError(err.message || 'Failed to cancel signup');
    } finally {
      setSigningUp(null);
    }
  };

  if (isLoading) {
    return (
      <div className="timeslot-loading">
        <div className="loading-spinner-small"></div>
        <span>Loading shifts...</span>
      </div>
    );
  }

  if (timeslots.length === 0) {
    return (
      <div className="timeslot-empty">
        <p>No shifts available for this event.</p>
      </div>
    );
  }

  return (
    <div className="timeslot-list-view">
      {error && (
        <div className="timeslot-error">
          {error}
        </div>
      )}

      <div className="timeslot-list">
        {timeslots.map((slot) => {
          const isSignedUp = isUserSignedUpForSlot(slot.id);
          const isTeamLead = slot.teamLeadUserId === currentUser?.uid;

          return (
            <div key={slot.id} className={`timeslot-item ${isSignedUp ? 'signed-up' : ''}`}>
              <div className="timeslot-header">
                <div className="timeslot-info">
                  <span className="shift-label">Shift {slot.shiftNumber}</span>
                  <span className="shift-time">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </span>
                </div>
                <div className={`availability-badge ${getAvailabilityColor(slot)}`}>
                  {getAvailabilityText(slot)}
                </div>
              </div>

              <div className="timeslot-details">
                <div className="volunteer-count">
                  {slot.current}/{slot.capacity} volunteers
                </div>

                {/* Show volunteer names if logged in */}
                {isLoggedIn && slot.signups && slot.signups.length > 0 && (
                  <div className="volunteer-names">
                    {slot.signups.map((signup, idx) => (
                      <span key={signup.id} className="volunteer-name">
                        {slot.teamLeadUserId === signup.userId && (
                          <span className="team-lead-badge" title="Team Lead">⭐</span>
                        )}
                        {signup.userFirstName} {signup.userLastName?.charAt(0)}.
                        {idx < slot.signups.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}

                {/* Show counts only if not logged in */}
                {!isLoggedIn && (
                  <div className="volunteer-names-hidden">
                    Log in to see volunteer names
                  </div>
                )}
              </div>

              <div className="timeslot-actions">
                {!isLoggedIn ? (
                  <button className="btn-slot btn-login-required" disabled>
                    Login to Sign Up
                  </button>
                ) : isSignedUp ? (
                  <div className="signed-up-actions">
                    <span className="signed-up-badge">
                      {isTeamLead && <span className="team-lead-icon">⭐</span>}
                      You're signed up!
                    </span>
                    <button
                      className="btn-slot btn-cancel"
                      onClick={() => handleCancel(slot)}
                      disabled={signingUp === slot.id}
                    >
                      {signingUp === slot.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                ) : slot.isFull ? (
                  <button className="btn-slot btn-full" disabled>
                    Shift Full
                  </button>
                ) : (
                  <button
                    className="btn-slot btn-signup"
                    onClick={() => handleSignup(slot)}
                    disabled={signingUp === slot.id}
                  >
                    {signingUp === slot.id ? 'Signing up...' : 'Sign Up'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .timeslot-list-view {
          padding: 1rem 0;
        }

        .timeslot-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 2rem;
          color: #6b7280;
        }

        .loading-spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(47, 80, 106, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .timeslot-empty {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }

        .timeslot-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .timeslot-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 500px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .timeslot-item {
          background: white;
          border: 1px solid rgba(47, 80, 106, 0.15);
          border-radius: 0.75rem;
          padding: 1rem;
          transition: all 0.15s ease;
        }

        .timeslot-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .timeslot-item.signed-up {
          border-color: var(--primary);
          background: rgba(47, 80, 106, 0.02);
        }

        .timeslot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .timeslot-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .shift-label {
          font-weight: 600;
          color: var(--primary);
          font-size: 1rem;
        }

        .shift-time {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .availability-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .availability-green {
          background-color: #dcfce7;
          color: #16a34a;
        }

        .availability-yellow {
          background-color: #fef9c3;
          color: #ca8a04;
        }

        .availability-red {
          background-color: #fee2e2;
          color: #dc2626;
        }

        .timeslot-details {
          margin-bottom: 0.75rem;
        }

        .volunteer-count {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .volunteer-names {
          font-size: 0.8rem;
          color: #4b5563;
          line-height: 1.4;
        }

        .volunteer-name {
          display: inline;
        }

        .team-lead-badge {
          margin-right: 0.125rem;
        }

        .volunteer-names-hidden {
          font-size: 0.75rem;
          color: #9ca3af;
          font-style: italic;
        }

        .timeslot-actions {
          display: flex;
          justify-content: flex-end;
        }

        .btn-slot {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-signup {
          background-color: var(--primary);
          color: white;
        }

        .btn-signup:hover:not(:disabled) {
          background-color: rgba(47, 80, 106, 0.9);
        }

        .btn-cancel {
          background-color: transparent;
          color: #dc2626;
          border: 1px solid #dc2626;
        }

        .btn-cancel:hover:not(:disabled) {
          background-color: #dc2626;
          color: white;
        }

        .btn-full, .btn-login-required {
          background-color: #e5e7eb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .btn-slot:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .signed-up-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .signed-up-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--primary);
          font-weight: 500;
          font-size: 0.875rem;
        }

        .team-lead-icon {
          font-size: 1rem;
        }

        @media (max-width: 480px) {
          .timeslot-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .timeslot-actions {
            flex-direction: column;
            width: 100%;
          }

          .btn-slot {
            width: 100%;
          }

          .signed-up-actions {
            flex-direction: column;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default TimeslotListView;
