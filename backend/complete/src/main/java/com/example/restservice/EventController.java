package com.example.restservice;

import com.example.restservice.model.firestore.EventFirestore;
import com.example.restservice.model.firestore.VolunteerFirestore;
import com.example.restservice.model.firestore.ParticipantFirestore;
import com.example.restservice.repository.firestore.EventFirestoreRepository;
import com.example.restservice.repository.firestore.VolunteerFirestoreRepository;
import com.example.restservice.repository.firestore.ParticipantFirestoreRepository;
import com.example.restservice.service.MessagingService;
import com.example.restservice.service.EmailDeliveryService;
import com.example.restservice.service.CalendarInviteService;
import com.example.restservice.payload.response.MessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@CrossOrigin(origins = "*", maxAge = 3600) // Allow all origins for now
@RestController
@RequestMapping("/api/events")
public class EventController {

    private static final Logger logger = LoggerFactory.getLogger(EventController.class);

    @Autowired
    private EventFirestoreRepository eventRepository;

    @Autowired
    private VolunteerFirestoreRepository volunteerRepository;

    @Autowired
    private ParticipantFirestoreRepository participantRepository;

    @Autowired
    private MessagingService messagingService;

    @Autowired
    private EmailDeliveryService emailDeliveryService;

    @Autowired
    private CalendarInviteService calendarInviteService;

    // Fetch all events, ordered by date
    @GetMapping
    public ResponseEntity<?> getAllEvents() {
        try {
            List<EventFirestore> events = eventRepository.findAllByOrderByDateAsc();
            System.out.println("=== ENHANCED BACKEND DEBUG ===");
            System.out.println("DEBUG: getAllEvents returning " + events.size() + " events");
            if (!events.isEmpty()) {
                EventFirestore firstEvent = events.get(0);
                System.out.println("DEBUG: First event details:");
                System.out.println("  - Name: " + firstEvent.getName());
                System.out.println("  - Date: " + firstEvent.getDate());
                System.out.println("  - StartTime (raw): " + firstEvent.getStartTime());
                System.out.println("  - EndTime (raw): " + firstEvent.getEndTime());
                System.out.println("  - StartTime type: " + (firstEvent.getStartTime() != null ? firstEvent.getStartTime().getClass().getSimpleName() : "null"));
                System.out.println("  - EndTime type: " + (firstEvent.getEndTime() != null ? firstEvent.getEndTime().getClass().getSimpleName() : "null"));
                System.out.println("  - StartTime null check: " + (firstEvent.getStartTime() == null));
                System.out.println("  - EndTime null check: " + (firstEvent.getEndTime() == null));
                System.out.println("  - StartTime empty check: " + (firstEvent.getStartTime() != null && firstEvent.getStartTime().isEmpty()));
                System.out.println("  - EndTime empty check: " + (firstEvent.getEndTime() != null && firstEvent.getEndTime().isEmpty()));
            }
            return ResponseEntity.ok(events);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to fetch events - " + e.getMessage()));
        }
    }

    // Fetch aggregate stats for all events (Admin only)
    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getEventStats() {
        try {
            List<EventFirestore> events = eventRepository.findAllByOrderByDateAsc();
            Map<String, Object> eventStats = new HashMap<>();

            for (EventFirestore event : events) {
                Map<String, Object> stats = new HashMap<>();

                try {
                    // Get participant count
                    List<ParticipantFirestore> participants = participantRepository.findByEventId(event.getId());
                    int participantCount = participants.size();

                    // Get volunteer count
                    int volunteerCount = 0;
                    try {
                        List<VolunteerFirestore> volunteers = volunteerRepository.findByEventId(event.getId());
                        volunteerCount = volunteers.size();
                    } catch (Exception volError) {
                        logger.warn("Failed to fetch volunteers for event {}: {}", event.getId(), volError.getMessage());
                        volunteerCount = 0;
                    }

                    // Calculate revenue
                    double revenue = participantCount * (event.getPrice() != null ? event.getPrice() : 0.0);

                    // Build stats object
                    stats.put("eventId", event.getId());
                    stats.put("registrationCount", participantCount);
                    stats.put("volunteerCount", volunteerCount);
                    stats.put("revenue", revenue);
                    stats.put("capacity", event.getCapacity());
                    stats.put("isFullyBooked", event.getCapacity() != null && participantCount >= event.getCapacity());

                    eventStats.put(event.getId(), stats);

                } catch (Exception statsError) {
                    logger.warn("Failed to fetch stats for event {}: {}", event.getId(), statsError.getMessage());
                    // Create minimal stats object for failed events
                    Map<String, Object> fallbackStats = new HashMap<>();
                    fallbackStats.put("eventId", event.getId());
                    fallbackStats.put("registrationCount", 0);
                    fallbackStats.put("volunteerCount", 0);
                    fallbackStats.put("revenue", 0.0);
                    fallbackStats.put("capacity", event.getCapacity());
                    fallbackStats.put("isFullyBooked", false);
                    fallbackStats.put("error", true);
                    eventStats.put(event.getId(), fallbackStats);
                }
            }

            return ResponseEntity.ok(eventStats);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to fetch event stats - " + e.getMessage()));
        }
    }

    // Fetch upcoming events (today or later), ordered by date
    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingEvents() {
        try {
            LocalDate today = LocalDate.now();
            List<EventFirestore> events = eventRepository.findByDateGreaterThanEqualOrderByDateAsc(today);
            System.out.println("DEBUG: getUpcomingEvents returning " + events.size() + " events");
            if (!events.isEmpty()) {
                EventFirestore firstEvent = events.get(0);
                System.out.println("DEBUG: First upcoming event - startTime: " + firstEvent.getStartTime() + ", endTime: " + firstEvent.getEndTime());
            }
            return ResponseEntity.ok(events);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to fetch upcoming events - " + e.getMessage()));
        }
    }

    // Fetch past events (before today), ordered by date descending
    @GetMapping("/past")
    public ResponseEntity<?> getPastEvents() {
        try {
            LocalDate today = LocalDate.now();
            List<EventFirestore> events = eventRepository.findByDateLessThanOrderByDateDesc(today);
            return ResponseEntity.ok(events);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to fetch past events - " + e.getMessage()));
        }
    }

    // Get event by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable String id) {
        try {
            Optional<EventFirestore> eventOpt = eventRepository.findById(id);
            if (eventOpt.isPresent()) {
                return ResponseEntity.ok(eventOpt.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to fetch event - " + e.getMessage()));
        }
    }

    // Create new event (Admin only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createEvent(@Valid @RequestBody CreateEventRequest request) {
        try {
            EventFirestore event = new EventFirestore();
            event.setName(request.getName());
            event.setDescription(request.getDescription());
            event.setLocation(request.getLocation());
            event.setCapacity(request.getCapacity());
            event.setAgeGroup(request.getAgeGroup());
            event.setPrice(request.getPrice());
            event.setEventTypes(request.getEventTypes());

            // Handle date
            if (request.getDate() != null) {
                event.setDateFromLocalDate(request.getDate());
            }

            // Handle times - convert string times to LocalTime
            if (request.getStartTime() != null && !request.getStartTime().trim().isEmpty()) {
                try {
                    LocalTime startTime = LocalTime.parse(request.getStartTime());
                    event.setStartTimeFromLocalTime(startTime);
                } catch (Exception e) {
                    throw new RuntimeException("Invalid start time format: " + request.getStartTime());
                }
            }
            if (request.getEndTime() != null && !request.getEndTime().trim().isEmpty()) {
                try {
                    LocalTime endTime = LocalTime.parse(request.getEndTime());
                    event.setEndTimeFromLocalTime(endTime);
                } catch (Exception e) {
                    throw new RuntimeException("Invalid end time format: " + request.getEndTime());
                }
            }

            EventFirestore savedEvent = eventRepository.save(event);
            return ResponseEntity.ok(savedEvent);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to create event - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Invalid event data - " + e.getMessage()));
        }
    }

    // Update event (Admin only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateEvent(@PathVariable String id, @Valid @RequestBody CreateEventRequest request) {
        try {
            Optional<EventFirestore> eventOpt = eventRepository.findById(id);
            if (!eventOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            EventFirestore oldEvent = eventOpt.get();

            // Start with the existing event and only update provided fields
            EventFirestore event = new EventFirestore();
            event.setId(oldEvent.getId());

            // Copy all existing fields first to preserve data
            event.setName(oldEvent.getName());
            event.setDescription(oldEvent.getDescription());
            event.setLocation(oldEvent.getLocation());
            event.setCapacity(oldEvent.getCapacity());
            event.setAgeGroup(oldEvent.getAgeGroup());
            event.setPrice(oldEvent.getPrice());
            event.setEventTypes(oldEvent.getEventTypes());
            event.setDate(oldEvent.getDate());
            event.setStartTime(oldEvent.getStartTime());
            event.setEndTime(oldEvent.getEndTime());

            // Now update only the fields that are provided in the request
            if (request.getName() != null && !request.getName().trim().isEmpty()) {
                event.setName(request.getName());
            }
            if (request.getDescription() != null) {
                event.setDescription(request.getDescription());
            }
            if (request.getLocation() != null) {
                event.setLocation(request.getLocation());
            }
            if (request.getCapacity() != null) {
                event.setCapacity(request.getCapacity());
            }
            if (request.getAgeGroup() != null) {
                event.setAgeGroup(request.getAgeGroup());
            }
            if (request.getPrice() != null) {
                event.setPrice(request.getPrice());
            }
            if (request.getEventTypes() != null) {
                event.setEventTypes(request.getEventTypes());
            }

            // Handle date - only update if provided
            if (request.getDate() != null) {
                event.setDateFromLocalDate(request.getDate());
            }

            // Handle times - allow clearing by setting to null when empty string provided
            if (request.getStartTime() != null) {
                if (request.getStartTime().trim().isEmpty()) {
                    // Clear the start time
                    event.setStartTime(null);
                } else {
                    try {
                        LocalTime startTime = LocalTime.parse(request.getStartTime());
                        event.setStartTimeFromLocalTime(startTime);
                    } catch (Exception e) {
                        throw new RuntimeException("Invalid start time format: " + request.getStartTime());
                    }
                }
            }
            if (request.getEndTime() != null) {
                if (request.getEndTime().trim().isEmpty()) {
                    // Clear the end time
                    event.setEndTime(null);
                } else {
                    try {
                        LocalTime endTime = LocalTime.parse(request.getEndTime());
                        event.setEndTimeFromLocalTime(endTime);
                    } catch (Exception e) {
                        throw new RuntimeException("Invalid end time format: " + request.getEndTime());
                    }
                }
            }

            EventFirestore savedEvent = eventRepository.save(event);

            // Detect changes and send notifications
            Map<String, String> changes = detectEventChanges(oldEvent, savedEvent);
            if (!changes.isEmpty()) {
                try {
                    List<ParticipantFirestore> participants = participantRepository.findByEventId(id);
                    if (!participants.isEmpty()) {
                        logger.info("Event {} updated with {} changes, notifying {} participants",
                                   id, changes.size(), participants.size());

                        int emailCount = 0;
                        int inboxCount = 0;

                        for (ParticipantFirestore participant : participants) {
                            try {
                                // Send email notification with optional calendar invite
                                if (participant.getParentUserEmail() != null && emailDeliveryService.isEnabled()) {
                                    String emailBody = buildEventUpdateEmail(savedEvent, changes, participant.getChildName());
                                    boolean emailSent;

                                    // Check if we should include calendar invite (if date/time changed)
                                    if (shouldIncludeCalendarInvite(changes)) {
                                        try {
                                            String calendarInvite = calendarInviteService.generateBase64ICalInvite(
                                                savedEvent,
                                                participant.getChildName()
                                            );

                                            if (calendarInvite != null) {
                                                String emailBodyWithCalendar = emailBody + "\n\nA calendar invite is attached to this email to help you keep track of the updated event details.";
                                                emailSent = emailDeliveryService.sendEmailWithAttachment(
                                                    participant.getParentUserEmail(),
                                                    "Event Update: " + savedEvent.getName(),
                                                    emailBodyWithCalendar,
                                                    calendarInvite,
                                                    savedEvent.getName().replaceAll("[^a-zA-Z0-9]", "_") + "_updated.ics",
                                                    "text/calendar"
                                                );
                                                logger.debug("Sent email with calendar invite to {}", participant.getParentUserEmail());
                                            } else {
                                                // Fallback to regular email if calendar generation fails
                                                emailSent = emailDeliveryService.sendEmail(
                                                    participant.getParentUserEmail(),
                                                    "Event Update: " + savedEvent.getName(),
                                                    emailBody
                                                );
                                            }
                                        } catch (Exception calendarError) {
                                            logger.warn("Failed to generate calendar invite for participant {}, sending regular email: {}",
                                                       participant.getChildName(), calendarError.getMessage());
                                            // Fallback to regular email
                                            emailSent = emailDeliveryService.sendEmail(
                                                participant.getParentUserEmail(),
                                                "Event Update: " + savedEvent.getName(),
                                                emailBody
                                            );
                                        }
                                    } else {
                                        // No calendar invite needed, send regular email
                                        emailSent = emailDeliveryService.sendEmail(
                                            participant.getParentUserEmail(),
                                            "Event Update: " + savedEvent.getName(),
                                            emailBody
                                        );
                                    }

                                    if (emailSent) emailCount++;
                                }

                                // Send inbox message
                                if (participant.getParentUserId() != null) {
                                    Map<String, Object> inboxMessage = buildEventUpdateInboxMessage(savedEvent, changes, participant.getChildName());
                                    boolean inboxSent = messagingService.sendInboxMessage(participant.getParentUserId(), inboxMessage);
                                    if (inboxSent) inboxCount++;
                                }
                            } catch (Exception notificationError) {
                                logger.warn("Failed to send notification to participant {}: {}",
                                           participant.getChildName(), notificationError.getMessage());
                            }
                        }

                        logger.info("Sent {} emails and {} inbox messages for event update", emailCount, inboxCount);
                    }
                } catch (Exception e) {
                    logger.error("Error sending event update notifications: {}", e.getMessage());
                    // Don't fail the update if notifications fail
                }
            }

            return ResponseEntity.ok(savedEvent);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to update event - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Invalid event data - " + e.getMessage()));
        }
    }

    // Delete event (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteEvent(@PathVariable String id) {
        try {
            Optional<EventFirestore> eventOpt = eventRepository.findById(id);
            if (!eventOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            // Delete all volunteers for this event first
            volunteerRepository.deleteByEventId(id);
            System.out.println("Deleted volunteers for event: " + id);

            // Delete all participants for this event
            participantRepository.deleteByEventId(id);
            System.out.println("Deleted participants for event: " + id);

            // Now delete the event
            eventRepository.deleteById(id);
            return ResponseEntity.ok(new MessageResponse("Event and all associated records deleted successfully"));

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to delete event - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to delete event - " + e.getMessage()));
        }
    }

    // Request class for creating/updating events
    public static class CreateEventRequest {
        private String name;
        private LocalDate date;
        private String description;
        private String location;
        private Integer capacity;
        private String ageGroup;
        private Double price;
        private String eventTypes;
        private String startTime;
        private String endTime;

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public Integer getCapacity() { return capacity; }
        public void setCapacity(Integer capacity) { this.capacity = capacity; }

        public String getAgeGroup() { return ageGroup; }
        public void setAgeGroup(String ageGroup) { this.ageGroup = ageGroup; }

        public Double getPrice() { return price; }
        public void setPrice(Double price) { this.price = price; }

        public String getEventTypes() { return eventTypes; }
        public void setEventTypes(String eventTypes) { this.eventTypes = eventTypes; }

        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }

        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
    }

    // Helper methods for date/time formatting
    private String formatEventDate(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return "TBD";
        }
        try {
            LocalDate date = LocalDate.parse(dateString);
            return date.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
        } catch (Exception e) {
            logger.warn("Failed to parse date string: {}", dateString);
            return "TBD";
        }
    }

    private String formatEventTime(String timeString) {
        if (timeString == null || timeString.trim().isEmpty()) {
            return "TBD";
        }
        try {
            LocalTime time = LocalTime.parse(timeString);
            return time.format(DateTimeFormatter.ofPattern("h:mm a"));
        } catch (Exception e) {
            logger.warn("Failed to parse time string: {}", timeString);
            return "TBD";
        }
    }

    private String formatEventDateTime(String date, String startTime, String endTime) {
        String formattedDate = formatEventDate(date);
        String formattedStartTime = formatEventTime(startTime);
        String formattedEndTime = formatEventTime(endTime);

        if ("TBD".equals(formattedDate)) {
            return "Date and time TBD";
        }

        StringBuilder result = new StringBuilder(formattedDate);

        if (!"TBD".equals(formattedStartTime)) {
            result.append(" from ").append(formattedStartTime);
            if (!"TBD".equals(formattedEndTime)) {
                result.append(" to ").append(formattedEndTime);
            }
        } else if (!"TBD".equals(formattedEndTime)) {
            result.append(" until ").append(formattedEndTime);
        }

        return result.toString();
    }

    // Change detection method
    private Map<String, String> detectEventChanges(EventFirestore oldEvent, EventFirestore newEvent) {
        Map<String, String> changes = new HashMap<>();

        // Compare key fields
        if (!java.util.Objects.equals(oldEvent.getName(), newEvent.getName())) {
            changes.put("name", oldEvent.getName() + " → " + newEvent.getName());
        }

        if (!java.util.Objects.equals(oldEvent.getDate(), newEvent.getDate())) {
            changes.put("date", formatEventDate(oldEvent.getDate()) + " → " + formatEventDate(newEvent.getDate()));
        }

        if (!java.util.Objects.equals(oldEvent.getStartTime(), newEvent.getStartTime())) {
            changes.put("startTime", formatEventTime(oldEvent.getStartTime()) + " → " + formatEventTime(newEvent.getStartTime()));
        }

        if (!java.util.Objects.equals(oldEvent.getEndTime(), newEvent.getEndTime())) {
            changes.put("endTime", formatEventTime(oldEvent.getEndTime()) + " → " + formatEventTime(newEvent.getEndTime()));
        }

        if (!java.util.Objects.equals(oldEvent.getLocation(), newEvent.getLocation())) {
            changes.put("location", (oldEvent.getLocation() != null ? oldEvent.getLocation() : "TBD") + " → " + (newEvent.getLocation() != null ? newEvent.getLocation() : "TBD"));
        }

        if (!java.util.Objects.equals(oldEvent.getAgeGroup(), newEvent.getAgeGroup())) {
            changes.put("ageGroup", (oldEvent.getAgeGroup() != null ? oldEvent.getAgeGroup() : "Not specified") + " → " + (newEvent.getAgeGroup() != null ? newEvent.getAgeGroup() : "Not specified"));
        }

        if (!java.util.Objects.equals(oldEvent.getPrice(), newEvent.getPrice())) {
            changes.put("price", String.format("$%.2f → $%.2f", (oldEvent.getPrice() != null ? oldEvent.getPrice() : 0.0), (newEvent.getPrice() != null ? newEvent.getPrice() : 0.0)));
        }

        if (!java.util.Objects.equals(oldEvent.getCapacity(), newEvent.getCapacity())) {
            changes.put("capacity", (oldEvent.getCapacity() != null ? oldEvent.getCapacity().toString() : "Unlimited") + " → " + (newEvent.getCapacity() != null ? newEvent.getCapacity().toString() : "Unlimited"));
        }

        return changes;
    }

    // Email builder method
    private String buildEventUpdateEmail(EventFirestore event, Map<String, String> changes, String childName) {
        StringBuilder emailBody = new StringBuilder();

        emailBody.append("Dear Parent,\n\n");
        emailBody.append("The event '").append(event.getName()).append("' that ").append(childName).append(" is registered for has been updated.\n\n");

        emailBody.append("CHANGES MADE:\n");
        for (Map.Entry<String, String> change : changes.entrySet()) {
            String fieldName = change.getKey();
            String changeValue = change.getValue();

            // Make field names more readable
            switch (fieldName) {
                case "startTime":
                    fieldName = "Start Time";
                    break;
                case "endTime":
                    fieldName = "End Time";
                    break;
                case "ageGroup":
                    fieldName = "Age Group";
                    break;
                default:
                    fieldName = fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1);
            }

            emailBody.append("• ").append(fieldName).append(": ").append(changeValue).append("\n");
        }

        emailBody.append("\n");
        emailBody.append("UPDATED EVENT DETAILS:\n");
        emailBody.append("Event: ").append(event.getName()).append("\n");
        emailBody.append("Date & Time: ").append(formatEventDateTime(event.getDate(), event.getStartTime(), event.getEndTime())).append("\n");

        if (event.getLocation() != null && !event.getLocation().trim().isEmpty()) {
            emailBody.append("Location: ").append(event.getLocation()).append("\n");
        }

        if (event.getAgeGroup() != null && !event.getAgeGroup().trim().isEmpty()) {
            emailBody.append("Age Group: ").append(event.getAgeGroup()).append("\n");
        }

        if (event.getPrice() != null && event.getPrice() > 0) {
            emailBody.append("Price: $").append(String.format("%.2f", event.getPrice())).append("\n");
        }

        emailBody.append("\n");
        emailBody.append("If you have questions about these changes, please contact us.\n\n");
        emailBody.append("Thank you,\n");
        emailBody.append("Kids in Motion Team\n");
        emailBody.append("Email: info@kidsinmotionpa.org");

        return emailBody.toString();
    }

    // Inbox message builder method
    private Map<String, Object> buildEventUpdateInboxMessage(EventFirestore event, Map<String, String> changes, String childName) {
        Map<String, Object> message = new HashMap<>();

        message.put("id", "event_update_" + System.currentTimeMillis());
        message.put("type", "event-update");
        message.put("title", "Event Update: " + event.getName());

        // Build short message with first 2-3 changes
        StringBuilder shortMessage = new StringBuilder();
        shortMessage.append("The event '").append(event.getName()).append("' has been updated for ").append(childName).append(". ");

        int changeCount = 0;
        for (Map.Entry<String, String> change : changes.entrySet()) {
            if (changeCount >= 2) {
                shortMessage.append("and more...");
                break;
            }
            if (changeCount > 0) {
                shortMessage.append(", ");
            }
            shortMessage.append(change.getKey()).append(" changed");
            changeCount++;
        }

        shortMessage.append(". Check your email for full details.");

        message.put("message", shortMessage.toString());
        message.put("from", "Kids in Motion");
        message.put("timestamp", LocalDateTime.now().toString());
        message.put("read", false);
        message.put("isSystem", true);
        message.put("actionLink", "/dashboard");
        message.put("actionText", "View Registrations");

        return message;
    }

    // Helper method to determine if calendar invite should be included
    private boolean shouldIncludeCalendarInvite(Map<String, String> changes) {
        // Include calendar invite if date, start time, or end time changed
        return changes.containsKey("date") ||
               changes.containsKey("startTime") ||
               changes.containsKey("endTime") ||
               changes.containsKey("location");
    }
}