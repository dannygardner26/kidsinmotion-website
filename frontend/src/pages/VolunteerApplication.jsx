import React, { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { apiService } from '../services/api';
import { onAuthStateChanged } from 'firebase/auth';


const VolunteerApplication = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    grade: '',
    school: '',
    preferredContact: [],
    preferredContactOther: '',
    selectedCategories: [],
    motivation: '',
    dynamicAnswers: {},
    resume: '',
    portfolioLink: ''
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState(null); // 'draft', 'submitted', 'new'
  const [isEditing, setIsEditing] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Custom notification modal state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // 'success', 'error', 'info'

  const categories = [
    'Logistics',
    'Member Outreach',
    'Community Outreach',
    'Event Coordination',
    'Social Media Team',
    'Website Team',
    'Coach',
    'New Sport'
  ];

  // Dynamic questions for each category
  const dynamicQuestions = {
    'coach': 'Tell us about your baseball/coaching experience and what sports you\'ve played or coached.',
    'community-outreach': 'What organizations, sports leagues, or community groups do you know that could benefit from Kids in Motion?',
    'social-media-team': 'Describe your social media experience and any platforms you\'re familiar with.',
    'website-team': 'Tell us about your web development, design, or technical experience.',
    'event-coordination': 'Do you have experience organizing events, managing logistics, or coordinating groups?',
    'member-outreach': 'How would you help recruit and engage new members for Kids in Motion?',
    'logistics': 'Do you have experience with financial management, equipment handling, or organizational operations?',
    'new-sport': 'What sport would you like to introduce to Kids in Motion? Describe your experience with this sport and explain how you would organize events - specifically address: 1) How you would recruit volunteers to help, 2) What locations you could secure for practices/events, and 3) How you would attract kids and families to participate.'
  };

  // Helper function to show custom notifications instead of browser alerts
  const showCustomNotification = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  };

  const closeNotification = () => {
    setShowNotification(false);
    setNotificationMessage('');
    setNotificationType('success');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (categoryValue) => {
    setFormData(prev => {
      const newSelectedCategories = prev.selectedCategories.includes(categoryValue)
        ? prev.selectedCategories.filter(cat => cat !== categoryValue)
        : [...prev.selectedCategories, categoryValue];

      return {
        ...prev,
        selectedCategories: newSelectedCategories
      };
    });
  };

  const handleDynamicAnswerChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      dynamicAnswers: {
        ...prev.dynamicAnswers,
        [category]: value
      }
    }));
  };

  const handlePreferredContactChange = (contactMethod) => {
    setFormData(prev => {
      const newPreferredContact = prev.preferredContact.includes(contactMethod)
        ? prev.preferredContact.filter(method => method !== contactMethod)
        : [...prev.preferredContact, contactMethod];

      return {
        ...prev,
        preferredContact: newPreferredContact
      };
    });
  };

  // Function to count words in a text
  const countWords = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Function to get word limit for each category
  const getWordLimit = (category) => {
    return category === 'new-sport' ? 300 : 75;
  };

  // Save draft to localStorage
  const saveDraft = () => {
    if (isLoggedIn) {
      const draftKey = `volunteer_draft_${auth.currentUser?.uid}`;
      const draftData = {
        ...formData,
        lastSaved: new Date().toISOString(),
        status: applicationStatus === 'submitted' ? 'submitted' : 'draft'
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setLastSaved(new Date().toISOString());
    }
  };

  // Load existing application or draft
  const loadExistingApplication = (user) => {
    if (user) {
      const draftKey = `volunteer_draft_${user.uid}`;
      const savedData = localStorage.getItem(draftKey);

      console.log('Loading existing application for user:', user.uid);
      console.log('Saved data found:', savedData ? 'Yes' : 'No');

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log('Parsed saved data:', parsed);

          setFormData({
            firstName: parsed.firstName || '',
            lastName: parsed.lastName || '',
            email: parsed.email || '',
            phone: parsed.phone || '',
            grade: parsed.grade || '',
            school: parsed.school || '',
            preferredContact: parsed.preferredContact || [],
            preferredContactOther: parsed.preferredContactOther || '',
            selectedCategories: parsed.selectedCategories || [],
            motivation: parsed.motivation || '',
            dynamicAnswers: parsed.dynamicAnswers || {},
            resume: parsed.resume || '',
            portfolioLink: parsed.portfolioLink || ''
          });
          setApplicationStatus(parsed.status || 'draft');
          setLastSaved(parsed.lastSaved);

          if (parsed.status === 'submitted') {
            setIsEditing(true);
          }
          return parsed; // Return the loaded data
        } catch (error) {
          console.error('Error parsing saved data:', error);
          setApplicationStatus('new');
        }
      } else {
        setApplicationStatus('new');
      }
    }
    return null;
  };

  // Auto-fill form data for logged-in users and load existing application
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);

        // First, load any existing application or draft
        const existingData = loadExistingApplication(user);

        // Only auto-fill if no existing draft was found
        if (!existingData) {
          try {
            // Get user profile data from backend
            await apiService.syncUser();
            const userProfile = await apiService.getCurrentUser();

            if (userProfile) {
              setFormData(prev => ({
                ...prev,
                firstName: userProfile.firstName || '',
                lastName: userProfile.lastName || '',
                email: user.email || '',
                phone: userProfile.phoneNumber || '',
                grade: userProfile.grade || '',
                school: userProfile.school || ''
              }));
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            // For demo purposes, if backend is down, simulate auto-fill with user's basic info
            if (user.displayName) {
              const nameParts = user.displayName.split(' ');
              setFormData(prev => ({
                ...prev,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: user.email || '',
                phone: ''
              }));
            } else {
              // Even without displayName, we can still auto-fill email
              setFormData(prev => ({
                ...prev,
                email: user.email || ''
              }));
            }
          }
        }
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (isLoggedIn && applicationStatus !== null) {
      const autoSaveInterval = setInterval(() => {
        saveDraft();
      }, 30000); // 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [isLoggedIn, formData, applicationStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showCustomNotification('Please enter a valid email address.', 'error');
      return;
    }

    // Validate phone number format (US format)
    const phoneRegex = /^[\+]?[1]?[\s\-\.]?[(]?[0-9]{3}[)]?[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4}$/;
    const cleanPhone = formData.phone.replace(/\D/g, ''); // Remove all non-digits
    if (cleanPhone.length < 10 || !phoneRegex.test(formData.phone)) {
      showCustomNotification('Please enter a valid phone number (e.g., (123) 456-7890 or 123-456-7890).', 'error');
      return;
    }

    // Validate at least one contact method is selected
    if (formData.preferredContact.length === 0) {
      showCustomNotification('Please select at least one preferred contact method.', 'error');
      return;
    }

    // Validate "other" contact method is specified if selected
    if (formData.preferredContact.includes('other') && (!formData.preferredContactOther || formData.preferredContactOther.trim() === '')) {
      showCustomNotification('Please specify your other contact method.', 'error');
      return;
    }

    // Validate at least one team is selected
    if (formData.selectedCategories.length === 0) {
      showCustomNotification('Please select at least one team to join.', 'error');
      return;
    }

    // Validate all dynamic answers are provided
    for (const category of formData.selectedCategories) {
      if (!formData.dynamicAnswers[category] || formData.dynamicAnswers[category].trim() === '') {
        const teamName = categories.find(cat => cat.toLowerCase().replace(/\s+/g, '-') === category);
        showCustomNotification(`Please answer the ${teamName} team question.`, 'error');
        return;
      }
    }

    // Mark as submitted
    setApplicationStatus('submitted');
    setIsEditing(false);

    // Save the submitted application
    if (isLoggedIn) {
      const draftKey = `volunteer_draft_${auth.currentUser?.uid}`;
      const submittedData = {
        ...formData,
        lastSaved: new Date().toISOString(),
        status: 'submitted',
        submittedAt: new Date().toISOString()
      };
      localStorage.setItem(draftKey, JSON.stringify(submittedData));
    }

    console.log('Form submitted:', formData);
    // TODO: Add API call to submit form
    const message = isEditing
      ? 'Application updated successfully! We\'ll review your changes and get back to you soon.'
      : 'Application submitted successfully! We\'ll review your application and get back to you soon.';

    showCustomNotification(message, 'success');
  };

  const handleSaveDraft = () => {
    saveDraft();
    showCustomNotification('Draft saved! You can come back and finish your application later.', 'info');
  };

  return (
    <>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #4a7ca3 0%, #2f506a 100%)',
        color: 'white',
        marginTop: '-5rem',
        paddingTop: '7rem',
        paddingBottom: '4rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: '800',
              marginBottom: '1rem',
              color: 'white'
            }}>
              Become a Volunteer
            </h1>
            <p style={{
              fontSize: '1.2rem',
              opacity: '0.9',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Join our team and help make sports accessible to every child in our community.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section style={{ backgroundColor: '#f8f8f8', padding: '4rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '3rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#2f506a',
              textAlign: 'center'
            }}>
              {isEditing ? 'Edit Volunteer Application' : 'Volunteer Application'}
            </h2>

            {/* Application Status Banner */}
            {applicationStatus === 'submitted' && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#92400e',
                textAlign: 'center'
              }}>
                <i className="fas fa-edit" style={{ marginRight: '0.5rem' }}></i>
                <strong>You are editing a previously submitted application.</strong> Any changes you make will update your existing submission.
              </div>
            )}

            {applicationStatus === 'draft' && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#dbeafe',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#1e40af',
                textAlign: 'center'
              }}>
                <i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>
                <strong>Draft saved.</strong> {lastSaved && `Last saved: ${new Date(lastSaved).toLocaleString()}`}
              </div>
            )}

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '1.2rem', color: '#2f506a' }}>Loading...</div>
              </div>
            ) : (
              <>
                {/* Info message for users */}
                {isLoggedIn ? (
                  <div style={{
                    marginBottom: '2rem',
                    padding: '1rem',
                    backgroundColor: '#d1ecf1',
                    border: '1px solid #bee5eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    color: '#0c5460'
                  }}>
                    <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }}></i>
                    Your personal information has been automatically filled from your account. You can edit any fields if needed.
                  </div>
                ) : (
                  <div style={{
                    marginBottom: '2rem',
                    padding: '1rem',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    color: '#856404'
                  }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                    You can fill out this form without an account, or <a href="/register" style={{ color: '#0056b3', textDecoration: 'underline' }}>register first</a> to auto-fill your information and save drafts.
                    <br /><br />
                    <strong>Parents:</strong> If you're applying as a parent/guardian volunteer, please <a href="/register" style={{ color: '#0056b3', textDecoration: 'underline' }}>create a parent account</a> to access event registration and family features.
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Name Fields Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* First Name */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: '#2f506a'
                      }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          outline: 'none',
                          backgroundColor: isLoggedIn && formData.firstName ? '#f8f9fa' : 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: '#2f506a'
                      }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          outline: 'none',
                          backgroundColor: isLoggedIn && formData.lastName ? '#f8f9fa' : 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      color: '#2f506a'
                    }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="example@email.com"
                      pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                      title="Please enter a valid email address"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        backgroundColor: isLoggedIn && formData.email ? '#f8f9fa' : 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  {/* Phone */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      color: '#2f506a'
                    }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="(123) 456-7890"
                      pattern="^[\+]?[1]?[\s\-\.]?[(]?[0-9]{3}[)]?[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4}$"
                      title="Please enter a valid phone number (e.g., (123) 456-7890)"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        backgroundColor: isLoggedIn && formData.phone ? '#f8f9fa' : 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  {/* Grade and School Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* Grade */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: '#2f506a'
                      }}>
                        Grade *
                      </label>
                      <select
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          outline: 'none',
                          backgroundColor: isLoggedIn && formData.grade ? '#f8f9fa' : 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      >
                        <option value="">Select grade...</option>
                        <option value="middleschool">Middle School</option>
                        <option value="9">9th Grade</option>
                        <option value="10">10th Grade</option>
                        <option value="11">11th Grade</option>
                        <option value="12">12th Grade</option>
                        <option value="college">College</option>
                        <option value="adult">Adult</option>
                      </select>
                    </div>

                    {/* School */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: '#2f506a'
                      }}>
                        School/Organization *
                      </label>
                      <input
                        type="text"
                        name="school"
                        value={formData.school}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Great Valley High School, Penn State, etc."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          outline: 'none',
                          backgroundColor: isLoggedIn && formData.school ? '#f8f9fa' : 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  </div>

                  {/* Preferred Contact Method */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: '#2f506a'
                }}>
                  Preferred Contact Methods for Alerts (Select all that apply) *
                </label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {['Email', 'Phone', 'Other'].map((option) => (
                    <label key={option} style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.preferredContact.includes(option.toLowerCase())}
                        onChange={() => handlePreferredContactChange(option.toLowerCase())}
                        style={{
                          marginRight: '0.5rem',
                          transform: 'scale(1.2)'
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>

                {formData.preferredContact.length === 0 && (
                  <p style={{ color: '#e53e3e', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Please select at least one contact method.
                  </p>
                )}

                {/* Other contact method text box */}
                {formData.preferredContact.includes('other') && (
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      color: '#2f506a'
                    }}>
                      Please specify your other contact method *
                    </label>
                    <input
                      type="text"
                      name="preferredContactOther"
                      value={formData.preferredContactOther}
                      onChange={handleInputChange}
                      required={formData.preferredContact.includes('other')}
                      placeholder="e.g., Text message, Discord, Slack, etc."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                )}
              </div>

              {/* Team Selection - Multi-select */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  color: '#2f506a'
                }}>
                  Which teams would you like to join? (Select all that apply) *
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '0.75rem',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  {categories.map((category) => {
                    const categoryValue = category.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <label key={category} style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        backgroundColor: formData.selectedCategories.includes(categoryValue) ? '#e1f5fe' : 'white',
                        border: `2px solid ${formData.selectedCategories.includes(categoryValue) ? '#4a7ca3' : '#e5e7eb'}`,
                        transition: 'all 0.2s ease'
                      }}>
                        <input
                          type="checkbox"
                          checked={formData.selectedCategories.includes(categoryValue)}
                          onChange={() => handleCategoryChange(categoryValue)}
                          style={{
                            marginRight: '0.75rem',
                            transform: 'scale(1.2)'
                          }}
                        />
                        <span style={{ fontWeight: formData.selectedCategories.includes(categoryValue) ? 'bold' : 'normal' }}>
                          {category}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {formData.selectedCategories.length === 0 && (
                  <p style={{ color: '#e53e3e', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Please select at least one team.
                  </p>
                )}
              </div>

              {/* Motivation */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: '#2f506a'
                }}>
                  Why do you want to join Kids in Motion? *
                </label>
                <textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Tell us what motivates you to volunteer with Kids in Motion..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Dynamic Questions Based on Selected Teams */}
              {formData.selectedCategories.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#2f506a',
                    marginBottom: '1rem',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '0.5rem'
                  }}>
                    Team-Specific Questions
                  </h3>
                  {formData.selectedCategories.map((category) => (
                    <div key={category} style={{ marginBottom: '1.5rem' }}>
                      <label style={{
                        display: 'block',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: '#2f506a',
                        fontSize: '1.1rem'
                      }}>
                        {categories.find(cat => cat.toLowerCase().replace(/\s+/g, '-') === category)} Team: *
                      </label>
                      <p style={{
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        fontStyle: 'italic'
                      }}>
                        {dynamicQuestions[category]}
                        <span style={{ color: '#2f506a', fontWeight: 'bold', fontStyle: 'normal' }}>
                          {' '}(Max {getWordLimit(category)} words)
                        </span>
                      </p>
                      <textarea
                        value={formData.dynamicAnswers[category] || ''}
                        onChange={(e) => {
                          const words = countWords(e.target.value);
                          const limit = getWordLimit(category);
                          if (words <= limit) {
                            handleDynamicAnswerChange(category, e.target.value);
                          }
                        }}
                        required
                        rows={category === 'new-sport' ? 6 : 3}
                        placeholder="Please provide your answer here..."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '0.5rem',
                        fontSize: '0.9rem'
                      }}>
                        <span style={{
                          color: countWords(formData.dynamicAnswers[category] || '') > getWordLimit(category) ? '#e53e3e' : '#6b7280'
                        }}>
                          {countWords(formData.dynamicAnswers[category] || '')} / {getWordLimit(category)} words
                        </span>
                        {countWords(formData.dynamicAnswers[category] || '') > getWordLimit(category) && (
                          <span style={{ color: '#e53e3e', fontSize: '0.8rem' }}>
                            Exceeds word limit
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Portfolio Upload for Social Media and Website Teams */}
                  {(formData.selectedCategories.includes('social-media-team') || formData.selectedCategories.includes('website-team')) && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{
                        display: 'block',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: '#2f506a'
                      }}>
                        Portfolio (Optional)
                      </label>
                      <p style={{
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem'
                      }}>
                        Share a link to your portfolio, GitHub, social media work, or any relevant examples. You can also mention you'll email a ZIP file.
                      </p>
                      <input
                        type="text"
                        name="portfolioLink"
                        value={formData.portfolioLink || ''}
                        onChange={handleInputChange}
                        placeholder="https://yourportfolio.com or 'Will email files separately'"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Resume Upload Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#2f506a',
                  marginBottom: '1rem',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '0.5rem'
                }}>
                  Resume (Optional)
                </h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: '#2f506a'
                  }}>
                    Upload Resume or Provide Link
                  </label>
                  <p style={{
                    color: '#6b7280',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    You can share a link to your resume (Google Drive, Dropbox, etc.) or mention that you'll email it separately.
                  </p>
                  <input
                    type="text"
                    name="resume"
                    value={formData.resume || ''}
                    onChange={handleInputChange}
                    placeholder="https://drive.google.com/... or 'Will email resume separately'"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4a7ca3'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #0ea5e9',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    color: '#0c4a6e'
                  }}>
                    <i className="fas fa-envelope" style={{ marginRight: '0.5rem' }}></i>
                    <strong>Email resumes to:</strong> <a href="mailto:kidsinmotion0@gmail.com" style={{ color: '#0369a1', textDecoration: 'underline' }}>kidsinmotion0@gmail.com</a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      padding: '1rem 2rem',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      flex: '1',
                      minWidth: '200px',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
                  >
                    <i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>
                    Save Draft
                  </button>
                )}
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#4a7ca3',
                    color: 'white',
                    padding: '1rem 2rem',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    flex: '2',
                    minWidth: '200px',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2f506a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#4a7ca3'}
                >
                  <i className="fas fa-paper-plane" style={{ marginRight: '0.5rem' }}></i>
                  {isEditing ? 'Update Application' : 'Submit Application'}
                </button>
              </div>

              {/* Auto-save notice for logged in users */}
              {isLoggedIn && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  <i className="fas fa-clock" style={{ marginRight: '0.5rem' }}></i>
                  Your progress is automatically saved every 30 seconds
                </div>
              )}
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Custom Notification Modal */}
      {showNotification && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={closeNotification}
        >
          <div
            style={{
              width: '90%',
              maxWidth: '500px',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              animation: 'slideInUp 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                margin: '0 auto 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                backgroundColor: notificationType === 'success' ? '#ecfdf5' :
                                notificationType === 'error' ? '#fef2f2' : '#f0f9ff',
                color: notificationType === 'success' ? '#10b981' :
                       notificationType === 'error' ? '#ef4444' : '#3b82f6'
              }}
            >
              <i className={`fas ${
                notificationType === 'success' ? 'fa-check' :
                notificationType === 'error' ? 'fa-exclamation-triangle' : 'fa-info'
              }`}></i>
            </div>

            <h3 style={{
              margin: '0 0 1rem 0',
              color: '#1f2937',
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              {notificationType === 'success' ? 'Success!' :
               notificationType === 'error' ? 'Validation Error' : 'Information'}
            </h3>

            <p style={{
              margin: '0 0 2rem 0',
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              {notificationMessage}
            </p>

            <button
              onClick={closeNotification}
              style={{
                backgroundColor: notificationType === 'success' ? '#10b981' :
                                 notificationType === 'error' ? '#ef4444' : '#3b82f6',
                color: 'white',
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.9';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              OK
            </button>

            {/* Close X button */}
            <button
              onClick={closeNotification}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                color: '#9ca3af',
                cursor: 'pointer',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.color = '#6b7280';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#9ca3af';
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default VolunteerApplication;