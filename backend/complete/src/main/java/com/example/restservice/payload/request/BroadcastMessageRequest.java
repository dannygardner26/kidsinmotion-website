package com.example.restservice.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.ArrayList;
import java.util.List;

public class BroadcastMessageRequest {

    @NotBlank
    private String subject;

    @NotBlank
    private String message;

    @NotEmpty
    private List<String> deliveryChannels = new ArrayList<>();

    private List<String> directEmails = new ArrayList<>();

    private List<String> directPhoneNumbers = new ArrayList<>();

    private List<String> categories = new ArrayList<>();

    private List<String> selectedRecipients = new ArrayList<>();

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<String> getDeliveryChannels() {
        return deliveryChannels;
    }

    public void setDeliveryChannels(List<String> deliveryChannels) {
        this.deliveryChannels = deliveryChannels != null ? deliveryChannels : new ArrayList<>();
    }

    public List<String> getDirectEmails() {
        return directEmails;
    }

    public void setDirectEmails(List<String> directEmails) {
        this.directEmails = directEmails != null ? directEmails : new ArrayList<>();
    }

    public List<String> getDirectPhoneNumbers() {
        return directPhoneNumbers;
    }

    public void setDirectPhoneNumbers(List<String> directPhoneNumbers) {
        this.directPhoneNumbers = directPhoneNumbers != null ? directPhoneNumbers : new ArrayList<>();
    }

    public List<String> getCategories() {
        return categories;
    }

    public void setCategories(List<String> categories) {
        this.categories = categories != null ? categories : new ArrayList<>();
    }

    public List<String> getSelectedRecipients() {
        return selectedRecipients;
    }

    public void setSelectedRecipients(List<String> selectedRecipients) {
        this.selectedRecipients = selectedRecipients != null ? selectedRecipients : new ArrayList<>();
    }
}
