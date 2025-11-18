package com.example.restservice;

import com.example.restservice.model.firestore.EventFirestore;
import com.example.restservice.model.firestore.ParticipantFirestore;
import com.example.restservice.model.firestore.VolunteerFirestore;
import com.example.restservice.model.firestore.UserFirestore;
import com.example.restservice.repository.firestore.EventFirestoreRepository;
import com.example.restservice.repository.firestore.ParticipantFirestoreRepository;
import com.example.restservice.repository.firestore.VolunteerFirestoreRepository;
import com.example.restservice.repository.firestore.UserFirestoreRepository;
import com.example.restservice.security.FirebaseAuthService;
import com.example.restservice.service.MessagingService;
import com.example.restservice.service.EmailDeliveryService;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.FieldValue;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private EventFirestoreRepository eventRepository;


    @Autowired
    private ParticipantFirestoreRepository participantRepository;

    @Autowired
    private VolunteerFirestoreRepository volunteerRepository;

    @Autowired
    private UserFirestoreRepository userRepository;

    @Autowired
    private FirebaseAuthService firebaseAuthService;

    @Autowired
    private MessagingService messagingService;

    @Autowired
    private EmailDeliveryService emailDeliveryService;

    @Autowired(required = false)
    private Firestore firestore;

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

    // Reset test accounts (parent@gmail.com and volunteer@gmail.com)
    @PostMapping("/test-accounts/reset")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetTestAccounts() {
        logger.info("Starting test account reset operation");
        List<Map<String, Object>> createdAccounts = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        // Define test account data
        Map<String, Object>[] testAccounts = new Map[]{
            Map.of(
                "email", "parent@gmail.com",
                "password", "parent",
                "firstName", "Parent",
                "lastName", "Parent",
                "phone", "4848856284",
                "userType", "PARENT"
            ),
            Map.of(
                "email", "volunteer@gmail.com",
                "password", "volunteer",
                "firstName", "Volunteer",
                "lastName", "Volunteer",
                "phone", "4848856284",
                "userType", "VOLUNTEER"
            )
        };

        for (Map<String, Object> accountData : testAccounts) {
            String email = (String) accountData.get("email");
            String password = (String) accountData.get("password");
            String firstName = (String) accountData.get("firstName");
            String lastName = (String) accountData.get("lastName");
            String phone = (String) accountData.get("phone");
            String userType = (String) accountData.get("userType");

            try {
                logger.info("Processing test account: {}", email);

                // Step 1: Find existing user by email in Firestore
                Optional<UserFirestore> existingOpt = userRepository.findByEmail(email);
                UserFirestore existingUser = null;
                String existingFirebaseUid = null;

                if (existingOpt.isPresent()) {
                    existingUser = existingOpt.get();
                    existingFirebaseUid = existingUser.getFirebaseUid();
                    logger.info("Found existing Firestore user for {}", email);
                } else {
                    logger.info("No existing Firestore user found for {}, checking Firebase Auth...", email);

                    // Step 2: Check if user exists in Firebase Auth but not Firestore
                    try {
                        UserRecord existingAuthUser = FirebaseAuth.getInstance().getUserByEmail(email);
                        existingFirebaseUid = existingAuthUser.getUid();
                        logger.info("Found existing Firebase Auth user for {}: {}", email, existingFirebaseUid);
                    } catch (FirebaseAuthException e) {
                        if (e.getAuthErrorCode().name().equals("USER_NOT_FOUND")) {
                            logger.info("No existing Firebase Auth user found for {}", email);
                        } else {
                            logger.warn("Error checking Firebase Auth for {}: {}", email, e.getMessage());
                        }
                    }
                }

                // Step 3: Clean up orphaned participant and volunteer records
                if (existingFirebaseUid != null) {
                    logger.info("Cleaning up orphaned participant and volunteer records for UID: {}", existingFirebaseUid);

                    // Track affected event IDs for allowedUserIds cleanup
                    Set<String> affectedEventIds = new HashSet<>();

                    // Delete participant records and track event IDs
                    try {
                        List<ParticipantFirestore> participants = participantRepository.findByParentUserId(existingFirebaseUid);
                        for (ParticipantFirestore participant : participants) {
                            // Track the event ID before deleting
                            if (participant.getEventId() != null) {
                                affectedEventIds.add(participant.getEventId());
                            }
                            participantRepository.deleteById(participant.getId());
                            logger.info("Deleted participant record: {}", participant.getId());
                        }
                        logger.info("Deleted {} participant record(s) for UID {}", participants.size(), existingFirebaseUid);
                    } catch (Exception e) {
                        logger.warn("Failed to delete participant records for {}: {}", existingFirebaseUid, e.getMessage());
                    }

                    // Delete volunteer records
                    try {
                        volunteerRepository.deleteByUserId(existingFirebaseUid);
                        logger.info("Deleted volunteer records for UID: {}", existingFirebaseUid);
                    } catch (Exception e) {
                        logger.warn("Failed to delete volunteer records for {}: {}", existingFirebaseUid, e.getMessage());
                    }

                    // Remove user from event allowedUserIds arrays
                    if (!affectedEventIds.isEmpty()) {
                        logger.info("Removing UID {} from allowedUserIds for {} event(s)", existingFirebaseUid, affectedEventIds.size());
                        for (String eventId : affectedEventIds) {
                            try {
                                removeEventAllowedUser(eventId, existingFirebaseUid);
                            } catch (Exception e) {
                                logger.warn("Failed to remove UID {} from event {} allowedUserIds: {}",
                                           existingFirebaseUid, eventId, e.getMessage());
                            }
                        }
                    }
                }

                // Step 4: Delete existing Firestore user if found
                if (existingUser != null) {
                    logger.info("Deleting existing Firestore user for {}...", email);

                    // Delete from Firestore
                    try {
                        userRepository.deleteById(existingUser.getId());
                        logger.info("Deleted Firestore user document: {}", existingUser.getId());
                    } catch (Exception e) {
                        logger.warn("Failed to delete Firestore user {}: {}", existingUser.getId(), e.getMessage());
                    }
                }

                // Step 5: Delete Firebase Auth user if found
                if (existingFirebaseUid != null) {
                    logger.info("Deleting existing Firebase Auth user: {}", existingFirebaseUid);
                    try {
                        firebaseAuthService.deleteUser(existingFirebaseUid);
                        logger.info("Deleted Firebase Auth user: {}", existingFirebaseUid);
                    } catch (FirebaseAuthException e) {
                        logger.warn("Failed to delete Firebase Auth user {}: {}", existingFirebaseUid, e.getMessage());
                    }
                }

                // Step 6: Create new Firebase Auth user
                UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                    .setEmail(email)
                    .setPassword(password)
                    .setDisplayName(firstName + " " + lastName)
                    .setEmailVerified(true);

                UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
                String newUid = userRecord.getUid();
                logger.info("Created Firebase Auth user with UID: {}", newUid);

                // Step 7: Create Firestore user document
                UserFirestore newUser = new UserFirestore(newUid, firstName, lastName, email, phone);
                newUser.setUserType(userType);
                newUser.setEmailVerified(true);
                newUser.setIsEmailVerified(true);
                newUser.setPhoneVerified(false);
                newUser.setNeedsOnboarding(false); // Test accounts have complete profiles
                newUser.setCreatedTimestamp(System.currentTimeMillis());
                newUser.setUpdatedTimestamp(System.currentTimeMillis());

                userRepository.save(newUser);
                logger.info("Created Firestore user document for: {}", email);

                // Add to success list
                Map<String, Object> accountInfo = new HashMap<>();
                accountInfo.put("email", email);
                accountInfo.put("uid", newUid);
                accountInfo.put("userType", userType);
                createdAccounts.add(accountInfo);

            } catch (FirebaseAuthException e) {
                String errorMsg = "Firebase Auth error for " + email + ": " + e.getMessage();
                logger.error(errorMsg, e);
                errors.add(errorMsg);
            } catch (ExecutionException | InterruptedException e) {
                String errorMsg = "Firestore error for " + email + ": " + e.getMessage();
                logger.error(errorMsg, e);
                errors.add(errorMsg);
            } catch (Exception e) {
                String errorMsg = "Unexpected error for " + email + ": " + e.getMessage();
                logger.error(errorMsg, e);
                errors.add(errorMsg);
            }
        }

        logger.info("Test account reset operation completed. Created: {}, Errors: {}",
            createdAccounts.size(), errors.size());

        // Build response
        Map<String, Object> response = new HashMap<>();
        response.put("success", errors.isEmpty());
        response.put("createdAccounts", createdAccounts);
        response.put("errors", errors);
        response.put("message", errors.isEmpty() ?
            "Test accounts reset successfully" :
            "Test account reset completed with some errors");

        return errors.isEmpty() ?
            ResponseEntity.ok(response) :
            ResponseEntity.status(500).body(response);
    }

    // Test email delivery functionality
    @GetMapping("/test-email")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> testEmail(HttpServletRequest request) {
        logger.info("Testing email delivery functionality...");

        Map<String, Object> response = new HashMap<>();

        if (!emailDeliveryService.isEnabled()) {
            response.put("success", false);
            response.put("error", "Email delivery service is not properly configured");
            return ResponseEntity.status(500).body(response);
        }

        // Test sending an email to the admin email (from the request context)
        String adminEmail = (String) request.getAttribute("firebaseEmail");
        if (adminEmail == null) {
            response.put("success", false);
            response.put("error", "No admin email found in request context");
            return ResponseEntity.status(400).body(response);
        }

        String testSubject = "Kids in Motion - Email Test from " + System.currentTimeMillis();
        String testBody = "This is a test email from the Kids in Motion system.\n\n" +
                         "Email delivery configuration test performed at: " + new Date() + "\n\n" +
                         "If you receive this email, the email delivery system is working correctly!\n\n" +
                         "Test details:\n" +
                         "- From: info@kidsinmotionpa.org\n" +
                         "- To: " + adminEmail + "\n" +
                         "- SendGrid Integration: Active\n" +
                         "- Domain Authentication: kidsinmotionpa.org\n\n" +
                         "Best regards,\n" +
                         "Kids in Motion System";

        try {
            boolean emailSent = emailDeliveryService.sendEmail(adminEmail, testSubject, testBody);

            if (emailSent) {
                response.put("success", true);
                response.put("message", "Test email sent successfully to " + adminEmail);
                response.put("details", "Check your inbox for the test email. It may take a few minutes to arrive.");
                logger.info("Test email sent successfully to {}", adminEmail);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "Failed to send test email - check server logs for details");
                logger.error("Failed to send test email to {}", adminEmail);
                return ResponseEntity.status(500).body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Exception while sending test email: " + e.getMessage());
            logger.error("Exception while sending test email to {}: {}", adminEmail, e.getMessage(), e);
            return ResponseEntity.status(500).body(response);
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