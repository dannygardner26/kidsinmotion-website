import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';

const AuthAction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [actionMode, setActionMode] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const mode = urlParams.get('mode');
    const actionCode = urlParams.get('oobCode');
    const continueUrl = urlParams.get('continueUrl');

    setActionMode(mode);

    if (!mode || !actionCode) {
      setError('Invalid or missing parameters in verification link.');
      setLoading(false);
      return;
    }

    handleAuthAction(mode, actionCode, continueUrl);
  }, [location]);

  const handleAuthAction = async (mode, actionCode, continueUrl) => {
    try {
      switch (mode) {
        case 'verifyEmail':
          await applyActionCode(auth, actionCode);
          setMessage('Email verified successfully! You can now access all features.');
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          break;

        case 'resetPassword':
          // Verify the password reset code first
          await verifyPasswordResetCode(auth, actionCode);
          setShowPasswordReset(true);
          setMessage('Please enter your new password below.');
          break;

        case 'recoverEmail':
          await applyActionCode(auth, actionCode);
          setMessage('Email recovery completed successfully.');
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          break;

        case 'verifyAndChangeEmail':
          await applyActionCode(auth, actionCode);
          setMessage('Email change verified successfully.');
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          break;

        default:
          setError('Invalid action mode.');
      }
    } catch (error) {
      console.error('Auth action error:', error);

      // Provide user-friendly error messages
      switch (error.code) {
        case 'auth/invalid-action-code':
          setError('This verification link is invalid or has expired. Please request a new one.');
          break;
        case 'auth/expired-action-code':
          setError('This verification link has expired. Please request a new verification email.');
          break;
        case 'auth/user-disabled':
          setError('Your account has been disabled. Please contact support.');
          break;
        case 'auth/user-not-found':
          setError('No account found. The verification link may be for an account that no longer exists.');
          break;
        default:
          setError('An error occurred while processing your request. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const urlParams = new URLSearchParams(location.search);
      const actionCode = urlParams.get('oobCode');

      await confirmPasswordReset(auth, actionCode, newPassword);
      setMessage('Password reset successfully! You can now sign in with your new password.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="loading-spinner mb-3"></div>
                <h4>Processing your request...</h4>
                <p className="text-muted">Please wait while we verify your information.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header text-center">
              <h3>
                {actionMode === 'verifyEmail' && '📧 Email Verification'}
                {actionMode === 'resetPassword' && '🔒 Password Reset'}
                {actionMode === 'recoverEmail' && '📧 Email Recovery'}
                {actionMode === 'verifyAndChangeEmail' && '📧 Email Change'}
              </h3>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                </div>
              )}

              {message && !showPasswordReset && (
                <div className="alert alert-success">
                  <i className="fas fa-check-circle me-2"></i>
                  {message}
                </div>
              )}

              {showPasswordReset && (
                <form onSubmit={handlePasswordReset}>
                  <div className="alert alert-info mb-4">
                    <i className="fas fa-info-circle me-2"></i>
                    {message}
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="newPassword" className="form-label">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      className="form-control"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      minLength={6}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                  </button>
                </form>
              )}

              {!showPasswordReset && (
                <div className="text-center mt-4">
                  <button
                    className="btn btn-outline-primary me-3"
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to Dashboard
                  </button>
                  <button
                    className="btn btn-link"
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthAction;