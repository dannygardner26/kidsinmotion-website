package com.example.restservice;

import com.example.restservice.model.firestore.EventFirestore;
import com.example.restservice.model.firestore.UserFirestore;
import com.example.restservice.model.firestore.ParticipantFirestore;
import com.example.restservice.model.firestore.VolunteerFirestore;
import com.example.restservice.repository.firestore.EventFirestoreRepository;
import com.example.restservice.repository.firestore.UserFirestoreRepository;
import com.example.restservice.repository.firestore.ParticipantFirestoreRepository;
import com.example.restservice.repository.firestore.VolunteerFirestoreRepository;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.service.NotificationService;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.FieldValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@CrossOrigin(origins = "*", maxAge = 3600) // Allow all origins for now
@RestController
@RequestMapping("/api/participants")
public class ParticipantController {

    private static final Logger logger = LoggerFactory.getLogger(ParticipantController.class);

    @Autowired
    private ParticipantFirestoreRepository participantRepository;

    @Autowired
    private UserFirestoreRepository userRepository;

    @Autowired
    private EventFirestoreRepository eventRepository;

    @Autowired
    private VolunteerFirestoreRepository volunteerRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired(required = false)
    private Firestore firestore;

    // Fetch participant registrations for the currently logged-in user
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserParticipantRegistrations(HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            List<ParticipantFirestore> participants = participantRepository.findByParentUserId(firebaseUid);
            return ResponseEntity.ok(participants);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to fetch participant registrations - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to fetch participant registrations - " + e.getMessage()));
        }
    }

    // Get all participants for an event (Admin only)
    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getParticipantsForEvent(@PathVariable String eventId) {
        try {
            List<ParticipantFirestore> participants = participantRepository.findByEventId(eventId);

            // Enrich participant data with parent user information
            for (ParticipantFirestore participant : participants) {
                try {
                    Optional<UserFirestore> parentUserOpt = userRepository.findByFirebaseUid(participant.getParentUserId());
                    if (parentUserOpt.isPresent()) {
                        UserFirestore parentUser = parentUserOpt.get();

                        // Create a map to include parent user details
                        Map<String, Object> parentUserDetails = new HashMap<>();
                        parentUserDetails.put("firstName", parentUser.getFirstName());
                        parentUserDetails.put("lastName", parentUser.getLastName());
                        parentUserDetails.put("email", parentUser.getEmail());
                        parentUserDetails.put("phoneNumber", parentUser.getPhoneNumber());
                        parentUserDetails.put("username", parentUser.getUsername());

                        // Update denormalized fields on participant if they're empty
                        if (participant.getParentUserFirstName() == null || participant.getParentUserFirstName().isEmpty()) {
                            participant.setParentUserFirstName(parentUser.getFirstName());
                        }
                        if (participant.getParentUserLastName() == null || participant.getParentUserLastName().isEmpty()) {
                            participant.setParentUserLastName(parentUser.getLastName());
                        }
                        if (participant.getParentUserEmail() == null || participant.getParentUserEmail().isEmpty()) {
                            participant.setParentUserEmail(parentUser.getEmail());
                        }
                        if (participant.getParentUserPhoneNumber() == null || participant.getParentUserPhoneNumber().isEmpty()) {
                            participant.setParentUserPhoneNumber(parentUser.getPhoneNumber());
                        }

                        // Set the parent user details using reflection or a custom field
                        participant.setParentUser(parentUserDetails);
                    }
                } catch (Exception userError) {
                    // Log the error but don't fail the entire request
                    System.err.println("Error enriching participant " + participant.getId() + " with parent user data: " + userError.getMessage());
                }
            }

            return ResponseEntity.ok(participants);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to fetch participants - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to fetch participants - " + e.getMessage()));
        }
    }

    // Get all participants (Admin only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllParticipants() {
        try {
            List<ParticipantFirestore> participants = participantRepository.findAll();
            return ResponseEntity.ok(participants);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to fetch participants - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to fetch participants - " + e.getMessage()));
        }
    }

    // Register as participant for an event
    @PostMapping
    public ResponseEntity<?> registerAsParticipant(@Valid @RequestBody ParticipantRegistrationRequest request,
                                                 HttpServletRequest httpRequest) {
        try {
            // Log the incoming registration request for debugging (masked for PII protection)
            logger.debug("Participant registration request received: eventId={}, participantFirstName={}, participantLastName={}, participantAge={}, participantAgeGroup={}, emergencyContactName={}, emergencyContactPhone={}",
                request.getEventId(),
                request.getParticipantFirstName() != null ? request.getParticipantFirstName().charAt(0) + "***" : null,
                request.getParticipantLastName() != null ? request.getParticipantLastName().charAt(0) + "***" : null,
                request.getParticipantAge(), request.getParticipantAgeGroup(),
                request.getEmergencyContactName() != null ? request.getEmergencyContactName().charAt(0) + "***" : null,
                request.getEmergencyContactPhone() != null ? "***-***-" + request.getEmergencyContactPhone().substring(Math.max(0, request.getEmergencyContactPhone().length() - 4)) : null);

            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            String firebaseEmail = (String) httpRequest.getAttribute("firebaseEmail");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            // Check if this specific child is already registered for this event
            String childName = request.getParticipantFirstName() + " " + request.getParticipantLastName();
            String normalizedChildName = normalizeChildName(childName);

            // Check for existing registrations using normalized name comparison
            List<ParticipantFirestore> allParentEventRegistrations = participantRepository.findByParentUserIdAndEventId(firebaseUid, request.getEventId());
            boolean childAlreadyRegistered = allParentEventRegistrations.stream()
                .anyMatch(reg -> normalizeChildName(reg.getChildName()).equals(normalizedChildName));

            if (childAlreadyRegistered) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + childName + " is already registered for this event"));
            }

            // Get user and event details for denormalization
            Optional<UserFirestore> userOpt = userRepository.findByFirebaseUid(firebaseUid);
            Optional<EventFirestore> eventOpt = eventRepository.findById(request.getEventId());

            if (!eventOpt.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Event not found"));
            }

            EventFirestore event = eventOpt.get();

            // Check event age range validation
            Integer childAge = request.getParticipantAge();
            if (event.getMinAge() != null && childAge < event.getMinAge()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Child does not meet minimum age requirement. Please contact us if you have questions."));
            }
            if (event.getMaxAge() != null && childAge > event.getMaxAge()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Child exceeds maximum age requirement. Please contact us if you have questions."));
            }

            // Check event capacity
            if (event.getCapacity() != null && event.getCapacity() > 0) {
                long currentParticipants = participantRepository.countByEventId(request.getEventId());
                if (currentParticipants >= event.getCapacity()) {
                    return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Event is at full capacity"));
                }
            }

            // Create participant record
            ParticipantFirestore participant = new ParticipantFirestore();
            participant.setParentUserId(firebaseUid);
            participant.setEventId(request.getEventId());
            participant.setChildName(request.getParticipantFirstName() + " " + request.getParticipantLastName());
            participant.setChildAge(request.getParticipantAge());
            participant.setAgeGroup(request.getParticipantAgeGroup());
            participant.setRegistrationDateFromLocalDate(LocalDate.now());
            participant.setStatus("REGISTERED");
            // Safely construct emergency contact string with null checks
            String emergencyContactName = request.getEmergencyContactName() != null ? request.getEmergencyContactName() : "";
            String emergencyContactPhone = request.getEmergencyContactPhone() != null ? request.getEmergencyContactPhone() : "";
            String emergencyContactString = "";
            if (!emergencyContactName.isEmpty() && !emergencyContactPhone.isEmpty()) {
                emergencyContactString = emergencyContactName + " - " + emergencyContactPhone;
            } else if (!emergencyContactName.isEmpty()) {
                emergencyContactString = emergencyContactName;
            } else if (!emergencyContactPhone.isEmpty()) {
                emergencyContactString = emergencyContactPhone;
            }
            participant.setEmergencyContact(emergencyContactString);
            participant.setMedicalConcerns(request.getMedicalInfo());
            participant.setAdditionalInformation(request.getSpecialRequests());

            // Add denormalized fields
            participant.setParentUserEmail(firebaseEmail);
            if (userOpt.isPresent()) {
                UserFirestore user = userOpt.get();
                participant.setParentUserFirstName(user.getFirstName());
                participant.setParentUserLastName(user.getLastName());
                participant.setParentUserPhoneNumber(user.getPhoneNumber());
                participant.setParentUserFullName(user.getFullName());

                // Update user's email communication preference based on registration consent
                if (request.getAgreesToCommunications() != null) {
                    // If user explicitly agrees, set opted out to false
                    // If user doesn't agree, set opted out to true
                    boolean optOut = !request.getAgreesToCommunications();
                    user.setEmailOptedOut(optOut);
                    user.setUpdatedTimestamp(System.currentTimeMillis());
                    userRepository.save(user); // Save the updated user preference
                }
            }

            participant.setEventName(event.getName());
            participant.setEventDate(event.getDate());

            ParticipantFirestore savedParticipant = participantRepository.save(participant);

            // Update event's allowedUserIds array to include the parent for chat access
            updateEventAllowedUsers(request.getEventId(), firebaseUid);

            // Send notifications after successful registration and collect delivery status
            NotificationService.NotificationDeliveryStatus deliveryStatus =
                notificationService.sendRegistrationNotifications(savedParticipant, event, firebaseEmail, firebaseUid);

            // Create response with participant data and delivery status
            Map<String, Object> response = new HashMap<>();
            response.put("participant", savedParticipant);
            response.put("deliveryStatus", deliveryStatus);

            return ResponseEntity.ok(response);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to register participant - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to register participant - " + e.getMessage()));
        }
    }

    // Update participant registration status (Admin only)
    @PutMapping("/{participantId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateParticipantStatus(@PathVariable String participantId,
                                                   @Valid @RequestBody UpdateParticipantStatusRequest request) {
        try {
            Optional<ParticipantFirestore> participantOpt = participantRepository.findById(participantId);
            if (!participantOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            ParticipantFirestore participant = participantOpt.get();
            participant.setStatus(request.getStatus());
            if (request.getAdminNotes() != null) {
                String currentNotes = participant.getAdditionalInformation() != null ? participant.getAdditionalInformation() : "";
                participant.setAdditionalInformation(currentNotes + "\nAdmin: " + request.getAdminNotes());
            }

            ParticipantFirestore updatedParticipant = participantRepository.save(participant);
            return ResponseEntity.ok(updatedParticipant);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to update participant status - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to update participant status - " + e.getMessage()));
        }
    }

    // Cancel participant registration
    @DeleteMapping("/{participantId}")
    public ResponseEntity<?> cancelParticipantRegistration(@PathVariable String participantId,
                                                         HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            Optional<ParticipantFirestore> participantOpt = participantRepository.findById(participantId);
            if (!participantOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            ParticipantFirestore participant = participantOpt.get();

            // Check if user owns this participant record or is admin
            if (!participant.getParentUserId().equals(firebaseUid)) {
                // Check if user is admin
                Optional<UserFirestore> userOpt = userRepository.findByFirebaseUid(firebaseUid);
                if (!userOpt.isPresent() || !"ADMIN".equals(userOpt.get().getUserType())) {
                    return ResponseEntity.status(403)
                        .body(new MessageResponse("Error: You can only cancel your own participant registrations"));
                }
            }

            // Check if this parent has any other participants for this event before removal
            List<ParticipantFirestore> otherParticipants = participantRepository
                .findByParentUserIdAndEventId(participant.getParentUserId(), participant.getEventId());

            // Remove the participant
            participantRepository.deleteById(participantId);

            // If this was the last participant for this parent, remove from allowedUserIds
            if (otherParticipants.size() <= 1) { // <= 1 because we haven't removed it from the list yet
                removeEventAllowedUser(participant.getEventId(), participant.getParentUserId());
            }

            return ResponseEntity.ok(new MessageResponse("Participant registration cancelled successfully"));

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to cancel participant registration - " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to cancel participant registration - " + e.getMessage()));
        }
    }

    @PutMapping("/{participantId}/attendance")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VOLUNTEER')")
    public ResponseEntity<?> updateParticipantAttendance(
            @PathVariable String participantId,
            @RequestBody Map<String, Boolean> request,
            HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            Boolean present = request.get("present");
            if (present == null) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: 'present' field is required"));
            }

            // Find participant by ID
            Optional<ParticipantFirestore> participantOpt = participantRepository.findById(participantId);
            if (!participantOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            ParticipantFirestore participant = participantOpt.get();

            // Verify user is either admin or volunteer for this event
            Optional<UserFirestore> userOpt = userRepository.findByFirebaseUid(firebaseUid);
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not found"));
            }

            UserFirestore user = userOpt.get();
            boolean isAdmin = "ADMIN".equals(user.getUserType());
            boolean isVolunteer = false;

            if (!isAdmin) {
                // Check if user is a volunteer for this event
                List<VolunteerFirestore> volunteerRecords = volunteerRepository.findByUserIdAndEventId(firebaseUid, participant.getEventId());
                isVolunteer = !volunteerRecords.isEmpty();
            }

            if (!isAdmin && !isVolunteer) {
                return ResponseEntity.status(403)
                    .body(new MessageResponse("Error: Access denied. Must be admin or volunteer for this event"));
            }

            // Update status based on presence
            String newStatus = present ? "ATTENDED" : "REGISTERED";
            participant.setStatus(newStatus);

            // Save updated participant
            ParticipantFirestore updatedParticipant = participantRepository.save(participant);

            logger.info("Updated attendance for participant {} to status: {}", participantId, newStatus);

            return ResponseEntity.ok(updatedParticipant);

        } catch (Exception e) {
            logger.error("Error updating participant attendance: ", e);
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to update attendance - " + e.getMessage()));
        }
    }

    // Request classes for participant operations
    public static class ParticipantRegistrationRequest {
        @NotBlank(message = "Event ID is required")
        private String eventId;

        @NotBlank(message = "Participant first name is required")
        private String participantFirstName;

        @NotBlank(message = "Participant last name is required")
        private String participantLastName;

        @NotNull(message = "Participant age is required")
        @Min(value = 0, message = "Participant age must be at least 0")
        @Max(value = 21, message = "Participant age must be at most 21")
        private Integer participantAge;

        private String participantAgeGroup;
        private String emergencyContactName;
        private String emergencyContactPhone;
        private String medicalInfo;
        private String specialRequests;
        private Boolean agreesToCommunications; // User consent for receiving communications

        // Getters and setters
        public String getEventId() { return eventId; }
        public void setEventId(String eventId) { this.eventId = eventId; }

        public String getParticipantFirstName() { return participantFirstName; }
        public void setParticipantFirstName(String participantFirstName) { this.participantFirstName = participantFirstName; }

        public String getParticipantLastName() { return participantLastName; }
        public void setParticipantLastName(String participantLastName) { this.participantLastName = participantLastName; }

        public Integer getParticipantAge() { return participantAge; }
        public void setParticipantAge(Integer participantAge) { this.participantAge = participantAge; }

        public String getParticipantAgeGroup() { return participantAgeGroup; }
        public void setParticipantAgeGroup(String participantAgeGroup) { this.participantAgeGroup = participantAgeGroup; }

        public String getEmergencyContactName() { return emergencyContactName; }
        public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

        public String getEmergencyContactPhone() { return emergencyContactPhone; }
        public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

        public String getMedicalInfo() { return medicalInfo; }
        public void setMedicalInfo(String medicalInfo) { this.medicalInfo = medicalInfo; }

        public String getSpecialRequests() { return specialRequests; }
        public void setSpecialRequests(String specialRequests) { this.specialRequests = specialRequests; }

        public Boolean getAgreesToCommunications() { return agreesToCommunications; }
        public void setAgreesToCommunications(Boolean agreesToCommunications) { this.agreesToCommunications = agreesToCommunications; }

        @Override
        public String toString() {
            return "ParticipantRegistrationRequest{" +
                    "eventId='" + eventId + '\'' +
                    ", participantFirstName='" + participantFirstName + '\'' +
                    ", participantLastName='" + participantLastName + '\'' +
                    ", participantAge=" + participantAge +
                    ", participantAgeGroup='" + participantAgeGroup + '\'' +
                    ", emergencyContactName='" + emergencyContactName + '\'' +
                    ", emergencyContactPhone='" + emergencyContactPhone + '\'' +
                    ", medicalInfo='" + medicalInfo + '\'' +
                    ", specialRequests='" + specialRequests + '\'' +
                    '}';
        }
    }

    public static class UpdateParticipantStatusRequest {
        private String status;
        private String adminNotes;

        // Getters and setters
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getAdminNotes() { return adminNotes; }
        public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    }

    // Helper method to normalize child names for consistent comparison
    private String normalizeChildName(String childName) {
        if (childName == null) {
            return "";
        }
        return childName.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    // Helper method to update event's allowedUserIds array for chat access
    private void updateEventAllowedUsers(String eventId, String userId) {
        if (firestore == null) {
            logger.warn("Firestore not available - skipping allowedUserIds update");
            return;
        }

        try {
            DocumentReference eventRef = firestore.collection("events").document(eventId);
            eventRef.update("allowedUserIds", FieldValue.arrayUnion(userId)).get();
            logger.info("Added user {} to event {} allowedUserIds for chat access", userId, eventId);
        } catch (Exception e) {
            logger.warn("Failed to update event allowedUserIds for user {} in event {}: {}",
                       userId, eventId, e.getMessage());
            // Don't fail the registration if this update fails
        }
    }

    // Helper method to remove user from event's allowedUserIds array
    private void removeEventAllowedUser(String eventId, String userId) {
        if (firestore == null) {
            logger.warn("Firestore not available - skipping allowedUserIds removal");
            return;
        }

        try {
            DocumentReference eventRef = firestore.collection("events").document(eventId);
            eventRef.update("allowedUserIds", FieldValue.arrayRemove(userId)).get();
            logger.info("Removed user {} from event {} allowedUserIds", userId, eventId);
        } catch (Exception e) {
            logger.warn("Failed to remove user {} from event {} allowedUserIds: {}",
                       userId, eventId, e.getMessage());
            // Don't fail the operation if this update fails
        }
    }

}