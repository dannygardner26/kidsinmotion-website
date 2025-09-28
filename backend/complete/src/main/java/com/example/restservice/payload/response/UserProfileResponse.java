package com.example.restservice.payload.response;

import java.util.List;

public class UserProfileResponse {
    private Long id;
    private String email;
    private List<String> roles;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String resumeLink;
    private String portfolioLink;

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
}