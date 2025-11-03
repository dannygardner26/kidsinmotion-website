import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { apiService } from '../services/api';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';


const APPLICATION_STORE_KEY = 'volunteer_applications_global';

const readGlobalApplications = () => {
  try {
    return JSON.parse(localStorage.getItem(APPLICATION_STORE_KEY) || '{}');
  } catch (error) {
    console.error('Failed to parse global applications store:', error);
    return {};
  }
};

const writeGlobalApplications = (applications) => {
  localStorage.setItem(APPLICATION_STORE_KEY, JSON.stringify(applications));
};

const VOLUNTEER_APPLICATIONS_COLLECTION = 'volunteerApplications';

const getApplicationDocRef = (uid) => doc(db, VOLUNTEER_APPLICATIONS_COLLECTION, uid);

const FIRESTORE_ENABLED = process.env.REACT_APP_ENABLE_FIRESTORE_SYNC === 'true';
const syncApplicationCaches = async (uid, data, options = {}) => {
  if (!uid || !data) return;

  // Track that a local update was made
  localStorage.setItem('volunteer_app_last_update', Date.now().toString());

  try {
    localStorage.setItem(`volunteer_draft_${uid}`, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to persist volunteer application draft locally:', error);
  }

  try {
    const globalRecords = readGlobalApplications();
    globalRecords[uid] = data;
    writeGlobalApplications(globalRecords);
  } catch (error) {
    console.error('Failed to update shared volunteer applications store:', error);
  }

  if (FIRESTORE_ENABLED && !options.skipFirestore) {
    try {
      await setDoc(getApplicationDocRef(uid), data, { merge: true });
    } catch (error) {
      console.error('Failed to sync volunteer application to Firestore:', error);
    }
  }
};

const VolunteerApplication = () => {
  const navigate = useNavigate();
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
  const [userProfile, setUserProfile] = useState(null);

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

  const goBackToDashboard = () => {
    navigate('/dashboard');
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
  const saveDraft = async () => {
    if (isLoggedIn) {
      const now = new Date().toISOString();
      const draftStatus = ['approved', 'denied', 'submitted'].includes(applicationStatus) ? applicationStatus : 'draft';
      const draftData = {
        ...formData,
        lastSaved: now,
        lastUpdatedAt: now,
        status: draftStatus
      };

      await syncApplicationCaches(auth.currentUser?.uid, draftData);

      setLastSaved(now);
    }
  };

  // Load existing application or draft
  const getApplicationTimestamp = (data) => {
    if (!data) return 0;
    const fields = ['lastUpdatedAt', 'reviewedAt', 'submittedAt', 'lastSaved'];
    for (const field of fields) {
      if (data[field]) {
        const value = new Date(data[field]).getTime();
        if (!Number.isNaN(value)) {
          return value;
        }
      }
    }
    return 0;
  };

  const normalizeLoadedApplication = (raw = {}) => {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    return {
      ...raw,
      selectedCategories: Array.isArray(raw.selectedCategories) ? raw.selectedCategories : [],
      preferredContact: Array.isArray(raw.preferredContact) ? raw.preferredContact : [],
      dynamicAnswers: raw.dynamicAnswers || {},
      status: raw.status || (raw.submittedAt ? 'submitted' : 'draft'),
      lastSaved: raw.lastSaved || raw.lastUpdatedAt || raw.submittedAt || null,
      lastUpdatedAt: raw.lastUpdatedAt || raw.reviewedAt || raw.submittedAt || raw.lastSaved || null,
      submittedAt: raw.submittedAt || null
    };
  };

  const loadExistingApplication = async (user) => {
    if (!user) {
      setApplicationStatus('new');
      setIsEditing(false);
      return null;
    }

    // **PRIORITY 1: Check backend database first**
    try {
      console.log('Loading volunteer status from backend...');
      const backendStatus = await apiService.getVolunteerStatus();

      if (backendStatus && backendStatus.volunteerEmployeeStatus !== 'NOT_REGISTERED') {
        console.log('Found backend registration:', backendStatus);

        // Map backend status to frontend status
        const statusMapping = {
          'PENDING': 'submitted',
          'APPROVED': 'approved',
          'REJECTED': 'denied',
          'SUSPENDED': 'denied'
        };

        const frontendStatus = statusMapping[backendStatus.volunteerEmployeeStatus] || 'submitted';

        // Populate form fields with backend data (including user information and team applications)
        if (backendStatus.grade || backendStatus.school || backendStatus.motivation || backendStatus.firstName) {
          // Extract team applications data
          const teamApplications = backendStatus.teamApplications || [];
          const selectedCategories = teamApplications.map(ta => ta.teamName.toLowerCase().replace(/\s+/g, '-'));
          const dynamicAnswers = teamApplications.reduce((acc, ta) => {
            const categorySlug = ta.teamName.toLowerCase().replace(/\s+/g, '-');
            acc[categorySlug] = ta.teamSpecificAnswer || '';
            return acc;
          }, {});

          setFormData(prevData => ({
            ...prevData,
            // User information fields
            firstName: backendStatus.firstName || '',
            lastName: backendStatus.lastName || '',
            email: backendStatus.email || '',
            phone: backendStatus.phoneNumber || '',
            resume: backendStatus.resumeLink || '',
            portfolioLink: backendStatus.portfolioLink || '',
            // Volunteer employee fields
            grade: backendStatus.grade || '',
            school: backendStatus.school || '',
            preferredContact: backendStatus.preferredContact ? backendStatus.preferredContact.split(', ') : [],
            motivation: backendStatus.motivation || '',
            skills: backendStatus.skills || '',
            // Team application fields
            selectedCategories,
            dynamicAnswers
          }));
        }

        setApplicationStatus(frontendStatus);
        setLastSaved(backendStatus.registrationDate);
        setIsEditing(true);

        console.log('Using backend data, status:', frontendStatus);
        return { status: frontendStatus, source: 'backend' };
      }
    } catch (error) {
      console.log('Backend status check failed, falling back to local storage:', error);
    }

    // **FALLBACK: Check local storage for drafts**
    const draftKey = `volunteer_draft_${user.uid}`;
    const candidates = [];

    const pushCandidate = (source, raw) => {
      const normalized = normalizeLoadedApplication(raw);
      if (normalized) {
        candidates.push({ source, data: normalized });
      }
    };

    const savedData = localStorage.getItem(draftKey);
    if (savedData) {
      try {
        pushCandidate('local', JSON.parse(savedData));
      } catch (error) {
        console.error('Error parsing saved volunteer application:', error);
      }
    }

    try {
      const globalApplications = readGlobalApplications();
      if (globalApplications[user.uid]) {
        pushCandidate('global', globalApplications[user.uid]);
      }
    } catch (error) {
      console.error('Error loading volunteer application from shared store:', error);
    }

    if (FIRESTORE_ENABLED) {
      try {
        const docSnap = await getDoc(getApplicationDocRef(user.uid));
        if (docSnap.exists()) {
          pushCandidate('firestore', docSnap.data());
        }
      } catch (error) {
        console.error('Error loading volunteer application from Firestore:', error);
      }
    }

    if (candidates.length === 0) {
      setApplicationStatus('new');
      setIsEditing(false);
      return null;
    }

    candidates.sort((a, b) => getApplicationTimestamp(b.data) - getApplicationTimestamp(a.data));
    const { source: latestSource, data: latestData } = candidates[0];

    setFormData({
      firstName: latestData.firstName || '',
      lastName: latestData.lastName || '',
      email: latestData.email || '',
      phone: latestData.phone || '',
      grade: latestData.grade || '',
      school: latestData.school || '',
      preferredContact: latestData.preferredContact || [],
      preferredContactOther: latestData.preferredContactOther || '',
      selectedCategories: latestData.selectedCategories || [],
      motivation: latestData.motivation || '',
      dynamicAnswers: latestData.dynamicAnswers || {},
      resume: latestData.resume || '',
      portfolioLink: latestData.portfolioLink || ''
    });

    const normalizedStatus = latestData.status || 'draft';
    setApplicationStatus(normalizedStatus);
    setLastSaved(latestData.lastSaved || latestData.lastUpdatedAt || null);
    setIsEditing(true);

    await syncApplicationCaches(user.uid, latestData, { skipFirestore: latestSource === 'firestore' });

    return latestData;
  };

  // Auto-fill form data for logged-in users and load existing application
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);

        // First, load any existing application or draft
        const existingData = await loadExistingApplication(user);

        // Only auto-fill if no existing draft was found
        if (!existingData) {
          try {
            // Get user profile data from backend
            await apiService.syncUser();
            const userProfile = await apiService.getCurrentUser();

            if (userProfile) {
              setUserProfile(userProfile); // Store user profile for resume/portfolio reuse
              setFormData(prev => ({
                ...prev,
                firstName: userProfile.firstName || '',
                lastName: userProfile.lastName || '',
                email: user.email || '',
                phone: userProfile.phoneNumber || '',
                grade: userProfile.grade || '',
                school: userProfile.school || '',
                resume: userProfile.resumeLink || '',
                portfolioLink: userProfile.portfolioLink || ''
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
        saveDraft().catch(error => console.error('Auto-save failed:', error));
      }, 30000); // 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [isLoggedIn, formData, applicationStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started');

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
    setIsEditing(true);

    // **PRIORITY 1: Submit to backend API first**
    try {
      const backendData = {
        grade: formData.grade,
        school: formData.school,
        preferredContact: formData.preferredContact.join(', '), // Convert array to string for backend
        motivation: formData.motivation,
        skills: formData.skills,
        // Include profile fields to update user account
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phone,
        resumeLink: formData.resume,
        portfolioLink: formData.portfolioLink
      };

      const response = await apiService.registerVolunteerEmployee(backendData);
      console.log('Backend volunteer employee registration successful:', response);

      // **STEP 2: Apply to each selected team**
      console.log('Selected categories for team applications:', formData.selectedCategories);
      console.log('Dynamic answers:', formData.dynamicAnswers);
      console.log('Available categories:', categories);
      for (const categorySlug of formData.selectedCategories) {
        try {
          console.log(`Processing category slug: ${categorySlug}`);
          const teamName = categories.find(cat => cat.toLowerCase().replace(/\s+/g, '-') === categorySlug);
          console.log(`Found team name: ${teamName}`);
          const teamApplicationData = {
            teamName: teamName,
            teamSpecificAnswer: formData.dynamicAnswers[categorySlug] || ''
          };
          console.log(`Team application data:`, teamApplicationData);

          const teamResponse = await apiService.applyToTeam(teamApplicationData);
          console.log(`Team application successful for ${teamName}:`, teamResponse);
        } catch (teamError) {
          console.error(`Failed to apply to team ${categorySlug}:`, teamError);

          // Extract team name for error message
          const teamDisplayName = categories.find(cat => cat.toLowerCase().replace(/\s+/g, '-') === categorySlug) || categorySlug;
          let teamErrorMessage = `Failed to apply to ${teamDisplayName} team. Please try again.`;

          if (teamError.message) {
            if (teamError.message.includes('already applied')) {
              teamErrorMessage = `You have already applied to the ${teamDisplayName} team.`;
            } else if (teamError.message.includes('not found')) {
              teamErrorMessage = `The ${teamDisplayName} team could not be found. Please refresh and try again.`;
            } else if (teamError.message.includes('validation')) {
              teamErrorMessage = `Invalid application data for ${teamDisplayName} team. Please check your answers.`;
            } else {
              teamErrorMessage = `Error applying to ${teamDisplayName} team: ${teamError.message}`;
            }
          }

          showCustomNotification(teamErrorMessage, 'error');
          return;
        }
      }

      // Backend submission successful - update local status to match
      setApplicationStatus('submitted');
      setLastSaved(new Date().toISOString());

    } catch (error) {
      console.error('Backend submission failed:', error);

      // Try to extract specific error message from backend response
      let errorMessage = 'Failed to submit application to server. Please try again.';

      if (error.message) {
        if (error.message.includes('phone') || error.message.includes('phoneNumber')) {
          errorMessage = 'Phone number is invalid or too long. Please check your phone number format.';
        } else if (error.message.includes('email')) {
          errorMessage = 'Email address is invalid. Please check your email format.';
        } else if (error.message.includes('validation') || error.message.includes('field')) {
          errorMessage = `Validation error: ${error.message}`;
        } else if (error.message.includes('HTTP error! status: 400')) {
          errorMessage = 'Invalid form data. Please check all fields and try again.';
        } else if (error.message.includes('HTTP error! status: 500')) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      showCustomNotification(errorMessage, 'error');
      return; // Don't proceed with local save if backend fails
    }

    // **FALLBACK: Save to local caches as backup**
    if (isLoggedIn) {
      const submittedAt = new Date().toISOString();
      const submittedData = {
        ...formData,
        lastSaved: submittedAt,
        lastUpdatedAt: submittedAt,
        status: 'submitted',
        submittedAt
      };

      try {
        await syncApplicationCaches(auth.currentUser?.uid, submittedData);
        console.log('Local backup save successful');
      } catch (localError) {
        console.error('Local backup save failed:', localError);
        // Don't fail the entire submission for local save issues
      }
    }

    console.log('Form submitted:', formData);

    // Clear feedback viewed status when new application is submitted
    // This will reset the notification state so they get yellow "pending" status
    if (auth.currentUser?.uid) {
      const feedbackViewedKey = `feedback_viewed_${auth.currentUser.uid}`;
      localStorage.removeItem(feedbackViewedKey);
    }

    const message = isEditing
      ? 'Application updated successfully! We\'ll review your changes and get back to you soon.'
      : 'Application submitted successfully! We\'ll review your application and get back to you soon.';

    showCustomNotification(message, 'success');
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      showCustomNotification('Draft saved! You can come back and finish your application later.', 'info');
    } catch (error) {
      console.error('Manual draft save failed:', error);
      showCustomNotification('Unable to save draft right now. Please try again soon.', 'error');
    }
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
          {/* Back Button */}
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={goBackToDashboard}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <i className="fas fa-arrow-left"></i>
              Back to Dashboard
            </button>
          </div>

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

            {applicationStatus === 'approved' && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#dcfce7',
                border: '1px solid #22c55e',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#166534',
                textAlign: 'center'
              }}>
                <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }}></i>
                <strong>Your application was approved.</strong> You can still make updates below and resubmit if you want to pursue additional teams.
              </div>
            )}

            {applicationStatus === 'denied' && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#991b1b',
                textAlign: 'center'
              }}>
                <i className="fas fa-undo" style={{ marginRight: '0.5rem' }}></i>
                <strong>Your application was marked as denied.</strong> Update your answers and resubmit when you're ready for another review.
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
                      pattern="^[^@ ]+@[^@ ]+\.[^@ ]+$"

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
                      placeholder="1234567890"
                      pattern="[0-9]{10}"


                      title="Please enter exactly 10 digits (e.g., 1234567890)"
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
                      {userProfile && userProfile.portfolioLink && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, portfolioLink: userProfile.portfolioLink }))}
                            style={{
                              backgroundColor: '#f3f4f6',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.875rem',
                              color: '#374151',
                              cursor: 'pointer',
                              marginRight: '0.5rem'
                            }}
                          >
                            Reuse Previous: {userProfile.portfolioLink.substring(0, 30)}...
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, portfolioLink: '' }))}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.875rem',
                              color: '#374151',
                              cursor: 'pointer'
                            }}
                          >
                            Enter New
                          </button>
                        </div>
                      )}
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
                  {userProfile && userProfile.resumeLink && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, resume: userProfile.resumeLink }))}
                        style={{
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.875rem',
                          color: '#374151',
                          cursor: 'pointer',
                          marginRight: '0.5rem'
                        }}
                      >
                        Reuse Previous: {userProfile.resumeLink.substring(0, 30)}...
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, resume: '' }))}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.875rem',
                          color: '#374151',
                          cursor: 'pointer'
                        }}
                      >
                        Enter New
                      </button>
                    </div>
                  )}
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
                    <strong>Email resumes to:</strong> <a href="mailto:info@kidsinmotionpa.org" style={{ color: '#0369a1', textDecoration: 'underline' }}>info@kidsinmotionpa.org</a>
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

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {notificationType === 'success' && notificationMessage.includes('successfully') && (
                <button
                  onClick={goBackToDashboard}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
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
                  <i className="fas fa-arrow-left"></i>
                  Back to Dashboard
                </button>
              )}

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
                {notificationType === 'success' && notificationMessage.includes('successfully') ? 'Stay Here' : 'OK'}
              </button>
            </div>

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







