package com.example.restservice;

import com.example.restservice.model.firestore.EventFirestore;
import com.example.restservice.model.firestore.ConnectionFirestore;
import com.example.restservice.model.firestore.ParticipantFirestore;
import com.example.restservice.model.firestore.VolunteerFirestore;
import com.example.restservice.model.firestore.UserFirestore;
import com.example.restservice.repository.firestore.EventFirestoreRepository;
import com.example.restservice.repository.firestore.ConnectionFirestoreRepository;
import com.example.restservice.repository.firestore.ParticipantFirestoreRepository;
import com.example.restservice.repository.firestore.VolunteerFirestoreRepository;
import com.example.restservice.repository.firestore.UserFirestoreRepository;
import com.example.restservice.service.MessagingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.*;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"https://kidsinmotionpa.org", "https://www.kidsinmotionpa.org"})
public class AdminController {

    @Autowired
    private EventFirestoreRepository eventRepository;

    @Autowired
    private ConnectionFirestoreRepository connectionRepository;

    @Autowired
    private ParticipantFirestoreRepository participantRepository;

    @Autowired
    private VolunteerFirestoreRepository volunteerRepository;

    @Autowired
    private UserFirestoreRepository userRepository;

    @Autowired
    private MessagingService messagingService;

    // Fetch aggregate stats for all events (Admin only)
    @GetMapping("/events/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getEventStats() {
        try {
            List<EventFirestore> events = eventRepository.findAllByOrderByDateAsc();

            Map<String, Map<String, Object>> eventStats = new HashMap<>();

            // For each event, create basic stats (participants/volunteers would need proper repositories)
            for (EventFirestore event : events) {
                Map<String, Object> stats = new HashMap<>();
                stats.put("eventId", event.getId());
                stats.put("registrationCount", 0); // TODO: Add when participant repository is available
                stats.put("volunteerCount", 0); // TODO: Add when volunteer repository is available
                stats.put("revenue", 0.0);
                stats.put("capacity", event.getCapacity());
                stats.put("isFullyBooked", false);

                eventStats.put(event.getId(), stats);
            }

            return ResponseEntity.ok(eventStats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch event stats: " + e.getMessage()));
        }
    }

    // Network Broadcast endpoint for event-specific connection notifications
    @PostMapping("/events/{eventId}/network-broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> triggerEventNetworkBroadcast(@PathVariable String eventId, HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            // Fetch event details
            Optional<EventFirestore> eventOpt = eventRepository.findById(eventId);
            if (!eventOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("error", "Event not found"));
            }
            EventFirestore event = eventOpt.get();

            // Query all participants for event
            List<ParticipantFirestore> participants = participantRepository.findByEventId(eventId);

            // Query all volunteers for event
            List<VolunteerFirestore> volunteers = volunteerRepository.findByEventId(eventId);

            // Build map of connections to notify
            Map<String, List<Map<String, Object>>> connectionsToNotify = new HashMap<>();
            List<String> errors = new ArrayList<>();
            int totalRegistrations = 0;

            // Process participants
            for (ParticipantFirestore participant : participants) {
                totalRegistrations++;
                try {
                    // Skip banned users
                    Optional<UserFirestore> participantUserOpt = userRepository.findByFirebaseUid(participant.getParentUserId());
                    if (participantUserOpt.isPresent() && Boolean.TRUE.equals(participantUserOpt.get().getIsBanned())) {
                        continue;
                    }

                    List<ConnectionFirestore> connections = connectionRepository.findAcceptedConnectionsForUser(participant.getParentUserId());

                    for (ConnectionFirestore connection : connections) {
                        String connectionUid = connection.getUserId().equals(participant.getParentUserId())
                            ? connection.getConnectedUserId()
                            : connection.getUserId();

                        connectionsToNotify.computeIfAbsent(connectionUid, k -> new ArrayList<>());

                        Map<String, Object> registrationInfo = new HashMap<>();
                        registrationInfo.put("type", "participant");
                        registrationInfo.put("childName", participant.getChildName());
                        registrationInfo.put("parentName", participant.getParentUserFullName());
                        registrationInfo.put("parentUsername", participant.getParentUserUsername());
                        connectionsToNotify.get(connectionUid).add(registrationInfo);
                    }
                } catch (Exception e) {
                    errors.add("Error processing participant " + participant.getId() + ": " + e.getMessage());
                }
            }

            // Process volunteers
            for (VolunteerFirestore volunteer : volunteers) {
                totalRegistrations++;
                try {
                    // Skip banned users
                    Optional<UserFirestore> volunteerUserOpt = userRepository.findByFirebaseUid(volunteer.getUserId());
                    if (volunteerUserOpt.isPresent() && Boolean.TRUE.equals(volunteerUserOpt.get().getIsBanned())) {
                        continue;
                    }

                    List<ConnectionFirestore> connections = connectionRepository.findAcceptedConnectionsForUser(volunteer.getUserId());

                    for (ConnectionFirestore connection : connections) {
                        String connectionUid = connection.getUserId().equals(volunteer.getUserId())
                            ? connection.getConnectedUserId()
                            : connection.getUserId();

                        connectionsToNotify.computeIfAbsent(connectionUid, k -> new ArrayList<>());

                        Map<String, Object> registrationInfo = new HashMap<>();
                        registrationInfo.put("type", "volunteer");
                        registrationInfo.put("volunteerName", volunteer.getUserFullName());
                        registrationInfo.put("volunteerUsername", volunteer.getUserUsername());
                        registrationInfo.put("role", volunteer.getRole());
                        connectionsToNotify.get(connectionUid).add(registrationInfo);
                    }
                } catch (Exception e) {
                    errors.add("Error processing volunteer " + volunteer.getId() + ": " + e.getMessage());
                }
            }

            // Send notifications to connections
            int connectionsNotified = 0;
            for (Map.Entry<String, List<Map<String, Object>>> entry : connectionsToNotify.entrySet()) {
                String connectionUid = entry.getKey();
                List<Map<String, Object>> registrations = entry.getValue();

                try {
                    // Skip notifications to banned recipients
                    Optional<UserFirestore> connectionUserOpt = userRepository.findByFirebaseUid(connectionUid);
                    if (connectionUserOpt.isPresent() && Boolean.TRUE.equals(connectionUserOpt.get().getIsBanned())) {
                        System.out.println("Skipping network broadcast notification to banned user: " + connectionUid);
                        continue;
                    }
                    // Build message payload
                    StringBuilder messageBody = new StringBuilder();
                    messageBody.append("Your connections have registered for ").append(event.getName()).append(":\n\n");

                    for (Map<String, Object> reg : registrations) {
                        if ("participant".equals(reg.get("type"))) {
                            messageBody.append("• ").append(reg.get("parentName"))
                                .append(" (@").append(reg.get("parentUsername"))
                                .append(") registered ").append(reg.get("childName")).append("\n");
                        } else {
                            messageBody.append("• ").append(reg.get("volunteerName"))
                                .append(" (@").append(reg.get("volunteerUsername"))
                                .append(") volunteering as ").append(reg.get("role")).append("\n");
                        }
                    }

                    messageBody.append("\nEvent Details:\n");
                    messageBody.append("Date: ").append(event.getDate()).append("\n");
                    messageBody.append("Time: ").append(event.getStartTime()).append(" - ").append(event.getEndTime()).append("\n");
                    messageBody.append("Location: ").append(event.getLocation()).append("\n\n");
                    messageBody.append("Want to join them? Register now!");

                    Map<String, Object> messagePayload = new HashMap<>();
                    messagePayload.put("subject", "Your connections registered for " + event.getName());
                    messagePayload.put("message", messageBody.toString());
                    messagePayload.put("eventId", eventId);
                    messagePayload.put("eventName", event.getName());
                    messagePayload.put("type", "network_broadcast");
                    messagePayload.put("timestamp", System.currentTimeMillis());
                    messagePayload.put("registerUrl", "/events/" + eventId);
                    messagePayload.put("cta", "Register Now");

                    messagingService.sendInboxMessage(connectionUid, messagePayload);
                    connectionsNotified++;
                } catch (Exception e) {
                    errors.add("Error notifying connection " + connectionUid + ": " + e.getMessage());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("connectionsNotified", connectionsNotified);
            response.put("registrationsIncluded", totalRegistrations);
            response.put("errors", errors);
            response.put("message", "Network broadcast completed successfully");

            return ResponseEntity.ok(response);

        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to trigger network broadcast: " + e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to trigger network broadcast: " + e.getMessage()));
        }
    }
}