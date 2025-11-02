package com.example.restservice;

import com.example.restservice.model.firestore.EventFirestore;
import com.example.restservice.model.firestore.UserFirestore;
import com.example.restservice.model.firestore.VolunteerFirestore;
import com.example.restservice.repository.firestore.EventFirestoreRepository;
import com.example.restservice.repository.firestore.UserFirestoreRepository;
import com.example.restservice.repository.firestore.VolunteerFirestoreRepository;
import com.example.restservice.payload.response.MessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@CrossOrigin(origins = "*", maxAge = 3600) // Allow all origins for now
@RestController
@RequestMapping("/api/volunteers")
public class VolunteerController {

    @Autowired
    private VolunteerFirestoreRepository volunteerRepository;

    @Autowired
    private UserFirestoreRepository userRepository;

    @Autowired
    private EventFirestoreRepository eventRepository;

    // Fetch volunteer signups for the currently logged-in user
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserVolunteerSignups(HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            List<VolunteerFirestore> volunteers = volunteerRepository.findByUserId(firebaseUid);
            return ResponseEntity.ok(volunteers);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to fetch volunteer signups - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to fetch volunteer signups - " + e.getMessage()));
        }
    }

    // Get all volunteers for an event (Admin only)
    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getVolunteersForEvent(@PathVariable String eventId) {
        try {
            List<VolunteerFirestore> volunteers = volunteerRepository.findByEventId(eventId);
            return ResponseEntity.ok(volunteers);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to fetch volunteers - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to fetch volunteers - " + e.getMessage()));
        }
    }

    // Get all volunteers (Admin only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllVolunteers() {
        try {
            List<VolunteerFirestore> volunteers = volunteerRepository.findAll();
            return ResponseEntity.ok(volunteers);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to fetch volunteers - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to fetch volunteers - " + e.getMessage()));
        }
    }

    // Get all volunteers with event details (Admin only)
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllVolunteersWithEventDetails() {
        try {
            List<VolunteerFirestore> volunteers = volunteerRepository.findAll();
            return ResponseEntity.ok(volunteers);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to fetch volunteers - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to fetch volunteers - " + e.getMessage()));
        }
    }

    // Sign up as volunteer for an event
    @PostMapping
    public ResponseEntity<?> signUpAsVolunteer(@Valid @RequestBody VolunteerSignupRequest request,
                                             HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            String firebaseEmail = (String) httpRequest.getAttribute("firebaseEmail");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            // Check if user already volunteered for this event
            List<VolunteerFirestore> existingVolunteers = volunteerRepository.findByUserIdAndEventId(firebaseUid, request.getEventId());
            if (!existingVolunteers.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You are already signed up to volunteer for this event"));
            }

            // Get user and event details for denormalization
            Optional<UserFirestore> userOpt = userRepository.findByFirebaseUid(firebaseUid);
            Optional<EventFirestore> eventOpt = eventRepository.findById(request.getEventId());

            if (!eventOpt.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Event not found"));
            }

            // Create volunteer record
            VolunteerFirestore volunteer = new VolunteerFirestore();
            volunteer.setUserId(firebaseUid);
            volunteer.setEventId(request.getEventId());
            volunteer.setRole(request.getRole() != null ? request.getRole() : "Event Helper");
            volunteer.setSignupDateFromLocalDate(LocalDate.now());
            volunteer.setStatus("CONFIRMED");
            volunteer.setAvailability(request.getAvailability());
            volunteer.setSkills(request.getSkills());
            volunteer.setNotes(request.getNotes());

            // Add denormalized fields
            volunteer.setUserEmail(firebaseEmail);
            if (userOpt.isPresent()) {
                UserFirestore user = userOpt.get();
                volunteer.setUserFirstName(user.getFirstName());
                volunteer.setUserLastName(user.getLastName());
                volunteer.setUserPhoneNumber(user.getPhoneNumber());
                volunteer.setUserUsername(user.getUsername());
                volunteer.setUserFullName(user.getFullName());
            }

            EventFirestore event = eventOpt.get();
            volunteer.setEventName(event.getName());
            volunteer.setEventDate(event.getDate());

            VolunteerFirestore savedVolunteer = volunteerRepository.save(volunteer);
            return ResponseEntity.ok(savedVolunteer);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to sign up as volunteer - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to sign up as volunteer - " + e.getMessage()));
        }
    }

    // Update volunteer signup status (Admin only)
    @PutMapping("/{volunteerId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateVolunteerStatus(@PathVariable String volunteerId,
                                                  @Valid @RequestBody UpdateVolunteerStatusRequest request) {
        try {
            Optional<VolunteerFirestore> volunteerOpt = volunteerRepository.findById(volunteerId);
            if (!volunteerOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            VolunteerFirestore volunteer = volunteerOpt.get();
            volunteer.setStatus(request.getStatus());
            if (request.getAdminNotes() != null) {
                volunteer.setNotes(volunteer.getNotes() + "\nAdmin: " + request.getAdminNotes());
            }

            VolunteerFirestore updatedVolunteer = volunteerRepository.save(volunteer);
            return ResponseEntity.ok(updatedVolunteer);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to update volunteer status - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to update volunteer status - " + e.getMessage()));
        }
    }

    // Cancel volunteer signup
    @DeleteMapping("/{volunteerId}")
    public ResponseEntity<?> cancelVolunteerSignup(@PathVariable String volunteerId,
                                                   HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            Optional<VolunteerFirestore> volunteerOpt = volunteerRepository.findById(volunteerId);
            if (!volunteerOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            VolunteerFirestore volunteer = volunteerOpt.get();

            // Check if user owns this volunteer record or is admin
            if (!volunteer.getUserId().equals(firebaseUid)) {
                // Check if user is admin
                Optional<UserFirestore> userOpt = userRepository.findByFirebaseUid(firebaseUid);
                if (!userOpt.isPresent() || !"ADMIN".equals(userOpt.get().getUserType())) {
                    return ResponseEntity.status(403)
                        .body(new MessageResponse("Error: You can only cancel your own volunteer signups"));
                }
            }

            volunteerRepository.deleteById(volunteerId);
            return ResponseEntity.ok(new MessageResponse("Volunteer signup cancelled successfully"));

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to cancel volunteer signup - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to cancel volunteer signup - " + e.getMessage()));
        }
    }

    // Request classes for volunteer operations
    public static class VolunteerSignupRequest {
        private String eventId;
        private String role;
        private String availability;
        private String skills;
        private String notes;

        // Getters and setters
        public String getEventId() { return eventId; }
        public void setEventId(String eventId) { this.eventId = eventId; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getAvailability() { return availability; }
        public void setAvailability(String availability) { this.availability = availability; }

        public String getSkills() { return skills; }
        public void setSkills(String skills) { this.skills = skills; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class UpdateVolunteerStatusRequest {
        private String status;
        private String adminNotes;

        // Getters and setters
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getAdminNotes() { return adminNotes; }
        public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    }
}