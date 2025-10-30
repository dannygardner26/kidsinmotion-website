import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const VerificationPrompt = ({
  isEmailVerified,
  isPhoneVerified,
  userEmail,
  userPhone,
  onClose
}) => {
  const {
    sendEmailVerification,
    refreshVerificationStatus,
    verificationLoading
  } = useAuth();

  const [sendingEmailVerification, setSendingEmailVerification] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSendEmailVerification = async () => {
    setSendingEmailVerification(true);
    setError(null);

    try {
      await sendEmailVerification();
      setEmailVerificationSent(true);
      setTimeout(() => {
        setEmailVerificationSent(false);
      }, 5000);
    } catch (error) {
      console.error('Error sending email verification:', error);
      setError('Failed to send verification email. Please try again.');
    } finally {
      setSendingEmailVerification(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      await refreshVerificationStatus();
    } catch (error) {
      console.error('Error refreshing verification status:', error);
    }
  };

  return (
    <div style={{
      border: '1px solid #ffc107',
      backgroundColor: '#fff3cd',
      color: '#856404',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <i className="fas fa-exclamation-triangle" style={{ marginRight: '10px', fontSize: '18px' }}></i>
        <h4 style={{ margin: 0, color: '#856404' }}>Verification Required</h4>
      </div>

      <p style={{ marginBottom: '15px' }}>
        To register for events and sign up as a volunteer, you need to verify at least one contact method.
      </p>

      {/* Email Verification Section */}
      {!isEmailVerified && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '15px',
          border: '1px solid #ddd'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <i className="fas fa-envelope" style={{ marginRight: '8px', color: '#dc3545' }}></i>
            <strong>Email Verification</strong>
          </div>
          <p style={{ margin: '5px 0 10px 0', fontSize: '14px' }}>
            Email: {userEmail}
          </p>
          {emailVerificationSent ? (
            <div style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              color: '#155724',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              ✓ Verification email sent! Check your inbox and click the verification link.
            </div>
          ) : (
            <button
              onClick={handleSendEmailVerification}
              disabled={sendingEmailVerification || verificationLoading}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: sendingEmailVerification ? 'not-allowed' : 'pointer',
                opacity: sendingEmailVerification ? 0.6 : 1,
                fontSize: '14px'
              }}
            >
              {sendingEmailVerification ? 'Sending...' : 'Send Verification Email'}
            </button>
          )}
        </div>
      )}

      {/* Phone Verification Section */}
      {!isPhoneVerified && userPhone && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '15px',
          border: '1px solid #ddd'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <i className="fas fa-phone" style={{ marginRight: '8px', color: '#dc3545' }}></i>
            <strong>Phone Verification</strong>
          </div>
          <p style={{ margin: '5px 0 10px 0', fontSize: '14px' }}>
            Phone: {userPhone}
          </p>
          <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
            Phone verification coming soon. For now, please verify your email address.
          </p>
        </div>
      )}

      {/* Status Display */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <i className={`fas ${isEmailVerified ? 'fa-check-circle' : 'fa-times-circle'}`}
             style={{ marginRight: '8px', color: isEmailVerified ? '#28a745' : '#dc3545' }}></i>
          <span style={{ fontSize: '14px' }}>
            Email {isEmailVerified ? 'Verified' : 'Not Verified'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <i className={`fas ${isPhoneVerified ? 'fa-check-circle' : 'fa-times-circle'}`}
             style={{ marginRight: '8px', color: isPhoneVerified ? '#28a745' : '#dc3545' }}></i>
          <span style={{ fontSize: '14px' }}>
            Phone {isPhoneVerified ? 'Verified' : 'Not Verified'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '8px',
          borderRadius: '4px',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleRefreshStatus}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <i className="fas fa-sync-alt" style={{ marginRight: '5px' }}></i>
          Check Status
        </button>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: '#856404',
              border: '1px solid #856404',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Continue Without Verifying
          </button>
        )}
      </div>

      <div style={{
        marginTop: '15px',
        fontSize: '12px',
        color: '#666',
        fontStyle: 'italic'
      }}>
        Limited Access: You can browse events and manage your profile, but cannot register until verified.
      </div>
    </div>
  );
};

export default VerificationPrompt;