package org.kidsinmotion.model;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Objects;

public class Event {
    private Integer id;
    private String title;
    private String description;
    private String eventType;
    private String sportType;
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer maxParticipants;
    private Boolean needsVolunteers;
    private Integer volunteerCountNeeded;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    // Constructors
    public Event() {
    }

    public Event(String title, String description, String eventType, String sportType, 
                 String location, LocalDateTime startDate, LocalDateTime endDate, 
                 Integer maxParticipants, Boolean needsVolunteers, Integer volunteerCountNeeded) {
        this.title = title;
        this.description = description;
        this.eventType = eventType;
        this.sportType = sportType;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.maxParticipants = maxParticipants;
        this.needsVolunteers = needsVolunteers;
        this.volunteerCountNeeded = volunteerCountNeeded;
    }

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getSportType() {
        return sportType;
    }

    public void setSportType(String sportType) {
        this.sportType = sportType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public Integer getMaxParticipants() {
        return maxParticipants;
    }

    public void setMaxParticipants(Integer maxParticipants) {
        this.maxParticipants = maxParticipants;
    }

    public Boolean getNeedsVolunteers() {
        return needsVolunteers;
    }

    public void setNeedsVolunteers(Boolean needsVolunteers) {
        this.needsVolunteers = needsVolunteers;
    }

    public Integer getVolunteerCountNeeded() {
        return volunteerCountNeeded;
    }

    public void setVolunteerCountNeeded(Integer volunteerCountNeeded) {
        this.volunteerCountNeeded = volunteerCountNeeded;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isUpcoming() {
        return startDate.isAfter(LocalDateTime.now());
    }

    public boolean isPast() {
        return endDate.isBefore(LocalDateTime.now());
    }

    public boolean isInProgress() {
        LocalDateTime now = LocalDateTime.now();
        return startDate.isBefore(now) && endDate.isAfter(now);
    }

    // Equals and HashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Event event = (Event) o;
        return Objects.equals(id, event.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    // ToString
    @Override
    public String toString() {
        return "Event{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", eventType='" + eventType + '\'' +
                ", sportType='" + sportType + '\'' +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                '}';
    }
}