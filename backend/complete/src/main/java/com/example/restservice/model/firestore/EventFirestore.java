package com.example.restservice.model.firestore;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Firestore-compatible Event model
 */
public class EventFirestore {

    private String id; // Firestore document ID
    private String name;
    private String date; // Store as ISO string for Firestore compatibility
    private String startTime; // Store as string for Firestore compatibility
    private String endTime; // Store as string for Firestore compatibility
    private String description;
    private String location;
    private Integer capacity;
    private String ageGroup;
    private Double price;
    private String eventTypes; // Comma-separated values: "VOLUNTEER,KID_EVENT"
    private Long createdTimestamp; // Creation timestamp
    private Long updatedTimestamp; // Last update timestamp

    public EventFirestore() {
        this.createdTimestamp = System.currentTimeMillis();
        this.updatedTimestamp = System.currentTimeMillis();
    }

    public EventFirestore(String name, LocalDate date, String description) {
        this();
        this.name = name;
        this.date = date != null ? date.toString() : null;
        this.description = description;
    }

    // Convert to Map for Firestore storage
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("name", name);
        map.put("date", date);
        map.put("startTime", startTime);
        map.put("endTime", endTime);
        map.put("description", description);
        map.put("location", location);
        map.put("capacity", capacity);
        map.put("ageGroup", ageGroup);
        map.put("price", price);
        map.put("eventTypes", eventTypes);
        map.put("createdTimestamp", createdTimestamp);
        map.put("updatedTimestamp", System.currentTimeMillis());
        return map;
    }

    // Create from Firestore Map
    public static EventFirestore fromMap(Map<String, Object> map, String documentId) {
        EventFirestore event = new EventFirestore();
        event.setId(documentId);
        event.setName((String) map.get("name"));
        event.setDate((String) map.get("date"));
        event.setStartTime((String) map.get("startTime"));
        event.setEndTime((String) map.get("endTime"));
        event.setDescription((String) map.get("description"));
        event.setLocation((String) map.get("location"));
        event.setCapacity(map.get("capacity") != null ? ((Long) map.get("capacity")).intValue() : null);
        event.setAgeGroup((String) map.get("ageGroup"));
        event.setPrice(map.get("price") != null ? convertToDouble(map.get("price")) : null);
        event.setEventTypes((String) map.get("eventTypes"));
        event.setCreatedTimestamp(map.get("createdTimestamp") != null ? (Long) map.get("createdTimestamp") : System.currentTimeMillis());
        event.setUpdatedTimestamp(map.get("updatedTimestamp") != null ? (Long) map.get("updatedTimestamp") : System.currentTimeMillis());
        return event;
    }

    private static Double convertToDouble(Object value) {
        if (value instanceof Double) {
            return (Double) value;
        } else if (value instanceof Long) {
            return ((Long) value).doubleValue();
        } else if (value instanceof Integer) {
            return ((Integer) value).doubleValue();
        } else if (value instanceof Float) {
            return ((Float) value).doubleValue();
        }
        return null;
    }

    // Convenience methods for LocalDate/LocalTime conversion
    public LocalDate getDateAsLocalDate() {
        return date != null ? LocalDate.parse(date) : null;
    }

    public void setDateFromLocalDate(LocalDate localDate) {
        this.date = localDate != null ? localDate.toString() : null;
    }

    public LocalTime getStartTimeAsLocalTime() {
        return startTime != null ? LocalTime.parse(startTime) : null;
    }

    public void setStartTimeFromLocalTime(LocalTime localTime) {
        this.startTime = localTime != null ? localTime.toString() : null;
    }

    public LocalTime getEndTimeAsLocalTime() {
        return endTime != null ? LocalTime.parse(endTime) : null;
    }

    public void setEndTimeFromLocalTime(LocalTime localTime) {
        this.endTime = localTime != null ? localTime.toString() : null;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public String getAgeGroup() { return ageGroup; }
    public void setAgeGroup(String ageGroup) { this.ageGroup = ageGroup; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getEventTypes() { return eventTypes; }
    public void setEventTypes(String eventTypes) { this.eventTypes = eventTypes; }

    public Long getCreatedTimestamp() { return createdTimestamp; }
    public void setCreatedTimestamp(Long createdTimestamp) { this.createdTimestamp = createdTimestamp; }

    public Long getUpdatedTimestamp() { return updatedTimestamp; }
    public void setUpdatedTimestamp(Long updatedTimestamp) { this.updatedTimestamp = updatedTimestamp; }
}