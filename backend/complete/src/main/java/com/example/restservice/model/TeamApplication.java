package com.example.restservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "team_applications")
public class TeamApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to the VolunteerEmployee who is applying
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "volunteer_employee_id", nullable = false)
    private VolunteerEmployee volunteerEmployee;

    @NotBlank
    @Size(max = 100)
    private String teamName; // e.g., "Logistics", "Coach", "Social Media Team", etc.

    @Lob
    private String teamSpecificAnswer; // Answer to team-specific question

    @NotNull
    private LocalDateTime applicationDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ApplicationStatus status = ApplicationStatus.PENDING; // Default status

    @Lob
    private String adminNotes; // Notes from admin during review

    private LocalDateTime reviewedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy; // Admin who reviewed the application

    // Additional fields for approved applications
    private LocalDateTime approvedDate;

    @Size(max = 200)
    private String assignedRole; // Specific role within the team if approved

    public TeamApplication() {
    }

    public TeamApplication(VolunteerEmployee volunteerEmployee, String teamName) {
        this.volunteerEmployee = volunteerEmployee;
        this.teamName = teamName;
        this.applicationDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public VolunteerEmployee getVolunteerEmployee() {
        return volunteerEmployee;
    }

    public void setVolunteerEmployee(VolunteerEmployee volunteerEmployee) {
        this.volunteerEmployee = volunteerEmployee;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public String getTeamSpecificAnswer() {
        return teamSpecificAnswer;
    }

    public void setTeamSpecificAnswer(String teamSpecificAnswer) {
        this.teamSpecificAnswer = teamSpecificAnswer;
    }

    public LocalDateTime getApplicationDate() {
        return applicationDate;
    }

    public void setApplicationDate(LocalDateTime applicationDate) {
        this.applicationDate = applicationDate;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }

    public LocalDateTime getReviewedDate() {
        return reviewedDate;
    }

    public void setReviewedDate(LocalDateTime reviewedDate) {
        this.reviewedDate = reviewedDate;
    }

    public User getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(User reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public LocalDateTime getApprovedDate() {
        return approvedDate;
    }

    public void setApprovedDate(LocalDateTime approvedDate) {
        this.approvedDate = approvedDate;
    }

    public String getAssignedRole() {
        return assignedRole;
    }

    public void setAssignedRole(String assignedRole) {
        this.assignedRole = assignedRole;
    }

    // Enum for application status
    public enum ApplicationStatus {
        PENDING,      // Initial status when application is submitted
        UNDER_REVIEW, // Admin is reviewing the application
        APPROVED,     // Application approved - volunteer accepted to team
        REJECTED,     // Application rejected
        WITHDRAWN     // Applicant withdrew their application
    }
}