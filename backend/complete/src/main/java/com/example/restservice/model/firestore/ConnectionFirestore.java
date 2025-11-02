package com.example.restservice.model.firestore;

import java.util.HashMap;
import java.util.Map;

/**
 * Firestore-compatible Connection model for user connections
 */
public class ConnectionFirestore {

    private String id; // Firestore document ID
    private String requesterId; // firebaseUid of user sending request
    private String receiverId; // firebaseUid of user receiving request
    private String status; // PENDING/ACCEPTED/REJECTED
    private Long requestedAt; // timestamp
    private Long acceptedAt; // timestamp
    private Long rejectedAt; // timestamp
    private Long createdTimestamp;
    private Long updatedTimestamp;

    public ConnectionFirestore() {
        this.createdTimestamp = System.currentTimeMillis();
        this.updatedTimestamp = System.currentTimeMillis();
        this.status = "PENDING";
        this.requestedAt = System.currentTimeMillis();
    }

    public ConnectionFirestore(String requesterId, String receiverId) {
        this();
        this.requesterId = requesterId;
        this.receiverId = receiverId;
    }

    // Convert to Map for Firestore storage
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("requesterId", requesterId);
        map.put("receiverId", receiverId);
        map.put("status", status);
        map.put("requestedAt", requestedAt);
        map.put("acceptedAt", acceptedAt);
        map.put("rejectedAt", rejectedAt);
        map.put("createdTimestamp", createdTimestamp);
        map.put("updatedTimestamp", System.currentTimeMillis());
        return map;
    }

    // Create from Firestore Map
    public static ConnectionFirestore fromMap(Map<String, Object> map, String documentId) {
        ConnectionFirestore connection = new ConnectionFirestore();
        connection.setId(documentId);
        connection.setRequesterId((String) map.get("requesterId"));
        connection.setReceiverId((String) map.get("receiverId"));
        connection.setStatus((String) map.get("status"));
        connection.setRequestedAt((Long) map.get("requestedAt"));
        connection.setAcceptedAt((Long) map.get("acceptedAt"));
        connection.setRejectedAt((Long) map.get("rejectedAt"));
        connection.setCreatedTimestamp(map.get("createdTimestamp") != null ? (Long) map.get("createdTimestamp") : System.currentTimeMillis());
        connection.setUpdatedTimestamp(map.get("updatedTimestamp") != null ? (Long) map.get("updatedTimestamp") : System.currentTimeMillis());
        return connection;
    }

    // Helper methods
    public boolean isPending() {
        return "PENDING".equals(status);
    }

    public boolean isAccepted() {
        return "ACCEPTED".equals(status);
    }

    public boolean isRejected() {
        return "REJECTED".equals(status);
    }

    public void accept() {
        this.status = "ACCEPTED";
        this.acceptedAt = System.currentTimeMillis();
        this.updatedTimestamp = System.currentTimeMillis();
    }

    public void reject() {
        this.status = "REJECTED";
        this.rejectedAt = System.currentTimeMillis();
        this.updatedTimestamp = System.currentTimeMillis();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRequesterId() { return requesterId; }
    public void setRequesterId(String requesterId) { this.requesterId = requesterId; }

    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Long requestedAt) { this.requestedAt = requestedAt; }

    public Long getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Long acceptedAt) { this.acceptedAt = acceptedAt; }

    public Long getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(Long rejectedAt) { this.rejectedAt = rejectedAt; }

    public Long getCreatedTimestamp() { return createdTimestamp; }
    public void setCreatedTimestamp(Long createdTimestamp) { this.createdTimestamp = createdTimestamp; }

    public Long getUpdatedTimestamp() { return updatedTimestamp; }
    public void setUpdatedTimestamp(Long updatedTimestamp) { this.updatedTimestamp = updatedTimestamp; }
}