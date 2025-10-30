package com.example.restservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

@Entity
@Table(name = "participants")
public class Participant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String childName;

    // Link to the parent/guardian User
    @ManyToOne(fetch = FetchType.LAZY) // Lazy fetch User unless needed
    @JoinColumn(name = "parent_user_id", nullable = false)
    private User parentUser;

    // Link to the Event they are registered for
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @NotNull
    private LocalDate registrationDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RegistrationStatus status = RegistrationStatus.REGISTERED; // Default status

    private Integer childAge;

    @Lob
    private String allergies;

    @Size(max = 100)
    private String emergencyContact;

    private Boolean needsFood = false;

    @Lob
    private String medicalConcerns;

    @Lob
    private String additionalInformation;

    public Participant() {
    }

    public Participant(String childName, User parentUser, Event event) {
        this.childName = childName;
        this.parentUser = parentUser;
        this.event = event;
        this.registrationDate = LocalDate.now(); // Set registration date on creation
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getChildName() {
        return childName;
    }

    public void setChildName(String childName) {
        this.childName = childName;
    }

    public User getParentUser() {
        return parentUser;
    }

    public void setParentUser(User parentUser) {
        this.parentUser = parentUser;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public LocalDate getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(LocalDate registrationDate) {
        this.registrationDate = registrationDate;
    }

    public RegistrationStatus getStatus() {
        return status;
    }

    public void setStatus(RegistrationStatus status) {
        this.status = status;
    }

    public Integer getChildAge() {
        return childAge;
    }

    public void setChildAge(Integer childAge) {
        this.childAge = childAge;
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public Boolean getNeedsFood() {
        return needsFood;
    }

    public void setNeedsFood(Boolean needsFood) {
        this.needsFood = needsFood;
    }

    public String getMedicalConcerns() {
        return medicalConcerns;
    }

    public void setMedicalConcerns(String medicalConcerns) {
        this.medicalConcerns = medicalConcerns;
    }

    public String getAdditionalInformation() {
        return additionalInformation;
    }

    public void setAdditionalInformation(String additionalInformation) {
        this.additionalInformation = additionalInformation;
    }

    // Enum for registration status
    public enum RegistrationStatus {
        REGISTERED,
        WAITLISTED,
        CANCELLED,
        ATTENDED
    }
}