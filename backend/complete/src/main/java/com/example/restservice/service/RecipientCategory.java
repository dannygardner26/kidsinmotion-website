package com.example.restservice.service;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

public enum RecipientCategory {
    ALL_USERS("all"),
    PARENTS("parents"),
    VOLUNTEERS("volunteers"),
    APPROVED_VOLUNTEERS("approved"),
    PENDING_APPLICATIONS("pending"),
    COACHES("coaches"),
    EVENT_COORDINATORS("event-coordinators"),
    SOCIAL_MEDIA_TEAM("social-media"),
    FUNDRAISING_TEAM("fundraising"),
    DIRECT_EMAILS("direct"),
    EVENT_PARENTS("event-parents"),
    EVENT_VOLUNTEERS("event-volunteers");

    private final String id;

    RecipientCategory(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    public static Optional<RecipientCategory> fromId(String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(category -> category.id.equals(normalized))
                .findFirst();
    }
}
