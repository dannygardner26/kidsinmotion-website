package org.kidsinmotion.model;

import java.sql.Timestamp;
import java.util.Objects;

public class Volunteer {
    private Integer id;
    private Integer userId;
    private Integer eventId;
    private String status; // PENDING, CONFIRMED, CANCELED
    private String notes;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    
    // Transient fields (not stored in DB)
    private User user;
    private Event event;

    // Constructors
    public Volunteer() {
    }

    public Volunteer(Integer userId, Integer eventId, String status, String notes) {
        this.userId = userId;
        this.eventId = eventId;
        this.status = status;
        this.notes = notes;
    }

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getEventId() {
        return eventId;
    }

    public void setEventId(Integer eventId) {
        this.eventId = eventId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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

    // Equals and HashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Volunteer volunteer = (Volunteer) o;
        return Objects.equals(id, volunteer.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    // ToString
    @Override
    public String toString() {
        return "Volunteer{" +
                "id=" + id +
                ", userId=" + userId +
                ", eventId=" + eventId +
                ", status='" + status + '\'' +
                '}';
    }
}