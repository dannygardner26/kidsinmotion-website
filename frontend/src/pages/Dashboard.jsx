import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { assetUrls } from '../utils/firebaseAssets';
import { collection, doc as firestoreDoc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ChildrenManagement from '../components/ChildrenManagement';
import VerificationPrompt from '../components/VerificationPrompt';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    userProfile,
    loading: authLoading,
    isEmailVerified,
    isPhoneVerified,
    sendEmailVerification,
    refreshVerificationStatus
  } = useAuth();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [volunteerEvents, setVolunteerEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null); // Will be set based on user type

  // Admin-specific state
  const [teamAssignmentOverview, setTeamAssignmentOverview] = useState([]);
  const [allChildEvents, setAllChildEvents] = useState([]);

  // Volunteer application state
  const [volunteerApplicationStatus, setVolunteerApplicationStatus] = useState(null);
  const [currentVolunteerApplication, setCurrentVolunteerApplication] = useState(null);

  // Verification state
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const queryParams = new URLSearchParams(location.search);
  const shouldShowVerifyPrompt = queryParams.get('verify') === 'true';
  const verificationRef = useRef(null);

  // Determine user type based on email or role
  const isVolunteer = () => {
    if (!userProfile) return false;

    // Check if user has volunteer role or email suggests volunteer account
    const email = userProfile.email || currentUser?.email || '';

    return email.toLowerCase().includes('volunteer') ||
           userProfile.roles?.includes('ROLE_VOLUNTEER') ||
           userProfile.accountType === 'volunteer' ||
           userProfile.userType === 'VOLUNTEER';
  };

  // Determine if user is Kids in Motion admin
  const isAdmin = () => {
    if (!userProfile) return false;

    const email = userProfile.email || currentUser?.email || '';

    // Admin detection: kidsinmotion emails or specific admin roles
    return email.toLowerCase().includes('kidsinmotion') ||
           userProfile.userType === 'ADMIN' ||
           userProfile.accountType === 'admin';
  };

  // Format team names properly (remove dashes, capitalize)
  const formatTeamName = (teamSlug) => {
    if (!teamSlug) return '';
    const words = teamSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    return words.toLowerCase().endsWith(' team') ? words : `${words} Team`;
  };

  const getTeamDisplayName = (team) => {
    const teamNames = {
      'TEAM_COACH': 'Coach',
      'TEAM_SOCIAL_MEDIA': 'Social Media',
      'TEAM_FUNDRAISING': 'Fundraising',
      'TEAM_EVENT_COORDINATION': 'Event Coordination'
    };
    return teamNames[team] || team.replace('TEAM_', '').replace(/_/g, ' ');
  };

  const readGlobalApplications = () => {
    try {
      return JSON.parse(localStorage.getItem(APPLICATION_STORE_KEY) || '{}');
    } catch (error) {
      console.error('Failed to parse global volunteer applications:', error);
      return {};
    }
  };

  const writeGlobalApplications = (applications) => {
    localStorage.setItem(APPLICATION_STORE_KEY, JSON.stringify(applications));
  };

  const VOLUNTEER_APPLICATIONS_COLLECTION = 'volunteerApplications';
  const APPLICATION_STORE_KEY = 'volunteer_applications_global';

  const getApplicationDocRef = (uid) => {
    // Convert uid to string and validate that it's a valid Firebase document ID
    const docId = String(uid);
    if (!uid || docId.length < 1) {
      throw new Error(`Invalid Firebase document ID: ${uid}`);
    }
    return firestoreDoc(db, VOLUNTEER_APPLICATIONS_COLLECTION, docId);
  };

  const FIRESTORE_ENABLED = process.env.REACT_APP_ENABLE_FIRESTORE_SYNC === 'true';

  const VOLUNTEER_DRAFT_PREFIX = 'volunteer_draft_';

  const getApplicationTimestamp = (record) => {
    if (!record) return 0;
    const fields = ['lastUpdatedAt', 'reviewedAt', 'submittedAt', 'lastSaved'];
    for (const field of fields) {
      if (record[field]) {
        const value = new Date(record[field]).getTime();
        if (!Number.isNaN(value)) {
          return value;
        }
      }
    }
    return 0;
  };

  const normalizeApplicationRecord = (id, raw = {}) => {
    if (!id || !raw || typeof raw !== 'object') {
      return null;
    }

    const selectedCategories = Array.isArray(raw.selectedCategories) ? raw.selectedCategories : [];
    const approvedRoles = Array.isArray(raw.approvedRoles) ? raw.approvedRoles : [];
    const deniedRoles = Array.isArray(raw.deniedRoles) ? raw.deniedRoles : [];
    const derivedStatus = raw.status || (approvedRoles.length
      ? 'approved'
      : (deniedRoles.length && !approvedRoles.length ? 'denied' : (raw.submittedAt ? 'submitted' : 'draft')));
    const submittedAt = raw.submittedAt || raw.lastSaved || null;
    const lastUpdatedAt = raw.lastUpdatedAt || raw.reviewedAt || submittedAt || raw.lastSaved || null;

    return {
      id,
      ...raw,
      status: derivedStatus,
      selectedCategories,
      preferredContact: Array.isArray(raw.preferredContact) ? raw.preferredContact : [],
      dynamicAnswers: raw.dynamicAnswers || {},
      decisionsByRole: raw.decisionsByRole || {},
      approvedRoles,
      deniedRoles,
      applicantName: `${raw.firstName || 'Unknown'} ${raw.lastName || 'Applicant'}`.trim(),
      submittedAt,
      lastUpdatedAt
    };
  };

  const syncApplicationRecordCaches = async (id, data, options = {}) => {
    if (!id || !data) return;

    // Skip Firestore sync for backend applications (numeric IDs)
    const isBackendApplication = typeof id === 'number' || /^\d+$/.test(id);

    if (!isBackendApplication) {
      try {
        localStorage.setItem(`${VOLUNTEER_DRAFT_PREFIX}${id}`, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to cache volunteer application locally:', error);
      }

      try {
        const globalApplications = readGlobalApplications();
        globalApplications[id] = data;
        writeGlobalApplications(globalApplications);
      } catch (error) {
        console.error('Failed to update shared volunteer application store:', error);
      }

      if (FIRESTORE_ENABLED && !options.skipFirestore) {
        try {
          await setDoc(getApplicationDocRef(id), data, { merge: true });
        } catch (error) {
          console.error('Failed to sync volunteer application to Firestore:', error);
        }
      }
    } else {
      console.log('Skipping local/Firestore sync for backend application:', id);
    }
  };

  const loadVolunteerApplicationById = async (applicantId) => {
    if (!applicantId) return null;

    const candidates = [];
    const pushCandidate = (source, raw) => {
      const normalized = normalizeApplicationRecord(applicantId, raw);
      if (normalized) {
        candidates.push({ source, data: normalized });
      }
    };

    const localKey = `${VOLUNTEER_DRAFT_PREFIX}${applicantId}`;
    const localRaw = localStorage.getItem(localKey);
    if (localRaw) {
      try {
        pushCandidate('local', JSON.parse(localRaw));
      } catch (error) {
        console.error('Failed to parse local volunteer application cache:', error);
      }
    }

    try {
      const globalApplications = readGlobalApplications();
      if (globalApplications[applicantId]) {
        pushCandidate('global', globalApplications[applicantId]);
      }
    } catch (error) {
      console.error('Failed to read shared volunteer application cache:', error);
    }

    if (FIRESTORE_ENABLED) {
      try {
        const docSnap = await getDoc(getApplicationDocRef(applicantId));
        if (docSnap.exists()) {
          pushCandidate('firestore', docSnap.data());
        }
      } catch (error) {
        console.error('Failed to load volunteer application from Firestore:', error);
      }
    }

    if (!candidates.length) {
      return null;
    }

    candidates.sort((a, b) => getApplicationTimestamp(b.data) - getApplicationTimestamp(a.data));
    const { source, data } = candidates[0];

    await syncApplicationRecordCaches(applicantId, data, { skipFirestore: source === 'firestore' });

    return data;
  };

  const buildVolunteerStatusPayload = (record) => {
    if (!record) return null;
    return {
      status: record.status || 'draft',
      submittedAt: record.submittedAt || record.lastUpdatedAt,
      lastUpdatedAt: record.lastUpdatedAt,
      teamSlugs: record.selectedCategories || [],
      teams: (record.selectedCategories || []).map(team => formatTeamName(team)),
      decisionsByRole: record.decisionsByRole || {},
      approvedRoles: record.approvedRoles || [],
      deniedRoles: record.deniedRoles || []
    };
  };


  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelItemId, setCancelItemId] = useState(null);
  const [cancelItemType, setCancelItemType] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  
  useEffect(() => {
    // Redirect if not logged in
    if (!authLoading && !currentUser) {
      navigate('/login');
      return;
    }

    // Fetch user data and registrations when user is available
    if (currentUser && userProfile) {
      fetchUserData();

      // Check if refresh parameter is present and clear it
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('refresh') === 'true') {
        // Clear the refresh parameter from URL
        searchParams.delete('refresh');
        const newUrl = location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
        navigate(newUrl, { replace: true });
      }

      // Handle verify=true parameter to scroll to verification prompt
      if (searchParams.get('verify') === 'true' && verificationRef.current) {
        setTimeout(() => {
          verificationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500); // Delay to ensure component is rendered
      }
    }
  }, [currentUser, userProfile, authLoading, navigate, location]);

  

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const userIsVolunteer = isVolunteer();
      const userIsAdmin = isAdmin();

      if (userIsAdmin) {
        // For admins: fetch volunteer applications and all child events
        await fetchAdminData();

        // Set default tab for admins
        if (!activeTab) setActiveTab('applications');
      } else if (userIsVolunteer) {
        // For volunteers: fetch volunteer activities
        try {
          const volunteersData = await apiService.getMyVolunteerSignups();

          // Enrich volunteer data with full event details
          if (volunteersData && volunteersData.length > 0) {
            try {
              // Extract unique event IDs
              const eventIds = [...new Set(volunteersData.map(v => v.eventId).filter(Boolean))];

              // Fetch all event details in parallel
              const eventPromises = eventIds.map(async (eventId) => {
                try {
                  const event = await apiService.getEvent(eventId);
                  return { eventId, event };
                } catch (error) {
                  console.warn(`Failed to fetch event ${eventId}:`, error.message);
                  return { eventId, event: null };
                }
              });

              const eventResults = await Promise.all(eventPromises);

              // Create event lookup map
              const eventMap = new Map();
              eventResults.forEach(({ eventId, event }) => {
                eventMap.set(eventId, event);
              });

              // Enrich volunteer data with event details
              const enrichedVolunteersData = volunteersData.map(volunteer => {
                const event = eventMap.get(volunteer.eventId);

                if (event) {
                  return {
                    ...volunteer,
                    event: event
                  };
                } else {
                  // Fallback for missing event details
                  return {
                    ...volunteer,
                    event: {
                      title: volunteer.eventName || 'Unknown Event',
                      startDate: volunteer.eventDate || null,
                      endDate: volunteer.eventDate || null,
                      location: 'Location TBD'
                    }
                  };
                }
              });

              setVolunteerEvents(enrichedVolunteersData);
            } catch (enrichmentError) {
              console.error('Error enriching volunteer data:', enrichmentError);
              // Fallback: use original data with basic event objects
              const fallbackData = volunteersData.map(volunteer => ({
                ...volunteer,
                event: {
                  title: volunteer.eventName || 'Unknown Event',
                  startDate: volunteer.eventDate || null,
                  endDate: volunteer.eventDate || null,
                  location: 'Location TBD'
                }
              }));
              setVolunteerEvents(fallbackData);
            }
          } else {
            setVolunteerEvents([]);
          }
        } catch (error) {
          console.log('No volunteer activities found:', error.message);
          setVolunteerEvents([]);
        }

        // Set default tab for volunteers
        if (!activeTab) {
          setActiveTab('volunteer');
        }
      } else {
        // For parents: fetch child registrations
        try {
          const registrationsData = await apiService.getMyRegistrations();
          setRegisteredEvents(registrationsData);
        } catch (error) {
          console.log('No registrations found:', error.message);
          setRegisteredEvents([]);
        }

        // Set default tab for parents
        if (!activeTab) setActiveTab('children');
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      // For test admin, use backend API instead of Firestore
      const isTestAdmin = localStorage.getItem('isTestAdmin') === 'true';

      if (isTestAdmin) {
        // Fetch users for team assignment overview
        try {
          const allUsers = await apiService.getAllUsers();
          console.log('Loaded all users for team management:', allUsers);

          // Set team assignment overview with users who have team assignments
          setTeamAssignmentOverview(allUsers.filter(user => user.teams && user.teams.length > 0));

          // Clear old volunteer applications state (no longer used)
          setVolunteerApplications([]);
        } catch (backendError) {
          console.error('Failed to load users from backend:', backendError);
          setTeamAssignmentOverview([]);
        }
      } else {
        // Regular user - clear team assignment overview
        setTeamAssignmentOverview([]);
      }

      // Fetch all child events/registrations
      try {
        const allRegistrations = await apiService.getMyRegistrations(); // This would be getAllRegistrations for admin
        setAllChildEvents(allRegistrations);
      } catch (error) {
        console.log('No child events found:', error.message);
        setAllChildEvents([]);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const loadAllVolunteerApplications = async () => {
    const applicationsMap = new Map();

    const upsertRecord = (id, raw, source) => {
      const normalized = normalizeApplicationRecord(id, raw);
      if (!normalized) return;

      const existing = applicationsMap.get(id);
      if (!existing || getApplicationTimestamp(normalized) > getApplicationTimestamp(existing.record)) {
        applicationsMap.set(id, { record: normalized, source });
      }
    };

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(VOLUNTEER_DRAFT_PREFIX)) {
          const applicantId = key.replace(VOLUNTEER_DRAFT_PREFIX, '');
          try {
            const raw = JSON.parse(localStorage.getItem(key));
            upsertRecord(applicantId, raw, 'local');
          } catch (error) {
            console.error('Failed to parse volunteer application from localStorage:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error iterating volunteer applications in localStorage:', error);
    }

    try {
      const globalApplications = readGlobalApplications();
      Object.entries(globalApplications).forEach(([applicantId, raw]) => {
        upsertRecord(applicantId, raw, 'shared');
      });
    } catch (error) {
      console.error('Error reading global volunteer applications store:', error);
    }

    if (FIRESTORE_ENABLED) {
      try {
        const snapshot = await getDocs(collection(db, VOLUNTEER_APPLICATIONS_COLLECTION));
        snapshot.forEach((docSnap) => {
          upsertRecord(docSnap.id, docSnap.data(), 'firestore');
        });
      } catch (error) {
        console.error('Error loading volunteer applications from Firestore:', error);
      }
    }

    const mergedRecords = Array.from(applicationsMap.entries())
      .map(([id, payload]) => ({
        id,
        record: payload.record,
        source: payload.source
      }))
      .sort((a, b) => getApplicationTimestamp(b.record) - getApplicationTimestamp(a.record));

    await Promise.all(mergedRecords.map(({ id, record, source }) =>
      syncApplicationRecordCaches(id, record, { skipFirestore: source === 'firestore' })
    ));

    return mergedRecords.map(({ record }) => record);
  };



  const handleVolunteerEmployeeStatusUpdate = async (status, adminNotes = '') => {
    try {
      if (!selectedApplication?.id) {
        console.error('No application selected');
        return;
      }

      await apiService.updateVolunteerEmployeeStatus(selectedApplication.id, status, adminNotes);

      // Update the local application data
      setSelectedApplication(prev => ({
        ...prev,
        status: status.toLowerCase()
      }));

      // Refresh the volunteer applications list
      await fetchAdminData();

      console.log(`Volunteer employee status updated to ${status}`);
    } catch (error) {
      console.error('Failed to update volunteer employee status:', error);
    }
  };

  const buildDecisionSummary = (decisions, teams) => {
    const approvedRoles = teams.filter(team => decisions[team] === 'approved');
    const deniedRoles = teams.filter(team => decisions[team] === 'denied');
    const pendingRoles = teams.filter(team => !decisions[team] || decisions[team] === 'pending');

    const summaryLines = [
      `Approved: ${approvedRoles.length ? approvedRoles.map(formatTeamName).join(', ') : 'None'}`
    ];
    summaryLines.push(`Denied: ${deniedRoles.length ? deniedRoles.map(formatTeamName).join(', ') : 'None'}`);

    if (pendingRoles.length) {
      summaryLines.push(`Pending: ${pendingRoles.map(formatTeamName).join(', ')}`);
    }

    return { approvedRoles, deniedRoles, pendingRoles, summaryLines };
  };

  const markFeedbackAsViewed = () => {
    if (currentUser?.uid) {
      const feedbackViewedKey = `feedback_viewed_${currentUser.uid}`;
      localStorage.setItem(feedbackViewedKey, 'true');

      // Update the volunteer status to remove the submission-update state
      setVolunteerApplicationStatus(prev => prev ? {
        ...prev,
        status: prev.allHaveFeedback ? 'completed' : 'submitted', // Show 'completed' if all feedback received
        hasViewedFeedback: true
      } : null);
    }
  };

  const clearFeedbackViewed = () => {
    if (currentUser?.uid) {
      const feedbackViewedKey = `feedback_viewed_${currentUser.uid}`;
      localStorage.removeItem(feedbackViewedKey);
    }
  };

  const sendInboxMessageWithFallback = async (userId, message) => {
    try {
      await apiService.sendMessage(userId, message);
    } catch (error) {
      console.error('Error sending inbox message, using localStorage fallback:', error);
      const fallbackMessages = JSON.parse(localStorage.getItem(`inbox_${userId}`) || '[]');
      fallbackMessages.unshift(message);
      localStorage.setItem(`inbox_${userId}`, JSON.stringify(fallbackMessages));
    }
  };

  const recordContactNotification = (userId, notification) => {
    const key = `contact_notifications_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift({
      id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...notification
    });
    localStorage.setItem(key, JSON.stringify(existing));
  };

  const sendPreferredContactNotifications = (application, payload) => {
    const preferred = Array.isArray(application?.preferredContact) && application.preferredContact.length > 0
      ? application.preferredContact
      : ['email'];

    preferred.forEach(method => {
      const normalizedMethod = method.toLowerCase();
      let destination = null;
      if (normalizedMethod === 'email') {
        destination = application.email || application.username || '';
      } else if (normalizedMethod === 'phone') {
        destination = application.phone || application.phoneNumber || '';
      } else if (normalizedMethod === 'other') {
        destination = application.preferredContactOther || '';
      }

      recordContactNotification(application.id, {
        method: normalizedMethod,
        destination: destination || 'not-provided',
        summary: payload.summary,
        message: payload.message,
        note: payload.note
      });

      console.log(`Queued ${normalizedMethod} notification for ${application.id} (${destination || 'n/a'})`);
    });
  };

  const handleSubmitApplicationDecision = async () => {
    if (!selectedApplication) return;

    const appliedTeams = selectedApplication.selectedCategories || [];
    if (appliedTeams.length === 0) {
      setDecisionError('This application does not list any roles to review.');
      return;
    }

    const undecided = appliedTeams.filter(team => !['approved', 'denied'].includes(roleDecisions[team]));
    if (undecided.length > 0) {
      setDecisionError('Please choose approve or deny for every applied role.');
      return;
    }

    setDecisionError('');
    setDecisionSubmitting(true);

    try {
      const { approvedRoles, deniedRoles, summaryLines } = buildDecisionSummary(roleDecisions, appliedTeams);
      const summaryText = summaryLines.join('\n');
      const noteText = adminResponseNote.trim();
      const reviewTimestamp = new Date().toISOString();

      const messageTitle = 'Volunteer Application Review Update';

      
      const messageBodyLines = [
        `Hello ${selectedApplication.firstName || selectedApplication.applicantName || 'there'},`,
        '',
        'Here is the update from the Kids in Motion admin team regarding your volunteer application:',
        summaryText
      ];

      if (noteText) {
        messageBodyLines.push('', `Note from the team: ${noteText}`);
      }

      messageBodyLines.push('', 'Thank you for applying and supporting Kids in Motion!');
      const messageBody = messageBodyLines.join('\n');

      const existingRecord = await loadVolunteerApplicationById(selectedApplication.id) || selectedApplication;

      const decisionStatus = approvedRoles.length > 0 ? 'approved' : 'denied';
      const updatedApplication = {
        ...existingRecord,
        ...selectedApplication,
        status: decisionStatus,
        reviewedAt: reviewTimestamp,
        lastUpdatedAt: reviewTimestamp,
        adminNote: noteText,
        decisionsByRole: roleDecisions,
        decisionSummary: summaryText,
        approvedRoles,
        deniedRoles
      };

      const normalizedUpdatedApplication = normalizeApplicationRecord(selectedApplication.id, updatedApplication) || updatedApplication;

      await syncApplicationRecordCaches(selectedApplication.id, normalizedUpdatedApplication);

      setVolunteerApplications(prev => {
        const exists = prev.some(app => app.id === selectedApplication.id);
        if (exists) {
          return prev.map(app =>
            app.id === selectedApplication.id ? normalizedUpdatedApplication : app
          );
        }
        return [...prev, normalizedUpdatedApplication];
      });

      if (currentVolunteerApplication?.id === selectedApplication.id) {
        setCurrentVolunteerApplication(normalizedUpdatedApplication);
        const refreshedStatus = buildVolunteerStatusPayload(normalizedUpdatedApplication);
        if (refreshedStatus) {
          setVolunteerApplicationStatus(refreshedStatus);
        }
      }


      const message = {
        id: `decision_${Date.now()}_${selectedApplication.id}`,
        type: 'admin',
        title: messageTitle,
        message: messageBody,
        from: 'Kids in Motion Admin',
        timestamp: reviewTimestamp,
        read: false,
        isSystem: true
      };

      await sendInboxMessageWithFallback(selectedApplication.id, message);

      sendPreferredContactNotifications(selectedApplication, {
        summary: summaryText,
        message: messageBody,
        note: noteText
      });

      setDecisionSubmitting(false);
      closeApplicationModal();
    } catch (error) {
      console.error('Error finalizing application decision:', error);
      setDecisionError('Failed to submit the decision. Please try again.');
      setDecisionSubmitting(false);
    }
  };

  const openCancelModal = (id, type) => {
    setCancelItemId(id);
    setCancelItemType(type);
    setShowConfirmModal(true);
  };
  
  const closeCancelModal = () => {
    setShowConfirmModal(false);
    setCancelItemId(null);
    setCancelItemType(null);
  };

  const startEditingProfile = () => {
    setEditProfileData({
      firstName: userProfile?.firstName || '',
      lastName: userProfile?.lastName || '',
      phoneNumber: (userProfile?.phoneNumber && typeof userProfile.phoneNumber === 'string' && userProfile.phoneNumber.trim().toLowerCase() !== 'pending') ? userProfile.phoneNumber : ''
    });
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setIsEditingProfile(false);
    setEditProfileData({
      firstName: '',
      lastName: '',
      phoneNumber: ''
    });
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setEditProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfileChanges = async () => {
    try {
      setProfileUpdateLoading(true);
      await apiService.updateUserProfile(editProfileData);

      // Refresh user profile data
      window.location.reload(); // Simple reload to refresh all user data

    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile: ' + error.message);
    } finally {
      setProfileUpdateLoading(false);
    }
  };
  
  const handleCancelRegistration = async () => {
    if (!cancelItemId || cancelItemType !== 'registration') return;
    
    try {
      await apiService.cancelRegistration(cancelItemId);
      
      // Update registrations list
      setRegisteredEvents(registeredEvents.filter(reg => reg.id !== cancelItemId));
      closeCancelModal();
      
    } catch (error) {
      console.error('Error canceling registration:', error);
      alert('Failed to cancel registration. Please try again.');
    }
  };
  
  const handleCancelVolunteer = async () => {
    if (!cancelItemId || cancelItemType !== 'volunteer') return;
    
    try {
      await apiService.cancelVolunteerSignup(cancelItemId);
      
      // Update volunteer list
      setVolunteerEvents(volunteerEvents.filter(vol => vol.id !== cancelItemId));
      closeCancelModal();
      
    } catch (error) {
      console.error('Error canceling volunteer sign-up:', error);
      alert('Failed to cancel volunteer sign-up. Please try again.');
    }
  };
  
  const handleConfirmCancel = () => {
    if (cancelItemType === 'registration') {
      handleCancelRegistration();
    } else if (cancelItemType === 'volunteer') {
      handleCancelVolunteer();
    } else if (cancelItemType === 'event-registrations') {
      handleCancelEventRegistrations();
    }
  };

  const handleCancelEventRegistrations = async () => {
    if (!cancelItemId) return;

    try {
      // Find all registrations for this event
      const eventRegistrations = registeredEvents.filter(reg =>
        (reg.event?.id || reg.eventId) === cancelItemId
      );

      // Cancel each registration
      for (const registration of eventRegistrations) {
        await apiService.cancelRegistration(registration.id);
      }

      // Update registrations list
      setRegisteredEvents(registeredEvents.filter(reg =>
        (reg.event?.id || reg.eventId) !== cancelItemId
      ));
      closeCancelModal();

    } catch (error) {
      console.error('Error canceling event registrations:', error);
      alert('Failed to cancel registrations. Please try again.');
    }
  };

  const handleEditRegistration = (eventGroup) => {
    // Navigate to event registration page in edit mode
    navigate(`/events/${eventGroup.eventId}/register`, {
      state: {
        editMode: true,
        registrations: eventGroup.children
      }
    });
  };

  const handleDeleteAllRegistrations = (eventGroup) => {
    // Set up modal for confirming deletion of all registrations for this event
    setCancelItemId(eventGroup.eventId);
    setCancelItemType('event-registrations');
    setShowConfirmModal(true);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // No longer using team applications - set to empty defaults
  const appliedTeamsForDecision = [];
  const volunteerTeamSlugs = [];
  const approvedRolesPreview = [];
  const deniedRolesPreview = [];
  const pendingRolesPreview = [];

  if (authLoading || isLoading) {
    return (
      <>
        <div className="container mt-4">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <div className="container mt-4">
          <div className="card error-card">
            <div className="card-body text-center">
              <div className="error-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2>Error</h2>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <section className="hero" style={{ minHeight: '30vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-bg" style={{ backgroundImage: `url("${assetUrls['placeholder.png']}")` }}></div>
        
        <div className="container hero-content">
          <h1>Welcome, {userProfile?.firstName || userProfile?.name || currentUser?.displayName?.split(' ')[0] || currentUser?.displayName || 'User'}!</h1>
          <p>{isAdmin()
            ? "Manage volunteer registrations, review submissions, and oversee all Kids in Motion programs."
            : isVolunteer()
            ? "Manage your volunteer activities and view your team assignments."
            : "Discover amazing sports programs and register your kids for upcoming events."
          }</p>
        </div>
        
        <div className="hero-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path
              fill="#ede9e7"
              fillOpacity="1"
              d="M0,64L60,58.7C120,53,240,43,360,48C480,53,600,75,720,75C840,75,960,53,1080,48C1200,43,1320,53,1380,58.7L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Verification Banner */}
      {currentUser && (!isEmailVerified && !isPhoneVerified) && (
        <div className="container mt-4" ref={verificationRef}>
          <VerificationPrompt
            isEmailVerified={isEmailVerified}
            isPhoneVerified={isPhoneVerified}
            userEmail={currentUser.email}
            userPhone={userProfile?.phoneNumber}
            onClose={() => setShowVerificationPrompt(false)}
          />
        </div>
      )}

      <div className="container mt-4 mb-5">
        <div className="row">
          <div className="col-third">
            <div className="card profile-card mb-4 ">
              <div className="card-header">
                <h3>Your Profile</h3>
              </div>
              <div className="card-body">
                <div className="profile-avatar">
                  {userProfile?.firstName?.charAt(0) || currentUser?.displayName?.charAt(0) || 'U'}{userProfile?.lastName?.charAt(0) || ''}
                </div>
                <div className="profile-info">
                  {!isEditingProfile ? (
                    <>
                      <p><strong>Name:</strong> {userProfile?.firstName || ''} {userProfile?.lastName || currentUser?.displayName || ''}</p>
                      <p><strong>Email:</strong> {userProfile?.email || currentUser?.email}</p>
                      <p><strong>Phone:</strong> {(userProfile?.phoneNumber && typeof userProfile.phoneNumber === 'string' && userProfile.phoneNumber.trim().toLowerCase() !== 'pending') ? userProfile.phoneNumber : 'Not provided'}</p>
                    </>
                  ) : (
                    <div className="edit-profile-form">
                      <div className="form-group">
                        <label><strong>First Name:</strong></label>
                        <input
                          type="text"
                          name="firstName"
                          value={editProfileData.firstName}
                          onChange={handleProfileInputChange}
                          className="form-control"
                          placeholder="First Name"
                        />
                      </div>
                      <div className="form-group">
                        <label><strong>Last Name:</strong></label>
                        <input
                          type="text"
                          name="lastName"
                          value={editProfileData.lastName}
                          onChange={handleProfileInputChange}
                          className="form-control"
                          placeholder="Last Name"
                        />
                      </div>
                      <div className="form-group">
                        <label><strong>Phone:</strong></label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={editProfileData.phoneNumber}
                          onChange={handleProfileInputChange}
                          className="form-control"
                          placeholder="Phone Number"
                        />
                      </div>
                      <p><strong>Email:</strong> {userProfile?.email || currentUser?.email} <small>(cannot be changed)</small></p>
                    </div>
                  )}
                </div>
                {!isEditingProfile ? (
                  <button onClick={startEditingProfile} className="btn btn-outline btn-block mt-3">
                    <i className="fas fa-user-edit mr-2"></i> Edit Profile
                  </button>
                ) : (
                  <div className="edit-profile-actions">
                    <button
                      onClick={saveProfileChanges}
                      className="btn btn-primary btn-block mt-3"
                      disabled={profileUpdateLoading}
                    >
                      {profileUpdateLoading ? (
                        <>
                          <div className="loading-spinner-small"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i> Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelEditingProfile}
                      className="btn btn-outline btn-block mt-2"
                      disabled={profileUpdateLoading}
                    >
                      <i className="fas fa-times mr-2"></i> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card mb-4 ">
              <div className="card-header">
                <h3>Quick Links</h3>
              </div>
              <div className="card-body">
                <div className="quick-links">
                  <Link to="/events" className="quick-link-item">
                    <div className="quick-link-icon">
                      <i className="fas fa-calendar-alt"></i>
                    </div>
                    <div className="quick-link-text">Browse Events</div>
                  </Link>

                  <Link to="/about" className="quick-link-item">
                    <div className="quick-link-icon" style={{ backgroundColor: 'var(--secondary)' }}>
                      <i className="fas fa-info-circle"></i>
                    </div>
                    <div className="quick-link-text">About Programs</div>
                  </Link>

                  <a href="https://account.venmo.com/u/ryanspiess22" target="_blank" rel="noopener noreferrer" className="quick-link-item">
                    <div className="quick-link-icon" style={{ backgroundColor: '#28a745' }}><i className="fas fa-donate"></i>
                    </div>
                    <div className="quick-link-text">Support Kids</div>
                  </a>

                </div>
              </div>
            </div>
          </div>
          
          <div className="col-two-thirds">
            <div className="card activities-card ">
              <div className="card-header tab-header">
                <ul className="nav-tabs">
                  {isAdmin() && (
                    <>
                      <li
                        className={`nav-tab ${activeTab === 'applications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('applications')}
                      >
                        <i className="fas fa-clipboard-list mr-2"></i>
                        Volunteer Management
                      </li>
                      <li
                        className={`nav-tab ${activeTab === 'child-events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('child-events')}
                      >
                        <i className="fas fa-child mr-2"></i>
                        Child Events
                      </li>
                    </>
                  )}
                  {!isVolunteer() && !isAdmin() && (
                    <>
                      <li
                        className={`nav-tab ${activeTab === 'children' ? 'active' : ''}`}
                        onClick={() => setActiveTab('children')}
                      >
                        <i className="fas fa-users mr-2"></i>
                        My Children
                      </li>
                      <li
                        className={`nav-tab ${activeTab === 'registrations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('registrations')}
                      >
                        <i className="fas fa-calendar mr-2"></i>
                        Event Registrations
                      </li>
                    </>
                  )}
                  {isVolunteer() && !isAdmin() && (
                    <>
                      <li
                        className={`nav-tab ${activeTab === 'volunteer' ? 'active' : ''}`}
                        onClick={() => setActiveTab('volunteer')}
                      >
                        <i className="fas fa-hands-helping mr-2"></i>
                        Your Volunteer Activities
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <div className="card-body">
                {activeTab === 'children' && (
                  <div className="tab-content">
                    <ChildrenManagement />
                  </div>
                )}

                {activeTab === 'registrations' && (
                  <div className="tab-content ">
                    <h2>Your Family's Event Registrations</h2>
                    <div className="mb-3 alert alert-info">
                      <i className="fas fa-info-circle mr-2"></i>
                      <strong>Note:</strong> To register for events, please first add your children's information in the "My Children" tab above.
                    </div>

                    {registeredEvents.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-calendar-times"></i>
                        </div>
                        <p>You haven't registered any children for events yet.</p>
                        <Link to="/events" className="btn btn-primary mt-3">Browse Events</Link>
                      </div>
                    ) : (
                      <div className="events-grid">
                        {(() => {
                          // Group registrations by event ID
                          const eventGroups = registeredEvents.reduce((groups, registration) => {
                            const eventId = registration.event?.id || registration.eventId;
                            if (!groups[eventId]) {
                              groups[eventId] = {
                                event: registration.event,
                                eventId: eventId,
                                children: []
                              };
                            }
                            groups[eventId].children.push(registration);
                            return groups;
                          }, {});

                          return Object.values(eventGroups).map(eventGroup => {
                            const isPast = new Date(eventGroup.event?.endDate) < new Date();
                            const childrenCount = eventGroup.children.length;

                            return (
                              <div className="event-card-container" key={eventGroup.eventId}>
                                <div className={`event-card enhanced-card ${isPast ? 'past-event' : ''}`}>
                                  <div className="event-date">
                                    <div className="date-month">
                                      {formatMonth(eventGroup.event?.startDate)}
                                    </div>
                                    <div className="date-day">
                                      {formatDay(eventGroup.event?.startDate)}
                                    </div>
                                  </div>
                                  <div className="event-details">
                                    <h4 className="event-title">{eventGroup.event?.title || 'Unknown Event'}</h4>

                                    <div className="children-section">
                                      <div className="children-header">
                                        <i className="fas fa-users mr-1"></i>
                                        <span className="children-count">{childrenCount} {childrenCount === 1 ? 'Child' : 'Children'} Registered</span>
                                      </div>
                                      <div className="children-list">
                                        {eventGroup.children.map((child, index) => (
                                          <div key={child.id} className="child-item">
                                            <span className="child-name">{child.childFirstName} {child.childLastName}</span>
                                            {child.childAge && <span className="child-age">Age {child.childAge}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="event-info">
                                      <div className="event-location">
                                        <i className="fas fa-map-marker-alt mr-1"></i>
                                        {eventGroup.event?.location || 'Location TBD'}
                                      </div>
                                      {eventGroup.event?.price && (
                                        <div className="event-price">
                                          <i className="fas fa-dollar-sign mr-1"></i>
                                          ${eventGroup.event.price} per child
                                        </div>
                                      )}
                                    </div>

                                    <div className="event-status">
                                      {isPast ? (
                                        <span className="status-badge completed">Completed</span>
                                      ) : (
                                        <span className="status-badge upcoming">Upcoming</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="event-actions">
                                    <Link
                                      to={`/events/${eventGroup.eventId}/parent-view`}
                                      className="action-btn view-btn"
                                      title="View Event Dashboard"
                                    >
                                      <i className="fas fa-eye"></i>
                                    </Link>
                                    {!isPast && (
                                      <>
                                        <button
                                          className="action-btn edit-btn"
                                          title="Edit Registration Details"
                                          onClick={() => handleEditRegistration(eventGroup)}
                                        >
                                          <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                          className="action-btn delete-btn"
                                          title="Delete All Registrations for this Event"
                                          onClick={() => handleDeleteAllRegistrations(eventGroup)}
                                        >
                                          <i className="fas fa-trash"></i>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}


                {activeTab === 'volunteer' && (
                  <div className="tab-content">
                    {volunteerEvents.length === 0 ? (
                      <div className="volunteer-welcome-card">
                        <div className="volunteer-icon">
                          <i className="fas fa-hands-helping"></i>
                        </div>
                        <h2>Ready to Make a Difference?</h2>
                        <p className="welcome-message">
                          Your volunteer activities will appear here once you sign up for events.
                          Help us create amazing experiences for kids in our community!
                        </p>
                        <div className="volunteer-benefits">
                          <div className="benefit-item">
                            <i className="fas fa-heart"></i>
                            <span>Make a positive impact</span>
                          </div>
                          <div className="benefit-item">
                            <i className="fas fa-users"></i>
                            <span>Connect with the community</span>
                          </div>
                          <div className="benefit-item">
                            <i className="fas fa-star"></i>
                            <span>Gain valuable experience</span>
                          </div>
                        </div>
                        <div className="volunteer-cta">
                          <a href="/events" className="btn btn-volunteer">
                            <i className="fas fa-calendar-plus mr-2"></i>
                            Browse Events to Volunteer
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="volunteer-activities-section">
                        <div className="section-header">
                          <h2>Your Volunteer Activities</h2>
                          <p className="section-subtitle">Your upcoming volunteer commitments and past experiences</p>
                        </div>
                        <div className="events-grid">
                        {volunteerEvents.map(volunteer => {
                          const isPast = new Date(volunteer.event?.endDate) < new Date();
                          return (
                            <div className="event-card-container" key={volunteer.id}>
                              <div className={`event-card volunteer-card ${isPast ? 'past-event' : ''}`}>
                                <div className="event-date">
                                  <div className="date-month">
                                    {formatMonth(volunteer.event?.startDate)}
                                  </div>
                                  <div className="date-day">
                                    {formatDay(volunteer.event?.startDate)}
                                  </div>
                                </div>
                                <div className="event-details">
                                  <h4 className="event-title">{volunteer.event?.title || 'Unknown Event'}</h4>
                                  <div className="volunteer-role">
                                    Volunteer Role: {volunteer.role || 'General Volunteer'}
                                  </div>
                                  <div className="event-location">
                                    <i className="fas fa-map-marker-alt mr-1"></i> {volunteer.event?.location}
                                  </div>
                                  <div className="event-status">
                                    {isPast ? (
                                      <span className="status-badge completed">Completed</span>
                                    ) : (
                                      <span className={`status-badge ${(volunteer.status || 'submitted').toLowerCase()}`}>
                                        {volunteer.status || 'Submitted'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="event-actions">
                                  <Link
                                    to={`/events/${volunteer.eventId}/volunteer-view`}
                                    className="action-btn view-btn"
                                    title="View Your Volunteer Dashboard"
                                  >
                                    <i className="fas fa-tachometer-alt"></i>
                                  </Link>
                                  
                                  {!isPast && volunteer.status !== 'CANCELED' && (
                                    <button
                                      onClick={() => openCancelModal(volunteer.id, 'volunteer')}
                                      className="action-btn cancel-btn"
                                      title="Cancel Volunteer Signup"
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin: Team Assignment Overview Tab */}
                {activeTab === 'applications' && isAdmin() && (
                  <div className="tab-content">
                    <h2>Team Assignment Overview</h2>
                    <p className="text-muted mb-3">View current team assignments - manage assignments in User Management</p>

                    {teamAssignmentOverview.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-users"></i>
                        </div>
                        <p>No team assignments found</p>
                        <p className="text-muted">Users with team roles will appear here.</p>
                      </div>
                    ) : (
                      <div className="team-overview-grid">
                        {['TEAM_COACH', 'TEAM_SOCIAL_MEDIA', 'TEAM_FUNDRAISING', 'TEAM_EVENT_COORDINATION'].map(teamType => {
                          const teamMembers = teamAssignmentOverview.filter(user =>
                            user.teams?.some(team => team.name === teamType)
                          );
                          const teamDisplayName = getTeamDisplayName(teamType);

                          return (
                            <div key={teamType} className="team-section">
                              <div className="team-header">
                                <h4>{teamDisplayName}</h4>
                                <span className="member-count">{teamMembers.length} members</span>
                              </div>
                              <div className="team-members">
                                {teamMembers.length === 0 ? (
                                  <p className="text-muted">No members assigned</p>
                                ) : (
                                  teamMembers.map(user => (
                                    <div key={user.id} className="member-card">
                                      <div className="member-info">
                                        <h5>{user.firstName} {user.lastName}</h5>
                                        <p className="text-muted">{user.email}</p>
                                        {user.phoneNumber && (
                                          <p className="text-muted small">{user.phoneNumber}</p>
                                        )}
                                      </div>
                                      <div className="member-actions">
                                        <button
                                          onClick={() => window.location.href = '/admin/users'}
                                          className="btn btn-sm btn-outline-primary"
                                          title="Edit in User Management"
                                        >
                                          <i className="fas fa-edit"></i>
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Admin: Child Events Tab */}
                {activeTab === 'child-events' && isAdmin() && (
                  <div className="tab-content">
                    <h2>Child Events Overview</h2>
                    <p className="text-muted mb-3">Monitor all child registrations and events</p>

                    {allChildEvents.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-child"></i>
                        </div>
                        <p>No child event registrations found.</p>
                        <p className="text-muted">Event registrations will appear here when parents register their children.</p>
                      </div>
                    ) : (
                      <div className="events-grid">
                        {allChildEvents.map(registration => {
                          const isPast = new Date(registration.event?.endDate) < new Date();
                          return (
                            <div className="event-card-container" key={registration.id}>
                              <div className={`event-card ${isPast ? 'past-event' : ''}`}>
                                <div className="event-date">
                                  <div className="date-month">
                                    {formatMonth(registration.event?.startDate)}
                                  </div>
                                  <div className="date-day">
                                    {formatDay(registration.event?.startDate)}
                                  </div>
                                </div>
                                <div className="event-details">
                                  <h4 className="event-title">{registration.event?.title || 'Unknown Event'}</h4>
                                  <div className="participant-name">
                                    <strong>Child:</strong> {registration.childFirstName} {registration.childLastName}
                                  </div>
                                  <div className="parent-info">
                                    <strong>Parent:</strong> {registration.parentEmail}
                                  </div>
                                  <div className="event-location">
                                    <i className="fas fa-map-marker-alt mr-1"></i> {registration.event?.location}
                                  </div>
                                  <div className="event-status">
                                    {isPast ? (
                                      <span className="status-badge completed">Completed</span>
                                    ) : (
                                      <span className="status-badge upcoming">Upcoming</span>
                                    )}
                                  </div>
                                </div>
                                <div className="event-actions">
                                  <Link
                                    to={`/events/${registration.eventId}`}
                                    className="action-btn view-btn"
                                    title="View Event Details"
                                  >
                                    <i className="fas fa-eye"></i>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

        </div>
      </div>
    </div>
  </div>
</div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Confirm Cancellation</h3>
              <button className="modal-close" onClick={closeCancelModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel {
                cancelItemType === 'registration' ? 'this registration' :
                cancelItemType === 'volunteer' ? 'this volunteer signup' :
                cancelItemType === 'event-registrations' ? 'ALL registrations for this event' :
                'this item'
              }?</p>
              <p className="text-danger"><strong>Note:</strong> This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeCancelModal}>
                No, Keep It
              </button>
              <button className="btn btn-danger" onClick={handleConfirmCancel}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom CSS for this page */}
      <style>{`
        .profile-card {
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
        }
        
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 600;
          margin: 0 auto 1.5rem;
        }
        
        .profile-info {
          text-align: center;
        }
        
        .profile-info p {
          margin-bottom: 0.5rem;
        }
        
        .quick-links {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        
        .quick-link-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          text-decoration: none;
          color: var(--text);
        }
        
        .quick-link-item:hover {
          background-color: #f8f8f8;
          transform: translateY(-5px);
        }
        
        .quick-link-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          margin-bottom: 0.8rem;
          transition: transform 0.3s ease;
        }
        
        .quick-link-item:hover .quick-link-icon {
          transform: scale(1.1);
        }
        
        .quick-link-text {
          font-weight: 600;
          text-align: center;
        }
        
        .activities-card {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .tab-header {
          padding: 0;
        }
        
        .nav-tabs {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          border-bottom: 1px solid #eee;
        }
        
        .nav-tab {
          padding: 1rem 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          border-bottom: 3px solid transparent;
        }
        
        .nav-tab.active {
          background-color: white;
          border-bottom-color: var(--primary);
          color: var(--primary);
          font-weight: 600;
        }
        
        .nav-tab:hover:not(.active) {
          background-color: #f8f8f8;
        }
        
        .tab-content {
          padding: 1.5rem 1.5rem 3rem 1.5rem;
          min-height: 450px;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem 1rem 4rem 1rem;
          min-height: 350px;
          margin-bottom: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .volunteer-welcome-card {
          text-align: center;
          padding: 3rem 2rem;
          background: #f8f9fa;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          margin: 2rem 0;
          border: 2px solid var(--primary);
        }

        .volunteer-icon {
          width: 80px;
          height: 80px;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          font-size: 2.5rem;
          color: white;
          box-shadow: 0 4px 16px rgba(47, 80, 106, 0.3);
        }

        .volunteer-welcome-card h2 {
          color: var(--primary);
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .welcome-message {
          font-size: 1.1rem;
          color: #6c757d;
          line-height: 1.6;
          margin-bottom: 2rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .volunteer-benefits {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin: 2rem 0;
          flex-wrap: wrap;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: white;
          border-radius: 25px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e9ecef;
          transition: transform 0.2s ease;
        }

        .benefit-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .benefit-item i {
          color: var(--secondary);
          font-size: 1.1rem;
        }

        .benefit-item span {
          font-weight: 600;
          color: var(--text);
          font-size: 0.9rem;
        }

        .volunteer-cta {
          margin-top: 2rem;
        }

        .btn-volunteer {
          background: var(--secondary);
          color: white;
          padding: 1rem 2rem;
          border-radius: 25px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          border: none;
          box-shadow: 0 4px 16px rgba(231, 110, 90, 0.3);
        }

        .btn-volunteer:hover {
          background: var(--secondary) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(231, 110, 90, 0.4);
          text-decoration: none !important;
          color: white !important;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .volunteer-benefits {
            flex-direction: column;
            align-items: center;
          }

          .volunteer-welcome-card {
            padding: 2rem 1rem;
          }

          .volunteer-welcome-card h2 {
            font-size: 1.6rem;
          }
        }

        .volunteer-activities-section {
          margin-top: 1rem;
        }

        .section-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
        }

        .section-header h2 {
          color: var(--primary);
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .section-subtitle {
          color: #6c757d;
          font-size: 1rem;
          margin: 0;
        }
        
        .empty-icon {
          font-size: 3rem;
          color: #ddd;
          margin-bottom: 1.5rem;
        }
        
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        
        .event-card {
          display: flex;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          background-color: white;
          height: 100%;
        }
        
        .event-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }
        
        .event-card.past-event {
          opacity: 0.7;
        }
        
        .event-date {
          width: 70px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: var(--primary);
          color: white;
          padding: 1rem 0;
        }
        
        .volunteer-card .event-date {
          background-color: var(--secondary);
        }
        
        .date-month {
          font-size: 0.8rem;
          text-transform: uppercase;
          font-weight: 600;
        }
        
        .date-day {
          font-size: 1.8rem;
          font-weight: 700;
        }
        
        .event-details {
          flex: 1;
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }
        
        .event-title {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        
        .participant-name, .volunteer-role {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .event-location {
          font-size: 0.85rem;
          color: var(--text-light);
          margin-bottom: 0.5rem;
        }
        
        .event-status {
          margin-top: auto;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-badge.upcoming {
          background-color: #e6f7ff;
          color: #0c6eb9;
        }
        
        .status-badge.completed {
          background-color: #f0f0f0;
          color: #999;
        }
        
        .status-badge.confirmed {
          background-color: #e6fffa;
          color: #0a866c;
        }
        
        .status-badge.pending {
          background-color: #fff7e6;
          color: #b97800;
        }
        
        .event-actions {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background-color: #f8f8f8;
          min-width: 80px;
        }
        
        .action-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          color: white;
        }
        
        .edit-btn {
          background-color: #10b981;
        }

        .delete-btn {
          background-color: #ef4444;
        }

        .view-btn {
          background-color: var(--primary);
        }

        .cancel-btn {
          background-color: var(--secondary);
        }
        
        .action-btn:hover {
          transform: scale(1.1);
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }
        
        .modal-container {
          width: 90%;
          max-width: 500px;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: #f8f8f8;
          border-bottom: 1px solid #eee;
        }
        
        .modal-header h3 {
          margin: 0;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: var(--text-light);
          transition: color 0.3s ease;
        }
        
        .modal-close:hover {
          color: var(--secondary);
        }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1rem;
          background-color: #f8f8f8;
          border-top: 1px solid #eee;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(47, 80, 106, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 1rem;
        }
        
        .error-card {
          text-align: center;
        }

        .edit-profile-form .form-group {
          margin-bottom: 1rem;
        }

        .edit-profile-form label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .edit-profile-form .form-control {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .edit-profile-form .form-control:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(47, 80, 106, 0.2);
        }

        .edit-profile-actions .btn {
          margin-top: 0.5rem;
        }

        .loading-spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-right: 0.5rem;
        }
        
        .error-icon {
          font-size: 3rem;
          color: var(--secondary);
          margin-bottom: 1rem;
        }

        /* Application Status Styles */
        .application-status-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .status-header {
          display: flex;
          align-items: center;
          padding: 1.5rem;
          background-color: #f8f9fa;
        }

        .status-header.status-draft {
          background-color: #e6f3ff;
          border-bottom: 2px solid #0ea5e9;
        }

        .status-header.status-submitted {
          background-color: #fff7e6;
          border-bottom: 2px solid #f59e0b;
        }

        .status-header.status-pending {
          background-color: #fff7e6;
          border-bottom: 2px solid #f59e0b;
        }

        .status-header.status-submission-update {
          background-color: #fef3c7;
          border-bottom: 2px solid #f59e0b;
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from { box-shadow: 0 0 5px rgba(245, 158, 11, 0.5); }
          to { box-shadow: 0 0 20px rgba(245, 158, 11, 0.8); }
        }

        .status-header.status-approved {
          background-color: #ecfdf5;
          border-bottom: 2px solid #10b981;
        }

        .status-header.status-completed {
          background-color: #f0f9ff;
          border-bottom: 2px solid #0ea5e9;
        }

        .status-header.status-denied {
          background-color: #fef2f2;
          border-bottom: 2px solid #ef4444;
        }

        .status-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
          font-size: 1.5rem;
        }

        .status-draft .status-icon {
          background-color: #0ea5e9;
          color: white;
        }

        .status-submitted .status-icon, .status-pending .status-icon, .status-submission-update .status-icon {
          background-color: #f59e0b;
          color: white;
        }

        .status-submission-update .status-icon {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .status-approved .status-icon {
          background-color: #10b981;
          color: white;
        }

        .status-completed .status-icon {
          background-color: #0ea5e9;
          color: white;
        }

        .status-denied .status-icon {
          background-color: #ef4444;
          color: white;
        }

        .status-text h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
        }

        .status-text p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .application-details {
          padding: 1.5rem;
        }

        .application-details h4 {
          margin: 0 0 1rem 0;
          color: var(--primary);
        }

        .teams-list {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .team-badge {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
          padding: 0.55rem 0.85rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background-color: #f8fafc;
          color: #0f172a;
          font-size: 0.85rem;
          font-weight: 600;
          min-width: 150px;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .team-badge-name {
          font-weight: 600;
        }

        .team-badge-status {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .team-badge.status-approved {
          border-color: #34d399;
          background-color: #ecfdf5;
          color: #047857;
        }

        .team-badge.status-denied {
          border-color: #f87171;
          background-color: #fef2f2;
          color: #b91c1c;
        }

        .team-badge.status-pending {
          border-color: #facc15;
          background-color: #fef9c3;
          color: #92400e;
        }

        .application-actions {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
        }

        .text-muted {
          color: #6b7280;
        }

        .volunteer-status-summary {
          margin-bottom: 2rem;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .status-pill i {
          margin-right: 0.5rem;
        }

        .status-pill.status-draft {
          background-color: #e6f3ff;
          color: #0c6eb9;
        }

        .status-pill.status-submitted,
        .status-pill.status-pending {
          background-color: #fff7e6;
          color: #b97800;
        }

        .status-pill.status-submission-update {
          background-color: #fef3c7;
          color: #92400e;
          border: 2px solid #f59e0b;
          font-weight: 600;
        }

        .status-pill.status-approved {
          background-color: #ecfdf5;
          color: #0a866c;
        }

        .status-pill.status-completed {
          background-color: #f0f9ff;
          color: #0c6eb9;
        }

        .status-pill.status-denied {
          background-color: #fef2f2;
          color: #dc2626;
        }

        .mb-3 {
          margin-bottom: 1rem;
        }

        .mb-4 {
          margin-bottom: 1.5rem;
        }
        
        .mr-1 {
          margin-right: 0.25rem;
        }
        
        .mr-2 {
          margin-right: 0.5rem;
        }

        /* Status title container for pending badge */
        .status-title-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .pending-status-badge {
          background-color: #fbbf24;
          color: #92400e;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .update-status-badge {
          background-color: #f59e0b;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          animation: blink 1.5s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.7; }
        }

        /* Additional status badge styles for volunteer activities */
        .status-badge.submitted {
          background-color: #dbeafe;
          color: #1e40af;
        }

        /* Admin-specific styles */
        .applications-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .application-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 1px solid #e5e7eb;
        }

        .application-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .application-header {
          display: flex;
          justify-content: between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .application-header h4 {
          margin: 0;
          color: var(--primary);
        }

        .application-details {
          margin-bottom: 1.5rem;
        }

        .application-details p {
          margin: 0.5rem 0;
          font-size: 0.9rem;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        /* Application modal styles */
        .application-modal {
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .application-review h4 {
          color: var(--primary);
          margin: 1.5rem 0 1rem 0;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 0.5rem;
        }

        .application-review h5 {
          color: var(--secondary);
          margin: 1rem 0 0.5rem 0;
          font-size: 1rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .info-grid div {
          padding: 0.5rem;
          background-color: #f9fafb;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .team-answer {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .team-answer p {
          margin: 0.5rem 0 0 0;
          line-height: 1.6;
        }

        .btn-success {
          background-color: #10b981;
          color: white;
          border: none;
        }

        .btn-success:hover {
          background-color: #059669;
        }

        .btn-danger {
          background-color: #ef4444;
          color: white;
          border: none;
        }

        .btn-danger:hover {
          background-color: #dc2626;
        }

        .parent-info {
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        /* Enhanced event card styles */
        .enhanced-card {
          min-height: 320px;
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #e2e8f0;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }

        .enhanced-card:hover {
          border-color: var(--primary);
          box-shadow: 0 12px 35px rgba(47, 80, 106, 0.15);
        }

        .children-section {
          margin-bottom: 1rem;
          padding: 1rem;
          background-color: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid var(--primary);
        }

        .children-header {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: var(--primary);
          font-size: 0.9rem;
        }

        .children-count {
          margin-left: 0.25rem;
        }

        .children-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .child-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background-color: white;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .child-name {
          font-weight: 600;
          color: #1a202c;
        }

        .child-age {
          font-size: 0.8rem;
          color: #718096;
          background-color: #edf2f7;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
        }

        .event-info {
          margin-bottom: 1rem;
        }

        .event-info > div {
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: #4a5568;
        }

        .event-price {
          font-weight: 600;
          color: var(--secondary);
        }

        .dropdown-actions {
          position: relative;
        }

        .manage-btn {
          background-color: #4a5568;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          min-width: 180px;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.2s ease;
        }

        .dropdown-actions:hover .dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          text-align: left;
          font-size: 0.9rem;
          color: #4a5568;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .dropdown-item:hover {
          background-color: #f7fafc;
        }

        .cancel-item {
          color: #e53e3e;
        }

        .cancel-item:hover {
          background-color: #fed7d7;
        }

        @media (max-width: 992px) {
          .events-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }        .admin-decision-panel {
          margin-top: 2rem;
          padding: 1.75rem 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background-color: #ffffff;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        }

        .admin-decision-panel h4 {
          margin-bottom: 0.75rem;
        }

        .admin-decision-panel > p {
          margin-bottom: 1.5rem;
        }

        .team-decisions {
          padding: 1rem 1.25rem;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background-color: #f8fafc;
        }

        .team-decisions h5 {
          margin-bottom: 0.65rem;
        }

        .team-decisions .decision-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .team-decision-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .team-decision-row + .team-decision-row {
          border-top: 1px dashed #dde5f1;
          padding-top: 0.75rem;
        }

        .team-name {
          font-weight: 600;
          flex: 1;
          min-width: 160px;
        }

        .decision-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .decision-btn {
          border: 1px solid #d1d5db;
          background-color: #ffffff;
          color: #1f2937;
          padding: 0.45rem 1.1rem;
          border-radius: 999px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s ease;
        }

        .decision-btn i {
          color: inherit;
        }

        .decision-btn.approve {
          border-color: #34d399;
          color: #047857;
        }

        .decision-btn.deny {
          border-color: #f87171;
          color: #b91c1c;
        }

        .decision-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
        }

        .decision-btn.approve.active {
          background-color: #10b981;
          border-color: #10b981;
          color: #ffffff;
        }

        .decision-btn.deny.active {
          background-color: #ef4444;
          border-color: #ef4444;
          color: #ffffff;
        }

        .admin-response {
          margin-top: 1.75rem;
        }

        .admin-response h5 {
          margin-bottom: 0.5rem;
        }

        .admin-response textarea {
          margin-top: 0.5rem;
          resize: vertical;
        }

        .decision-preview {
          margin-top: 1.75rem;
          background-color: #f1f5f9;
          border: 1px dashed #cbd5f5;
          border-radius: 12px;
          padding: 1rem 1.25rem;
        }

        .decision-preview h5 {
          margin-bottom: 0.6rem;
        }

        .decision-preview p {
          margin-bottom: 0.35rem;
        }

        .decision-preview-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .decision-preview-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.6rem 0.75rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background-color: #ffffff;
        }

        .decision-preview-row.status-approved {
          border-color: #34d399;
          background-color: #ecfdf5;
        }

        .decision-preview-row.status-denied {
          border-color: #f87171;
          background-color: #fef2f2;
        }

        .decision-preview-row.status-pending {
          border-color: #facc15;
          background-color: #fef9c3;
        }

        .decision-team-name {
          font-weight: 600;
          color: #0f172a;
        }

        .decision-team-status,
        .team-decision-status {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .team-decision-status.status-approved,
        .decision-team-status.status-approved {
          color: #047857;
        }

        .team-decision-status.status-denied,
        .decision-team-status.status-denied {
          color: #b91c1c;
        }

        .team-decision-status.status-pending,
        .decision-team-status.status-pending {
          color: #92400e;
        }

        .team-decision-label {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          flex: 1;
          min-width: 170px;
        }

        .team-decision-row {
          align-items: flex-start;
        }

        .decision-alert {
          margin: 1.25rem 0 0;
        }

        .application-modal .modal-footer {
          border-top: 1px solid #e2e8f0;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
        }

        @media (max-width: 640px) {
          .team-decision-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .decision-buttons {
            width: 100%;
            justify-content: center;
          }

          .decision-btn {
            flex: 1;
            justify-content: center;
          }

          .admin-decision-panel {
            padding: 1.25rem;
          }
        }


      `}</style>
    </>
  );
};

// Helper functions for formatting dates
function formatMonth(dateString) {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'short' });
}

function formatDay(dateString) {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  return date.getDate();
}

export default Dashboard;














