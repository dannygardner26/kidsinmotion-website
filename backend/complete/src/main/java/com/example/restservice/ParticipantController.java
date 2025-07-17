package com.example.restservice;

import com.example.restservice.model.Event;
import com.example.restservice.model.Participant;
import com.example.restservice.model.User;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.repository.EventRepository;
import com.example.restservice.repository.ParticipantRepository;
import com.example.restservice.repository.UserRepository;
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
@RequestMapping("/api/participants")
public class ParticipantController {

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventRepository eventRepository;

    // Fetch registrations for the currently logged-in user
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserRegistrations(HttpServletRequest request) {
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

            List<Participant> registrations = participantRepository.findByParentUser(currentUser);
            return ResponseEntity.ok(registrations);
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to get registrations - " + e.getMessage()));
        }
    }

    // Register for an event
    @PostMapping
    public ResponseEntity<?> registerForEvent(@Valid @RequestBody RegisterEventRequest request, 
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

            // Check if already registered
            List<Participant> existingRegistrations = participantRepository
                .findByParentUserAndEvent(currentUser, event);
            
            if (!existingRegistrations.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Child already registered for this event"));
            }

            // Check capacity if set
            if (event.getCapacity() != null) {
                long currentRegistrations = participantRepository.countByEvent(event);
                if (currentRegistrations >= event.getCapacity()) {
                    return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Event is at full capacity"));
                }
            }

            Participant participant = new Participant(request.getChildName(), currentUser, event);
            
            // Set additional fields
            if (request.getChildAge() != null) {
                participant.setChildAge(request.getChildAge());
            }
            if (request.getAllergies() != null) {
                participant.setAllergies(request.getAllergies());
            }
            if (request.getEmergencyContact() != null) {
                participant.setEmergencyContact(request.getEmergencyContact());
            }

            Participant savedParticipant = participantRepository.save(participant);
            return ResponseEntity.ok(savedParticipant);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to register for event - " + e.getMessage()));
        }
    }

    // Cancel registration
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelRegistration(@PathVariable Long id, 
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

            Optional<Participant> participantOpt = participantRepository.findById(id);
            if (!participantOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Participant participant = participantOpt.get();
            
            // Check if the participant belongs to the current user
            if (!participant.getParentUser().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(403)
                    .body(new MessageResponse("Error: You can only cancel your own registrations"));
            }

            // Check if event hasn't started yet
            if (participant.getEvent().getDate().isBefore(LocalDate.now())) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Cannot cancel registration for past events"));
            }

            participantRepository.delete(participant);
            return ResponseEntity.ok(new MessageResponse("Registration cancelled successfully"));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to cancel registration - " + e.getMessage()));
        }
    }

    // Get all participants for an event (Admin only)
    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getEventParticipants(@PathVariable Long eventId) {
        try {
            Event event = eventRepository.findById(eventId)
                    .orElse(null);

            if (event == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: Event not found"));
            }

            List<Participant> participants = participantRepository.findByEvent(event);
            return ResponseEntity.ok(participants);
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to get participants - " + e.getMessage()));
        }
    }

    // Request class for event registration
    public static class RegisterEventRequest {
        private Long eventId;
        private String childName;
        private Integer childAge;
        private String allergies;
        private String emergencyContact;

        // Getters and setters
        public Long getEventId() { return eventId; }
        public void setEventId(Long eventId) { this.eventId = eventId; }
        
        public String getChildName() { return childName; }
        public void setChildName(String childName) { this.childName = childName; }
        
        public Integer getChildAge() { return childAge; }
        public void setChildAge(Integer childAge) { this.childAge = childAge; }
        
        public String getAllergies() { return allergies; }
        public void setAllergies(String allergies) { this.allergies = allergies; }
        
        public String getEmergencyContact() { return emergencyContact; }
        public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
    }

    // Removed the static inner ParticipantRegistration class
}