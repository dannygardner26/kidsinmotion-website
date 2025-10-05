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

// CORS handled by WebSecurityConfig - removed wildcard origin for security
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
            return ResponseEntity.ok(signups);
            
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

    // Removed the static inner VolunteerSignup class
}