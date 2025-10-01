package com.example.restservice;

import com.example.restservice.model.Event;
import com.example.restservice.repository.EventRepository;
import com.example.restservice.payload.response.MessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

// CORS handled by WebSecurityConfig - removed wildcard origin for security
@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired
    private EventRepository eventRepository;

    // Fetch all events, ordered by date
    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepository.findAllByOrderByDateAsc();
    }

    // Fetch upcoming events (today or later), ordered by date
    @GetMapping("/upcoming")
    public List<Event> getUpcomingEvents() {
        LocalDate today = LocalDate.now();
        return eventRepository.findByDateGreaterThanEqualOrderByDateAsc(today);
    }

    // Fetch past events (before today), ordered by date descending
    @GetMapping("/past")
    public List<Event> getPastEvents() {
        LocalDate today = LocalDate.now();
        return eventRepository.findByDateLessThanOrderByDateDesc(today);
    }

    // Get single event by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable Long id) {
        Optional<Event> event = eventRepository.findById(id);
        if (event.isPresent()) {
            return ResponseEntity.ok(event.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Create new event (Admin only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createEvent(@Valid @RequestBody CreateEventRequest eventRequest, 
                                       HttpServletRequest request) {
        try {
            Event event = new Event(
                eventRequest.getName(),
                eventRequest.getDate(),
                eventRequest.getDescription()
            );
            
            // Set additional fields if provided
            if (eventRequest.getLocation() != null) {
                event.setLocation(eventRequest.getLocation());
            }
            if (eventRequest.getCapacity() != null) {
                event.setCapacity(eventRequest.getCapacity());
            }
            if (eventRequest.getAgeGroup() != null) {
                event.setAgeGroup(eventRequest.getAgeGroup());
            }
            if (eventRequest.getPrice() != null) {
                event.setPrice(eventRequest.getPrice());
            }
            if (eventRequest.getTargetAudience() != null) {
                event.setTargetAudience(eventRequest.getTargetAudience());
            }

            Event savedEvent = eventRepository.save(event);
            return ResponseEntity.ok(savedEvent);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to create event - " + e.getMessage()));
        }
    }

    // Update event (Admin only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, 
                                       @Valid @RequestBody CreateEventRequest eventRequest) {
        try {
            Optional<Event> eventOpt = eventRepository.findById(id);
            if (!eventOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Event event = eventOpt.get();
            event.setName(eventRequest.getName());
            event.setDate(eventRequest.getDate());
            event.setDescription(eventRequest.getDescription());
            
            if (eventRequest.getLocation() != null) {
                event.setLocation(eventRequest.getLocation());
            }
            if (eventRequest.getCapacity() != null) {
                event.setCapacity(eventRequest.getCapacity());
            }
            if (eventRequest.getAgeGroup() != null) {
                event.setAgeGroup(eventRequest.getAgeGroup());
            }
            if (eventRequest.getPrice() != null) {
                event.setPrice(eventRequest.getPrice());
            }
            if (eventRequest.getTargetAudience() != null) {
                event.setTargetAudience(eventRequest.getTargetAudience());
            }

            Event savedEvent = eventRepository.save(event);
            return ResponseEntity.ok(savedEvent);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to update event - " + e.getMessage()));
        }
    }

    // Delete event (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        try {
            if (!eventRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            eventRepository.deleteById(id);
            return ResponseEntity.ok(new MessageResponse("Event deleted successfully"));
            
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
        private String targetAudience;

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

        public String getTargetAudience() { return targetAudience; }
        public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }
    }
}