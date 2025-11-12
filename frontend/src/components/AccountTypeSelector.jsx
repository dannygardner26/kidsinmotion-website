import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AccountTypeSelector = ({ onComplete }) => {
  const { userProfile, updateProfile } = useAuth();
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);

  const accountTypes = [
    {
      type: 'PARENT',
      title: 'Parent/Guardian',
      description: 'Register children for events and activities',
      icon: 'fas fa-users',
      color: 'primary'
    },
    {
      type: 'VOLUNTEER',
      title: 'Volunteer',
      description: 'Help with events and activities',
      icon: 'fas fa-hands-helping',
      color: 'success'
    }
  ];

  const handleConfirm = async () => {
    if (!selectedType) return;

    setLoading(true);
    try {
      const updatedProfile = await updateProfile({
        userType: selectedType,
        needsOnboarding: false,
        needsProfileCompletion: true, // Force profile completion
        onboardingCompletedAt: new Date().toISOString()
      });

      console.log('Account type selected:', selectedType);
      onComplete && onComplete(updatedProfile);
    } catch (error) {
      console.error('Error updating account type:', error);
      // Remove alert, just log error and keep loading state
      setLoading(false);
    }
  };

  return (
    <div className="account-type-selector">
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Welcome to Kids in Motion!</h2>
            <p>Please select your account type to get started:</p>
          </div>

          <div className="account-types">
            {accountTypes.map((accountType) => (
              <div
                key={accountType.type}
                className={`account-type-card ${selectedType === accountType.type ? 'selected' : ''}`}
                onClick={() => setSelectedType(accountType.type)}
              >
                <div className={`icon-container ${accountType.color}`}>
                  <i className={accountType.icon}></i>
                </div>
                <h3>{accountType.title}</h3>
                <p>{accountType.description}</p>
                <div className="selection-indicator">
                  {selectedType === accountType.type && (
                    <i className="fas fa-check-circle"></i>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleConfirm}
              disabled={!selectedType || loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Setting up account...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .account-type-selector {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-overlay {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          text-align: center;
          padding: 2rem 2rem 1rem;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          color: var(--primary);
          margin-bottom: 0.5rem;
        }

        .modal-header p {
          color: #666;
          margin: 0;
        }

        .account-types {
          padding: 2rem;
          display: grid;
          gap: 1rem;
        }

        .account-type-card {
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          text-align: center;
        }

        .account-type-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .account-type-card.selected {
          border-color: var(--primary);
          background: rgba(47, 80, 106, 0.05);
          box-shadow: 0 4px 12px rgba(47, 80, 106, 0.2);
        }

        .icon-container {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 1.5rem;
          color: white;
        }

        .icon-container.primary {
          background: var(--primary);
        }

        .icon-container.success {
          background: #28a745;
        }

        .icon-container.info {
          background: #17a2b8;
        }

        .account-type-card h3 {
          margin: 0 0 0.5rem;
          color: var(--text);
        }

        .account-type-card p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .selection-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          color: var(--primary);
          font-size: 1.2rem;
        }

        .modal-footer {
          padding: 1.5rem 2rem 2rem;
          text-align: center;
        }

        .btn-lg {
          padding: 0.75rem 2rem;
          font-size: 1.1rem;
          min-width: 200px;
        }

        .mr-2 {
          margin-right: 0.5rem;
        }

        .fa-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .modal-content {
            margin: 20px;
            max-height: calc(100vh - 40px);
          }

          .modal-header,
          .account-types,
          .modal-footer {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountTypeSelector;