<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kids In Motion API Tester</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      margin-bottom: 20px;
    }
    .container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .card {
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      background-color: #f9f9f9;
    }
    .card h2 {
      margin-top: 0;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    button {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 10px 15px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
      margin: 4px 2px;
      cursor: pointer;
      border-radius: 4px;
    }
    button:hover {
      background-color: #45a049;
    }
    .input-group {
      margin-bottom: 10px;
    }
    label {
      display: block;
      margin-bottom: 5px;
    }
    input, select, textarea {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .response {
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      max-height: 300px;
      overflow-y: auto;
      white-space: pre-wrap;
      margin-top: 10px;
    }
    .error {
      color: #D8000C;
      background-color: #FFD2D2;
      padding: 10px;
      margin-top: 10px;
      border-radius: 4px;
    }
    .success {
      color: #4F8A10;
      background-color: #DFF2BF;
      padding: 10px;
      margin-top: 10px;
      border-radius: 4px;
    }
    .tabs {
      display: flex;
      border-bottom: 1px solid #ddd;
      margin-bottom: 20px;
    }
    .tab {
      padding: 10px 20px;
      cursor: pointer;
      background-color: #f1f1f1;
      border: 1px solid #ddd;
      border-bottom: none;
      margin-right: 5px;
      border-radius: 5px 5px 0 0;
    }
    .tab.active {
      background-color: white;
      border-bottom: 1px solid white;
      margin-bottom: -1px;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
  </style>
</head>
<body>
  <h1>Kids In Motion API Tester</h1>
  
  <div class="tabs">
    <div class="tab active" onclick="openTab(event, 'auth')">Authentication</div>
    <div class="tab" onclick="openTab(event, 'events')">Events</div>
    <div class="tab" onclick="openTab(event, 'participants')">Participants</div>
    <div class="tab" onclick="openTab(event, 'volunteers')">Volunteers</div>
    <div class="tab" onclick="openTab(event, 'users')">Users</div>
  </div>
  
  <div class="container">
    <!-- Authentication Tab -->
    <div id="auth" class="tab-content active">
      <div class="card">
        <h2>Login</h2>
        <div class="input-group">
          <label for="login-email">Email:</label>
          <input type="email" id="login-email" value="admin@kidsinmotion.org">
        </div>
        <div class="input-group">
          <label for="login-password">Password:</label>
          <input type="password" id="login-password" value="kids12345INMOTION">
        </div>
        <button onclick="login()">Login</button>
        <div id="login-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Register</h2>
        <div class="input-group">
          <label for="register-email">Email:</label>
          <input type="email" id="register-email" value="new@example.com">
        </div>
        <div class="input-group">
          <label for="register-password">Password:</label>
          <input type="password" id="register-password" value="password123">
        </div>
        <div class="input-group">
          <label for="register-firstName">First Name:</label>
          <input type="text" id="register-firstName" value="New">
        </div>
        <div class="input-group">
          <label for="register-lastName">Last Name:</label>
          <input type="text" id="register-lastName" value="User">
        </div>
        <div class="input-group">
          <label for="register-role">Role:</label>
          <select id="register-role">
            <option value="PARENT">PARENT</option>
            <option value="VOLUNTEER">VOLUNTEER</option>
          </select>
        </div>
        <div class="input-group">
          <label for="register-phoneNumber">Phone Number:</label>
          <input type="text" id="register-phoneNumber" value="555-123-4567">
        </div>
        <button onclick="register()">Register</button>
        <div id="register-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Get User Profile</h2>
        <button onclick="getProfile()">Get Profile</button>
        <div id="profile-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Logout</h2>
        <button onclick="logout()">Logout</button>
        <div id="logout-response" class="response"></div>
      </div>
    </div>
    
    <!-- Events Tab -->
    <div id="events" class="tab-content">
      <div class="card">
        <h2>Get All Events</h2>
        <button onclick="getAllEvents()">Get All Events</button>
        <div id="all-events-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Get Upcoming Events</h2>
        <button onclick="getUpcomingEvents()">Get Upcoming Events</button>
        <div id="upcoming-events-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Get Past Events</h2>
        <button onclick="getPastEvents()">Get Past Events</button>
        <div id="past-events-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Get Events Needing Volunteers</h2>
        <button onclick="getEventsNeedingVolunteers()">Get Events Needing Volunteers</button>
        <div id="volunteer-events-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Get Event by ID</h2>
        <div class="input-group">
          <label for="event-id">Event ID:</label>
          <input type="number" id="event-id" value="1">
        </div>
        <button onclick="getEventById()">Get Event</button>
        <div id="event-by-id-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Create Event (Admin Only)</h2>
        <div class="input-group">
          <label for="event-title">Title:</label>
          <input type="text" id="event-title" value="New Test Event">
        </div>
        <div class="input-group">
          <label for="event-description">Description:</label>
          <textarea id="event-description">This is a test event created via API</textarea>
        </div>
        <div class="input-group">
          <label for="event-type">Event Type:</label>
          <select id="event-type">
            <option value="CLINIC">CLINIC</option>
            <option value="TOURNAMENT">TOURNAMENT</option>
            <option value="CAMP">CAMP</option>
          </select>
        </div>
        <div class="input-group">
          <label for="event-sport">Sport Type:</label>
          <select id="event-sport">
            <option value="BASEBALL">BASEBALL</option>
            <option value="SOCCER">SOCCER</option>
            <option value="BASKETBALL">BASKETBALL</option>
          </select>
        </div>
        <div class="input-group">
          <label for="event-location">Location:</label>
          <input type="text" id="event-location" value="Test Location">
        </div>
        <div class="input-group">
          <label for="event-start">Start Date (YYYY-MM-DD HH:MM):</label>
          <input type="text" id="event-start" value="2025-05-01 09:00">
        </div>
        <div class="input-group">
          <label for="event-end">End Date (YYYY-MM-DD HH:MM):</label>
          <input type="text" id="event-end" value="2025-05-01 12:00">
        </div>
        <div class="input-group">
          <label for="event-max">Max Participants:</label>
          <input type="number" id="event-max" value="20">
        </div>
        <div class="input-group">
          <label for="event-needs-volunteers">Needs Volunteers:</label>
          <select id="event-needs-volunteers">
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div class="input-group">
          <label for="event-volunteer-count">Volunteer Count Needed:</label>
          <input type="number" id="event-volunteer-count" value="5">
        </div>
        <button onclick="createEvent()">Create Event</button>
        <div id="create-event-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Update Event (Admin Only)</h2>
        <div class="input-group">
          <label for="update-event-id">Event ID:</label>
          <input type="number" id="update-event-id" value="1">
        </div>
        <div class="input-group">
          <label for="update-event-title">Title:</label>
          <input type="text" id="update-event-title" value="Updated Test Event">
        </div>
        <div class="input-group">
          <label for="update-event-description">Description:</label>
          <textarea id="update-event-description">This is an updated test event</textarea>
        </div>
        <button onclick="updateEvent()">Update Event</button>
        <div id="update-event-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Delete Event (Admin Only)</h2>
        <div class="input-group">
          <label for="delete-event-id">Event ID:</label>
          <input type="number" id="delete-event-id" value="1">
        </div>
        <button onclick="deleteEvent()">Delete Event</button>
        <div id="delete-event-response" class="response"></div>
      </div>
    </div>
    
    <!-- Participants Tab -->
    <div id="participants" class="tab-content">
      <div class="card">
        <h2>Get My Participants</h2>
        <button onclick="getMyParticipants()">Get My Participants</button>
        <div id="my-participants-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Get Participants by Event ID (Admin Only)</h2>
        <div class="input-group">
          <label for="participants-event-id">Event ID:</label>
          <input type="number" id="participants-event-id" value="1">
        </div>
        <button onclick="getParticipantsByEventId()">Get Participants</button>
        <div id="participants-by-event-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Register Participant</h2>
        <div class="input-group">
          <label for="register-participant-event-id">Event ID:</label>
          <input type="number" id="register-participant-event-id" value="1">
        </div>
        <div class="input-group">
          <label for="register-participant-child-first">Child First Name:</label>
          <input type="text" id="register-participant-child-first" value="Test">
        </div>
        <div class="input-group">
          <label for="register-participant-child-last">Child Last Name:</label>
          <input type="text" id="register-participant-child-last" value="Child">
        </div>
        <div class="input-group">
          <label for="register-participant-child-age">Child Age:</label>
          <input type="number" id="register-participant-child-age" value="10">
        </div>
        <div class="input-group">
          <label for="register-participant-special-needs">Special Needs:</label>
          <textarea id="register-participant-special-needs">None</textarea>
        </div>
        <div class="input-group">
          <label for="register-participant-emergency">Emergency Contact:</label>
          <input type="text" id="register-participant-emergency" value="555-123-4567">
        </div>
        <button onclick="registerParticipant()">Register Participant</button>
        <div id="register-participant-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Cancel Registration</h2>
        <div class="input-group">
          <label for="cancel-participant-id">Participant ID:</label>
          <input type="number" id="cancel-participant-id" value="1">
        </div>
        <button onclick="cancelRegistration()">Cancel Registration</button>
        <div id="cancel-registration-response" class="response"></div>
      </div>
    </div>
    
    <!-- Volunteers Tab -->
    <div id="volunteers" class="tab-content">
      <div class="card">
        <h2>Get My Volunteer Signups</h2>
        <button onclick="getMyVolunteers()">Get My Volunteers</button>
        <div id="my-volunteers-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Get Volunteers by Event ID (Admin Only)</h2>
        <div class="input-group">
          <label for="volunteers-event-id">Event ID:</label>
          <input type="number" id="volunteers-event-id" value="1">
        </div>
        <button onclick="getVolunteersByEventId()">Get Volunteers</button>
        <div id="volunteers-by-event-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Get Volunteers by Status (Admin Only)</h2>
        <div class="input-group">
          <label for="volunteers-status">Status:</label>
          <select id="volunteers-status">
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
        </div>
        <button onclick="getVolunteersByStatus()">Get Volunteers</button>
        <div id="volunteers-by-status-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Sign Up Volunteer</h2>
        <div class="input-group">
          <label for="volunteer-event-id">Event ID:</label>
          <input type="number" id="volunteer-event-id" value="1">
        </div>
        <div class="input-group">
          <label for="volunteer-notes">Notes:</label>
          <textarea id="volunteer-notes">I'm available to help with this event.</textarea>
        </div>
        <button onclick="signUpVolunteer()">Sign Up</button>
        <div id="sign-up-volunteer-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Cancel Volunteer Signup</h2>
        <div class="input-group">
          <label for="cancel-volunteer-id">Volunteer ID:</label>
          <input type="number" id="cancel-volunteer-id" value="1">
        </div>
        <button onclick="cancelVolunteer()">Cancel Signup</button>
        <div id="cancel-volunteer-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Confirm Volunteer (Admin Only)</h2>
        <div class="input-group">
          <label for="confirm-volunteer-id">Volunteer ID:</label>
          <input type="number" id="confirm-volunteer-id" value="1">
        </div>
        <button onclick="confirmVolunteer()">Confirm Volunteer</button>
        <div id="confirm-volunteer-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Reject Volunteer (Admin Only)</h2>
        <div class="input-group">
          <label for="reject-volunteer-id">Volunteer ID:</label>
          <input type="number" id="reject-volunteer-id" value="1">
        </div>
        <button onclick="rejectVolunteer()">Reject Volunteer</button>
        <div id="reject-volunteer-response" class="response"></div>
      </div>
    </div>
    
    <!-- Users Tab -->
    <div id="users" class="tab-content">
      <div class="card">
        <h2>Get All Users (Admin Only)</h2>
        <button onclick="getAllUsers()">Get All Users</button>
        <div id="all-users-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Get User by ID (Admin Only)</h2>
        <div class="input-group">
          <label for="user-id">User ID:</label>
          <input type="number" id="user-id" value="1">
        </div>
        <button onclick="getUserById()">Get User</button>
        <div id="user-by-id-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Get Users by Role (Admin Only)</h2>
        <div class="input-group">
          <label for="users-role">Role:</label>
          <select id="users-role">
            <option value="PARENT">PARENT</option>
            <option value="VOLUNTEER">VOLUNTEER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <button onclick="getUsersByRole()">Get Users</button>
        <div id="users-by-role-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Update User (Admin Only)</h2>
        <div class="input-group">
          <label for="update-user-id">User ID:</label>
          <input type="number" id="update-user-id" value="1">
        </div>
        <div class="input-group">
          <label for="update-user-firstName">First Name:</label>
          <input type="text" id="update-user-firstName" value="Updated">
        </div>
        <div class="input-group">
          <label for="update-user-lastName">Last Name:</label>
          <input type="text" id="update-user-lastName" value="User">
        </div>
        <div class="input-group">
          <label for="update-user-role">Role:</label>
          <select id="update-user-role">
            <option value="PARENT">PARENT</option>
            <option value="VOLUNTEER">VOLUNTEER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <button onclick="updateUser()">Update User</button>
        <div id="update-user-response" class="response"></div>
      </div>
      
      <div class="card">
        <h2>Delete User (Admin Only)</h2>
        <div class="input-group">
          <label for="delete-user-id">User ID:</label>
          <input type="number" id="delete-user-id" value="1">
        </div>
        <button onclick="deleteUser()">Delete User</button>
        <div id="delete-user-response" class="response"></div>
      </div>
    </div>
  </div>
  
  <script>
    // Base URL for API endpoints
    const BASE_URL = 'http://localhost:8080/kidsinmotion/api';
    let token = localStorage.getItem('token') || '';
    
    // Set token if it exists
    if (token) {
      document.getElementById('login-response').textContent = 'Token found in storage: ' + token;
    }
    
    // Helper function to make API calls
    async function callApi(endpoint, method = 'GET', data = null) {
      const url = `${BASE_URL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add token to headers if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const options = {
        method,
        headers,
        credentials: 'include' // Include cookies
      };
      
      // Add body for non-GET requests
      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }
      
      try {
        const response = await fetch(url, options);
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
          // Try to get error message from response
          let errorMessage;
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`;
          } else {
            errorMessage = `Error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        // Return JSON if content-type is json, otherwise return text
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text();
        }
      } catch (error) {
        throw error;
      }
    }
    
    // Display response in the UI
    function displayResponse(elementId, data, isError = false) {
      const element = document.getElementById(elementId);
      
      if (isError) {
        element.className = 'error';
        element.textContent = data;
      } else {
        element.className = 'response';
        
        if (typeof data === 'object') {
          element.textContent = JSON.stringify(data, null, 2);
        } else {
          element.textContent = data;
        }
      }
      
      // Scroll to the response
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Tab functionality
    function openTab(evt, tabName) {
      // Hide all tab content
      const tabContents = document.getElementsByClassName('tab-content');
      for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].className = tabContents[i].className.replace(' active', '');
      }
      
      // Remove active class from all tabs
      const tabs = document.getElementsByClassName('tab');
      for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(' active', '');
      }
      
      // Show the specific tab content
      document.getElementById(tabName).className += ' active';
      
      // Add active class to the clicked button
      evt.currentTarget.className += ' active';
    }
    
    // Authentication Functions
    async function login() {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      try {
        const data = await callApi('/auth/login', 'POST', { email, password });
        token = data.token;
        localStorage.setItem('token', token);
        displayResponse('login-response', `Login successful! Token: ${token}`);
      } catch (error) {
        displayResponse('login-response', error.message, true);
      }
    }
    
    async function register() {
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const firstName = document.getElementById('register-firstName').value;
      const lastName = document.getElementById('register-lastName').value;
      const role = document.getElementById('register-role').value;
      const phoneNumber = document.getElementById('register-phoneNumber').value;
      
      try {
        const data = await callApi('/auth/register', 'POST', {
          email,
          password,
          firstName,
          lastName,
          role,
          phoneNumber
        });
        token = data.token;
        localStorage.setItem('token', token);
        displayResponse('register-response', `Registration successful! Token: ${token}`);
      } catch (error) {
        displayResponse('register-response', error.message, true);
      }
    }
    
    async function getProfile() {
      try {
        const data = await callApi('/auth/profile', 'GET');
        displayResponse('profile-response', data);
      } catch (error) {
        displayResponse('profile-response', error.message, true);
      }
    }
    
    async function logout() {
      try {
        const data = await callApi('/auth/logout', 'POST');
        token = '';
        localStorage.removeItem('token');
        displayResponse('logout-response', 'Logout successful!');
      } catch (error) {
        displayResponse('logout-response', error.message, true);
      }
    }
    
    // Events Functions
    async function getAllEvents() {
      try {
        const data = await callApi('/events', 'GET');
        displayResponse('all-events-response', data);
      } catch (error) {
        displayResponse('all-events-response', error.message, true);
      }
    }
    
    async function getUpcomingEvents() {
      try {
        const data = await callApi('/events/upcoming', 'GET');
        displayResponse('upcoming-events-response', data);
      } catch (error) {
        displayResponse('upcoming-events-response', error.message, true);
      }
    }
    
    async function getPastEvents() {
      try {
        const data = await callApi('/events/past', 'GET');
        displayResponse('past-events-response', data);
      } catch (error) {
        displayResponse('past-events-response', error.message, true);
      }
    }
    
    async function getEventsNeedingVolunteers() {
      try {
        const data = await callApi('/events/volunteers-needed', 'GET');
        displayResponse('volunteer-events-response', data);
      } catch (error) {
        displayResponse('volunteer-events-response', error.message, true);
      }
    }
    
    async function getEventById() {
      const eventId = document.getElementById('event-id').value;
      
      try {
        const data = await callApi(`/events/${eventId}`, 'GET');
        displayResponse('event-by-id-response', data);
      } catch (error) {
        displayResponse('event-by-id-response', error.message, true);
      }
    }
    
    async function createEvent() {
      const title = document.getElementById('event-title').value;
      const description = document.getElementById('event-description').value;
      const eventType = document.getElementById('event-type').value;
      const sportType = document.getElementById('event-sport').value;
      const location = document.getElementById('event-location').value;
      const startDateStr = document.getElementById('event-start').value;
      const endDateStr = document.getElementById('event-end').value;
      const maxParticipants = parseInt(document.getElementById('event-max').value);
      const needsVolunteers = document.getElementById('event-needs-volunteers').value === 'true';
      const volunteerCountNeeded = parseInt(document.getElementById('event-volunteer-count').value);
      
      // Convert date strings to ISO format
      const startDate = new Date(startDateStr).toISOString();
      const endDate = new Date(endDateStr).toISOString();
      
      try {
        const data = await callApi('/events', 'POST', {
          title,
          description,
          eventType,
          sportType,
          location,
          startDate,
          endDate,
          maxParticipants,
          needsVolunteers,
          volunteerCountNeeded
        });
        displayResponse('create-event-response', data);
      } catch (error) {
        displayResponse('create-event-response', error.message, true);
      }
    }
    
    async function updateEvent() {
      const eventId = document.getElementById('update-event-id').value;
      const title = document.getElementById('update-event-title').value;
      const description = document.getElementById('update-event-description').value;
      
      try {
        // First get the existing event
        const existingEvent = await callApi(`/events/${eventId}`, 'GET');
        
        // Update with new values
        const updatedEvent = {...existingEvent.event, title, description};
        
        const data = await callApi(`/events/${eventId}`, 'PUT', updatedEvent);
        displayResponse('update-event-response', data);
      } catch (error) {
        displayResponse('update-event-response', error.message, true);
      }
    }
    
    async function deleteEvent() {
      const eventId = document.getElementById('delete-event-id').value;
      
      try {
        const data = await callApi(`/events/${eventId}`, 'DELETE');
        displayResponse('delete-event-response', `Event ${eventId} deleted successfully!`);
      } catch (error) {
        displayResponse('delete-event-response', error.message, true);
      }
    }
    
    // Participants Functions
    async function getMyParticipants() {
      try {
        const data = await callApi('/participants/me', 'GET');
        displayResponse('my-participants-response', data);
      } catch (error) {
        displayResponse('my-participants-response', error.message, true);
      }
    }
    
    async function getParticipantsByEventId() {
      const eventId = document.getElementById('participants-event-id').value;
      
      try {
        const data = await callApi(`/events/${eventId}/participants`, 'GET');
        displayResponse('participants-by-event-response', data);
      } catch (error) {
        displayResponse('participants-by-event-response', error.message, true);
      }
    }
    
    async function registerParticipant() {
      const eventId = document.getElementById('register-participant-event-id').value;
      const childFirstName = document.getElementById('register-participant-child-first').value;
      const childLastName = document.getElementById('register-participant-child-last').value;
      const childAge = parseInt(document.getElementById('register-participant-child-age').value);
      const specialNeeds = document.getElementById('register-participant-special-needs').value;
      const emergencyContact = document.getElementById('register-participant-emergency').value;
      
      try {
        const data = await callApi(`/events/${eventId}/participants`, 'POST', {
          childFirstName,
          childLastName,
          childAge,
          specialNeeds,
          emergencyContact
        });
        displayResponse('register-participant-response', data);
      } catch (error) {
        displayResponse('register-participant-response', error.message, true);
      }
    }
    
    async function cancelRegistration() {
      const participantId = document.getElementById('cancel-participant-id').value;
      
      try {
        const data = await callApi(`/participants/${participantId}`, 'DELETE');
        displayResponse('cancel-registration-response', `Registration ${participantId} canceled successfully!`);
      } catch (error) {
        displayResponse('cancel-registration-response', error.message, true);
      }
    }
    
    // Volunteers Functions
    async function getMyVolunteers() {
      try {
        const data = await callApi('/volunteers/me', 'GET');
        displayResponse('my-volunteers-response', data);
      } catch (error) {
        displayResponse('my-volunteers-response', error.message, true);
      }
    }
    
    async function getVolunteersByEventId() {
      const eventId = document.getElementById('volunteers-event-id').value;
      
      try {
        const data = await callApi(`/events/${eventId}/volunteers`, 'GET');
        displayResponse('volunteers-by-event-response', data);
      } catch (error) {
        displayResponse('volunteers-by-event-response', error.message, true);
      }
    }
    
    async function getVolunteersByStatus() {
      const status = document.getElementById('volunteers-status').value;
      
      try {
        const data = await callApi(`/volunteers?status=${status}`, 'GET');
        displayResponse('volunteers-by-status-response', data);
      } catch (error) {
        displayResponse('volunteers-by-status-response', error.message, true);
      }
    }
    
    async function signUpVolunteer() {
      const eventId = document.getElementById('volunteer-event-id').value;
      const notes = document.getElementById('volunteer-notes').value;
      
      try {
        const data = await callApi(`/events/${eventId}/volunteers`, 'POST', { notes });
        displayResponse('sign-up-volunteer-response', data);
      } catch (error) {
        displayResponse('sign-up-volunteer-response', error.message, true);
      }
    }
    
    async function cancelVolunteer() {
      const volunteerId = document.getElementById('cancel-volunteer-id').value;
      
      try {
        const data = await callApi(`/volunteers/${volunteerId}`, 'DELETE');
        displayResponse('cancel-volunteer-response', `Volunteer signup ${volunteerId} canceled successfully!`);
      } catch (error) {
        displayResponse('cancel-volunteer-response', error.message, true);
      }
    }
    
    async function confirmVolunteer() {
      const volunteerId = document.getElementById('confirm-volunteer-id').value;
      
      try {
        const data = await callApi(`/volunteers/${volunteerId}/confirm`, 'PUT');
        displayResponse('confirm-volunteer-response', `Volunteer ${volunteerId} confirmed successfully!`);
      } catch (error) {
        displayResponse('confirm-volunteer-response', error.message, true);
      }
    }
    
    async function rejectVolunteer() {
      const volunteerId = document.getElementById('reject-volunteer-id').value;
      
      try {
        const data = await callApi(`/volunteers/${volunteerId}/reject`, 'PUT');
        displayResponse('reject-volunteer-response', `Volunteer ${volunteerId} rejected successfully!`);
      } catch (error) {
        displayResponse('reject-volunteer-response', error.message, true);
      }
    }
    
    // Users Functions
    async function getAllUsers() {
      try {
        const data = await callApi('/users', 'GET');
        displayResponse('all-users-response', data);
      } catch (error) {
        displayResponse('all-users-response', error.message, true);
      }
    }
    
    async function getUserById() {
      const userId = document.getElementById('user-id').value;
      
      try {
        const data = await callApi(`/users/${userId}`, 'GET');
        displayResponse('user-by-id-response', data);
      } catch (error) {
        displayResponse('user-by-id-response', error.message, true);
      }
    }
    
    async function getUsersByRole() {
      const role = document.getElementById('users-role').value;
      
      try {
        const data = await callApi(`/users/role/${role}`, 'GET');
        displayResponse('users-by-role-response', data);
      } catch (error) {
        displayResponse('users-by-role-response', error.message, true);
      }
    }
    
    async function updateUser() {
      const userId = document.getElementById('update-user-id').value;
      const firstName = document.getElementById('update-user-firstName').value;
      const lastName = document.getElementById('update-user-lastName').value;
      const role = document.getElementById('update-user-role').value;
      
      try {
        // First get the existing user
        const existingUser = await callApi(`/users/${userId}`, 'GET');
        
        // Update with new values
        const updatedUser = {
          ...existingUser,
          firstName,
          lastName,
          role
        };
        
        const data = await callApi(`/users/${userId}`, 'PUT', updatedUser);
        displayResponse('update-user-response', data);
      } catch (error) {
        displayResponse('update-user-response', error.message, true);
      }
    }
    
    async function deleteUser() {
      const userId = document.getElementById('delete-user-id').value;
      
      try {
        const data = await callApi(`/users/${userId}`, 'DELETE');
        displayResponse('delete-user-response', `User ${userId} deleted successfully!`);
      } catch (error) {
        displayResponse('delete-user-response', error.message, true);
      }
    }
    
    // Test all endpoints sequentially
    async function testAllEndpoints() {
      const results = [];
      const addResult = (name, success, message) => {
        results.push({ name, success, message });
        updateTestResults();
      };
      
      const updateTestResults = () => {
        const element = document.getElementById('test-all-results');
        let html = '<h3>Test Results</h3>';
        html += '<table border="1" style="width: 100%; border-collapse: collapse;">';
        html += '<tr><th>Endpoint</th><th>Status</th><th>Message</th></tr>';
        
        results.forEach(result => {
          const color = result.success ? 'green' : 'red';
          const status = result.success ? 'Success' : 'Failed';
          html += `<tr>
                    <td>${result.name}</td>
                    <td style="color: ${color};">${status}</td>
                    <td>${result.message}</td>
                  </tr>`;
        });
        
        html += '</table>';
        element.innerHTML = html;
      };
      
      // Start tests
      try {
        // Login test
        try {
          const loginData = await callApi('/auth/login', 'POST', { 
            email: 'admin@kidsinmotion.org', 
            password: 'kids12345INMOTION' 
          });
          token = loginData.token;
          localStorage.setItem('token', token);
          addResult('Login', true, 'Successfully logged in as admin');
        } catch (error) {
          addResult('Login', false, error.message);
        }
        
        // Get all events
        try {
          const events = await callApi('/events', 'GET');
          addResult('Get All Events', true, `Retrieved ${events.length} events`);
        } catch (error) {
          addResult('Get All Events', false, error.message);
        }
        
        // Get upcoming events
        try {
          const events = await callApi('/events/upcoming', 'GET');
          addResult('Get Upcoming Events', true, `Retrieved ${events.length} upcoming events`);
        } catch (error) {
          addResult('Get Upcoming Events', false, error.message);
        }
        
        // Get past events
        try {
          const events = await callApi('/events/past', 'GET');
          addResult('Get Past Events', true, `Retrieved ${events.length} past events`);
        } catch (error) {
          addResult('Get Past Events', false, error.message);
        }
        
        // Create an event
        let newEventId;
        try {
          const event = {
            title: 'Test Automation Event',
            description: 'Created by the API tester',
            eventType: 'CLINIC',
            sportType: 'BASEBALL',
            location: 'Test Location',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 3 hours after start
            maxParticipants: 20,
            needsVolunteers: true,
            volunteerCountNeeded: 5
          };
          
          const newEvent = await callApi('/events', 'POST', event);
          newEventId = newEvent.id;
          addResult('Create Event', true, `Created event with ID ${newEventId}`);
        } catch (error) {
          addResult('Create Event', false, error.message);
        }
        
        // Get event by ID
        if (newEventId) {
          try {
            const event = await callApi(`/events/${newEventId}`, 'GET');
            addResult('Get Event by ID', true, `Retrieved event ${newEventId}`);
          } catch (error) {
            addResult('Get Event by ID', false, error.message);
          }
        }
        
        // Update event
        if (newEventId) {
          try {
            const event = await callApi(`/events/${newEventId}`, 'GET');
            const updatedEvent = {
              ...event.event,
              title: 'Updated Test Event',
              description: 'Updated by the API tester'
            };
            
            await callApi(`/events/${newEventId}`, 'PUT', updatedEvent);
            addResult('Update Event', true, `Updated event ${newEventId}`);
          } catch (error) {
            addResult('Update Event', false, error.message);
          }
        }
        
        // Register a participant
        let newParticipantId;
        if (newEventId) {
          try {
            const participant = {
              childFirstName: 'Test',
              childLastName: 'Child',
              childAge: 10,
              specialNeeds: 'None',
              emergencyContact: '555-123-4567'
            };
            
            const newParticipant = await callApi(`/events/${newEventId}/participants`, 'POST', participant);
            newParticipantId = newParticipant.id;
            addResult('Register Participant', true, `Registered participant with ID ${newParticipantId}`);
          } catch (error) {
            addResult('Register Participant', false, error.message);
          }
        }
        
        // Get participants by event ID
        if (newEventId) {
          try {
            const participants = await callApi(`/events/${newEventId}/participants`, 'GET');
            addResult('Get Participants by Event', true, `Retrieved ${participants.length} participants for event ${newEventId}`);
          } catch (error) {
            addResult('Get Participants by Event', false, error.message);
          }
        }
        
        // Sign up as a volunteer
        let newVolunteerId;
        if (newEventId) {
          try {
            const volunteer = {
              notes: 'Test volunteer signup by API tester'
            };
            
            const newVolunteer = await callApi(`/events/${newEventId}/volunteers`, 'POST', volunteer);
            newVolunteerId = newVolunteer.id;
            addResult('Sign Up Volunteer', true, `Signed up as volunteer with ID ${newVolunteerId}`);
          } catch (error) {
            addResult('Sign Up Volunteer', false, error.message);
          }
        }
        
        // Get volunteers by event ID
        if (newEventId) {
          try {
            const volunteers = await callApi(`/events/${newEventId}/volunteers`, 'GET');
            addResult('Get Volunteers by Event', true, `Retrieved ${volunteers.length} volunteers for event ${newEventId}`);
          } catch (error) {
            addResult('Get Volunteers by Event', false, error.message);
          }
        }
        
        // Confirm volunteer
        if (newVolunteerId) {
          try {
            await callApi(`/volunteers/${newVolunteerId}/confirm`, 'PUT');
            addResult('Confirm Volunteer', true, `Confirmed volunteer ${newVolunteerId}`);
          } catch (error) {
            addResult('Confirm Volunteer', false, error.message);
          }
        }
        
        // Clean up - Delete participant
        if (newParticipantId) {
          try {
            await callApi(`/participants/${newParticipantId}`, 'DELETE');
            addResult('Delete Participant', true, `Deleted participant ${newParticipantId}`);
          } catch (error) {
            addResult('Delete Participant', false, error.message);
          }
        }
        
        // Clean up - Cancel volunteer
        if (newVolunteerId) {
          try {
            await callApi(`/volunteers/${newVolunteerId}`, 'DELETE');
            addResult('Cancel Volunteer', true, `Canceled volunteer ${newVolunteerId}`);
          } catch (error) {
            addResult('Cancel Volunteer', false, error.message);
          }
        }
        
        // Clean up - Delete event
        if (newEventId) {
          try {
            await callApi(`/events/${newEventId}`, 'DELETE');
            addResult('Delete Event', true, `Deleted event ${newEventId}`);
          } catch (error) {
            addResult('Delete Event', false, error.message);
          }
        }
        
        // Logout
        try {
          await callApi('/auth/logout', 'POST');
          token = '';
          localStorage.removeItem('token');
          addResult('Logout', true, 'Successfully logged out');
        } catch (error) {
          addResult('Logout', false, error.message);
        }
        
      } catch (error) {
        console.error('Error running tests:', error);
      }
    }
  </script>
</body>
</html>