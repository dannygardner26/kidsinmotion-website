import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email...');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        // Get token from URL params
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');

        if (!token) {
          setStatus('error');
          setMessage('No verification token found. Please check your email for the correct verification link.');
          return;
        }

        // Call verification endpoint
        const response = await fetch(`${process.env.REACT_APP_API_URL}/users/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          setEmail(data.email);

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Email verification failed.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('Unable to verify email. Please try again or contact support.');
      }
    };

    verifyEmailToken();
  }, [location.search, navigate]);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div className="card-body text-center p-5">
              {status === 'verifying' && (
                <>
                  <div className="mb-4">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                  <h2 className="mb-3" style={{ color: '#2f506a' }}>Verifying Email</h2>
                  <p className="text-muted">{message}</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="mb-4">
                    <div className="text-success" style={{ fontSize: '4rem' }}>
                      <i className="fas fa-check-circle"></i>
                    </div>
                  </div>
                  <h2 className="mb-3 text-success">Email Verified!</h2>
                  <p className="text-muted mb-3">{message}</p>
                  {email && (
                    <p className="small text-muted">
                      <strong>Email:</strong> {email}
                    </p>
                  )}
                  <p className="small text-muted">Redirecting to dashboard in 3 seconds...</p>
                  <button
                    className="btn btn-primary mt-3"
                    onClick={() => navigate('/dashboard')}
                    style={{ backgroundColor: '#e64f50', borderColor: '#e64f50' }}
                  >
                    Go to Dashboard Now
                  </button>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="mb-4">
                    <div className="text-danger" style={{ fontSize: '4rem' }}>
                      <i className="fas fa-times-circle"></i>
                    </div>
                  </div>
                  <h2 className="mb-3 text-danger">Verification Failed</h2>
                  <p className="text-muted mb-4">{message}</p>
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate('/dashboard')}
                      style={{ backgroundColor: '#2f506a', borderColor: '#2f506a' }}
                    >
                      Go to Dashboard
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => navigate('/login')}
                    >
                      Back to Login
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;