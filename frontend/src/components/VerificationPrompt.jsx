import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const VerificationPrompt = ({
  isEmailVerified,
  isPhoneVerified,
  userEmail,
  userPhone,
  onClose
}) => {
  const {
    sendEmailVerification,
    sendPhoneVerification,
    verifyPhoneCode,
    refreshVerificationStatus,
    verificationLoading
  } = useAuth();

  const [sendingEmailVerification, setSendingEmailVerification] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [error, setError] = useState(null);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);

  const handleSendEmailVerification = async () => {
    setSendingEmailVerification(true);
    setError(null);

    try {
      await sendEmailVerification();
      setEmailVerificationSent(true);
      startEmailResendCooldown(); // Start cooldown after successful send
      setTimeout(() => {
        setEmailVerificationSent(false);
      }, 5000);
    } catch (error) {
      console.error('Error sending email verification:', error);

      // Enhanced error handling for rate limiting
      if (error.message.includes('Too many')) {
        setError('You\'ve requested too many verification emails. Please wait a few minutes before trying again.');
        startEmailResendCooldown(); // Start cooldown even on rate limit
      } else if (error.message.includes('rate limit')) {
        setError('Rate limit reached. Please wait before requesting another verification email.');
        startEmailResendCooldown();
      } else {
        setError('Failed to send verification email. Please try again in a moment.');
      }
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

  // Email resend cooldown helper
  const startEmailResendCooldown = () => {
    setEmailResendCooldown(60); // 60 seconds
    const timer = setInterval(() => {
      setEmailResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
        To register for events and sign up as a volunteer, you need to verify your email address.
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
              marginBottom: '10px',
              fontSize: '14px'
            }}>
              <i className="fas fa-check" style={{ marginRight: '5px' }}></i>
              Verification email sent! Please check your inbox and spam folder.
            </div>
          ) : (
            <button
              onClick={handleSendEmailVerification}
              disabled={sendingEmailVerification || emailResendCooldown > 0}
              style={{
                backgroundColor: emailResendCooldown > 0 ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: emailResendCooldown > 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: emailResendCooldown > 0 ? 0.6 : 1
              }}
            >
              <i className="fas fa-envelope" style={{ marginRight: '5px' }}></i>
              {emailResendCooldown > 0 ? `Resend in ${emailResendCooldown}s` : 'Resend Verification Email'}
            </button>
          )}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
          <i className={`fas ${isEmailVerified ? 'fa-check-circle' : 'fa-times-circle'}`}
             style={{ marginRight: '8px', color: isEmailVerified ? '#28a745' : '#dc3545' }}></i>
          <span style={{ fontSize: '14px' }}>
            Email {isEmailVerified ? 'Verified' : 'Not Verified'}
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