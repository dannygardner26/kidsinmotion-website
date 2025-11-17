package com.example.restservice.service;

import java.util.LinkedHashSet;
import java.util.Set;

public class MessagingRecipient {

    private Long userId;
    private String firebaseUid;
    private String email;
    private String phoneNumber;
    private String displayName;
    private boolean includedByDirectEmail;
    private boolean directEmailOnly;
    private boolean includedByDirectPhone;
    private boolean directPhoneOnly;
    private final Set<RecipientCategory> categories = new LinkedHashSet<>();

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFirebaseUid() {
        return firebaseUid;
    }

    public void setFirebaseUid(String firebaseUid) {
        this.firebaseUid = firebaseUid;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public boolean isIncludedByDirectEmail() {
        return includedByDirectEmail;
    }

    public void setIncludedByDirectEmail(boolean includedByDirectEmail) {
        this.includedByDirectEmail = includedByDirectEmail;
    }

    public boolean isDirectEmailOnly() {
        return directEmailOnly;
    }

    public void setDirectEmailOnly(boolean directEmailOnly) {
        this.directEmailOnly = directEmailOnly;
    }

    public boolean isIncludedByDirectPhone() {
        return includedByDirectPhone;
    }

    public void setIncludedByDirectPhone(boolean includedByDirectPhone) {
        this.includedByDirectPhone = includedByDirectPhone;
    }

    public boolean isDirectPhoneOnly() {
        return directPhoneOnly;
    }

    public void setDirectPhoneOnly(boolean directPhoneOnly) {
        this.directPhoneOnly = directPhoneOnly;
    }

    public Set<RecipientCategory> getCategories() {
        return categories;
    }

    public void addCategory(RecipientCategory category) {
        if (category != null) {
            categories.add(category);
        }
    }

    public boolean hasCategory(RecipientCategory category) {
        return category != null && categories.contains(category);
    }
}
