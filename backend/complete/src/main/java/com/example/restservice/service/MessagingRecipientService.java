package com.example.restservice.service;

import com.example.restservice.model.Participant;
import com.example.restservice.model.TeamApplication;
import com.example.restservice.model.User;
import com.example.restservice.model.VolunteerEmployee;
import com.example.restservice.repository.ParticipantRepository;
import com.example.restservice.repository.TeamApplicationRepository;
import com.example.restservice.repository.UserRepository;
import com.example.restservice.repository.VolunteerEmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class MessagingRecipientService {

    private static final Map<RecipientCategory, String> TEAM_CATEGORY_SLUGS = Map.of(
            RecipientCategory.COACHES, "coach",
            RecipientCategory.EVENT_COORDINATORS, "event-coordination",
            RecipientCategory.SOCIAL_MEDIA_TEAM, "social-media-team"
    );

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private VolunteerEmployeeRepository volunteerEmployeeRepository;

    @Autowired
    private TeamApplicationRepository teamApplicationRepository;

    public RecipientResolutionResult resolveRecipients(Set<RecipientCategory> categories, Collection<String> directEmails) {
        Map<String, MessagingRecipient> recipients = new LinkedHashMap<>();

        boolean needsTeamApplications = categories.stream().anyMatch(TEAM_CATEGORY_SLUGS::containsKey);
        List<TeamApplication> approvedTeamApplications = needsTeamApplications
                ? teamApplicationRepository.findByStatus(TeamApplication.ApplicationStatus.APPROVED)
                : Collections.emptyList();

        for (RecipientCategory category : categories) {
            switch (category) {
                case ALL_USERS -> userRepository.findAll().forEach(user -> upsertUserRecipient(user, category, recipients));
                case PARENTS -> participantRepository.findAll().forEach(participant -> {
                    User parent = participant.getParentUser();
                    if (parent != null) {
                        upsertUserRecipient(parent, category, recipients);
                    }
                });
                case VOLUNTEERS -> volunteerEmployeeRepository.findAll().forEach(volunteer -> {
                    if (volunteer.getUser() != null) {
                        upsertUserRecipient(volunteer.getUser(), category, recipients);
                    }
                });
                case APPROVED_VOLUNTEERS -> volunteerEmployeeRepository
                        .findByStatus(VolunteerEmployee.EmployeeStatus.APPROVED)
                        .forEach(volunteer -> {
                            if (volunteer.getUser() != null) {
                                upsertUserRecipient(volunteer.getUser(), category, recipients);
                            }
                        });
                case PENDING_APPLICATIONS -> volunteerEmployeeRepository
                        .findByStatus(VolunteerEmployee.EmployeeStatus.PENDING)
                        .forEach(volunteer -> {
                            if (volunteer.getUser() != null) {
                                upsertUserRecipient(volunteer.getUser(), category, recipients);
                            }
                        });
                case COACHES, EVENT_COORDINATORS, SOCIAL_MEDIA_TEAM -> {
                    String targetSlug = TEAM_CATEGORY_SLUGS.get(category);
                    if (targetSlug != null && !approvedTeamApplications.isEmpty()) {
                        approvedTeamApplications.stream()
                                .filter(app -> slugify(app.getTeamName()).equals(targetSlug))
                                .forEach(app -> {
                                    VolunteerEmployee volunteer = app.getVolunteerEmployee();
                                    if (volunteer != null && volunteer.getUser() != null) {
                                        upsertUserRecipient(volunteer.getUser(), category, recipients);
                                    }
                                });
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
                            userRepository.findByEmailIgnoreCase(email)
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
                        }
                    });
        }

        Map<RecipientCategory, Integer> categoryCounts = new EnumMap<>(RecipientCategory.class);
        recipients.values().forEach(recipient -> {
            recipient.getCategories().forEach(category ->
                    categoryCounts.merge(category, 1, Integer::sum));
        });

        return new RecipientResolutionResult(new ArrayList<>(recipients.values()), directEmailsWithoutAccounts, categoryCounts);
    }

    private MessagingRecipient upsertUserRecipient(User user, RecipientCategory category, Map<String, MessagingRecipient> recipients) {
        if (user == null) {
            return null;
        }

        String key = buildUserKey(user);
        MessagingRecipient recipient = recipients.get(key);
        if (recipient == null) {
            recipient = new MessagingRecipient();
            recipient.setUserId(user.getId());
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

    private String buildUserKey(User user) {
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

    private String buildDisplayName(User user) {
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
