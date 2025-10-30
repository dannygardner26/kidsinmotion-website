import { auth, db } from '../firebaseConfig';
import { parseEmergencyContact } from '../utils/emergencyContactParser';
import firestoreEventService from './firestoreEventService';
import firestoreParticipantService from './firestoreParticipantService';
import firestoreChildService from './firestoreChildService';
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8082/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getAuthToken() {
    // Check for test admin user first
    const isTestAdmin = localStorage.getItem('isTestAdmin');
    if (isTestAdmin === 'true') {
      // For test admin, return a mock token or skip token validation
      return 'test-admin-token';
    }

    const user = auth.currentUser;
    if (user) {
      try {
        // Get token with caching (false = use cached if valid)
        return await user.getIdToken(false);
      } catch (error) {
        console.warn('Token refresh error, retrying:', error.message);
        // Try one more time with force refresh
        return await user.getIdToken(true);
      }
    }
    throw new Error('User not authenticated');
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const token = await this.getAuthToken();
      
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      };

      const tokenPreview = token ? `${token.slice(0, 8)}...` : 'none';
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[api] ${options.method || 'GET'} ${endpoint} token: ${tokenPreview}`);
        console.log('[api] headers', config.headers);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async checkUser() {
    return this.makeRequest('/auth/check-user', { method: 'POST' });
  }

  async syncUser() {
    return this.makeRequest('/auth/sync-user', { method: 'POST' });
  }

  async getUserProfile() {
    return this.makeRequest('/auth/profile');
  }

  async updateUserProfile(profileData) {
    return this.makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Event endpoints
  async getEvents() {
    // Public endpoint - no auth required
    try {
      const response = await fetch(`${this.baseURL}/events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('getEvents response:', data);
      return data;
    } catch (error) {
      console.error('getEvents error:', error);
      throw error;
    }
  }

  async getAllEvents() {
    return this.getEvents();
  }

  async getUpcomingEvents() {
    // Public endpoint - no auth required
    try {
      const response = await fetch(`${this.baseURL}/events/upcoming`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('getUpcomingEvents response:', data);
      return data;
    } catch (error) {
      console.error('getUpcomingEvents error:', error);
      throw error;
    }
  }

  async getEvent(id) {
    // Public endpoint - no auth required, with Firestore fallback
    try {
      const response = await fetch(`${this.baseURL}/events/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('getEvent response:', data);
      return data;
    } catch (error) {
      console.log('getEvent API failed, trying Firestore:', error);
      try {
        const firestoreData = await firestoreEventService.getEvent(id);
        console.log('getEvent Firestore fallback succeeded:', firestoreData);
        return firestoreData;
      } catch (firestoreError) {
        console.error('getEvent Firestore fallback failed:', firestoreError);
        throw error; // Throw original API error
      }
    }
  }

  async getEventStats() {
    return this.makeRequest('/admin/events/stats');
  }

  async createEvent(eventData) {
    return this.makeRequest('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id, eventData) {
    console.log('Updating event', id, 'with data:', eventData);
    const response = await this.makeRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
    console.log('Event updated successfully:', response);
    return response;
  }

  async deleteEvent(id) {
    return this.makeRequest(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  async getEventById(id) {
    return this.makeRequest(`/events/${id}`);
  }

  // Participant endpoints
  async getMyRegistrations() {
    return this.makeRequest('/participants/me');
  }

  async registerForEvent(registrationData) {
    // Transform data structure if needed (backward compatibility)
    let transformedData = { ...registrationData };

    // Check if old format is being used and transform it
    if (registrationData.childName && !registrationData.participantFirstName) {
      const nameParts = registrationData.childName.split(' ');
      transformedData.participantFirstName = nameParts[0] || '';
      transformedData.participantLastName = nameParts.slice(1).join(' ') || '';

      // Transform other fields
      if (registrationData.childAge) {
        transformedData.participantAge = registrationData.childAge;
      }
      if (registrationData.medicalConcerns) {
        transformedData.medicalInfo = registrationData.medicalConcerns;
      }
      if (registrationData.additionalInformation) {
        transformedData.specialRequests = registrationData.additionalInformation;
      }

      // Parse emergency contact using shared utility function
      if (registrationData.emergencyContact) {
        const parsedContact = parseEmergencyContact(registrationData.emergencyContact);
        transformedData.emergencyContactName = parsedContact.name;
        transformedData.emergencyContactPhone = parsedContact.phone;
      }

      // Calculate age group
      if (transformedData.participantAge && !transformedData.participantAgeGroup) {
        const age = transformedData.participantAge;
        if (age >= 4 && age <= 6) transformedData.participantAgeGroup = '4-6 years';
        else if (age >= 7 && age <= 9) transformedData.participantAgeGroup = '7-9 years';
        else if (age >= 10 && age <= 12) transformedData.participantAgeGroup = '10-12 years';
        else if (age >= 13 && age <= 15) transformedData.participantAgeGroup = '13-15 years';
        else if (age >= 16 && age <= 18) transformedData.participantAgeGroup = '16-18 years';
        else transformedData.participantAgeGroup = `${age} years`;
      }

      // Remove old format fields
      delete transformedData.childName;
      delete transformedData.childAge;
      delete transformedData.allergies;
      delete transformedData.needsFood;
      delete transformedData.medicalConcerns;
      delete transformedData.additionalInformation;
      delete transformedData.emergencyContact;
    }

    // Coerce participantAge to number before validation
    if (transformedData.participantAge !== null && transformedData.participantAge !== undefined) {
      transformedData.participantAge = parseInt(transformedData.participantAge, 10);
    }

    // Validate required fields with robust checks
    const validationErrors = [];

    // Check string fields - must exist and not be empty after trimming
    const stringFields = ['eventId', 'participantFirstName', 'participantLastName'];
    stringFields.forEach(field => {
      const value = transformedData[field];
      if (typeof value !== 'string' || value.trim() === '') {
        validationErrors.push(field);
      }
    });

    // Check participantAge - must be a finite number and not null/undefined
    const age = transformedData.participantAge;
    if (age === null || age === undefined || !Number.isFinite(age)) {
      validationErrors.push('participantAge');
    }

    if (validationErrors.length > 0) {
      console.error('Missing or invalid required fields for registration:', validationErrors);
      console.error('Registration data:', transformedData);
      throw new Error(`Missing or invalid required fields: ${validationErrors.join(', ')}`);
    }

    // Debug logging for data being sent
    if (process.env.NODE_ENV !== 'production') {
      console.log('[api] Registration data being sent to backend:', transformedData);
    }

    try {
      return await this.makeRequest('/participants', {
        method: 'POST',
        body: JSON.stringify(transformedData),
      });
    } catch (error) {
      console.log('registerForEvent API failed, trying Firestore:', error);
      try {
        // Get current user's Firebase UID
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Transform API data format to Firestore format
        const firestoreData = {
          eventId: transformedData.eventId,
          parentFirebaseUid: user.uid,
          parentEmail: user.email,
          childFirstName: transformedData.participantFirstName,
          childLastName: transformedData.participantLastName,
          childAge: transformedData.participantAge,
          childDateOfBirth: transformedData.participantDateOfBirth || '',
          emergencyContact: `${transformedData.emergencyContactName || ''} - ${transformedData.emergencyContactPhone || ''}`.trim(),
          medicalInfo: transformedData.medicalInfo || '',
          specialInstructions: transformedData.specialRequests || ''
        };

        const firestoreResult = await firestoreParticipantService.registerChild(firestoreData);
        console.log('registerForEvent Firestore fallback succeeded:', firestoreResult);
        return firestoreResult;
      } catch (firestoreError) {
        console.error('registerForEvent Firestore fallback failed:', firestoreError);
        throw error; // Throw original API error
      }
    }
  }

  async cancelRegistration(registrationId) {
    return this.makeRequest(`/participants/${registrationId}`, {
      method: 'DELETE',
    });
  }

  async getEventParticipants(eventId) {
    return this.makeRequest(`/participants/event/${eventId}`);
  }

  async updateParticipantAttendance(participantId, isPresent) {
    return this.makeRequest(`/participants/${participantId}/attendance`, {
      method: 'PUT',
      body: JSON.stringify({ present: isPresent }),
    });
  }

  // Volunteer endpoints
  async getMyVolunteerSignups() {
    return this.makeRequest('/volunteers/me');
  }

  async volunteerForEvent(volunteerData) {
    try {
      return await this.makeRequest('/volunteers', {
        method: 'POST',
        body: JSON.stringify(volunteerData),
      });
    } catch (error) {
      console.log('volunteerForEvent API failed, trying Firestore:', error);
      try {
        // Get current user's Firebase UID
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Create volunteer entry in Firestore
        const firestoreData = {
          eventId: volunteerData.eventId,
          volunteerFirebaseUid: user.uid,
          volunteerEmail: user.email,
          firstName: volunteerData.firstName || '',
          lastName: volunteerData.lastName || '',
          phone: volunteerData.phone || '',
          experience: volunteerData.experience || '',
          availability: volunteerData.availability || '',
          specialSkills: volunteerData.specialSkills || '',
          signupDate: new Date().toISOString(),
          status: 'REGISTERED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Add to Firestore volunteers collection
        const docRef = await addDoc(collection(db, 'volunteers'), firestoreData);

        // Update event's allowedUserIds array to include the volunteer
        try {
          const eventRef = doc(db, 'events', volunteerData.eventId);
          await updateDoc(eventRef, {
            allowedUserIds: arrayUnion(user.uid)
          });
          console.log('Added volunteer to event allowedUserIds:', user.uid);
        } catch (error) {
          console.warn('Failed to update event allowedUserIds:', error);
          // Don't fail the signup if this update fails
        }

        const result = {
          id: docRef.id,
          ...firestoreData
        };

        console.log('volunteerForEvent Firestore fallback succeeded:', result);
        return result;
      } catch (firestoreError) {
        console.error('volunteerForEvent Firestore fallback failed:', firestoreError);
        throw error; // Throw original API error
      }
    }
  }

  async cancelVolunteerSignup(volunteerId) {
    return this.makeRequest(`/volunteers/${volunteerId}`, {
      method: 'DELETE',
    });
  }

  async getEventVolunteers(eventId) {
    try {
      const result = await this.makeRequest(`/volunteers/event/${eventId}`);
      return result;
    } catch (error) {
      console.error('getEventVolunteers error for event', eventId, ':', error);
      console.error('Error response:', error.response);
      throw error;
    }
  }

  async getAllVolunteersWithEvents() {
    return this.makeRequest('/volunteers/admin/all');
  }

  async updateVolunteerStatus(volunteerId, status) {
    return this.makeRequest(`/volunteers/${volunteerId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Announcement endpoints
  async getActiveAnnouncements() {
    try {
      return await this.makeRequest('/announcements/active');
    } catch (error) {
      console.warn('Active announcements endpoint not available, returning empty array');
      return [];
    }
  }

  async getRecentAnnouncements() {
    try {
      return await this.makeRequest('/announcements/recent');
    } catch (error) {
      console.warn('Recent announcements endpoint not available, returning empty array');
      return [];
    }
  }

  async getAnnouncementsByAudience(audience) {
    return this.makeRequest(`/announcements/by-audience/${audience}`);
  }

  async createAnnouncement(announcementData) {
    return this.makeRequest('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    });
  }

  async getAllAnnouncements() {
    return this.makeRequest('/announcements/admin/all');
  }

  async getAnnouncementById(id) {
    return this.makeRequest(`/announcements/${id}`);
  }

  async updateAnnouncement(id, announcementData) {
    return this.makeRequest(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(announcementData),
    });
  }

  async deleteAnnouncement(id) {
    return this.makeRequest(`/announcements/${id}`, {
      method: 'DELETE',
    });
  }

  async permanentlyDeleteAnnouncement(id) {
    return this.makeRequest(`/announcements/${id}/permanent`, {
      method: 'DELETE',
    });
  }

  async createSampleAnnouncement() {
    return this.makeRequest('/announcements/test/sample', {
      method: 'POST',
    });
  }

  // Inbox/Messaging Methods
  async getInboxMessages() {
    try {
      // Try to fetch inbox messages, fallback to empty if not available
      return await this.makeRequest('/messages/inbox');
    } catch (error) {
      // Handle 403 errors gracefully for inbox (expected when endpoint isn't available for regular users)
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        // Return null to indicate API is unavailable, let caller handle fallback
        return null;
      }
      throw error;
    }
  }

  async sendMessage(userId, messageData) {
    return this.makeRequest(`/messages/send/${userId}`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async broadcastMessage(broadcastPayload) {
    return this.makeRequest('/messages/broadcast', {
      method: 'POST',
      body: JSON.stringify(broadcastPayload),
    });
  }

  async markMessageAsRead(messageId) {
    return this.makeRequest(`/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  async deleteMessage(messageId) {
    return this.makeRequest(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async getRecipientPreview(category) {
    return this.makeRequest('/messages/recipients/preview', {
      method: 'POST',
      body: JSON.stringify({ category }),
    });
  }

  async getAllUsers() {
    return this.makeRequest('/users/all');
  }

  async updateUserAccount(userId, userData) {
    return this.makeRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Volunteer Employee endpoints
  async getAllVolunteerEmployees() {
    return this.makeRequest('/volunteer/admin/all');
  }


  async getVolunteerStatus() {
    return this.makeRequest('/volunteer/status');
  }

  async registerVolunteerEmployee(data) {
    return this.makeRequest('/volunteer/employee/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async updateVolunteerEmployeeStatus(volunteerEmployeeId, status, adminNotes = '') {
    return this.makeRequest('/volunteer/admin/update-status', {
      method: 'POST',
      body: JSON.stringify({
        volunteerEmployeeId,
        status,
        adminNotes
      }),
    });
  }

  // Children endpoints
  async getChildren() {
    try {
      return await this.makeRequest('/children');
    } catch (error) {
      console.log('getChildren API failed, trying Firestore:', error);
      try {
        const firestoreData = await firestoreChildService.getChildren();
        console.log('getChildren Firestore fallback succeeded:', firestoreData);
        return firestoreData;
      } catch (firestoreError) {
        console.error('getChildren Firestore fallback failed:', firestoreError);
        throw error; // Throw original API error
      }
    }
  }

  async getChild(id) {
    return this.makeRequest(`/children/${id}`);
  }

  async createChild(childData) {
    try {
      return await this.makeRequest('/children', {
        method: 'POST',
        body: JSON.stringify(childData),
      });
    } catch (error) {
      console.log('createChild API failed, trying Firestore:', error);
      try {
        const firestoreData = await firestoreChildService.createChild(childData);
        console.log('createChild Firestore fallback succeeded:', firestoreData);
        return firestoreData;
      } catch (firestoreError) {
        console.error('createChild Firestore fallback failed:', firestoreError);
        throw error; // Throw original API error
      }
    }
  }

  async updateChild(id, childData) {
    try {
      return await this.makeRequest(`/children/${id}`, {
        method: 'PUT',
        body: JSON.stringify(childData),
      });
    } catch (error) {
      console.log('updateChild API failed, trying Firestore:', error);
      try {
        const firestoreData = await firestoreChildService.updateChild(id, childData);
        console.log('updateChild Firestore fallback succeeded:', firestoreData);
        return firestoreData;
      } catch (firestoreError) {
        console.error('updateChild Firestore fallback failed:', firestoreError);
        throw error; // Throw original API error
      }
    }
  }

  async deleteChild(id) {
    try {
      return await this.makeRequest(`/children/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.log('deleteChild API failed, trying Firestore:', error);
      try {
        const firestoreData = await firestoreChildService.deleteChild(id);
        console.log('deleteChild Firestore fallback succeeded:', firestoreData);
        return firestoreData;
      } catch (firestoreError) {
        console.error('deleteChild Firestore fallback failed:', firestoreError);
        throw error; // Throw original API error
      }
    }
  }

}

export const apiService = new ApiService();
export default apiService;
