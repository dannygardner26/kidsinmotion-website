package com.example.restservice.payload.response;

import com.example.restservice.service.MessagingService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class BroadcastMessageResponse {

    private int totalRecipients;
    private int inboxSent;
    private int inboxSkipped;
    private int emailSent;
    private int emailSkipped;
    private int smsSent;
    private int smsSkipped;
    private Set<String> requestedChannels;
    private List<String> directEmailsWithoutAccounts = new ArrayList<>();
    private List<String> directPhoneNumbersWithoutAccounts = new ArrayList<>();
    private Map<String, Integer> categoryCounts;
    private List<String> warnings = new ArrayList<>();
    private List<DeliveryIssue> failures = new ArrayList<>();

    public static BroadcastMessageResponse from(MessagingService.BroadcastResult result) {
        BroadcastMessageResponse response = new BroadcastMessageResponse();
        response.totalRecipients = result.getTotalRecipients();
        response.inboxSent = result.getInboxSent();
        response.inboxSkipped = result.getInboxSkipped();
        response.emailSent = result.getEmailSent();
        response.emailSkipped = result.getEmailSkipped();
        response.smsSent = result.getSmsSent();
        response.smsSkipped = result.getSmsSkipped();
        response.requestedChannels = result.getRequestedChannels();
        response.directEmailsWithoutAccounts = result.getDirectEmailsWithoutAccounts();
        response.directPhoneNumbersWithoutAccounts = result.getDirectPhoneNumbersWithoutAccounts();
        response.categoryCounts = result.getCategoryCounts();
        response.warnings = result.getGlobalWarnings();
        response.failures = result.getFailures().stream()
                .map(issue -> new DeliveryIssue(issue.getChannel(), issue.getReason(), issue.getRecipient()))
                .collect(Collectors.toList());
        return response;
    }

    public int getTotalRecipients() {
        return totalRecipients;
    }

    public int getInboxSent() {
        return inboxSent;
    }

    public int getInboxSkipped() {
        return inboxSkipped;
    }

    public int getEmailSent() {
        return emailSent;
    }

    public int getEmailSkipped() {
        return emailSkipped;
    }

    public int getSmsSent() {
        return smsSent;
    }

    public int getSmsSkipped() {
        return smsSkipped;
    }

    public Set<String> getRequestedChannels() {
        return requestedChannels;
    }

    public List<String> getDirectEmailsWithoutAccounts() {
        return directEmailsWithoutAccounts;
    }

    public List<String> getDirectPhoneNumbersWithoutAccounts() {
        return directPhoneNumbersWithoutAccounts;
    }

    public Map<String, Integer> getCategoryCounts() {
        return categoryCounts;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public List<DeliveryIssue> getFailures() {
        return failures;
    }

    public record DeliveryIssue(String channel, String reason, Map<String, String> recipient) { }
}
