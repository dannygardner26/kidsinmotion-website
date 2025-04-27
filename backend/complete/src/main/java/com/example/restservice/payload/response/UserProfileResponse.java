package com.example.restservice.payload.response;

import java.util.List;

public class UserProfileResponse {
    private Long id;
    // private String username; // Remove username
    private String email;
    private List<String> roles;

    public UserProfileResponse(Long id, String email, List<String> roles) { // Remove username from constructor
        this.id = id;
        // this.username = username;
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
}