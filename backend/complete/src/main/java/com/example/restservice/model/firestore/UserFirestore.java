package com.example.restservice.model.firestore;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Firestore-compatible User model
 */
public class UserFirestore {

    private String id; // Firestore document ID (can be firebaseUid)
    private String firebaseUid; // Firebase UID for authentication
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String resumeLink;
    private String portfolioLink;
    private String userType; // PARENT, ADMIN, VOLUNTEER
    private List<String> teams; // List of team/role names
    private String grade; // For volunteers: grade level
    private String school; // For volunteers: school/organization
    private Boolean emailVerified;
    private Boolean phoneVerified;
    private Long createdTimestamp;
    private Long updatedTimestamp;

    public UserFirestore() {
        this.createdTimestamp = System.currentTimeMillis();
        this.updatedTimestamp = System.currentTimeMillis();
        this.userType = "PARENT"; // Default
        this.emailVerified = false;
        this.phoneVerified = false;
    }

    public UserFirestore(String firebaseUid, String firstName, String lastName, String email, String phoneNumber) {
        this();
        this.firebaseUid = firebaseUid;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.id = firebaseUid; // Use firebaseUid as document ID
    }

    // Convert to Map for Firestore storage
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("firebaseUid", firebaseUid);
        map.put("email", email);
        map.put("firstName", firstName);
        map.put("lastName", lastName);
        map.put("phoneNumber", phoneNumber);
        map.put("resumeLink", resumeLink);
        map.put("portfolioLink", portfolioLink);
        map.put("userType", userType);
        map.put("teams", teams);
        map.put("grade", grade);
        map.put("school", school);
        map.put("emailVerified", emailVerified);
        map.put("phoneVerified", phoneVerified);
        map.put("createdTimestamp", createdTimestamp);
        map.put("updatedTimestamp", System.currentTimeMillis());
        return map;
    }

    // Create from Firestore Map
    @SuppressWarnings("unchecked")
    public static UserFirestore fromMap(Map<String, Object> map, String documentId) {
        UserFirestore user = new UserFirestore();
        user.setId(documentId);
        user.setFirebaseUid((String) map.get("firebaseUid"));
        user.setEmail((String) map.get("email"));
        user.setFirstName((String) map.get("firstName"));
        user.setLastName((String) map.get("lastName"));
        user.setPhoneNumber((String) map.get("phoneNumber"));
        user.setResumeLink((String) map.get("resumeLink"));
        user.setPortfolioLink((String) map.get("portfolioLink"));
        user.setUserType((String) map.get("userType"));
        user.setTeams((List<String>) map.get("teams"));
        user.setGrade((String) map.get("grade"));
        user.setSchool((String) map.get("school"));
        user.setEmailVerified(map.get("emailVerified") != null ? (Boolean) map.get("emailVerified") : false);
        user.setPhoneVerified(map.get("phoneVerified") != null ? (Boolean) map.get("phoneVerified") : false);
        user.setCreatedTimestamp(map.get("createdTimestamp") != null ? (Long) map.get("createdTimestamp") : System.currentTimeMillis());
        user.setUpdatedTimestamp(map.get("updatedTimestamp") != null ? (Long) map.get("updatedTimestamp") : System.currentTimeMillis());
        return user;
    }

    // Helper method to check if user is admin
    public boolean isAdmin() {
        return "ADMIN".equals(userType);
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFirebaseUid() { return firebaseUid; }
    public void setFirebaseUid(String firebaseUid) { this.firebaseUid = firebaseUid; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getResumeLink() { return resumeLink; }
    public void setResumeLink(String resumeLink) { this.resumeLink = resumeLink; }

    public String getPortfolioLink() { return portfolioLink; }
    public void setPortfolioLink(String portfolioLink) { this.portfolioLink = portfolioLink; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public List<String> getTeams() { return teams; }
    public void setTeams(List<String> teams) { this.teams = teams; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public String getSchool() { return school; }
    public void setSchool(String school) { this.school = school; }

    public Long getCreatedTimestamp() { return createdTimestamp; }
    public void setCreatedTimestamp(Long createdTimestamp) { this.createdTimestamp = createdTimestamp; }

    public Long getUpdatedTimestamp() { return updatedTimestamp; }
    public void setUpdatedTimestamp(Long updatedTimestamp) { this.updatedTimestamp = updatedTimestamp; }

    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }

    public Boolean getPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(Boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public boolean isVerified() {
        return (emailVerified != null && emailVerified) || (phoneVerified != null && phoneVerified);
    }
}