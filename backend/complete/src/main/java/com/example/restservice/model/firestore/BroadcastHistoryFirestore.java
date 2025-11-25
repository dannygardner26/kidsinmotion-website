package com.example.restservice.model.firestore;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Firestore model for storing broadcast message history
 */
public class BroadcastHistoryFirestore {

    private String id; // Firestore document ID
    private String initiatorFirebaseUid; // Who sent the broadcast
    private String initiatorName; // Name of the person who sent it
    private String subject;
    private String message;
    private Set<String> requestedChannels; // inbox, email, sms
    private List<String> categories; // recipient categories
    private List<String> directEmails; // direct email addresses
    private List<String> directPhoneNumbers; // direct phone numbers
    private List<String> selectedRecipients; // selected recipient IDs

    // Delivery statistics
    private int totalRecipients;
    private int inboxSent;
    private int inboxSkipped;
    private int emailSent;
    private int emailSkipped;
    private int smsSent;
    private int smsSkipped;

    // Additional data
    private Map<String, Integer> categoryCounts;
    private List<String> warnings;
    private List<Map<String, Object>> failures; // Delivery failures with details

    // Timestamps
    private Long createdTimestamp;
    private Long sentTimestamp;

    public BroadcastHistoryFirestore() {
        this.createdTimestamp = System.currentTimeMillis();
        this.sentTimestamp = System.currentTimeMillis();
    }

    // Convert to Map for Firestore storage
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("initiatorFirebaseUid", initiatorFirebaseUid);
        map.put("initiatorName", initiatorName);
        map.put("subject", subject);
        map.put("message", message);
        map.put("requestedChannels", requestedChannels);
        map.put("categories", categories);
        map.put("directEmails", directEmails);
        map.put("directPhoneNumbers", directPhoneNumbers);
        map.put("selectedRecipients", selectedRecipients);
        map.put("totalRecipients", totalRecipients);
        map.put("inboxSent", inboxSent);
        map.put("inboxSkipped", inboxSkipped);
        map.put("emailSent", emailSent);
        map.put("emailSkipped", emailSkipped);
        map.put("smsSent", smsSent);
        map.put("smsSkipped", smsSkipped);
        map.put("categoryCounts", categoryCounts);
        map.put("warnings", warnings);
        map.put("failures", failures);
        map.put("createdTimestamp", createdTimestamp);
        map.put("sentTimestamp", sentTimestamp);
        return map;
    }

    // Convert from Firestore Map
    public static BroadcastHistoryFirestore fromMap(Map<String, Object> map, String documentId) {
        BroadcastHistoryFirestore history = new BroadcastHistoryFirestore();
        history.setId(documentId);
        history.setInitiatorFirebaseUid((String) map.get("initiatorFirebaseUid"));
        history.setInitiatorName((String) map.get("initiatorName"));
        history.setSubject((String) map.get("subject"));
        history.setMessage((String) map.get("message"));
        history.setRequestedChannels((Set<String>) map.get("requestedChannels"));
        history.setCategories((List<String>) map.get("categories"));
        history.setDirectEmails((List<String>) map.get("directEmails"));
        history.setDirectPhoneNumbers((List<String>) map.get("directPhoneNumbers"));
        history.setSelectedRecipients((List<String>) map.get("selectedRecipients"));
        history.setTotalRecipients(safeLongToInt(map.get("totalRecipients")));
        history.setInboxSent(safeLongToInt(map.get("inboxSent")));
        history.setInboxSkipped(safeLongToInt(map.get("inboxSkipped")));
        history.setEmailSent(safeLongToInt(map.get("emailSent")));
        history.setEmailSkipped(safeLongToInt(map.get("emailSkipped")));
        history.setSmsSent(safeLongToInt(map.get("smsSent")));
        history.setSmsSkipped(safeLongToInt(map.get("smsSkipped")));
        history.setCategoryCounts((Map<String, Integer>) map.get("categoryCounts"));
        history.setWarnings((List<String>) map.get("warnings"));
        history.setFailures((List<Map<String, Object>>) map.get("failures"));
        history.setCreatedTimestamp(safeLongFromMap(map, "createdTimestamp"));
        history.setSentTimestamp(safeLongFromMap(map, "sentTimestamp"));
        return history;
    }

    private static int safeLongToInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Long) return ((Long) value).intValue();
        return 0;
    }

    private static Long safeLongFromMap(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Long) return (Long) value;
        if (value instanceof Integer) return ((Integer) value).longValue();
        return null;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getInitiatorFirebaseUid() { return initiatorFirebaseUid; }
    public void setInitiatorFirebaseUid(String initiatorFirebaseUid) { this.initiatorFirebaseUid = initiatorFirebaseUid; }

    public String getInitiatorName() { return initiatorName; }
    public void setInitiatorName(String initiatorName) { this.initiatorName = initiatorName; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Set<String> getRequestedChannels() { return requestedChannels; }
    public void setRequestedChannels(Set<String> requestedChannels) { this.requestedChannels = requestedChannels; }

    public List<String> getCategories() { return categories; }
    public void setCategories(List<String> categories) { this.categories = categories; }

    public List<String> getDirectEmails() { return directEmails; }
    public void setDirectEmails(List<String> directEmails) { this.directEmails = directEmails; }

    public List<String> getDirectPhoneNumbers() { return directPhoneNumbers; }
    public void setDirectPhoneNumbers(List<String> directPhoneNumbers) { this.directPhoneNumbers = directPhoneNumbers; }

    public List<String> getSelectedRecipients() { return selectedRecipients; }
    public void setSelectedRecipients(List<String> selectedRecipients) { 
        this.selectedRecipients = selectedRecipients != null ? selectedRecipients : new java.util.ArrayList<>(); 
    }

    public int getTotalRecipients() { return totalRecipients; }
    public void setTotalRecipients(int totalRecipients) { this.totalRecipients = totalRecipients; }

    public int getInboxSent() { return inboxSent; }
    public void setInboxSent(int inboxSent) { this.inboxSent = inboxSent; }

    public int getInboxSkipped() { return inboxSkipped; }
    public void setInboxSkipped(int inboxSkipped) { this.inboxSkipped = inboxSkipped; }

    public int getEmailSent() { return emailSent; }
    public void setEmailSent(int emailSent) { this.emailSent = emailSent; }

    public int getEmailSkipped() { return emailSkipped; }
    public void setEmailSkipped(int emailSkipped) { this.emailSkipped = emailSkipped; }

    public int getSmsSent() { return smsSent; }
    public void setSmsSent(int smsSent) { this.smsSent = smsSent; }

    public int getSmsSkipped() { return smsSkipped; }
    public void setSmsSkipped(int smsSkipped) { this.smsSkipped = smsSkipped; }

    public Map<String, Integer> getCategoryCounts() { return categoryCounts; }
    public void setCategoryCounts(Map<String, Integer> categoryCounts) { this.categoryCounts = categoryCounts; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public List<Map<String, Object>> getFailures() { return failures; }
    public void setFailures(List<Map<String, Object>> failures) { this.failures = failures; }

    public Long getCreatedTimestamp() { return createdTimestamp; }
    public void setCreatedTimestamp(Long createdTimestamp) { this.createdTimestamp = createdTimestamp; }

    public Long getSentTimestamp() { return sentTimestamp; }
    public void setSentTimestamp(Long sentTimestamp) { this.sentTimestamp = sentTimestamp; }
}