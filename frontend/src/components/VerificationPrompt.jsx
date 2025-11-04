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

  // Phone verification state
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [sendingPhoneCode, setSendingPhoneCode] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [verifyingPhoneCode, setVerifyingPhoneCode] = useState(false);
  const [phoneVerificationError, setPhoneVerificationError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [smsAvailable, setSmsAvailable] = useState(true); // Default to true to avoid hiding until checked

  // Check SMS availability on component mount
  useEffect(() => {
    const checkSmsAvailability = async () => {
      try {
        const response = await apiService.getSmsAvailability();
        setSmsAvailable(response.smsEnabled);
      } catch (error) {
        console.warn('Failed to check SMS availability:', error);
        setSmsAvailable(false); // Assume not available if check fails
      }
    };

    checkSmsAvailability();
  }, []);

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

  // Phone verification handlers
  const handleSendPhoneVerification = async () => {
    setSendingPhoneCode(true);
    setPhoneVerificationError('');

    try {
      await sendPhoneVerification();
      setPhoneCodeSent(true);
      startResendCooldown();
    } catch (error) {
      console.error('Error sending phone verification:', error);
      setPhoneVerificationError(error.message || 'Failed to send verification code');
    } finally {
      setSendingPhoneCode(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!phoneVerificationCode || phoneVerificationCode.length !== 6) {
      setPhoneVerificationError('Please enter a 6-digit code');
      return;
    }

    setVerifyingPhoneCode(true);
    setPhoneVerificationError('');

    try {
      await verifyPhoneCode(phoneVerificationCode);
      await refreshVerificationStatus();
      setPhoneCodeSent(false);
      setPhoneVerificationCode('');
    } catch (error) {
      console.error('Error verifying phone code:', error);
      setPhoneVerificationError(error.message || 'Invalid verification code');
    } finally {
      setVerifyingPhoneCode(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown(prev => {
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
      {!isPhoneVerified && userPhone && smsAvailable && (
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

          {/* Phone verification error */}
          {phoneVerificationError && (
            <div style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              padding: '8px',
              borderRadius: '4px',
              marginBottom: '10px',
              fontSize: '14px'
            }}>
              {phoneVerificationError}
            </div>
          )}

          {!phoneCodeSent ? (
            /* Send verification code button */
            <button
              onClick={handleSendPhoneVerification}
              disabled={sendingPhoneCode}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: sendingPhoneCode ? 'not-allowed' : 'pointer',
                opacity: sendingPhoneCode ? 0.6 : 1,
                fontSize: '14px'
              }}
            >
              {sendingPhoneCode ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '5px' }}></i>
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </button>
          ) : (
            /* Code input and verify section */
            <div>
              <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                Enter the 6-digit code sent to your phone:
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={phoneVerificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPhoneVerificationCode(value);
                  }}
                  placeholder="123456"
                  maxLength="6"
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    width: '100px',
                    textAlign: 'center',
                    fontSize: '16px',
                    letterSpacing: '2px'
                  }}
                />
                <button
                  onClick={handleVerifyPhoneCode}
                  disabled={verifyingPhoneCode || phoneVerificationCode.length !== 6}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: (verifyingPhoneCode || phoneVerificationCode.length !== 6) ? 'not-allowed' : 'pointer',
                    opacity: (verifyingPhoneCode || phoneVerificationCode.length !== 6) ? 0.6 : 1,
                    fontSize: '14px'
                  }}
                >
                  {verifyingPhoneCode ? (
                    <>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '5px' }}></i>
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </div>

              {/* Resend code button */}
              <button
                onClick={handleSendPhoneVerification}
                disabled={resendCooldown > 0 || sendingPhoneCode}
                style={{
                  backgroundColor: 'transparent',
                  color: resendCooldown > 0 ? '#6c757d' : '#007bff',
                  border: 'none',
                  padding: '4px 8px',
                  cursor: (resendCooldown > 0 || sendingPhoneCode) ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  textDecoration: resendCooldown > 0 ? 'none' : 'underline'
                }}
              >
                {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* SMS Not Available Message */}
      {!isPhoneVerified && userPhone && !smsAvailable && (
        <div style={{
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '15px',
          border: '1px solid #ffc107'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#856404' }}></i>
            <strong>SMS Verification Unavailable</strong>
          </div>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#856404' }}>
            Phone verification via SMS is not currently configured. Please use email verification or contact an administrator.
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
            Phone: {userPhone} (Cannot verify via SMS)
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
            {userPhone && !smsAvailable && (
              <span style={{ color: '#856404', marginLeft: '8px' }}>
                (SMS unavailable)
              </span>
            )}
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