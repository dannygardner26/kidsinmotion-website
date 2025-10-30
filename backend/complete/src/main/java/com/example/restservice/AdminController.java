package com.example.restservice;

import com.example.restservice.model.firestore.EventFirestore;
import com.example.restservice.repository.firestore.EventFirestoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"https://kidsinmotionpa.org", "https://www.kidsinmotionpa.org"})
public class AdminController {

    @Autowired
    private EventFirestoreRepository eventRepository;

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