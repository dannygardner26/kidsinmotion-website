import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const ChildrenManagement = () => {
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    grade: '',
    baseballExperience: '',
    medicalConcerns: '',
    foodAllergies: '',
    additionalInformation: ''
  });

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getChildren();
      setChildren(data);
    } catch (error) {
      console.error('Error fetching children:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      age: '',
      grade: '',
      baseballExperience: '',
      medicalConcerns: '',
      foodAllergies: '',
      additionalInformation: ''
    });
    setEditingChild(null);
    setShowAddForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form data before submission
    if (!formData.firstName?.trim()) {
      setError('First name is required');
      setIsSubmitting(false);
      return;
    }
    if (!formData.lastName?.trim()) {
      setError('Last name is required');
      setIsSubmitting(false);
      return;
    }
    if (!formData.age || formData.age < 0 || formData.age > 21) {
      setError('Age must be between 0 and 21');
      setIsSubmitting(false);
      return;
    }

    // Prepare payload with proper data types
    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      age: Number(formData.age),
      grade: formData.grade.trim(),
      baseballExperience: formData.baseballExperience.trim(),
      medicalConcerns: formData.medicalConcerns.trim(),
      foodAllergies: formData.foodAllergies.trim(),
      additionalInformation: formData.additionalInformation.trim()
    };

    console.log('Submitting child data:', payload);

    try {
      if (editingChild) {
        const result = await apiService.updateChild(editingChild.id, payload);
        console.log('Update child result:', result);
      } else {
        const result = await apiService.createChild(payload);
        console.log('Create child result:', result);
      }

      await fetchChildren();
      resetForm();
      setError(null); // Clear any previous errors
      // Show success notification
      setTimeout(() => {
        alert(editingChild ? 'Child updated successfully!' : 'Child added successfully!');
      }, 100);
    } catch (error) {
      console.error('Error saving child:', error);
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      if (error.response) {
        console.error('Error response:', error.response);
      }
      setError(error.message || 'Failed to save child. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (child) => {
    setFormData({
      firstName: child.firstName,
      lastName: child.lastName,
      age: child.age.toString(),
      grade: child.grade || '',
      baseballExperience: child.baseballExperience || '',
      medicalConcerns: child.medicalConcerns || '',
      foodAllergies: child.foodAllergies || '',
      additionalInformation: child.additionalInformation || ''
    });
    setEditingChild(child);
    setShowAddForm(true);
  };

  const handleDelete = async (childId) => {
    if (!window.confirm('Are you sure you want to delete this child? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteChild(childId);
      await fetchChildren();
    } catch (error) {
      console.error('Error deleting child:', error);
      setError(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="children-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="children-management">
      <div className="section-header">
        <h2>Your Children</h2>
        <p>Manage your children's information for event registrations</p>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <i className="fas fa-plus mr-2"></i>Add Child
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingChild ? 'Edit Child' : 'Add New Child'}</h3>
              <button
                className="modal-close"
                onClick={resetForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="child-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="age">Age *</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="form-control"
                    min="0"
                    max="21"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="grade">Grade</label>
                  <input
                    type="text"
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="e.g., 3rd Grade"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="baseballExperience">Baseball Experience</label>
                <textarea
                  id="baseballExperience"
                  name="baseballExperience"
                  value={formData.baseballExperience}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                  placeholder="Describe any baseball or sports experience..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="medicalConcerns">Medical Concerns</label>
                <textarea
                  id="medicalConcerns"
                  name="medicalConcerns"
                  value={formData.medicalConcerns}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                  placeholder="Any medical conditions, medications, or concerns we should know about..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="foodAllergies">Food Allergies</label>
                <textarea
                  id="foodAllergies"
                  name="foodAllergies"
                  value={formData.foodAllergies}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="2"
                  placeholder="List any food allergies or dietary restrictions..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="additionalInformation">Additional Information</label>
                <textarea
                  id="additionalInformation"
                  name="additionalInformation"
                  value={formData.additionalInformation}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                  placeholder="Any other information you'd like us to know..."
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : (editingChild ? 'Update Child' : 'Add Child')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Children List */}
      {children.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-child"></i>
          </div>
          <h3>No Children Added Yet</h3>
          <p>Add your children's information to make event registration easier. You only need to enter their details once!</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            Add Your First Child
          </button>
        </div>
      ) : (
        <div className="children-grid">
          {children.map(child => (
            <div key={child.id} className="child-card">
              <div className="child-header">
                <h3>{child.firstName} {child.lastName}</h3>
                <div className="child-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(child)}
                    title="Edit child"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(child.id)}
                    title="Delete child"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              <div className="child-details">
                <div className="detail-item">
                  <strong>Age:</strong> {child.age} years old
                </div>
                {child.grade && (
                  <div className="detail-item">
                    <strong>Grade:</strong> {child.grade}
                  </div>
                )}
                {child.baseballExperience && (
                  <div className="detail-item">
                    <strong>Baseball Experience:</strong>
                    <p>{child.baseballExperience}</p>
                  </div>
                )}
                {child.medicalConcerns && (
                  <div className="detail-item medical">
                    <strong>Medical Concerns:</strong>
                    <p>{child.medicalConcerns}</p>
                  </div>
                )}
                {child.foodAllergies && (
                  <div className="detail-item allergies">
                    <strong>Food Allergies:</strong>
                    <p>{child.foodAllergies}</p>
                  </div>
                )}
                {child.additionalInformation && (
                  <div className="detail-item">
                    <strong>Additional Information:</strong>
                    <p>{child.additionalInformation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .children-management {
          padding: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
        }

        .section-header h2 {
          margin: 0;
          color: var(--primary);
        }

        .section-header p {
          margin: 0.5rem 0 0 0;
          color: #6c757d;
        }

        .loading-container {
          text-align: center;
          padding: 4rem 2rem;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(47, 80, 106, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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
          border-radius: 12px;
          padding: 0;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-header h3 {
          margin: 0;
          color: var(--primary);
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6c757d;
        }

        .child-form {
          padding: 2rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text);
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(47, 80, 106, 0.1);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          border: 2px solid;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--primary-light);
          border-color: var(--primary-light);
        }

        .btn-outline {
          background: white;
          color: var(--primary);
          border-color: var(--primary);
        }

        .btn-outline:hover:not(:disabled) {
          background: var(--primary);
          color: white;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon {
          font-size: 4rem;
          color: var(--primary);
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: var(--primary);
          margin-bottom: 1rem;
        }

        .children-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .child-card {
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.3s ease;
        }

        .child-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .child-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e9ecef;
        }

        .child-header h3 {
          margin: 0;
          color: var(--primary);
        }

        .child-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-icon {
          background: none;
          border: none;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          color: #6c757d;
          transition: all 0.3s ease;
        }

        .btn-icon:hover {
          background: #f8f9fa;
          color: var(--primary);
        }

        .btn-icon.btn-danger:hover {
          background: #f8f9fa;
          color: #dc3545;
        }

        .child-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-item strong {
          color: var(--text);
          font-size: 0.9rem;
        }

        .detail-item p {
          margin: 0;
          color: #6c757d;
          line-height: 1.4;
        }

        .detail-item.medical strong {
          color: #dc3545;
        }

        .detail-item.allergies strong {
          color: #fd7e14;
        }

        .alert {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .alert-danger {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .mr-2 {
          margin-right: 0.5rem;
        }

        @media (max-width: 768px) {
          .children-management {
            padding: 1rem;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .children-grid {
            grid-template-columns: 1fr;
          }

          .modal-content {
            width: 95%;
          }

          .child-form {
            padding: 1rem;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ChildrenManagement;