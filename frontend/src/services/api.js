import { auth } from '../firebaseConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

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
      return await user.getIdToken();
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
    const response = await fetch(`${this.baseURL}/events`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getUpcomingEvents() {
    // Public endpoint - no auth required
    const response = await fetch(`${this.baseURL}/events/upcoming`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getEvent(id) {
    // Public endpoint - no auth required
    const response = await fetch(`${this.baseURL}/events/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async createEvent(eventData) {
    return this.makeRequest('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id, eventData) {
    return this.makeRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(id) {
    return this.makeRequest(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Participant endpoints
  async getMyRegistrations() {
    return this.makeRequest('/participants/me');
  }

  async registerForEvent(registrationData) {
    return this.makeRequest('/participants', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  }

  async cancelRegistration(registrationId) {
    return this.makeRequest(`/participants/${registrationId}`, {
      method: 'DELETE',
    });
  }

  async getEventParticipants(eventId) {
    return this.makeRequest(`/participants/event/${eventId}`);
  }

  // Volunteer endpoints
  async getMyVolunteerSignups() {
    return this.makeRequest('/volunteers/me');
  }

  async volunteerForEvent(volunteerData) {
    return this.makeRequest('/volunteers', {
      method: 'POST',
      body: JSON.stringify(volunteerData),
    });
  }

  async cancelVolunteerSignup(volunteerId) {
    return this.makeRequest(`/volunteers/${volunteerId}`, {
      method: 'DELETE',
    });
  }

  async getEventVolunteers(eventId) {
    return this.makeRequest(`/volunteers/event/${eventId}`);
  }

  async updateVolunteerStatus(volunteerId, status) {
    return this.makeRequest(`/volunteers/${volunteerId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Announcement endpoints
  async getActiveAnnouncements() {
    // Public endpoint - no auth required
    const response = await fetch(`${this.baseURL}/announcements/active`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getRecentAnnouncements() {
    // Public endpoint - no auth required
    const response = await fetch(`${this.baseURL}/announcements/recent`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
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
    return this.makeRequest('/messages/inbox');
  }

  async sendMessage(userId, messageData) {
    return this.makeRequest(`/messages/send/${userId}`, {
      method: 'POST',
      body: JSON.stringify(messageData),
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

  async getAllUsers() {
    return this.makeRequest('/users/all');
  }
}

export const apiService = new ApiService();
export default apiService;