import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { assetUrls } from '../utils/firebaseAssets';
import { collection, doc as firestoreDoc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [volunteerEvents, setVolunteerEvents] = useState([]);
  const [volunteerApplicationStatus, setVolunteerApplicationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null); // Will be set based on user type

  // Admin-specific state
  const [volunteerApplications, setVolunteerApplications] = useState([]);
  const [currentVolunteerApplication, setCurrentVolunteerApplication] = useState(null);
  const [allChildEvents, setAllChildEvents] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [roleDecisions, setRoleDecisions] = useState({});
  const [adminResponseNote, setAdminResponseNote] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  // Messaging system state
  const [messagingMode, setMessagingMode] = useState('emails'); // 'emails' or 'categories'
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [emailList, setEmailList] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [deliveryChannels, setDeliveryChannels] = useState(['inbox']);
  const [messagingError, setMessagingError] = useState('');
  const [messagingSending, setMessagingSending] = useState(false);
  const [messagingSuccess, setMessagingSuccess] = useState('');

  // Determine user type based on email or role
  const isVolunteer = () => {
    if (!userProfile) return false;

    // Check if user has volunteer role or email suggests volunteer account
    const email = userProfile.email || currentUser?.email || '';

    return email.toLowerCase().includes('volunteer') ||
           userProfile.roles?.includes('ROLE_VOLUNTEER') ||
           userProfile.accountType === 'volunteer';
  };

  // Determine if user is Kids in Motion admin
  const isAdmin = () => {
    if (!userProfile) return false;

    const email = userProfile.email || currentUser?.email || '';

    // Admin detection: kidsinmotion emails or specific admin roles
    return email.toLowerCase().includes('kidsinmotion') ||
           userProfile.roles?.includes('ROLE_ADMIN') ||
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

  const APPLICATION_STORE_KEY = 'volunteer_applications_global';

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

  const getApplicationDocRef = (uid) => firestoreDoc(db, VOLUNTEER_APPLICATIONS_COLLECTION, uid);

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
    }
  }, [currentUser, userProfile, authLoading, navigate]);
  
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
        // For volunteers: fetch volunteer activities and application status
        try {
          const volunteersData = await apiService.getMyVolunteerSignups();
          setVolunteerEvents(volunteersData);
        } catch (error) {
          console.log('No volunteer activities found:', error.message);
          setVolunteerEvents([]);
        }

        // Check for volunteer application status using the shared caches (Firestore when available)
        const applicationRecord = await loadVolunteerApplicationById(currentUser.uid);

        if (applicationRecord) {
          setCurrentVolunteerApplication(applicationRecord);
          setVolunteerApplicationStatus(buildVolunteerStatusPayload(applicationRecord));
        } else {
          setCurrentVolunteerApplication(null);
          setVolunteerApplicationStatus(null);
        }

        if (!activeTab) {
          const noTeamsSelected = !applicationRecord || !Array.isArray(applicationRecord.selectedCategories) || applicationRecord.selectedCategories.length === 0;
          if (!applicationRecord || ((applicationRecord.status === 'draft' || applicationRecord.status === 'new') && noTeamsSelected)) {
            setActiveTab('application');
          } else {
            setActiveTab('volunteer');
          }
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
        if (!activeTab) setActiveTab('registrations');
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
      // Fetch volunteer applications from localStorage (would be API in production)
      const applications = await loadAllVolunteerApplications();
      setVolunteerApplications(applications);

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

  const openApplicationModal = (application) => {
    setSelectedApplication(application);

    const initialDecisions = {};
    (application?.selectedCategories || []).forEach(team => {
      const existingDecision = application?.decisionsByRole?.[team];
      initialDecisions[team] = existingDecision || 'pending';
    });
    setRoleDecisions(initialDecisions);
    setAdminResponseNote(application?.adminNote || '');
    setDecisionError('');
    setDecisionSubmitting(false);
    setShowApplicationModal(true);
  };

  const closeApplicationModal = () => {
    setSelectedApplication(null);
    setShowApplicationModal(false);
    setRoleDecisions({});
    setAdminResponseNote('');
    setDecisionError('');
    setDecisionSubmitting(false);
  };

  const handleRoleDecisionChange = (team, decision) => {
    setRoleDecisions(prev => ({
      ...prev,
      [team]: decision
    }));
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

  // Messaging functions
  const userCategories = [
    { id: 'all', label: 'All Users', description: 'Everyone in the system' },
    { id: 'parents', label: 'Parents', description: 'Users who have registered children' },
    { id: 'volunteers', label: 'Volunteers', description: 'Users with volunteer accounts' },
    { id: 'coaches', label: 'Coaches', description: 'Volunteers on coaching teams' },
    { id: 'approved', label: 'Approved Volunteers', description: 'Volunteers with approved applications' },
    { id: 'pending', label: 'Pending Applications', description: 'Users with submitted applications' },
    { id: 'event-coordinators', label: 'Event Coordinators', description: 'Event coordination team members' },
    { id: 'social-media', label: 'Social Media Team', description: 'Social media team members' }
  ];

  const availableChannels = [
    { id: 'inbox', label: 'Inbox', icon: 'fa-inbox' },
    { id: 'email', label: 'Email', icon: 'fa-envelope' },
    { id: 'phone', label: 'Phone/SMS', icon: 'fa-phone' },
    { id: 'all', label: 'All Channels', icon: 'fa-broadcast-tower' }
  ];

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleChannelToggle = (channelId) => {
    if (channelId === 'all') {
      setDeliveryChannels(['inbox', 'email', 'phone']);
    } else {
      setDeliveryChannels(prev => {
        if (prev.includes(channelId)) {
          return prev.filter(id => id !== channelId);
        } else {
          return [...prev.filter(id => id !== 'all'), channelId];
        }
      });
    }
  };

  const getUsersByCategory = (categoryId) => {
    // This would typically query your database
    // For now, we'll simulate by checking localStorage and volunteer applications
    const users = [];

    if (categoryId === 'all') {
      // Add all users from localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('volunteer_draft_')) {
          const userData = JSON.parse(localStorage.getItem(key));
          users.push({
            id: key.replace('volunteer_draft_', ''),
            email: userData.email,
            name: `${userData.firstName} ${userData.lastName}`,
            type: 'volunteer'
          });
        }
      }
    } else if (categoryId === 'volunteers') {
      volunteerApplications.forEach(app => {
        users.push({
          id: app.id,
          email: app.email,
          name: app.applicantName,
          type: 'volunteer'
        });
      });
    } else if (categoryId === 'approved') {
      volunteerApplications.filter(app => app.status === 'approved').forEach(app => {
        users.push({
          id: app.id,
          email: app.email,
          name: app.applicantName,
          type: 'approved-volunteer'
        });
      });
    } else if (categoryId === 'pending') {
      volunteerApplications.filter(app => app.status === 'submitted').forEach(app => {
        users.push({
          id: app.id,
          email: app.email,
          name: app.applicantName,
          type: 'pending-volunteer'
        });
      });
    } else if (categoryId === 'coaches') {
      volunteerApplications.filter(app =>
        app.selectedCategories?.includes('coach') && app.status === 'approved'
      ).forEach(app => {
        users.push({
          id: app.id,
          email: app.email,
          name: app.applicantName,
          type: 'coach'
        });
      });
    }
    // Add more categories as needed

    return users;
  };

  const sendMessage = async () => {
    setMessagingError('');
    setMessagingSuccess('');

    if (!messageTitle.trim() || !messageContent.trim()) {
      setMessagingError('Please enter both a title and message content.');
      return;
    }

    if (deliveryChannels.length === 0) {
      setMessagingError('Please select at least one delivery channel.');
      return;
    }

    let recipients = [];

    if (messagingMode === 'emails') {
      if (!emailList.trim()) {
        setMessagingError('Please enter email addresses.');
        return;
      }

      const emails = emailList.split(/[,;\n]/).map(email => email.trim()).filter(email => email);
      recipients = emails.map(email => ({
        id: email,
        email: email,
        name: email,
        type: 'direct'
      }));
    } else {
      if (selectedCategories.length === 0) {
        setMessagingError('Please select at least one user category.');
        return;
      }

      selectedCategories.forEach(categoryId => {
        const categoryUsers = getUsersByCategory(categoryId);
        recipients.push(...categoryUsers);
      });

      // Remove duplicates
      recipients = recipients.filter((user, index, self) =>
        index === self.findIndex(u => u.email === user.email)
      );
    }

    if (recipients.length === 0) {
      setMessagingError('No recipients found for the selected criteria.');
      return;
    }

    setMessagingSending(true);

    try {
      const message = {
        id: `admin_message_${Date.now()}`,
        type: 'admin',
        title: messageTitle,
        message: messageContent,
        from: 'Kids in Motion Admin',
        timestamp: new Date().toISOString(),
        read: false,
        isSystem: true
      };

      let sentCount = 0;

      for (const recipient of recipients) {
        try {
          // Send to inbox
          if (deliveryChannels.includes('inbox')) {
            await sendInboxMessageWithFallback(recipient.id, message);
          }

          // Log other delivery channels (email, phone would be actual API calls)
          if (deliveryChannels.includes('email')) {
            console.log(`Would send email to: ${recipient.email}`);
            recordContactNotification(recipient.id, {
              method: 'email',
              destination: recipient.email,
              subject: messageTitle,
              message: messageContent,
              sentBy: 'admin'
            });
          }

          if (deliveryChannels.includes('phone')) {
            console.log(`Would send SMS to: ${recipient.phone || 'phone not available'}`);
            recordContactNotification(recipient.id, {
              method: 'phone',
              destination: recipient.phone || 'not-available',
              subject: messageTitle,
              message: messageContent,
              sentBy: 'admin'
            });
          }

          sentCount++;
        } catch (error) {
          console.error(`Failed to send message to ${recipient.email}:`, error);
        }
      }

      setMessagingSuccess(`Message sent successfully to ${sentCount} recipient${sentCount !== 1 ? 's' : ''} via ${deliveryChannels.join(', ')}.`);

      // Clear form
      setMessageTitle('');
      setMessageContent('');
      setEmailList('');
      setSelectedCategories([]);
      setDeliveryChannels(['inbox']);

    } catch (error) {
      console.error('Error sending messages:', error);
      setMessagingError('Failed to send messages. Please try again.');
    }

    setMessagingSending(false);
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
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const appliedTeamsForDecision = selectedApplication?.selectedCategories || [];
  const volunteerTeamSlugs = currentVolunteerApplication?.selectedCategories || (volunteerApplicationStatus?.teamSlugs || []);
  const approvedRolesPreview = appliedTeamsForDecision.filter(team => roleDecisions[team] === 'approved');
  const deniedRolesPreview = appliedTeamsForDecision.filter(team => roleDecisions[team] === 'denied');
  const pendingRolesPreview = appliedTeamsForDecision.filter(team => !roleDecisions[team] || roleDecisions[team] === 'pending');

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
          <h1>Welcome, {userProfile?.firstName || currentUser?.displayName?.split(' ')[0] || 'User'}!</h1>
          <p>{isAdmin()
            ? "Manage volunteer applications, review submissions, and oversee all Kids in Motion programs."
            : isVolunteer()
            ? "Manage your volunteer activities and team applications."
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
      
      <div className="container mt-4">
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

                  {isVolunteer() ? (
                    <Link to="/volunteer" className="quick-link-item">
                      <div className="quick-link-icon" style={{ backgroundColor: 'var(--secondary)' }}>
                        <i className="fas fa-hands-helping"></i>
                      </div>
                      <div className="quick-link-text">Team Application</div>
                    </Link>
                  ) : (
                    <Link to="/about" className="quick-link-item">
                      <div className="quick-link-icon" style={{ backgroundColor: 'var(--secondary)' }}>
                        <i className="fas fa-info-circle"></i>
                      </div>
                      <div className="quick-link-text">About Programs</div>
                    </Link>
                  )}

                  <a href="https://account.venmo.com/u/ryanspiess22" target="_blank" rel="noopener noreferrer" className="quick-link-item">
                    <div className="quick-link-icon" style={{ backgroundColor: '#28a745' }}><i className="fas fa-donate"></i>
                    </div>
                    <div className="quick-link-text">Support Kids</div>
                  </a>

                  {!isVolunteer() && (
                    <Link to="/volunteer" className="quick-link-item">
                      <div className="quick-link-icon" style={{ backgroundColor: '#fbbf24' }}>
                        <i className="fas fa-heart"></i>
                      </div>
                      <div className="quick-link-text">Join Our Team</div>
                    </Link>
                  )}
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
                        Volunteer Applications
                      </li>
                      <li
                        className={`nav-tab ${activeTab === 'child-events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('child-events')}
                      >
                        <i className="fas fa-child mr-2"></i>
                        Child Events
                      </li>
                      <li
                        className={`nav-tab ${activeTab === 'messaging' ? 'active' : ''}`}
                        onClick={() => setActiveTab('messaging')}
                      >
                        <i className="fas fa-bullhorn mr-2"></i>
                        Send Messages
                      </li>
                    </>
                  )}
                  {!isVolunteer() && !isAdmin() && (
                    <li
                      className={`nav-tab ${activeTab === 'registrations' ? 'active' : ''}`}
                      onClick={() => setActiveTab('registrations')}
                    >
                      <i className="fas fa-child mr-2"></i>
                      Your Child's Events
                    </li>
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
                      <li
                        className={`nav-tab ${activeTab === 'application' ? 'active' : ''}`}
                        onClick={() => setActiveTab('application')}
                      >
                        <i className="fas fa-file-alt mr-2"></i>
                        Team Application Status
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <div className="card-body">
                {activeTab === 'registrations' && (
                  <div className="tab-content ">
                    <h2>Your Child's Registered Events</h2>
                    
                    {registeredEvents.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-calendar-times"></i>
                        </div>
                        <p>You haven't registered your child for any events yet.</p>
                        <Link to="/events" className="btn btn-primary mt-3">Browse Events</Link>
                      </div>
                    ) : (
                      <div className="events-grid">
                        {registeredEvents.map(registration => {
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
                                    {registration.childFirstName} {registration.childLastName}
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
                                  
                                  {!isPast && (
                                    <button
                                      onClick={() => openCancelModal(registration.id, 'registration')}
                                      className="action-btn cancel-btn"
                                      title="Cancel Registration"
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
                    )}
                  </div>
                )}

                {activeTab === 'application' && isVolunteer() && (
                  <div className="tab-content ">
                    <h2>Team Application Status</h2>

                    {!volunteerApplicationStatus ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-clipboard-list"></i>
                        </div>
                        <p>You haven't submitted a team application yet.</p>
                        <p className="text-muted">Apply to join one of our volunteer teams to help make a difference!</p>
                        <Link to="/volunteer" className="btn btn-primary mt-3">
                          <i className="fas fa-plus mr-2"></i>Apply for Teams
                        </Link>
                      </div>
                    ) : (
                      <div className="application-status-card">
                        <div className={`status-header status-${volunteerApplicationStatus.status.toLowerCase()}`}>
                          <div className="status-icon">
                            <i className={`fas ${
                              volunteerApplicationStatus.status === 'submitted' ? 'fa-paper-plane' :
                              volunteerApplicationStatus.status === 'approved' ? 'fa-check-circle' :
                              volunteerApplicationStatus.status === 'denied' ? 'fa-times-circle' :
                              volunteerApplicationStatus.status === 'pending' ? 'fa-clock' :
                              'fa-edit'
                            }`}></i>
                          </div>
                          <div className="status-text">
                            <div className="status-title-container">
                              <h3>Application {
                                volunteerApplicationStatus.status === 'submitted' ? 'Submitted' :
                                volunteerApplicationStatus.status.charAt(0).toUpperCase() + volunteerApplicationStatus.status.slice(1)
                              }</h3>
                              {volunteerApplicationStatus.status === 'submitted' && (
                                <span className="pending-status-badge">PENDING</span>
                              )}
                            </div>
                            {volunteerApplicationStatus.submittedAt && (
                              <p>
                                {volunteerApplicationStatus.status === 'draft' ? 'Last saved: ' : 'Submitted: '}
                                {new Date(volunteerApplicationStatus.submittedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="application-details">
                          <h4>Applied Teams:</h4>
                          <div className="teams-list">
                            {volunteerTeamSlugs.length === 0 ? (
                              <span className="team-badge status-pending">
                                <span className="team-badge-name">No teams selected yet</span>
                                <span className="team-badge-status">Pending</span>
                              </span>
                            ) : (
                              volunteerTeamSlugs.map((teamSlug, index) => {
                                const decisionForTeam = (currentVolunteerApplication?.decisionsByRole?.[teamSlug] || volunteerApplicationStatus.decisionsByRole?.[teamSlug] || (volunteerApplicationStatus.status === 'approved' ? 'approved' : volunteerApplicationStatus.status === 'denied' ? 'denied' : 'pending'));
                                const normalizedDecision = ['approved', 'denied'].includes(decisionForTeam) ? decisionForTeam : 'pending';
                                const pendingLabel = volunteerApplicationStatus.status === 'submitted' ? 'Under Review' : 'Pending';
                                return (
                                  <span key={`${teamSlug}-${index}`} className={`team-badge status-${normalizedDecision}`}>
                                    <span className="team-badge-name">{formatTeamName(teamSlug)}</span>
                                    <span className="team-badge-status">
                                      {normalizedDecision === 'approved' ? 'Approved' : normalizedDecision === 'denied' ? 'Denied' : pendingLabel}
                                    </span>
                                  </span>
                                );
                              })
                            )}
                          </div>

                          {volunteerApplicationStatus.status === 'draft' && (
                            <div className="application-actions mt-3">
                              <Link to="/volunteer" className="btn btn-primary">
                                <i className="fas fa-edit mr-2"></i>Continue Application
                              </Link>
                            </div>
                          )}

                          {volunteerApplicationStatus.status === 'submitted' && (
                            <div className="application-actions mt-3">
                              <Link to="/volunteer" className="btn btn-outline">
                                <i className="fas fa-edit mr-2"></i>Edit Application
                              </Link>
                            </div>
                          )}

                          {volunteerApplicationStatus.status === 'denied' && (
                            <div className="application-actions mt-3">
                              <Link to="/volunteer" className="btn btn-secondary">
                                <i className="fas fa-redo mr-2"></i>Reapply for Teams
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'volunteer' && (
                  <div className="tab-content ">
                    <h2>Your Volunteer Dashboard</h2>

                    {/* Application Status Summary for volunteers */}
                    {isVolunteer() && volunteerApplicationStatus && (
                      <div className="volunteer-status-summary mb-4">
                        <div className={`status-pill status-${volunteerApplicationStatus.status.toLowerCase()}`}>
                          <i className={`fas ${
                            volunteerApplicationStatus.status === 'approved' ? 'fa-check-circle' :
                            volunteerApplicationStatus.status === 'submitted' ? 'fa-paper-plane' :
                            volunteerApplicationStatus.status === 'pending' ? 'fa-clock' :
                            volunteerApplicationStatus.status === 'denied' ? 'fa-times-circle' :
                            'fa-edit'
                          }`}></i>
                          Team Application: {volunteerApplicationStatus.status.charAt(0).toUpperCase() + volunteerApplicationStatus.status.slice(1)}
                        </div>
                      </div>
                    )}

                    <h3>Volunteer Events & Training</h3>
                    <p className="text-muted mb-3">Events for your volunteer teams and organization-wide activities</p>

                    {volunteerEvents.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-calendar-check"></i>
                        </div>
                        <p>No volunteer events available at this time.</p>
                        <p className="text-muted">Check back soon for training sessions and volunteer activities!</p>
                      </div>
                    ) : (
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
                                    to={`/events/${volunteer.eventId}`} 
                                    className="action-btn view-btn"
                                    title="View Event Details"
                                  >
                                    <i className="fas fa-eye"></i>
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
                    )}
                  </div>
                )}

                {/* Admin: Volunteer Applications Tab */}
                {activeTab === 'applications' && isAdmin() && (
                  <div className="tab-content">
                    <h2>Volunteer Applications</h2>
                    <p className="text-muted mb-3">Review and manage volunteer team applications</p>

                    {volunteerApplications.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="fas fa-clipboard-list"></i>
                        </div>
                        <p>No volunteer applications found.</p>
                        <p className="text-muted">Applications will appear here when volunteers submit team applications.</p>
                      </div>
                    ) : (
                      <div className="applications-grid">
                        {volunteerApplications.map((application, index) => (
                          <div key={application.id} className="application-card">
                            <div className="application-header">
                              <h4>{application.applicantName}</h4>
                              <span className={`status-pill ${application.status.toLowerCase()}`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                            <div className="application-details">
                              <p><strong>Email:</strong> {application.email}</p>
                              <p><strong>Phone:</strong> {application.phone}</p>
                              <p><strong>Applied Teams:</strong></p>
                              <div className="teams-list">
                                {application.selectedCategories?.map((team, idx) => {
                                  const decision = application.decisionsByRole?.[team] || (application.status === 'approved' ? 'approved' : application.status === 'denied' ? 'denied' : 'pending');
                                  return (
                                    <span
                                      key={`${application.id}-${idx}`}
                                      className={`team-badge status-${decision}`}
                                    >
                                      <span className="team-badge-name">{formatTeamName(team)}</span>
                                      <span className="team-badge-status">
                                        {decision === 'approved' ? 'Approved' : decision === 'denied' ? 'Denied' : 'Awaiting Review'}
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>
                              <p><strong>Submitted:</strong> {new Date(application.submittedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="application-actions">
                              <button
                                onClick={() => openApplicationModal(application)}
                                className="btn btn-primary btn-sm"
                              >
                                <i className="fas fa-eye mr-1"></i>
                                Review
                              </button>
                            </div>
                          </div>
                        ))}
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

                {/* Admin: Messaging Tab */}
                {activeTab === 'messaging' && isAdmin() && (
                  <div className="tab-content">
                    <h2>Send Messages</h2>
                    <p className="text-muted mb-3">Send messages to users through multiple channels</p>

                    <div className="messaging-panel">
                      {/* Mode Selection */}
                      <div className="messaging-mode">
                        <h4>Select Recipients</h4>
                        <div className="mode-selector">
                          <button
                            type="button"
                            className={`mode-btn ${messagingMode === 'emails' ? 'active' : ''}`}
                            onClick={() => setMessagingMode('emails')}
                          >
                            <i className="fas fa-at mr-2"></i>
                            Direct Emails
                          </button>
                          <button
                            type="button"
                            className={`mode-btn ${messagingMode === 'categories' ? 'active' : ''}`}
                            onClick={() => setMessagingMode('categories')}
                          >
                            <i className="fas fa-users mr-2"></i>
                            User Categories
                          </button>
                        </div>
                      </div>

                      {/* Email Input Mode */}
                      {messagingMode === 'emails' && (
                        <div className="email-input-section">
                          <h5>Email Addresses</h5>
                          <p className="text-muted small">Enter email addresses separated by commas, semicolons, or new lines</p>
                          <textarea
                            className="form-control"
                            rows={4}
                            placeholder="user1@example.com, user2@example.com
volunteer@example.com
parent@example.com"
                            value={emailList}
                            onChange={(e) => setEmailList(e.target.value)}
                          />
                          <div className="email-count">
                            {emailList.split(/[,;\n]/).filter(e => e.trim()).length} email(s) entered
                          </div>
                        </div>
                      )}

                      {/* Category Selection Mode */}
                      {messagingMode === 'categories' && (
                        <div className="category-selection">
                          <h5>User Categories</h5>
                          <p className="text-muted small">Select one or more user groups to message</p>
                          <div className="category-grid">
                            {userCategories.map(category => (
                              <label key={category.id} className="category-card">
                                <input
                                  type="checkbox"
                                  checked={selectedCategories.includes(category.id)}
                                  onChange={() => handleCategoryToggle(category.id)}
                                />
                                <div className="category-info">
                                  <strong>{category.label}</strong>
                                  <small>{category.description}</small>
                                </div>
                              </label>
                            ))}
                          </div>
                          <div className="category-count">
                            {selectedCategories.length} categor{selectedCategories.length !== 1 ? 'ies' : 'y'} selected
                          </div>
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="message-content">
                        <h4>Message Details</h4>

                        <div className="form-group">
                          <label>Subject/Title</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter message title..."
                            value={messageTitle}
                            onChange={(e) => setMessageTitle(e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label>Message Content</label>
                          <textarea
                            className="form-control"
                            rows={6}
                            placeholder="Enter your message content..."
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                          />
                          <small className="text-muted">
                            {messageContent.length} characters
                          </small>
                        </div>
                      </div>

                      {/* Delivery Channels */}
                      <div className="delivery-channels">
                        <h4>Delivery Channels</h4>
                        <p className="text-muted small">Choose how to deliver the message (select multiple options)</p>
                        <div className="channel-options">
                          {availableChannels.map(channel => (
                            <label key={channel.id} className="channel-option">
                              <input
                                type="checkbox"
                                checked={
                                  channel.id === 'all'
                                    ? deliveryChannels.includes('inbox') && deliveryChannels.includes('email') && deliveryChannels.includes('phone')
                                    : deliveryChannels.includes(channel.id)
                                }
                                onChange={() => handleChannelToggle(channel.id)}
                              />
                              <div className="channel-info">
                                <i className={`fas ${channel.icon} mr-2`}></i>
                                <span>{channel.label}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                        <div className="channel-summary">
                          Delivering via: {deliveryChannels.join(', ') || 'none selected'}
                        </div>
                      </div>

                      {/* Error/Success Messages */}
                      {messagingError && (
                        <div className="alert alert-danger">
                          <i className="fas fa-exclamation-triangle mr-2"></i>
                          {messagingError}
                        </div>
                      )}

                      {messagingSuccess && (
                        <div className="alert alert-success">
                          <i className="fas fa-check-circle mr-2"></i>
                          {messagingSuccess}
                        </div>
                      )}

                      {/* Send Button */}
                      <div className="messaging-actions">
                        <button
                          className="btn btn-primary btn-lg"
                          onClick={sendMessage}
                          disabled={messagingSending}
                        >
                          {messagingSending ? (
                            <>
                              <div className="loading-spinner-small"></div>
                              Sending Messages...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-paper-plane mr-2"></i>
                              Send Messages
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Application Review Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-container application-modal">
            <div className="modal-header">
              <h3>Review Application - {selectedApplication.applicantName}</h3>
              <button className="modal-close" onClick={closeApplicationModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="application-review">
                <div className="applicant-info">
                  <h4>Applicant Information</h4>
                  <div className="info-grid">
                    <div><strong>Name:</strong> {selectedApplication.applicantName}</div>
                    <div><strong>Email:</strong> {selectedApplication.email}</div>
                    <div><strong>Phone:</strong> {selectedApplication.phone}</div>
                    <div><strong>Grade:</strong> {selectedApplication.grade || 'Not provided'}</div>
                    <div><strong>School:</strong> {selectedApplication.school || 'Not provided'}</div>
                    <div><strong>Submitted:</strong> {new Date(selectedApplication.submittedAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="applied-teams">
                  <h4>Applied Teams</h4>
                  <div className="teams-list">
                    {selectedApplication.selectedCategories?.map((team, idx) => {
                      const decision = roleDecisions[team] || selectedApplication.decisionsByRole?.[team] || 'pending';
                      return (
                        <span
                          key={idx}
                          className={`team-badge status-${decision}`}
                        >
                          <span className="team-badge-name">{formatTeamName(team)}</span>
                          <span className="team-badge-status">
                            {decision === 'approved' ? 'Approved' : decision === 'denied' ? 'Denied' : 'Pending'}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="motivation">
                  <h4>Motivation</h4>
                  <p>{selectedApplication.motivation || 'No motivation provided'}</p>
                </div>

                {selectedApplication.dynamicAnswers && Object.keys(selectedApplication.dynamicAnswers).length > 0 && (
                  <div className="team-answers">
                    <h4>Team-Specific Answers</h4>
                    {Object.entries(selectedApplication.dynamicAnswers).map(([team, answer]) => (
                      <div key={team} className="team-answer">
                        <h5>{formatTeamName(team)}</h5>
                        <p>{answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="contact-preferences">
                  <h4>Contact Preferences</h4>
                  <p>{selectedApplication.preferredContact?.join(', ') || 'None specified'}</p>
                  {selectedApplication.preferredContactOther && (
                    <p><strong>Other:</strong> {selectedApplication.preferredContactOther}</p>
                  )}
                </div>

                {selectedApplication.portfolioLink && (
                  <div className="portfolio">
                    <h4>Portfolio/Website</h4>
                    <a href={selectedApplication.portfolioLink} target="_blank" rel="noopener noreferrer">
                      {selectedApplication.portfolioLink}
                    </a>
                  </div>
                )}

                              </div>

              <div className="admin-decision-panel">
                <h4>Admin Decision</h4>
                <p className="text-muted small">Set the outcome for each role and include a note before sending.</p>

                <div className="team-decisions">
                  <h5>Role Outcomes</h5>
                  <p className="text-muted small">Choose approve or deny for every role this candidate applied for.</p>
                  {selectedApplication.selectedCategories?.length > 0 ? (
                    <div className="decision-list">
                      {selectedApplication.selectedCategories.map((team, idx) => {
                        const decision = roleDecisions[team] || 'pending';

                        return (
                          <div key={`${team}-${idx}`} className="team-decision-row">                            <div className="team-decision-label">

                              <span className="team-name">{formatTeamName(team)}</span>

                              <span className={`team-decision-status status-${decision}`}>

                                {decision === 'approved' ? 'Approved' : decision === 'denied' ? 'Denied' : 'Pending'}

                              </span>

                            </div>

                            <div className="decision-buttons">

                              <button
                                type="button"
                                className={`decision-btn approve ${decision === 'approved' ? 'active' : ''}`}
                                onClick={() => handleRoleDecisionChange(team, 'approved')}
                              >
                                <i className="fas fa-check mr-1"></i>
                                Approve
                              </button>
                              <button
                                type="button"
                                className={`decision-btn deny ${decision === 'denied' ? 'active' : ''}`}
                                onClick={() => handleRoleDecisionChange(team, 'denied')}
                              >
                                <i className="fas fa-times mr-1"></i>
                                Deny
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted">This applicant has not selected any specific roles.</p>
                  )}
                </div>

                <div className="admin-response">
                  <h5>Response to Applicant</h5>
                  <textarea
                    id="adminResponseNote"
                    className="form-control"
                    rows={3}
                    placeholder="Add an optional note for the candidate..."
                    value={adminResponseNote}
                    onChange={(e) => setAdminResponseNote(e.target.value)}
                  ></textarea>
                  <small className="text-muted">This note is included in the summary sent to the candidate.</small>
                </div>

                <div className="decision-preview">
                  <h5>Decision Summary Preview</h5>
                  {appliedTeamsForDecision.length === 0 ? (
                    <p className="text-muted">No roles selected yet.</p>
                  ) : (
                    <div className="decision-preview-list">
                      {appliedTeamsForDecision.map(team => {
                        const previewDecision = roleDecisions[team] || 'pending';
                        return (
                          <div key={team} className={`decision-preview-row status-${previewDecision}`}>
                            <span className="decision-team-name">{formatTeamName(team)}</span>
                            <span className={`decision-team-status status-${previewDecision}`}>
                              {previewDecision === 'approved' ? 'Approved' : previewDecision === 'denied' ? 'Denied' : 'Pending'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <small className="text-muted">Summary and note are delivered to the applicant's inbox and preferred contact methods.</small>
                </div>

                {decisionError && (
                  <div className="alert alert-danger decision-alert">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {decisionError}
                  </div>
                )}
              </div>

            </div>

            <div className="modal-footer application-actions">
              <button
                className="btn btn-primary"
                onClick={handleSubmitApplicationDecision}
                disabled={decisionSubmitting}
              >
                {decisionSubmitting ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Sending Decision...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-1"></i>
                    Submit Decision
                  </>
                )}
              </button>
              <button
                className="btn btn-outline"
                onClick={closeApplicationModal}
                disabled={decisionSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
              <p>Are you sure you want to cancel this {cancelItemType === 'registration' ? 'registration' : 'volunteer signup'}?</p>
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
          padding: 1.5rem;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .empty-icon {
          font-size: 3rem;
          color: #ddd;
          margin-bottom: 1.5rem;
        }
        
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
          justify-content: space-around;
          padding: 0.5rem;
          background-color: #f8f8f8;
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

        .status-header.status-approved {
          background-color: #ecfdf5;
          border-bottom: 2px solid #10b981;
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

        .status-submitted .status-icon, .status-pending .status-icon {
          background-color: #f59e0b;
          color: white;
        }

        .status-approved .status-icon {
          background-color: #10b981;
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

        .status-pill.status-approved {
          background-color: #ecfdf5;
          color: #0a866c;
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
        
        @media (max-width: 992px) {
          .events-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
        }
        
        @media (max-width: 768px) {
          .nav-tabs {
            flex-direction: column;
          }
          
          .nav-tab {
            padding: 0.8rem 1rem;
            border-bottom: none;
            border-left: 3px solid transparent;
          }
          
          .nav-tab.active {
            border-bottom: none;
            border-left-color: var(--primary);
          }
          
          .events-grid {
            grid-template-columns: 1fr;
          }
        }

        .admin-decision-panel {
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

        /* Messaging Panel Styles */
        .messaging-panel {
          max-width: 800px;
          margin: 0 auto;
        }

        .messaging-mode {
          margin-bottom: 2rem;
        }

        .mode-selector {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .mode-btn {
          padding: 1rem 1.5rem;
          border: 2px solid #e5e7eb;
          background-color: white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          font-weight: 600;
          flex: 1;
        }

        .mode-btn:hover {
          border-color: var(--primary);
          background-color: #f8f9fa;
        }

        .mode-btn.active {
          border-color: var(--primary);
          background-color: var(--primary);
          color: white;
        }

        .email-input-section, .category-selection {
          margin-bottom: 2rem;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background-color: #f8f9fa;
        }

        .email-count, .category-count {
          text-align: right;
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .category-card {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background-color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .category-card:hover {
          border-color: var(--primary);
          background-color: #f0f7ff;
        }

        .category-card input[type="checkbox"] {
          margin-top: 0.125rem;
        }

        .category-card input[type="checkbox"]:checked + .category-info {
          color: var(--primary);
        }

        .category-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .category-info small {
          color: #6b7280;
          font-size: 0.8rem;
        }

        .message-content {
          margin-bottom: 2rem;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .delivery-channels {
          margin-bottom: 2rem;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background-color: #f9fafb;
        }

        .channel-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .channel-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background-color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .channel-option:hover {
          border-color: var(--secondary);
          background-color: #fef7f0;
        }

        .channel-option input[type="checkbox"]:checked + .channel-info {
          color: var(--secondary);
          font-weight: 600;
        }

        .channel-summary {
          margin-top: 1rem;
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .alert-danger {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .alert-success {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .messaging-actions {
          text-align: center;
        }

        .btn-lg {
          padding: 1rem 2rem;
          font-size: 1.125rem;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .mode-selector {
            flex-direction: column;
          }

          .category-grid {
            grid-template-columns: 1fr;
          }

          .channel-options {
            grid-template-columns: 1fr;
          }
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














