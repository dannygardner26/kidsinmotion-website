package com.example.restservice.payload.request;

import jakarta.validation.constraints.*;
// import java.util.Set; // No longer needed

public class SignupRequest {
    // @NotBlank // Removing username
    // @Size(min = 3, max = 50)
    // private String username;

    @NotBlank
    @Size(max = 100)
    @Email
    private String email;

    // Roles can be optionally provided during signup, otherwise defaults to ROLE_USER
    private String role; // Keep as String

    @NotBlank
    @Size(min = 6, max = 120) // Enforce minimum password length
    private String password; // Renamed from passwordHash

    @NotBlank
    @Size(max = 50)
    private String firstName;

    @NotBlank
    @Size(max = 50)
    private String lastName;

    @NotBlank
    @Size(max = 20) // Adjust size as needed
    private String phoneNumber;

    // Getters and Setters
    // public String getUsername() { // Removing username
    //     return username;
    // }
    //
    // public void setUsername(String username) {
    //     this.username = username;
    // }

     public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() { // Renamed from getPasswordHash
        return password;
    }

    public void setPassword(String password) { // Renamed from setPasswordHash
        this.password = password;
    }

    public String getRole() { // Keep as String
      return this.role;
    }

    public void setRole(String role) { // Keep as String
      this.role = role;
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
}