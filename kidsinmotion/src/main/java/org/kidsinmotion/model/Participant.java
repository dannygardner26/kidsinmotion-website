package org.kidsinmotion.model;

import java.sql.Timestamp;
import java.util.Objects;

public class Participant {
    private Integer id;
    private Integer parentUserId;
    private Integer eventId;
    private String childFirstName;
    private String childLastName;
    private Integer childAge;
    private String specialNeeds;
    private String emergencyContact;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    
    // Transient fields (not stored in DB)
    private User parentUser;
    private Event event;

    // Constructors
    public Participant() {
    }

    public Participant(Integer parentUserId, Integer eventId, String childFirstName, 
                       String childLastName, Integer childAge, String specialNeeds, 
                       String emergencyContact) {
        this.parentUserId = parentUserId;
        this.eventId = eventId;
        this.childFirstName = childFirstName;
        this.childLastName = childLastName;
        this.childAge = childAge;
        this.specialNeeds = specialNeeds;
        this.emergencyContact = emergencyContact;
    }

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getParentUserId() {
        return parentUserId;
    }

    public void setParentUserId(Integer parentUserId) {
        this.parentUserId = parentUserId;
    }

    public Integer getEventId() {
        return eventId;
    }

    public void setEventId(Integer eventId) {
        this.eventId = eventId;
    }

    public String getChildFirstName() {
        return childFirstName;
    }

    public void setChildFirstName(String childFirstName) {
        this.childFirstName = childFirstName;
    }

    public String getChildLastName() {
        return childLastName;
    }

    public void setChildLastName(String childLastName) {
        this.childLastName = childLastName;
    }

    public String getChildFullName() {
        return childFirstName + " " + childLastName;
    }

    public Integer getChildAge() {
        return childAge;
    }

    public void setChildAge(Integer childAge) {
        this.childAge = childAge;
    }

    public String getSpecialNeeds() {
        return specialNeeds;
    }

    public void setSpecialNeeds(String specialNeeds) {
        this.specialNeeds = specialNeeds;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
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

    // Equals and HashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Participant that = (Participant) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    // ToString
    @Override
    public String toString() {
        return "Participant{" +
                "id=" + id +
                ", childFirstName='" + childFirstName + '\'' +
                ", childLastName='" + childLastName + '\'' +
                ", childAge=" + childAge +
                ", eventId=" + eventId +
                '}';
    }
}