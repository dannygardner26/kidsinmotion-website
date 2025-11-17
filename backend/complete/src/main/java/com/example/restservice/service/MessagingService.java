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
import java.util.Collections;
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

        // Parse categories and extract event-specific ones
        Map<String, Set<RecipientCategory>> eventCategoryMap = new HashMap<>();
        Set<RecipientCategory> generalCategories = new HashSet<>();

        if (request.getCategories() != null) {
            for (String categoryString : request.getCategories()) {
                if (categoryString.startsWith("event-parents-")) {
                    String eventId = categoryString.substring("event-parents-".length());
                    eventCategoryMap.computeIfAbsent(eventId, k -> new HashSet<>()).add(RecipientCategory.EVENT_PARENTS);
                } else if (categoryString.startsWith("event-volunteers-")) {
                    String eventId = categoryString.substring("event-volunteers-".length());
                    eventCategoryMap.computeIfAbsent(eventId, k -> new HashSet<>()).add(RecipientCategory.EVENT_VOLUNTEERS);
                } else {
                    // Regular category
                    RecipientCategory.fromId(categoryString).ifPresent(generalCategories::add);
                }
            }
        }

        // Collect all recipients
        List<MessagingRecipient> allRecipients = new ArrayList<>();
        Map<RecipientCategory, Integer> allCategoryCounts = new HashMap<>();
        List<String> allDirectEmailsWithoutAccounts = new ArrayList<>();

        // Process general categories and direct emails
        if (!generalCategories.isEmpty() || (request.getDirectEmails() != null && !request.getDirectEmails().isEmpty())) {
            MessagingRecipientService.RecipientResolutionResult generalResult =
                    recipientService.resolveRecipients(generalCategories, request.getDirectEmails(), null, null);
            allRecipients.addAll(generalResult.getRecipients());
            allCategoryCounts.putAll(generalResult.getCategoryCounts());
            allDirectEmailsWithoutAccounts.addAll(generalResult.getDirectEmailsWithoutAccounts());
        }

        // Process event-specific categories
        for (Map.Entry<String, Set<RecipientCategory>> eventEntry : eventCategoryMap.entrySet()) {
            String eventId = eventEntry.getKey();
            Set<RecipientCategory> eventCategories = eventEntry.getValue();

            MessagingRecipientService.RecipientResolutionResult eventResult =
                    recipientService.resolveRecipients(eventCategories, Collections.emptyList(), eventId, request.getSelectedRecipients());
            allRecipients.addAll(eventResult.getRecipients());
            eventResult.getCategoryCounts().forEach((category, count) ->
                allCategoryCounts.merge(category, count, Integer::sum));
        }

        // Create combined result
        MessagingRecipientService.RecipientResolutionResult resolutionResult =
                new MessagingRecipientService.RecipientResolutionResult(
                    allRecipients, allDirectEmailsWithoutAccounts, allCategoryCounts);

        List<MessagingRecipient> recipients = resolutionResult.getRecipients();
        List<String> directEmailsWithoutAccounts = resolutionResult.getDirectEmailsWithoutAccounts();

        // Check if we have any recipients (either registered users or direct emails)
        if (recipients.isEmpty() && directEmailsWithoutAccounts.isEmpty()) {
            throw new IllegalArgumentException("No recipients resolved for the provided criteria");
        }

        BroadcastResult result = new BroadcastResult();
        int totalRecipientCount = recipients.size() + directEmailsWithoutAccounts.size();
        logger.info("Broadcasting admin message '{}' to {} recipients ({} registered users + {} direct emails) via channels {}",
                request.getSubject(), totalRecipientCount, recipients.size(), directEmailsWithoutAccounts.size(), channels);
        result.setRequestedChannels(channels);
        result.setDirectEmailsWithoutAccounts(directEmailsWithoutAccounts);
        result.setCategoryCounts(transformCategoryCounts(resolutionResult.getCategoryCounts()));
        result.setTotalRecipients(totalRecipientCount);

        if (sendEmail && !emailDeliveryService.isEnabled()) {
            result.addGlobalWarning("Email delivery is disabled. No emails were sent.");
        }
        if (sendSms && !smsDeliveryService.isEnabled()) {
            result.addGlobalWarning("SMS delivery is disabled or not configured. No SMS messages were sent.");
        }

        Map<String, Object> inboxTemplate = buildInboxTemplate(request, initiatedBy, channels);
        String emailBody = buildEmailBody(request, initiatedBy);
        String smsBody = buildSmsBody(request);

        // Process registered user recipients
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

        // Process direct emails without accounts (email only - no inbox or SMS)
        if (sendEmail && !directEmailsWithoutAccounts.isEmpty()) {
            for (String email : directEmailsWithoutAccounts) {
                handleDirectEmailDelivery(email, request.getSubject(), emailBody, result);
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

    private void handleDirectEmailDelivery(String email,
                                          String subject,
                                          String body,
                                          BroadcastResult result) {
        if (!emailDeliveryService.isEnabled()) {
            result.incrementEmailSkipped();
            result.addFailure(new BroadcastResult.DeliveryFailure("email",
                    "Email delivery disabled",
                    Map.of("email", email, "displayName", email)));
            return;
        }

        boolean delivered = emailDeliveryService.sendEmail(email, subject, body);
        if (delivered) {
            result.incrementEmailSent();
        } else {
            result.incrementEmailSkipped();
            result.addFailure(new BroadcastResult.DeliveryFailure("email",
                    "Email provider reported a failure - check server logs",
                    Map.of("email", email, "displayName", email)));
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



