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
    private String username; // unique identifier for profile URLs and login, 3-20 characters
    private String usernameLowercase; // lowercase version for case-insensitive lookups
    private Long usernameLastChangedAt; // timestamp of last username change for 3-month cooldown

    // Address information
    private String address;
    private String city;
    private String state;
    private String zipCode;

    // Parent information (for minors)
    private String parentFirstName;
    private String parentLastName;
    private String parentPhoneNumber;
    private String parentEmail;

    // Emergency contact information
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;

    // Profile settings
    private String profileVisibility; // PUBLIC, PRIVATE
    private String profilePictureUrl; // URL to uploaded profile picture in Firebase Storage
    private String profileColor; // hex color code assigned at creation for avatar background
    private Long lastLoginAt; // timestamp of last login for admin tracking
    private Boolean isBanned; // soft delete flag for banned users
    private Long bannedAt; // timestamp when user was banned
    private String bannedReason; // admin message explaining ban reason
    private Boolean emailVerified;
    private Boolean isEmailVerified; // Alternative naming
    private Boolean phoneVerified;
    private Long createdTimestamp;
    private Long updatedTimestamp;

    public UserFirestore() {
        this.createdTimestamp = System.currentTimeMillis();
        this.updatedTimestamp = System.currentTimeMillis();
        this.userType = "PARENT"; // Default
        this.emailVerified = false;
        this.phoneVerified = false;
        this.isBanned = false;
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
        map.put("username", username);
        map.put("usernameLowercase", usernameLowercase);
        map.put("usernameLastChangedAt", usernameLastChangedAt);

        // Address information
        map.put("address", address);
        map.put("city", city);
        map.put("state", state);
        map.put("zipCode", zipCode);

        // Parent information
        map.put("parentFirstName", parentFirstName);
        map.put("parentLastName", parentLastName);
        map.put("parentPhoneNumber", parentPhoneNumber);
        map.put("parentEmail", parentEmail);

        // Emergency contact information
        map.put("emergencyContactName", emergencyContactName);
        map.put("emergencyContactPhone", emergencyContactPhone);
        map.put("emergencyContactRelationship", emergencyContactRelationship);

        // Profile settings
        map.put("profileVisibility", profileVisibility);
        map.put("profilePictureUrl", profilePictureUrl);
        map.put("profileColor", profileColor);
        map.put("lastLoginAt", lastLoginAt);
        map.put("isBanned", isBanned);
        map.put("bannedAt", bannedAt);
        map.put("bannedReason", bannedReason);
        map.put("emailVerified", emailVerified);
        map.put("isEmailVerified", isEmailVerified);
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
        user.setUsername((String) map.get("username"));
        user.setUsernameLowercase((String) map.get("usernameLowercase"));
        user.setUsernameLastChangedAt((Long) map.get("usernameLastChangedAt"));

        // Address information
        user.setAddress((String) map.get("address"));
        user.setCity((String) map.get("city"));
        user.setState((String) map.get("state"));
        user.setZipCode((String) map.get("zipCode"));

        // Parent information
        user.setParentFirstName((String) map.get("parentFirstName"));
        user.setParentLastName((String) map.get("parentLastName"));
        user.setParentPhoneNumber((String) map.get("parentPhoneNumber"));
        user.setParentEmail((String) map.get("parentEmail"));

        // Emergency contact information
        user.setEmergencyContactName((String) map.get("emergencyContactName"));
        user.setEmergencyContactPhone((String) map.get("emergencyContactPhone"));
        user.setEmergencyContactRelationship((String) map.get("emergencyContactRelationship"));

        // Profile settings
        user.setProfileVisibility((String) map.get("profileVisibility"));
        user.setProfilePictureUrl((String) map.get("profilePictureUrl"));
        user.setProfileColor((String) map.get("profileColor"));
        user.setLastLoginAt((Long) map.get("lastLoginAt"));
        user.setIsBanned(map.get("isBanned") != null ? (Boolean) map.get("isBanned") : false);
        user.setBannedAt((Long) map.get("bannedAt"));
        user.setBannedReason((String) map.get("bannedReason"));
        user.setEmailVerified(map.get("emailVerified") != null ? (Boolean) map.get("emailVerified") : false);
        user.setIsEmailVerified(map.get("isEmailVerified") != null ? (Boolean) map.get("isEmailVerified") : false);
        user.setPhoneVerified(map.get("phoneVerified") != null ? (Boolean) map.get("phoneVerified") : false);
        user.setCreatedTimestamp(map.get("createdTimestamp") != null ? (Long) map.get("createdTimestamp") : System.currentTimeMillis());
        user.setUpdatedTimestamp(map.get("updatedTimestamp") != null ? (Long) map.get("updatedTimestamp") : System.currentTimeMillis());
        return user;
    }

    // Helper method to check if user is admin
    public boolean isAdmin() {
        return "ADMIN".equals(userType);
    }

    // Helper method to get full name
    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        }
        return "";
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

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getUsernameLowercase() { return usernameLowercase; }
    public void setUsernameLowercase(String usernameLowercase) { this.usernameLowercase = usernameLowercase; }

    public Long getUsernameLastChangedAt() { return usernameLastChangedAt; }
    public void setUsernameLastChangedAt(Long usernameLastChangedAt) { this.usernameLastChangedAt = usernameLastChangedAt; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public String getProfileColor() { return profileColor; }
    public void setProfileColor(String profileColor) { this.profileColor = profileColor; }

    public Long getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Long lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    // Address information getters and setters
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }

    // Parent information getters and setters
    public String getParentFirstName() { return parentFirstName; }
    public void setParentFirstName(String parentFirstName) { this.parentFirstName = parentFirstName; }

    public String getParentLastName() { return parentLastName; }
    public void setParentLastName(String parentLastName) { this.parentLastName = parentLastName; }

    public String getParentPhoneNumber() { return parentPhoneNumber; }
    public void setParentPhoneNumber(String parentPhoneNumber) { this.parentPhoneNumber = parentPhoneNumber; }

    public String getParentEmail() { return parentEmail; }
    public void setParentEmail(String parentEmail) { this.parentEmail = parentEmail; }

    // Emergency contact getters and setters
    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

    public String getEmergencyContactRelationship() { return emergencyContactRelationship; }
    public void setEmergencyContactRelationship(String emergencyContactRelationship) { this.emergencyContactRelationship = emergencyContactRelationship; }

    // Profile settings getters and setters
    public String getProfileVisibility() { return profileVisibility; }
    public void setProfileVisibility(String profileVisibility) { this.profileVisibility = profileVisibility; }

    public Boolean getIsEmailVerified() { return isEmailVerified; }
    public void setIsEmailVerified(Boolean isEmailVerified) { this.isEmailVerified = isEmailVerified; }

    public Boolean getIsBanned() { return isBanned; }
    public void setIsBanned(Boolean isBanned) { this.isBanned = isBanned; }

    public Long getBannedAt() { return bannedAt; }
    public void setBannedAt(Long bannedAt) { this.bannedAt = bannedAt; }

    public String getBannedReason() { return bannedReason; }
    public void setBannedReason(String bannedReason) { this.bannedReason = bannedReason; }
}