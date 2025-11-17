package com.example.restservice.service;

// import com.example.restservice.model.Participant;
import com.example.restservice.model.firestore.UserFirestore;
// import com.example.restservice.model.VolunteerEmployee;
// import com.example.restservice.repository.ParticipantRepository;
import com.example.restservice.repository.firestore.UserFirestoreRepository;
// import com.example.restservice.repository.VolunteerEmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MessagingRecipientService {


    @Autowired
    private UserFirestoreRepository userRepository;

    @Autowired
    private com.example.restservice.repository.firestore.ParticipantFirestoreRepository participantRepository;

    @Autowired
    private com.example.restservice.repository.firestore.VolunteerFirestoreRepository volunteerRepository;


    public RecipientResolutionResult resolveRecipients(Set<RecipientCategory> categories, Collection<String> directEmails) {
        return resolveRecipients(categories, directEmails, null);
    }

    public RecipientResolutionResult resolveRecipients(Set<RecipientCategory> categories, Collection<String> directEmails, String eventId) {
        return resolveRecipients(categories, directEmails, eventId, null);
    }

    public RecipientResolutionResult resolveRecipients(Set<RecipientCategory> categories, Collection<String> directEmails, String eventId, Collection<String> selectedRecipientIds) {
        Map<String, MessagingRecipient> recipients = new LinkedHashMap<>();

        // Team-based categories will use User.teams directly

        for (RecipientCategory category : categories) {
            switch (category) {
                case ALL_USERS -> {
                    try {
                        userRepository.findAll().forEach(user -> upsertUserRecipient(user, category, recipients));
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to fetch all users", e);
                    }
                }
                case PARENTS -> {
                    try {
                        // Find users with PARENT userType
                        userRepository.findByUserType("PARENT").forEach(user ->
                            upsertUserRecipient(user, category, recipients));
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to fetch parent users by userType", e);
                    }
                }
                case VOLUNTEERS -> {
                    try {
                        // Find users with VOLUNTEER userType
                        userRepository.findByUserType("VOLUNTEER").forEach(user ->
                            upsertUserRecipient(user, category, recipients));
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to fetch volunteer users by userType", e);
                    }
                }
                case EVENT_PARENTS -> {
                    if (eventId != null) {
                        try {
                            // Collect unique parent user IDs for this event first to avoid duplicate lookups
                            Set<String> uniqueParentIds = participantRepository.findByEventId(eventId).stream()
                                .map(participant -> participant.getParentUserId())
                                .filter(StringUtils::hasText)
                                .collect(Collectors.toSet());

                            // Batch lookup users by ID
                            for (String parentUserId : uniqueParentIds) {
                                try {
                                    userRepository.findByFirebaseUid(parentUserId)
                                        .ifPresent(user -> upsertUserRecipient(user, category, recipients));
                                } catch (Exception e) {
                                    // Skip this user if lookup fails
                                }
                            }
                        } catch (Exception e) {
                            throw new RuntimeException("Failed to fetch parent users for event", e);
                        }
                    }
                }
                case EVENT_VOLUNTEERS -> {
                    if (eventId != null) {
                        try {
                            // Collect unique volunteer user IDs for this event first to avoid duplicate lookups
                            Set<String> uniqueVolunteerIds = volunteerRepository.findByEventId(eventId).stream()
                                .map(volunteer -> volunteer.getUserId())
                                .filter(StringUtils::hasText)
                                .collect(Collectors.toSet());

                            // Batch lookup users by ID
                            for (String userId : uniqueVolunteerIds) {
                                try {
                                    userRepository.findByFirebaseUid(userId)
                                        .ifPresent(user -> upsertUserRecipient(user, category, recipients));
                                } catch (Exception e) {
                                    // Skip this user if lookup fails
                                }
                            }
                        } catch (Exception e) {
                            throw new RuntimeException("Failed to fetch volunteer users for event", e);
                        }
                    }
                }
                default -> {
                    // No-op for categories handled elsewhere (e.g., DIRECT_EMAILS)
                }
            }
        }

        List<String> directEmailsWithoutAccounts = new ArrayList<>();
        if (directEmails != null) {
            directEmails.stream()
                    .map(email -> email != null ? email.trim() : "")
                    .filter(StringUtils::hasText)
                    .forEach(email -> {
                        String key = buildEmailKey(email);
                        MessagingRecipient existing = recipients.get(key);
                        if (existing != null) {
                            existing.setIncludedByDirectEmail(true);
                            existing.addCategory(RecipientCategory.DIRECT_EMAILS);
                        } else {
                            try {
                                userRepository.findByEmail(email)
                                    .ifPresentOrElse(user -> {
                                        MessagingRecipient recipient = upsertUserRecipient(user, RecipientCategory.DIRECT_EMAILS, recipients);
                                        recipient.setIncludedByDirectEmail(true);
                                    }, () -> {
                                        MessagingRecipient recipient = new MessagingRecipient();
                                        recipient.setEmail(email);
                                        recipient.setDisplayName(email);
                                        recipient.setDirectEmailOnly(true);
                                        recipient.setIncludedByDirectEmail(true);
                                        recipient.addCategory(RecipientCategory.DIRECT_EMAILS);
                                        recipients.put(key, recipient);
                                        directEmailsWithoutAccounts.add(email);
                                    });
                            } catch (Exception e) {
                                throw new RuntimeException("Failed to find user by email", e);
                            }
                        }
                    });
        }

        // Apply selectedRecipients filtering if provided
        if (selectedRecipientIds != null && !selectedRecipientIds.isEmpty()) {
            Set<String> selectedSet = new HashSet<>(selectedRecipientIds);
            recipients.entrySet().removeIf(entry -> {
                MessagingRecipient recipient = entry.getValue();
                // Match by firebaseUid or email
                boolean isSelected = (recipient.getFirebaseUid() != null && selectedSet.contains(recipient.getFirebaseUid())) ||
                                   (recipient.getEmail() != null && selectedSet.contains(recipient.getEmail()));
                return !isSelected;
            });
        }

        Map<RecipientCategory, Integer> categoryCounts = new EnumMap<>(RecipientCategory.class);
        recipients.values().forEach(recipient -> {
            recipient.getCategories().forEach(category ->
                    categoryCounts.merge(category, 1, Integer::sum));
        });

        return new RecipientResolutionResult(new ArrayList<>(recipients.values()), directEmailsWithoutAccounts, categoryCounts);
    }

    private MessagingRecipient upsertUserRecipient(UserFirestore user, RecipientCategory category, Map<String, MessagingRecipient> recipients) {
        if (user == null) {
            return null;
        }

        String key = buildUserKey(user);
        MessagingRecipient recipient = recipients.get(key);
        if (recipient == null) {
            recipient = new MessagingRecipient();
            // TODO: Update MessagingRecipient to use String IDs for Firestore
            // recipient.setUserId(user.getId());
            recipient.setFirebaseUid(user.getFirebaseUid());
            recipient.setEmail(sanitizeEmail(user.getEmail()));
            recipient.setPhoneNumber(sanitizePhone(user.getPhoneNumber()));
            recipient.setDisplayName(buildDisplayName(user));
            recipients.put(key, recipient);
        } else {
            // Update contact info if we have fresher data
            if (!StringUtils.hasText(recipient.getPhoneNumber())) {
                recipient.setPhoneNumber(sanitizePhone(user.getPhoneNumber()));
            }
            if (!StringUtils.hasText(recipient.getEmail())) {
                recipient.setEmail(sanitizeEmail(user.getEmail()));
            }
        }
        recipient.addCategory(category);
        return recipient;
    }

    private String buildUserKey(UserFirestore user) {
        if (StringUtils.hasText(user.getFirebaseUid())) {
            return "uid:" + user.getFirebaseUid();
        }
        if (StringUtils.hasText(user.getEmail())) {
            return buildEmailKey(user.getEmail());
        }
        return user.getId() != null ? "id:" + user.getId() : "anon:" + System.identityHashCode(user);
    }

    private String buildEmailKey(String email) {
        return "email:" + email.trim().toLowerCase(Locale.ROOT);
    }

    private String sanitizeEmail(String email) {
        return StringUtils.hasText(email) ? email.trim() : null;
    }

    private String sanitizePhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return null;
        }
        String trimmed = phone.trim();
        if ("pending".equalsIgnoreCase(trimmed) || "n/a".equalsIgnoreCase(trimmed)) {
            return null;
        }
        return trimmed;
    }

    private String buildDisplayName(UserFirestore user) {
        String first = user.getFirstName();
        String last = user.getLastName();
        if (StringUtils.hasText(first) || StringUtils.hasText(last)) {
            return (StringUtils.hasText(first) ? first : "").trim() +
                    (StringUtils.hasText(last) ? " " + last.trim() : "").trim();
        }
        return sanitizeEmail(user.getEmail());
    }

    private String slugify(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-", "")
                .replaceAll("-$", "");
    }

    public static class RecipientResolutionResult {
        private final List<MessagingRecipient> recipients;
        private final List<String> directEmailsWithoutAccounts;
        private final Map<RecipientCategory, Integer> categoryCounts;

        public RecipientResolutionResult(List<MessagingRecipient> recipients,
                                         List<String> directEmailsWithoutAccounts,
                                         Map<RecipientCategory, Integer> categoryCounts) {
            this.recipients = recipients;
            this.directEmailsWithoutAccounts = directEmailsWithoutAccounts;
            this.categoryCounts = categoryCounts;
        }

        public List<MessagingRecipient> getRecipients() {
            return recipients;
        }

        public List<String> getDirectEmailsWithoutAccounts() {
            return directEmailsWithoutAccounts;
        }

        public Map<RecipientCategory, Integer> getCategoryCounts() {
            return categoryCounts;
        }
    }
}
