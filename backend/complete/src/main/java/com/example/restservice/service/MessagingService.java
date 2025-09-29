package com.example.restservice.service;

import com.example.restservice.payload.request.BroadcastMessageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MessagingService {

    private static final Logger logger = LoggerFactory.getLogger(MessagingService.class);

    @Autowired
    private MessagingRecipientService recipientService;

    @Autowired
    private FirestoreService firestoreService;

    @Autowired
    private EmailDeliveryService emailDeliveryService;

    @Autowired
    private SmsDeliveryService smsDeliveryService;

    public BroadcastResult broadcast(BroadcastMessageRequest request, String initiatedBy) {
        validateRequest(request);

        Set<String> channels = request.getDeliveryChannels() != null
                ? request.getDeliveryChannels().stream()
                    .filter(StringUtils::hasText)
                    .map(channel -> channel.trim().toLowerCase(Locale.ROOT))
                    .collect(Collectors.toCollection(HashSet::new))
                : Set.of();

        boolean sendInbox = channels.contains("inbox");
        boolean sendEmail = channels.contains("email");
        boolean sendSms = channels.contains("phone") || channels.contains("sms");

        Set<RecipientCategory> categorySet = request.getCategories() != null
                ? request.getCategories().stream()
                    .map(RecipientCategory::fromId)
                    .flatMap(Optional::stream)
                    .collect(Collectors.toCollection(HashSet::new))
                : new HashSet<>();

        MessagingRecipientService.RecipientResolutionResult resolutionResult =
                recipientService.resolveRecipients(categorySet, request.getDirectEmails());

        List<MessagingRecipient> recipients = resolutionResult.getRecipients();
        if (recipients.isEmpty()) {
            throw new IllegalArgumentException("No recipients resolved for the provided criteria");
        }

        BroadcastResult result = new BroadcastResult();
        logger.info("Broadcasting admin message '{}' to {} recipients via channels {}", request.getSubject(), recipients.size(), channels);
        result.setRequestedChannels(channels);
        result.setDirectEmailsWithoutAccounts(resolutionResult.getDirectEmailsWithoutAccounts());
        result.setCategoryCounts(transformCategoryCounts(resolutionResult.getCategoryCounts()));
        result.setTotalRecipients(recipients.size());

        if (sendEmail && !emailDeliveryService.isEnabled()) {
            result.addGlobalWarning("Email delivery is disabled. No emails were sent.");
        }
        if (sendSms && !smsDeliveryService.isEnabled()) {
            result.addGlobalWarning("SMS delivery is disabled or not configured. No SMS messages were sent.");
        }

        Map<String, Object> inboxTemplate = buildInboxTemplate(request, initiatedBy, channels);
        String emailBody = buildEmailBody(request, initiatedBy);
        String smsBody = buildSmsBody(request);

        for (MessagingRecipient recipient : recipients) {
            if (sendInbox) {
                handleInboxDelivery(recipient, inboxTemplate, result);
            }
            if (sendEmail) {
                handleEmailDelivery(recipient, request.getSubject(), emailBody, result);
            }
            if (sendSms) {
                handleSmsDelivery(recipient, smsBody, result);
            }
        }

        return result;
    }

    public boolean sendInboxMessage(String userIdentifier, Map<String, Object> messageData) {
        if (!StringUtils.hasText(userIdentifier) || messageData == null) {
            return false;
        }
        return firestoreService.saveMessage(userIdentifier, messageData);
    }

    private void handleInboxDelivery(MessagingRecipient recipient,
                                     Map<String, Object> inboxTemplate,
                                     BroadcastResult result) {
        if (!StringUtils.hasText(recipient.getFirebaseUid())) {
            result.incrementInboxSkipped();
            result.addFailure(new BroadcastResult.DeliveryFailure("inbox",
                    "Recipient does not have a linked site inbox",
                    recipientSnapshot(recipient)));
            return;
        }

        Map<String, Object> payload = new HashMap<>(inboxTemplate);
        payload.put("recipientEmail", recipient.getEmail());
        payload.put("recipientDisplayName", recipient.getDisplayName());

        boolean delivered = firestoreService.saveMessage(recipient.getFirebaseUid(), payload);
        if (delivered) {
            result.incrementInboxSent();
        } else {
            result.incrementInboxSkipped();
            result.addFailure(new BroadcastResult.DeliveryFailure("inbox",
                    "Failed to persist message to inbox (service disabled or error)",
                    recipientSnapshot(recipient)));
        }
    }

    private void handleEmailDelivery(MessagingRecipient recipient,
                                     String subject,
                                     String body,
                                     BroadcastResult result) {
        if (!StringUtils.hasText(recipient.getEmail())) {
            result.incrementEmailSkipped();
            result.addFailure(new BroadcastResult.DeliveryFailure("email",
                    "No email address on file",
                    recipientSnapshot(recipient)));
            return;
        }

        if (!emailDeliveryService.isEnabled()) {
            result.incrementEmailSkipped();
            result.addFailure(new BroadcastResult.DeliveryFailure("email",
                    "Email delivery disabled",
                    recipientSnapshot(recipient)));
            return;
        }

        boolean delivered = emailDeliveryService.sendEmail(recipient.getEmail(), subject, body);
        if (delivered) {
            result.incrementEmailSent();
        } else {
            result.incrementEmailSkipped();
            result.addFailure(new BroadcastResult.DeliveryFailure("email",
                    "Email provider reported a failure - check server logs",
                    recipientSnapshot(recipient)));
        }
    }

    private void handleSmsDelivery(MessagingRecipient recipient,
                                   String smsBody,
                                   BroadcastResult result) {
        if (!StringUtils.hasText(recipient.getPhoneNumber())) {
            result.incrementSmsSkipped();
            result.addFailure(new BroadcastResult.DeliveryFailure("sms",
                    "No phone number available",
                    recipientSnapshot(recipient)));
            return;
        }

        if (!smsDeliveryService.isEnabled()) {
            result.incrementSmsSkipped();
            result.addFailure(new BroadcastResult.DeliveryFailure("sms",
                    "SMS delivery not configured",
                    recipientSnapshot(recipient)));
            return;
        }

        boolean delivered = smsDeliveryService.sendSms(recipient.getPhoneNumber(), smsBody);
        if (delivered) {
            result.incrementSmsSent();
        } else {
            result.incrementSmsSkipped();
            result.addFailure(new BroadcastResult.DeliveryFailure("sms",
                    "SMS provider reported a failure - check credentials",
                    recipientSnapshot(recipient)));
        }
    }

    private Map<String, Integer> transformCategoryCounts(Map<RecipientCategory, Integer> counts) {
        Map<String, Integer> response = new HashMap<>();
        counts.forEach((category, count) -> response.put(category.getId(), count));
        return response;
    }

    private Map<String, Object> buildInboxTemplate(BroadcastMessageRequest request,
                                                   String initiatedBy,
                                                   Set<String> channels) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", "broadcast_" + System.currentTimeMillis());
        payload.put("type", "admin-broadcast");
        payload.put("title", request.getSubject());
        payload.put("message", request.getMessage());
        payload.put("from", StringUtils.hasText(initiatedBy) ? initiatedBy : "Kids in Motion Admin");
        payload.put("channels", new ArrayList<>(channels));
        payload.put("timestamp", LocalDateTime.now().toString());
        payload.put("read", false);
        payload.put("isSystem", true);
        return payload;
    }

    private String buildEmailBody(BroadcastMessageRequest request, String initiatedBy) {
        StringBuilder builder = new StringBuilder();
        builder.append(request.getMessage());
        if (StringUtils.hasText(initiatedBy)) {
            builder.append("\n\n— ").append(initiatedBy);
        }
        builder.append("\nKids in Motion Admin Team");
        return builder.toString();
    }

    private String buildSmsBody(BroadcastMessageRequest request) {
        String subject = request.getSubject();
        String message = request.getMessage();
        String combined = StringUtils.hasText(subject)
                ? subject.trim() + ": " + message
                : message;
        if (combined.length() > 320) {
            return combined.substring(0, 317) + "...";
        }
        return combined;
    }

    private Map<String, String> recipientSnapshot(MessagingRecipient recipient) {
        Map<String, String> snapshot = new HashMap<>();
        snapshot.put("displayName", recipient.getDisplayName());
        snapshot.put("email", recipient.getEmail());
        snapshot.put("phone", recipient.getPhoneNumber());
        snapshot.put("firebaseUid", recipient.getFirebaseUid());
        return snapshot;
    }

    private void validateRequest(BroadcastMessageRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request payload is required");
        }
        if (!StringUtils.hasText(request.getSubject())) {
            throw new IllegalArgumentException("Message subject/title is required");
        }
        if (!StringUtils.hasText(request.getMessage())) {
            throw new IllegalArgumentException("Message content is required");
        }
        if (CollectionUtils.isEmpty(request.getDeliveryChannels())) {
            throw new IllegalArgumentException("At least one delivery channel must be selected");
        }
    }

    public static class BroadcastResult {
        private int totalRecipients;
        private int inboxSent;
        private int inboxSkipped;
        private int emailSent;
        private int emailSkipped;
        private int smsSent;
        private int smsSkipped;
        private Set<String> requestedChannels = new HashSet<>();
        private List<String> directEmailsWithoutAccounts = new ArrayList<>();
        private Map<String, Integer> categoryCounts = new HashMap<>();
        private final List<DeliveryFailure> failures = new ArrayList<>();
        private final List<String> globalWarnings = new ArrayList<>();

        public int getTotalRecipients() {
            return totalRecipients;
        }

        public void setTotalRecipients(int totalRecipients) {
            this.totalRecipients = totalRecipients;
        }

        public int getInboxSent() {
            return inboxSent;
        }

        public void incrementInboxSent() {
            this.inboxSent++;
        }

        public int getInboxSkipped() {
            return inboxSkipped;
        }

        public void incrementInboxSkipped() {
            this.inboxSkipped++;
        }

        public int getEmailSent() {
            return emailSent;
        }

        public void incrementEmailSent() {
            this.emailSent++;
        }

        public int getEmailSkipped() {
            return emailSkipped;
        }

        public void incrementEmailSkipped() {
            this.emailSkipped++;
        }

        public int getSmsSent() {
            return smsSent;
        }

        public void incrementSmsSent() {
            this.smsSent++;
        }

        public int getSmsSkipped() {
            return smsSkipped;
        }

        public void incrementSmsSkipped() {
            this.smsSkipped++;
        }

        public Set<String> getRequestedChannels() {
            return requestedChannels;
        }

        public void setRequestedChannels(Set<String> requestedChannels) {
            this.requestedChannels = requestedChannels;
        }

        public List<String> getDirectEmailsWithoutAccounts() {
            return directEmailsWithoutAccounts;
        }

        public void setDirectEmailsWithoutAccounts(List<String> directEmailsWithoutAccounts) {
            this.directEmailsWithoutAccounts = directEmailsWithoutAccounts;
        }

        public Map<String, Integer> getCategoryCounts() {
            return categoryCounts;
        }

        public void setCategoryCounts(Map<String, Integer> categoryCounts) {
            this.categoryCounts = categoryCounts;
        }

        public List<DeliveryFailure> getFailures() {
            return failures;
        }

        public List<String> getGlobalWarnings() {
            return globalWarnings;
        }

        public void addFailure(DeliveryFailure failure) {
            if (failure != null) {
                failures.add(failure);
            }
        }

        public void addGlobalWarning(String warning) {
            if (StringUtils.hasText(warning)) {
                globalWarnings.add(warning);
            }
        }

        public static class DeliveryFailure {
            private final String channel;
            private final String reason;
            private final Map<String, String> recipient;

            public DeliveryFailure(String channel, String reason, Map<String, String> recipient) {
                this.channel = channel;
                this.reason = reason;
                this.recipient = recipient;
            }

            public String getChannel() {
                return channel;
            }

            public String getReason() {
                return reason;
            }

            public Map<String, String> getRecipient() {
                return recipient;
            }
        }
    }
}



