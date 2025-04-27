package com.example.restservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

@Entity
@Table(name = "volunteers")
public class Volunteer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to the User who is volunteering
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Link to the Event they are volunteering for
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @NotBlank
    @Size(max = 100)
    private String role; // e.g., "Event Helper", "Setup Crew", "Photographer"

    @NotNull
    private LocalDate signupDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SignupStatus status = SignupStatus.CONFIRMED; // Default status

    // Add other relevant fields: availability, skills, notes, etc.

    public Volunteer() {
    }

    public Volunteer(User user, Event event, String role) {
        this.user = user;
        this.event = event;
        this.role = role;
        this.signupDate = LocalDate.now(); // Set signup date on creation
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDate getSignupDate() {
        return signupDate;
    }

    public void setSignupDate(LocalDate signupDate) {
        this.signupDate = signupDate;
    }

    public SignupStatus getStatus() {
        return status;
    }

    public void setStatus(SignupStatus status) {
        this.status = status;
    }

    // Enum for signup status
    public enum SignupStatus {
        CONFIRMED,
        PENDING,
        CANCELLED,
        COMPLETED
    }
}