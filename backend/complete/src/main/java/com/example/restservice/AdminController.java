package com.example.restservice;

import com.example.restservice.model.firestore.EventFirestore;
import com.example.restservice.model.firestore.ParticipantFirestore;
import com.example.restservice.model.firestore.VolunteerFirestore;
import com.example.restservice.model.firestore.UserFirestore;
import com.example.restservice.repository.firestore.EventFirestoreRepository;
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
}