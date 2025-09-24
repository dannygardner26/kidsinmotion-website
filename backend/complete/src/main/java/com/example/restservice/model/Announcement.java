package com.example.restservice.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "announcements")
public class Announcement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private AnnouncementType type = AnnouncementType.INFO;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false, length = 128)
    private String createdBy; // Firebase UID of admin who created it

    @Column(name = "created_by_email", length = 100)
    private String createdByEmail;

    // Delivery options
    @Column(name = "send_to_website", nullable = false)
    private Boolean sendToWebsite = true;

    @Column(name = "send_to_email", nullable = false)
    private Boolean sendToEmail = false;

    @Column(name = "send_to_phone", nullable = false)
    private Boolean sendToPhone = false;

    @Column(name = "target_audience", length = 50)
    @Enumerated(EnumType.STRING)
    private TargetAudience targetAudience = TargetAudience.ALL_USERS;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "scheduled_for")
    private LocalDateTime scheduledFor; // For future scheduling

    // Constructors
    public Announcement() {
        this.createdAt = LocalDateTime.now();
    }

    public Announcement(String title, String message, AnnouncementType type, String createdBy, String createdByEmail) {
        this();
        this.title = title;
        this.message = message;
        this.type = type;
        this.createdBy = createdBy;
        this.createdByEmail = createdByEmail;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public AnnouncementType getType() {
        return type;
    }

    public void setType(AnnouncementType type) {
        this.type = type;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getCreatedByEmail() {
        return createdByEmail;
    }

    public void setCreatedByEmail(String createdByEmail) {
        this.createdByEmail = createdByEmail;
    }

    public Boolean getSendToWebsite() {
        return sendToWebsite;
    }

    public void setSendToWebsite(Boolean sendToWebsite) {
        this.sendToWebsite = sendToWebsite;
    }

    public Boolean getSendToEmail() {
        return sendToEmail;
    }

    public void setSendToEmail(Boolean sendToEmail) {
        this.sendToEmail = sendToEmail;
    }

    public Boolean getSendToPhone() {
        return sendToPhone;
    }

    public void setSendToPhone(Boolean sendToPhone) {
        this.sendToPhone = sendToPhone;
    }

    public TargetAudience getTargetAudience() {
        return targetAudience;
    }

    public void setTargetAudience(TargetAudience targetAudience) {
        this.targetAudience = targetAudience;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getScheduledFor() {
        return scheduledFor;
    }

    public void setScheduledFor(LocalDateTime scheduledFor) {
        this.scheduledFor = scheduledFor;
    }

    // Enums
    public enum AnnouncementType {
        INFO,
        SUCCESS,
        WARNING,
        ERROR,
        ANNOUNCEMENT
    }

    public enum TargetAudience {
        ALL_USERS,
        REGISTERED_USERS,
        PARENTS_ONLY,
        VOLUNTEERS_ONLY,
        EVENT_PARTICIPANTS,
        SPECIFIC_EVENT
    }
}