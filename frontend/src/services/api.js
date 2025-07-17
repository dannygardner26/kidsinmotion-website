import { auth } from '../firebaseConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getAuthToken() {
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
}

export const apiService = new ApiService();
export default apiService;