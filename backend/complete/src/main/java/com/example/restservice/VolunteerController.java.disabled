package com.example.restservice;

import com.example.restservice.model.Event;
import com.example.restservice.model.User;
import com.example.restservice.model.Volunteer;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.repository.EventRepository;
import com.example.restservice.repository.UserRepository;
import com.example.restservice.repository.VolunteerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600) // Allow all origins for now
@RestController
@RequestMapping("/api/volunteers")
public class VolunteerController {

    @Autowired
    private VolunteerRepository volunteerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventRepository eventRepository;

    // Fetch volunteer signups for the currently logged-in user
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserVolunteerSignups(HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");
            
            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            User currentUser = userRepository.findByFirebaseUid(firebaseUid)
                    .orElse(null);

            if (currentUser == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: User not found in database"));
            }

            List<Volunteer> signups = volunteerRepository.findByUser(currentUser);

            // Convert to DTOs to avoid lazy loading issues and provide consistent structure
            List<VolunteerSignupResponse> response = signups.stream()
                .map(volunteer -> new VolunteerSignupResponse(volunteer))
                .toList();

            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to get volunteer signups - " + e.getMessage()));
        }
    }

    // Sign up as volunteer for an event
    @PostMapping
    public ResponseEntity<?> volunteerForEvent(@Valid @RequestBody VolunteerSignupRequest request, 
                                             HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            
            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            User currentUser = userRepository.findByFirebaseUid(firebaseUid)
                    .orElse(null);

            if (currentUser == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: User not found in database"));
            }

            Event event = eventRepository.findById(request.getEventId())
                    .orElse(null);

            if (event == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: Event not found"));
            }

            // Check if already volunteered
            List<Volunteer> existingSignups = volunteerRepository
                .findByUserAndEvent(currentUser, event);
            
            if (!existingSignups.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You are already volunteering for this event"));
            }

            // Check if event is in the future
            if (event.getDate().isBefore(LocalDate.now())) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Cannot volunteer for past events"));
            }

            Volunteer volunteer = new Volunteer(currentUser, event, request.getRole());
            
            // Set additional fields
            if (request.getAvailability() != null) {
                volunteer.setAvailability(request.getAvailability());
            }
            if (request.getSkills() != null) {
                volunteer.setSkills(request.getSkills());
            }
            if (request.getNotes() != null) {
                volunteer.setNotes(request.getNotes());
            }

            Volunteer savedVolunteer = volunteerRepository.save(volunteer);
            return ResponseEntity.ok(savedVolunteer);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to sign up as volunteer - " + e.getMessage()));
        }
    }

    // Cancel volunteer signup
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelVolunteerSignup(@PathVariable Long id, 
                                                 HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");
            
            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            User currentUser = userRepository.findByFirebaseUid(firebaseUid)
                    .orElse(null);

            if (currentUser == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: User not found in database"));
            }

            Optional<Volunteer> volunteerOpt = volunteerRepository.findById(id);
            if (!volunteerOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Volunteer volunteer = volunteerOpt.get();
            
            // Check if the volunteer signup belongs to the current user
            if (!volunteer.getUser().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(403)
                    .body(new MessageResponse("Error: You can only cancel your own volunteer signups"));
            }

            // Check if event hasn't started yet
            if (volunteer.getEvent().getDate().isBefore(LocalDate.now())) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Cannot cancel volunteer signup for past events"));
            }

            volunteerRepository.delete(volunteer);
            return ResponseEntity.ok(new MessageResponse("Volunteer signup cancelled successfully"));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to cancel volunteer signup - " + e.getMessage()));
        }
    }

    // Get all volunteers for an event (Admin only)
    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getEventVolunteers(@PathVariable Long eventId) {
        try {
            Event event = eventRepository.findById(eventId)
                    .orElse(null);

            if (event == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: Event not found"));
            }

            List<Volunteer> volunteers = volunteerRepository.findByEvent(event);
            return ResponseEntity.ok(volunteers);
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to get volunteers - " + e.getMessage()));
        }
    }

    // Update volunteer status (Admin only)
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateVolunteerStatus(@PathVariable Long id, 
                                                 @RequestBody UpdateVolunteerStatusRequest request) {
        try {
            Optional<Volunteer> volunteerOpt = volunteerRepository.findById(id);
            if (!volunteerOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Volunteer volunteer = volunteerOpt.get();
            volunteer.setStatus(request.getStatus());
            
            Volunteer savedVolunteer = volunteerRepository.save(volunteer);
            return ResponseEntity.ok(savedVolunteer);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to update volunteer status - " + e.getMessage()));
        }
    }

    // Get all volunteers across all events (Admin only)
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllVolunteersWithEvents() {
        try {
            List<Volunteer> allVolunteers = volunteerRepository.findAll();
            return ResponseEntity.ok(allVolunteers);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to get all volunteers - " + e.getMessage()));
        }
    }

    // Request class for volunteer signup
    public static class VolunteerSignupRequest {
        private Long eventId;
        private String role;
        private String availability;
        private String skills;
        private String notes;

        // Getters and setters
        public Long getEventId() { return eventId; }
        public void setEventId(Long eventId) { this.eventId = eventId; }
        
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        
        public String getAvailability() { return availability; }
        public void setAvailability(String availability) { this.availability = availability; }
        
        public String getSkills() { return skills; }
        public void setSkills(String skills) { this.skills = skills; }
        
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    // Request class for updating volunteer status
    public static class UpdateVolunteerStatusRequest {
        private Volunteer.SignupStatus status;

        public Volunteer.SignupStatus getStatus() { return status; }
        public void setStatus(Volunteer.SignupStatus status) { this.status = status; }
    }

    // Response class for volunteer signups with event details
    public static class VolunteerSignupResponse {
        private Long id;
        private Long eventId;
        private String role;
        private String status;
        private String availability;
        private String skills;
        private String notes;
        private String signupDate;
        private EventDetails event;

        public VolunteerSignupResponse(Volunteer volunteer) {
            this.id = volunteer.getId();
            this.eventId = volunteer.getEvent().getId();
            this.role = volunteer.getRole();
            this.status = volunteer.getStatus() != null ? volunteer.getStatus().toString() : "CONFIRMED";
            this.availability = volunteer.getAvailability();
            this.skills = volunteer.getSkills();
            this.notes = volunteer.getNotes();
            this.signupDate = volunteer.getSignupDate() != null ? volunteer.getSignupDate().toString() : null;
            this.event = new EventDetails(volunteer.getEvent());
        }

        // Getters
        public Long getId() { return id; }
        public Long getEventId() { return eventId; }
        public String getRole() { return role; }
        public String getStatus() { return status; }
        public String getAvailability() { return availability; }
        public String getSkills() { return skills; }
        public String getNotes() { return notes; }
        public String getSignupDate() { return signupDate; }
        public EventDetails getEvent() { return event; }
    }

    // Event details for volunteer response
    public static class EventDetails {
        private Long id;
        private String title;
        private String name;
        private String startDate;
        private String endDate;
        private String location;
        private String description;

        public EventDetails(Event event) {
            this.id = event.getId();
            this.title = event.getName();
            this.name = event.getName();
            this.startDate = event.getDate() != null ? event.getDate().toString() : null;
            this.endDate = event.getDate() != null ? event.getDate().toString() : null; // Using same date for both since Event only has one date
            this.location = event.getLocation();
            this.description = event.getDescription();
        }

        // Getters
        public Long getId() { return id; }
        public String getTitle() { return title; }
        public String getName() { return name; }
        public String getStartDate() { return startDate; }
        public String getEndDate() { return endDate; }
        public String getLocation() { return location; }
        public String getDescription() { return description; }
    }
}