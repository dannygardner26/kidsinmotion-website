package com.example.restservice.model.firestore;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * Firestore-compatible Participant model
 */
public class ParticipantFirestore {

    private String id; // Firestore document ID
    private String childName;
    private String parentUserId; // Reference to User document ID (firebaseUid)
    private String eventId; // Reference to Event document ID
    private String registrationDate; // Store as ISO string
    private String status; // REGISTERED, WAITLISTED, CANCELLED, ATTENDED
    private Integer childAge;
    private String allergies;
    private String emergencyContact;
    private Boolean needsFood;
    private String medicalConcerns;
    private String additionalInformation;
    private Long createdTimestamp;
    private Long updatedTimestamp;

    // Additional fields for easy querying (denormalized data)
    private String parentUserEmail;
    private String parentUserFirstName;
    private String parentUserLastName;
    private String parentUserPhoneNumber;
    private String eventName;
    private String eventDate;
    private String ageGroup;
    private String grade;

    public ParticipantFirestore() {
        this.createdTimestamp = System.currentTimeMillis();
        this.updatedTimestamp = System.currentTimeMillis();
        this.status = "REGISTERED"; // Default status
        this.needsFood = false; // Default value
    }

    public ParticipantFirestore(String childName, String parentUserId, String eventId) {
        this();
        this.childName = childName;
        this.parentUserId = parentUserId;
        this.eventId = eventId;
        this.registrationDate = LocalDate.now().toString();
    }

    // Convert to Map for Firestore storage
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("childName", childName);
        map.put("parentUserId", parentUserId);
        map.put("eventId", eventId);
        map.put("registrationDate", registrationDate);
        map.put("status", status);
        map.put("childAge", childAge);
        map.put("allergies", allergies);
        map.put("emergencyContact", emergencyContact);
        map.put("needsFood", needsFood);
        map.put("medicalConcerns", medicalConcerns);
        map.put("additionalInformation", additionalInformation);
        map.put("createdTimestamp", createdTimestamp);
        map.put("updatedTimestamp", System.currentTimeMillis());

        // Denormalized fields for easier querying
        map.put("parentUserEmail", parentUserEmail);
        map.put("parentUserFirstName", parentUserFirstName);
        map.put("parentUserLastName", parentUserLastName);
        map.put("parentUserPhoneNumber", parentUserPhoneNumber);
        map.put("eventName", eventName);
        map.put("eventDate", eventDate);
        map.put("ageGroup", ageGroup);
        map.put("grade", grade);

        return map;
    }

    // Create from Firestore Map
    public static ParticipantFirestore fromMap(Map<String, Object> map, String documentId) {
        ParticipantFirestore participant = new ParticipantFirestore();
        participant.setId(documentId);
        participant.setChildName((String) map.get("childName"));
        participant.setParentUserId((String) map.get("parentUserId"));
        participant.setEventId((String) map.get("eventId"));
        participant.setRegistrationDate((String) map.get("registrationDate"));
        participant.setStatus((String) map.get("status"));
        participant.setChildAge(map.get("childAge") != null ? ((Long) map.get("childAge")).intValue() : null);
        participant.setAllergies((String) map.get("allergies"));
        participant.setEmergencyContact((String) map.get("emergencyContact"));
        participant.setNeedsFood(map.get("needsFood") != null ? (Boolean) map.get("needsFood") : false);
        participant.setMedicalConcerns((String) map.get("medicalConcerns"));
        participant.setAdditionalInformation((String) map.get("additionalInformation"));
        participant.setCreatedTimestamp(map.get("createdTimestamp") != null ? (Long) map.get("createdTimestamp") : System.currentTimeMillis());
        participant.setUpdatedTimestamp(map.get("updatedTimestamp") != null ? (Long) map.get("updatedTimestamp") : System.currentTimeMillis());

        // Denormalized fields
        participant.setParentUserEmail((String) map.get("parentUserEmail"));
        participant.setParentUserFirstName((String) map.get("parentUserFirstName"));
        participant.setParentUserLastName((String) map.get("parentUserLastName"));
        participant.setParentUserPhoneNumber((String) map.get("parentUserPhoneNumber"));
        participant.setEventName((String) map.get("eventName"));
        participant.setEventDate((String) map.get("eventDate"));
        participant.setAgeGroup((String) map.get("ageGroup"));
        participant.setGrade((String) map.get("grade"));

        return participant;
    }

    // Convenience methods for LocalDate conversion
    public LocalDate getRegistrationDateAsLocalDate() {
        return registrationDate != null ? LocalDate.parse(registrationDate) : null;
    }

    public void setRegistrationDateFromLocalDate(LocalDate localDate) {
        this.registrationDate = localDate != null ? localDate.toString() : null;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getChildName() { return childName; }
    public void setChildName(String childName) { this.childName = childName; }

    public String getParentUserId() { return parentUserId; }
    public void setParentUserId(String parentUserId) { this.parentUserId = parentUserId; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getRegistrationDate() { return registrationDate; }
    public void setRegistrationDate(String registrationDate) { this.registrationDate = registrationDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getChildAge() { return childAge; }
    public void setChildAge(Integer childAge) { this.childAge = childAge; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }

    public Boolean getNeedsFood() { return needsFood; }
    public void setNeedsFood(Boolean needsFood) { this.needsFood = needsFood; }

    public String getMedicalConcerns() { return medicalConcerns; }
    public void setMedicalConcerns(String medicalConcerns) { this.medicalConcerns = medicalConcerns; }

    public String getAdditionalInformation() { return additionalInformation; }
    public void setAdditionalInformation(String additionalInformation) { this.additionalInformation = additionalInformation; }

    public Long getCreatedTimestamp() { return createdTimestamp; }
    public void setCreatedTimestamp(Long createdTimestamp) { this.createdTimestamp = createdTimestamp; }

    public Long getUpdatedTimestamp() { return updatedTimestamp; }
    public void setUpdatedTimestamp(Long updatedTimestamp) { this.updatedTimestamp = updatedTimestamp; }

    // Denormalized fields getters and setters
    public String getParentUserEmail() { return parentUserEmail; }
    public void setParentUserEmail(String parentUserEmail) { this.parentUserEmail = parentUserEmail; }

    public String getParentUserFirstName() { return parentUserFirstName; }
    public void setParentUserFirstName(String parentUserFirstName) { this.parentUserFirstName = parentUserFirstName; }

    public String getParentUserLastName() { return parentUserLastName; }
    public void setParentUserLastName(String parentUserLastName) { this.parentUserLastName = parentUserLastName; }

    public String getParentUserPhoneNumber() { return parentUserPhoneNumber; }
    public void setParentUserPhoneNumber(String parentUserPhoneNumber) { this.parentUserPhoneNumber = parentUserPhoneNumber; }

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public String getEventDate() { return eventDate; }
    public void setEventDate(String eventDate) { this.eventDate = eventDate; }

    public String getAgeGroup() { return ageGroup; }
    public void setAgeGroup(String ageGroup) { this.ageGroup = ageGroup; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
}