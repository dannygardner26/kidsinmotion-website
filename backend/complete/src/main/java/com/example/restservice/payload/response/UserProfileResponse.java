package com.example.restservice.payload.response;

import java.util.List;

public class UserProfileResponse {
    private Long id;
    private String email;
    private List<String> roles; // Keep for backward compatibility
    private List<String> teams; // New teams field
    private String userType; // New userType field
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String resumeLink;
    private String portfolioLink;
    private Boolean emailVerified;
    private Boolean phoneVerified;
    private Boolean hasPassword;

    public UserProfileResponse(Long id, String email, List<String> roles) {
        this.id = id;
        this.email = email;
        this.roles = roles;
    }

    // Getters
    public Long getId() {
        return id;
    }

    // public String getUsername() { // Remove username getter/setter
    //     return username;
    // }

    public String getEmail() {
        return email;
    }

    public List<String> getRoles() {
        return roles;
    }

    // Setters (Optional, depending on usage)
    public void setId(Long id) {
        this.id = id;
    }

    // public void setUsername(String username) {
    //     this.username = username;
    // }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getResumeLink() {
        return resumeLink;
    }

    public void setResumeLink(String resumeLink) {
        this.resumeLink = resumeLink;
    }

    public String getPortfolioLink() {
        return portfolioLink;
    }

    public void setPortfolioLink(String portfolioLink) {
        this.portfolioLink = portfolioLink;
    }

    public List<String> getTeams() {
        return teams;
    }

    public void setTeams(List<String> teams) {
        this.teams = teams;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }

    public Boolean getEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(Boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public Boolean getPhoneVerified() {
        return phoneVerified;
    }

    public void setPhoneVerified(Boolean phoneVerified) {
        this.phoneVerified = phoneVerified;
    }

    public Boolean getHasPassword() {
        return hasPassword;
    }

    public void setHasPassword(Boolean hasPassword) {
        this.hasPassword = hasPassword;
    }

    public boolean isVerified() {
        return (emailVerified != null && emailVerified) || (phoneVerified != null && phoneVerified);
    }
}