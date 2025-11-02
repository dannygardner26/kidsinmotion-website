package com.example.restservice.model.firestore;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * Firestore-compatible Volunteer model
 */
public class VolunteerFirestore {

    private String id; // Firestore document ID
    private String userId; // Reference to User document ID (firebaseUid)
    private String eventId; // Reference to Event document ID
    private String role; // e.g., "Event Helper", "Setup Crew", "Photographer"
    private String signupDate; // Store as ISO string
    private String status; // CONFIRMED, PENDING, CANCELLED, COMPLETED
    private String availability;
    private String skills;
    private String notes;
    private Long createdTimestamp;
    private Long updatedTimestamp;

    // Additional denormalized fields for easy querying
    private String userEmail;
    private String userFirstName;
    private String userLastName;
    private String userPhoneNumber;
    private String userUsername;
    private String userFullName;
    private String eventName;
    private String eventDate;

    public VolunteerFirestore() {
        this.createdTimestamp = System.currentTimeMillis();
        this.updatedTimestamp = System.currentTimeMillis();
        this.status = "CONFIRMED"; // Default status
    }

    public VolunteerFirestore(String userId, String eventId, String role) {
        this();
        this.userId = userId;
        this.eventId = eventId;
        this.role = role;
        this.signupDate = LocalDate.now().toString();
    }

    // Convert to Map for Firestore storage
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("userId", userId);
        map.put("eventId", eventId);
        map.put("role", role);
        map.put("signupDate", signupDate);
        map.put("status", status);
        map.put("availability", availability);
        map.put("skills", skills);
        map.put("notes", notes);
        map.put("createdTimestamp", createdTimestamp);
        map.put("updatedTimestamp", System.currentTimeMillis());

        // Denormalized fields for easier querying
        map.put("userEmail", userEmail);
        map.put("userFirstName", userFirstName);
        map.put("userLastName", userLastName);
        map.put("userPhoneNumber", userPhoneNumber);
        map.put("userUsername", userUsername);
        map.put("userFullName", userFullName);
        map.put("eventName", eventName);
        map.put("eventDate", eventDate);

        return map;
    }

    // Create from Firestore Map
    public static VolunteerFirestore fromMap(Map<String, Object> map, String documentId) {
        VolunteerFirestore volunteer = new VolunteerFirestore();
        volunteer.setId(documentId);
        volunteer.setUserId((String) map.get("userId"));
        volunteer.setEventId((String) map.get("eventId"));
        volunteer.setRole((String) map.get("role"));
        volunteer.setSignupDate((String) map.get("signupDate"));
        volunteer.setStatus((String) map.get("status"));
        volunteer.setAvailability((String) map.get("availability"));
        volunteer.setSkills((String) map.get("skills"));
        volunteer.setNotes((String) map.get("notes"));
        volunteer.setCreatedTimestamp(map.get("createdTimestamp") != null ? (Long) map.get("createdTimestamp") : System.currentTimeMillis());
        volunteer.setUpdatedTimestamp(map.get("updatedTimestamp") != null ? (Long) map.get("updatedTimestamp") : System.currentTimeMillis());

        // Denormalized fields
        volunteer.setUserEmail((String) map.get("userEmail"));
        volunteer.setUserFirstName((String) map.get("userFirstName"));
        volunteer.setUserLastName((String) map.get("userLastName"));
        volunteer.setUserPhoneNumber((String) map.get("userPhoneNumber"));
        volunteer.setUserUsername((String) map.get("userUsername"));
        volunteer.setUserFullName((String) map.get("userFullName"));
        volunteer.setEventName((String) map.get("eventName"));
        volunteer.setEventDate((String) map.get("eventDate"));

        return volunteer;
    }

    // Convenience methods for LocalDate conversion
    public LocalDate getSignupDateAsLocalDate() {
        return signupDate != null ? LocalDate.parse(signupDate) : null;
    }

    public void setSignupDateFromLocalDate(LocalDate localDate) {
        this.signupDate = localDate != null ? localDate.toString() : null;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getSignupDate() { return signupDate; }
    public void setSignupDate(String signupDate) { this.signupDate = signupDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Long getCreatedTimestamp() { return createdTimestamp; }
    public void setCreatedTimestamp(Long createdTimestamp) { this.createdTimestamp = createdTimestamp; }

    public Long getUpdatedTimestamp() { return updatedTimestamp; }
    public void setUpdatedTimestamp(Long updatedTimestamp) { this.updatedTimestamp = updatedTimestamp; }

    // Denormalized fields getters and setters
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserFirstName() { return userFirstName; }
    public void setUserFirstName(String userFirstName) { this.userFirstName = userFirstName; }

    public String getUserLastName() { return userLastName; }
    public void setUserLastName(String userLastName) { this.userLastName = userLastName; }

    public String getUserPhoneNumber() { return userPhoneNumber; }
    public void setUserPhoneNumber(String userPhoneNumber) { this.userPhoneNumber = userPhoneNumber; }

    public String getUserUsername() { return userUsername; }
    public void setUserUsername(String userUsername) { this.userUsername = userUsername; }

    public String getUserFullName() { return userFullName; }
    public void setUserFullName(String userFullName) { this.userFullName = userFullName; }

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public String getEventDate() { return eventDate; }
    public void setEventDate(String eventDate) { this.eventDate = eventDate; }
}