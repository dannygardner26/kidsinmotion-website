package com.example.restservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = "firebaseUid"),
           @UniqueConstraint(columnNames = "email")
       })
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 128)
    @Column(name = "firebase_uid", nullable = false, unique = true)
    private String firebaseUid; // Firebase UID for authentication

    @NotBlank
    @Size(max = 100)
    @Email
    private String email;

    @NotBlank
    @Size(max = 50)
    private String firstName;

    @NotBlank
    @Size(max = 50)
    private String lastName;

    @Size(max = 20) // Adjust size as needed
    private String phoneNumber;

    @Lob
    private String resumeLink; // URL or text indicating where resume is stored

    @Lob
    private String portfolioLink; // URL or text indicating where portfolio is stored

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private UserType userType = UserType.PARENT; // Default to parent

    @ManyToMany(fetch = FetchType.EAGER) // Team roles only (Discord-like)
    @JoinTable(name = "user_roles",
               joinColumns = @JoinColumn(name = "user_id"),
               inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> teams = new HashSet<>();

    public User() {
    }

    // Updated constructor for Firebase
    public User(String firebaseUid, String firstName, String lastName, String email, String phoneNumber) {
        this.firebaseUid = firebaseUid;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirebaseUid() {
        return firebaseUid;
    }

    public void setFirebaseUid(String firebaseUid) {
        this.firebaseUid = firebaseUid;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public UserType getUserType() {
        return userType;
    }

    public void setUserType(UserType userType) {
        this.userType = userType;
    }

    public Set<Role> getTeams() {
        return teams;
    }

    public void setTeams(Set<Role> teams) {
        this.teams = teams;
    }

    // For backward compatibility - will be removed
    public Set<Role> getRoles() {
        return teams;
    }

    public void setRoles(Set<Role> roles) {
        this.teams = roles;
    }

    // Enum for user types
    public enum UserType {
        PARENT,
        ADMIN,
        VOLUNTEER
    }
}