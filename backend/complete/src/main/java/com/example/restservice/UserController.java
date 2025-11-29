package com.example.restservice;

import com.example.restservice.model.User;
import com.example.restservice.payload.response.UserProfileResponse;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.repository.firestore.UserFirestoreRepository;
import com.example.restservice.model.firestore.UserFirestore;
import com.example.restservice.security.FirebaseAuthService;
import com.example.restservice.service.MessagingService;
import com.example.restservice.service.NotificationService;
import com.example.restservice.service.SmsDeliveryService;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserInfo;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.concurrent.TimeUnit;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"https://kidsinmotionpa.org", "https://www.kidsinmotionpa.org"})
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserFirestoreRepository userFirestoreRepository;

    @Autowired
    private FirebaseAuthService firebaseAuthService;


    @Autowired(required = false)
    private Firestore db;

    @Autowired
    private MessagingService messagingService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SmsDeliveryService smsDeliveryService;

    @Value("${app.volunteer.emails:}")
    private String volunteerEmails;

    @PostMapping("/auth/sync-user")
    public ResponseEntity<?> syncUser(HttpServletRequest request, Authentication authentication) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");
            String firebaseEmail = (String) request.getAttribute("firebaseEmail");

            if (firebaseUid == null || firebaseEmail == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing Firebase authentication data"));
            }

            // Check if user already exists
            Optional<UserFirestore> existingUser = userFirestoreRepository.findByFirebaseUid(firebaseUid);

            UserFirestore user;
            boolean needsRegistrationCompletion = false;

            if (existingUser.isPresent()) {
                user = existingUser.get();
                boolean needsUpdate = false;

                // Check if user is banned
                if (user.getIsBanned() != null && user.getIsBanned()) {
                    return ResponseEntity.status(403).body(Map.of("error", "Your account has been suspended. Please contact support."));
                }

                // Update email if it has changed
                if (!firebaseEmail.equals(user.getEmail())) {
                    user.setEmail(firebaseEmail);
                    needsUpdate = true;
                }

                // Check if user needs registration completion (missing userType)
                if (user.getUserType() == null || user.getUserType().trim().isEmpty()) {
                    needsRegistrationCompletion = true;
                }

                // Update user type if they should be admin or volunteer but aren't
                if ("kidsinmotion0@gmail.com".equalsIgnoreCase(firebaseEmail) ||
                    "danny@dannygardner.com".equalsIgnoreCase(firebaseEmail)) {
                    if (!"ADMIN".equals(user.getUserType())) {
                        user.setUserType("ADMIN");
                        needsUpdate = true;
                    }
                    // Set admin account details for kidsinmotion0@gmail.com
                    if ("kidsinmotion0@gmail.com".equalsIgnoreCase(firebaseEmail)) {
                        if (!"Kids In".equals(user.getFirstName())) {
                            user.setFirstName("Kids In");
                            needsUpdate = true;
                        }
                        if (!"Motion".equals(user.getLastName())) {
                            user.setLastName("Motion");
                            needsUpdate = true;
                        }

                        // Set admin password idempotently
                        try {
                            firebaseAuthService.setUserPassword(firebaseUid, "admin123");
                        } catch (Exception e) {
                            System.err.println("Failed to set admin password: " + e.getMessage());
                            // Don't fail the whole sync operation
                        }
                    }
                } else if (isVolunteerEmail(firebaseEmail)) {
                    if (!"VOLUNTEER".equals(user.getUserType())) {
                        user.setUserType("VOLUNTEER");
                        needsUpdate = true;
                    }
                }

                // Set last login timestamp
                user.setLastLoginAt(System.currentTimeMillis());
                needsUpdate = true;

                if (needsUpdate) {
                    userFirestoreRepository.save(user);
                }
            } else {
                // Create new user
                user = new UserFirestore();
                user.setFirebaseUid(firebaseUid);
                user.setEmail(firebaseEmail);

                // Try to get user's display name from Firebase Auth
                try {
                    UserRecord userRecord = firebaseAuthService.getUserRecord(firebaseUid);
                    String displayName = userRecord.getDisplayName();

                    if (displayName != null && !displayName.trim().isEmpty()) {
                        // Parse display name into first and last name
                        String[] nameParts = displayName.trim().split("\\s+", 2);
                        user.setFirstName(nameParts.length > 0 ? nameParts[0] : "User");
                        user.setLastName(nameParts.length > 1 ? nameParts[1] : "");
                    } else {
                        // Fallback: Extract name from email
                        String[] emailParts = firebaseEmail.split("@")[0].split("\\.");
                        user.setFirstName(emailParts.length > 0 ? emailParts[0] : "User");
                        user.setLastName(emailParts.length > 1 ? emailParts[1] : "");
                    }
                } catch (Exception e) {
                    // Fallback: Extract name from email if Firebase Auth call fails
                    String[] emailParts = firebaseEmail.split("@")[0].split("\\.");
                    user.setFirstName(emailParts.length > 0 ? emailParts[0] : "User");
                    user.setLastName(emailParts.length > 1 ? emailParts[1] : "");
                }

                // Automatically grant admin privileges to specific emails
                if ("kidsinmotion0@gmail.com".equalsIgnoreCase(firebaseEmail) ||
                    "danny@dannygardner.com".equalsIgnoreCase(firebaseEmail)) {
                    user.setUserType("ADMIN");
                    // Set special admin account details for kidsinmotion0@gmail.com
                    if ("kidsinmotion0@gmail.com".equalsIgnoreCase(firebaseEmail)) {
                        user.setFirstName("Kids In");
                        user.setLastName("Motion");

                        // Set admin password
                        try {
                            firebaseAuthService.setUserPassword(firebaseUid, "admin123");
                        } catch (Exception e) {
                            System.err.println("Failed to set admin password: " + e.getMessage());
                            // Don't fail the whole sync operation
                        }
                    }
                } else if (isVolunteerEmail(firebaseEmail)) {
                    user.setUserType("VOLUNTEER");
                } else {
                    user.setUserType("PARENT");
                }

                // Assign random profile color
                String[] colors = {"#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"};
                String randomColor = colors[(int) (Math.random() * colors.length)];
                user.setProfileColor(randomColor);

                // Set last login timestamp
                user.setLastLoginAt(System.currentTimeMillis());

                userFirestoreRepository.save(user);
            }

            // Return user profile data with verification status
            UserProfileResponse response = buildUserProfileResponse(user, firebaseUid);

            // Add registration completion flag if needed
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("userProfile", response);
            if (needsRegistrationCompletion) {
                responseData.put("needsRegistrationCompletion", true);
            }

            return ResponseEntity.ok(responseData);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to sync user: " + e.getMessage()));
        }
    }

    @GetMapping("/auth/profile")
    public ResponseEntity<?> getUserProfile(HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing Firebase authentication data"));
            }

            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(firebaseUid);

            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            UserFirestore user = userOpt.get();

            UserProfileResponse response = buildUserProfileResponse(user, firebaseUid);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get user profile: " + e.getMessage()));
        }
    }

    @PutMapping("/auth/profile")
    public ResponseEntity<?> updateUserProfile(HttpServletRequest request, @RequestBody Map<String, Object> updates) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing Firebase authentication data"));
            }

            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(firebaseUid);

            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            UserFirestore user = userOpt.get();

            // Username functionality has been removed

            // Update other allowed fields
            if (updates.containsKey("firstName")) {
                user.setFirstName((String) updates.get("firstName"));
            }
            if (updates.containsKey("lastName")) {
                user.setLastName((String) updates.get("lastName"));
            }
            if (updates.containsKey("userType")) {
                user.setUserType((String) updates.get("userType"));
            }
            if (updates.containsKey("phoneNumber")) {
                user.setPhoneNumber((String) updates.get("phoneNumber"));
            }
            if (updates.containsKey("grade")) {
                user.setGrade((String) updates.get("grade"));
            }
            if (updates.containsKey("school")) {
                user.setSchool((String) updates.get("school"));
            }
            if (updates.containsKey("profilePictureUrl")) {
                user.setProfilePictureUrl((String) updates.get("profilePictureUrl"));
            }
            if (updates.containsKey("profileColor")) {
                user.setProfileColor((String) updates.get("profileColor"));
            }

            // Handle emergency contact information
            if (updates.containsKey("emergencyContactName")) {
                user.setEmergencyContactName((String) updates.get("emergencyContactName"));
            }
            if (updates.containsKey("emergencyContactPhone")) {
                user.setEmergencyContactPhone((String) updates.get("emergencyContactPhone"));
            }
            if (updates.containsKey("emergencyContactRelationship")) {
                user.setEmergencyContactRelationship((String) updates.get("emergencyContactRelationship"));
            }

            // Handle email preferences
            if (updates.containsKey("emailOptedOut")) {
                user.setEmailOptedOut((Boolean) updates.get("emailOptedOut"));
            }

            // Handle email change with Firebase Auth integration
            if (updates.containsKey("email")) {
                String newEmail = (String) updates.get("email");
                if (newEmail != null && !newEmail.trim().isEmpty()) {
                    // Validate email format
                    if (!newEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid email format"));
                    }

                    try {
                        // Update email in Firebase Auth
                        firebaseAuthService.updateUserEmail(firebaseUid, newEmail);
                        // Update email in Firestore
                        user.setEmail(newEmail);
                        // Reset email verification status since email changed
                        user.setEmailVerified(false);
                    } catch (Exception e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Failed to update email: " + e.getMessage()));
                    }
                }
            }

            userFirestoreRepository.save(user);

            UserProfileResponse response = buildUserProfileResponse(user, firebaseUid);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update user profile: " + e.getMessage()));
        }
    }

    @PostMapping("/auth/set-password")
    public ResponseEntity<?> setUserPassword(HttpServletRequest request, @RequestBody Map<String, String> requestBody) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing Firebase authentication data"));
            }

            String password = requestBody.get("password");
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
            }

            if (password.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters long"));
            }

            try {
                // Use Firebase Admin SDK to update the user's password
                firebaseAuthService.setUserPassword(firebaseUid, password);

                return ResponseEntity.ok(Map.of("message", "Password set successfully"));

            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Failed to set password: " + e.getMessage()));
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to set password: " + e.getMessage()));
        }
    }

    @GetMapping("/auth/sms-availability")
    public ResponseEntity<?> getSmsAvailability() {
        try {
            boolean smsEnabled = smsDeliveryService.isEnabled();

            return ResponseEntity.ok(Map.of(
                "smsEnabled", smsEnabled,
                "message", smsEnabled ? "SMS verification is available" : "SMS verification is not configured"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to check SMS availability: " + e.getMessage()));
        }
    }

    @GetMapping("/users/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<UserFirestore> users = userFirestoreRepository.findAllExcludingBanned();

            // Add computed fields including id, name, and proper timestamps
            List<Map<String, Object>> usersWithComputedFields = new ArrayList<>();
            for (UserFirestore user : users) {
                Map<String, Object> userMap = user.toMap();
                userMap.put("id", user.getId()); // Include id field
                userMap.put("name", user.getFullName()); // Include computed name
                usersWithComputedFields.add(userMap);
            }

            return ResponseEntity.ok(Map.of("users", usersWithComputedFields));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get users: " + e.getMessage()));
        }
    }

    @PutMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserAccount(@PathVariable String userId, @RequestBody Map<String, Object> updates) {
        try {
            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(userId);

            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            UserFirestore user = userOpt.get();

            // Admin can update more fields
            if (updates.containsKey("firstName")) {
                user.setFirstName((String) updates.get("firstName"));
            }
            if (updates.containsKey("lastName")) {
                user.setLastName((String) updates.get("lastName"));
            }
            if (updates.containsKey("userType")) {
                user.setUserType((String) updates.get("userType"));
            }
            if (updates.containsKey("teams")) {
                user.setTeams((List<String>) updates.get("teams"));
            }

            userFirestoreRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "User updated successfully"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update user: " + e.getMessage()));
        }
    }

    @PutMapping("/users/{userId}/account-type")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserAccountType(@PathVariable String userId, @RequestBody Map<String, String> request) {
        try {
            String newUserType = request.get("userType");
            if (newUserType == null || newUserType.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User type is required"));
            }

            // Validate user type
            if (!Arrays.asList("PARENT", "VOLUNTEER", "ATHLETE", "ADMIN").contains(newUserType)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid user type"));
            }

            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            UserFirestore user = userOpt.get();
            String previousUserType = user.getUserType();

            // Archive previous associations
            Map<String, Object> archiveData = new HashMap<>();
            archiveData.put("userId", userId);
            archiveData.put("previousUserType", previousUserType);
            archiveData.put("newUserType", newUserType);
            archiveData.put("changedAt", System.currentTimeMillis());
            archiveData.put("changedBy", "ADMIN"); // Could be enhanced to include admin user ID

            // Check for active registrations and return warnings
            List<String> warnings = new ArrayList<>();

            // Check participant registrations if changing from PARENT
            if ("PARENT".equals(previousUserType)) {
                try {
                    // This would need participant repository to check active registrations
                    warnings.add("User has active participant registrations that may be affected");
                } catch (Exception e) {
                    warnings.add("Could not verify participant registrations");
                }
            }

            // Check volunteer signups if changing from VOLUNTEER
            if ("VOLUNTEER".equals(previousUserType)) {
                try {
                    // This would need volunteer repository to check active signups
                    warnings.add("User has active volunteer signups that may be affected");
                } catch (Exception e) {
                    warnings.add("Could not verify volunteer signups");
                }
            }

            // Persist archive data to Firestore
            try {
                // Create archive document in 'accountTypeChanges' collection
                DocumentReference archiveRef = db.collection("accountTypeChanges").document();
                archiveRef.set(archiveData).get();
                System.out.println("Account type change successfully archived to Firestore with ID: " + archiveRef.getId());
            } catch (Exception e) {
                System.err.println("Failed to archive account type change: " + e.getMessage());
                // Don't fail the operation if archiving fails
            }

            user.setUserType(newUserType);
            userFirestoreRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User account type updated successfully");
            response.put("warnings", warnings);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update user account type: " + e.getMessage()));
        }
    }

    public static class UserListResponse {
        private List<UserFirestore> users;

        public List<UserFirestore> getUsers() { return users; }
        public void setUsers(List<UserFirestore> users) { this.users = users; }
    }

    public static class UserUpdateRequest {
        private String displayName;
        private String userType;
        private List<String> teams;

        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }

        public String getUserType() { return userType; }
        public void setUserType(String userType) { this.userType = userType; }

        public List<String> getTeams() { return teams; }
        public void setTeams(List<String> teams) { this.teams = teams; }
    }

    // Helper method to check if an email should have volunteer privileges
    private boolean isVolunteerEmail(String email) {
        if (volunteerEmails == null || volunteerEmails.trim().isEmpty()) {
            return false;
        }

        String[] volunteerEmailList = volunteerEmails.split(",");
        for (String volunteerEmail : volunteerEmailList) {
            if (volunteerEmail.trim().equalsIgnoreCase(email.trim())) {
                return true;
            }
        }
        return false;
    }

    // Helper method to build UserProfileResponse with verification status
    private UserProfileResponse buildUserProfileResponse(UserFirestore user, String firebaseUid) {
        UserProfileResponse response = new UserProfileResponse(null, user.getEmail(), List.of());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setUserType(user.getUserType());
        response.setTeams(user.getTeams());
        response.setPhoneNumber(user.getPhoneNumber());

        // Get verification status and password status from Firebase
        boolean emailVerified = false;
        boolean phoneVerified = user.getPhoneVerified() != null ? user.getPhoneVerified() : false;
        boolean hasPassword = false;

        try {
            UserRecord firebaseUser = firebaseAuthService.getUserRecord(firebaseUid);
            emailVerified = firebaseUser.isEmailVerified();

            // Check if user has password provider
            UserInfo[] providerData = firebaseUser.getProviderData();
            for (UserInfo provider : providerData) {
                if ("password".equals(provider.getProviderId())) {
                    hasPassword = true;
                    break;
                }
            }
        } catch (Exception e) {
            // Log error but don't fail the request
            System.err.println("Failed to get Firebase user verification status: " + e.getMessage());
        }

        response.setEmailVerified(emailVerified);
        response.setPhoneVerified(phoneVerified);
        response.setHasPassword(hasPassword);

        return response;
    }

    // Username system endpoints have been removed

    // Duplicate Account Check Endpoint
    @PostMapping("/auth/check-duplicate")
    public ResponseEntity<?> checkDuplicate(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String phoneNumber = request.get("phoneNumber");

            Map<String, Boolean> duplicates = new HashMap<>();

            // Check email duplicate
            if (email != null && !email.trim().isEmpty()) {
                Optional<UserFirestore> emailUser = userFirestoreRepository.findByEmail(email.trim());
                duplicates.put("email", emailUser.isPresent());
            } else {
                duplicates.put("email", false);
            }

            // Check phone duplicate
            if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
                Optional<UserFirestore> phoneUser = userFirestoreRepository.findByPhoneNumber(phoneNumber.trim());
                duplicates.put("phone", phoneUser.isPresent());
            } else {
                duplicates.put("phone", false);
            }

            // Username duplicate check removed
            duplicates.put("username", false);

            return ResponseEntity.ok(Map.of("duplicates", duplicates));
        } catch (Exception e) {
            System.err.println("Error checking duplicates: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error checking for duplicate accounts"));
        }
    }

    // Authentication Enhancement
    @PostMapping("/auth/login-identifier")
    public ResponseEntity<?> loginWithIdentifier(@RequestBody Map<String, String> request) {
        try {
            String identifier = request.get("identifier");
            if (identifier == null || identifier.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Identifier is required"));
            }

            identifier = identifier.trim();
            Optional<UserFirestore> userOpt = Optional.empty();

            // Detect format and query accordingly
            if (identifier.contains("@")) {
                // Email format
                userOpt = userFirestoreRepository.findByEmail(identifier);
            } else if (identifier.matches("^[\\d\\s\\-\\(\\)\\+]+$")) {
                // Phone format (digits, spaces, dashes, parentheses, plus)
                userOpt = userFirestoreRepository.findByPhoneNumber(identifier);
            } else {
                // Username functionality removed - no longer supported
                return ResponseEntity.ok(Map.of("exists", false, "message", "Username login not supported"));
            }

            if (!userOpt.isPresent()) {
                return ResponseEntity.ok(Map.of("exists", false, "message", "No account found"));
            }

            UserFirestore user = userOpt.get();
            return ResponseEntity.ok(Map.of("exists", true, "email", user.getEmail()));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error looking up identifier"));
        }
    }

    // Username-based profile retrieval endpoints have been removed

    // Username-based profile update endpoint has been removed

    // Admin Features
    @PostMapping("/users/{userId}/ban")
    public ResponseEntity<?> banUser(@PathVariable String userId, @RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        try {
            String adminFirebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (adminFirebaseUid == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            // Check if requester is admin
            Optional<UserFirestore> adminOpt = userFirestoreRepository.findByFirebaseUid(adminFirebaseUid);
            if (!adminOpt.isPresent() || !adminOpt.get().isAdmin()) {
                return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
            }

            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            UserFirestore user = userOpt.get();
            String reason = request.get("reason");
            String adminMessage = request.get("message");

            // Update user ban status
            user.setIsBanned(true);
            user.setBannedAt(System.currentTimeMillis());
            user.setBannedReason(reason);
            userFirestoreRepository.save(user);

            // Force logout by revoking tokens
            try {
                firebaseAuthService.revokeRefreshTokens(user.getFirebaseUid());
                firebaseAuthService.setCustomUserClaims(user.getFirebaseUid(), Map.of("banned", true));
            } catch (Exception e) {
                System.err.println("Failed to revoke tokens: " + e.getMessage());
            }

            // Send email/inbox notification to user
            try {
                StringBuilder notificationBody = new StringBuilder();
                notificationBody.append("Your account has been temporarily suspended.\n\n");

                if (reason != null && !reason.trim().isEmpty()) {
                    notificationBody.append("Reason: ").append(reason).append("\n\n");
                }

                if (adminMessage != null && !adminMessage.trim().isEmpty()) {
                    notificationBody.append("Additional Information: ").append(adminMessage).append("\n\n");
                }

                notificationBody.append("If you believe this is an error, please contact support.\n");
                notificationBody.append("Support Email: info@kidsinmotionpa.org");

                Map<String, Object> messagePayload = new HashMap<>();
                messagePayload.put("subject", "Account Suspended - Kids in Motion");
                messagePayload.put("message", notificationBody.toString());
                messagePayload.put("type", "account_suspension");
                messagePayload.put("timestamp", System.currentTimeMillis());
                messagePayload.put("priority", "high");

                // Use messaging service to send inbox notification
                messagingService.sendInboxMessage(user.getFirebaseUid(), messagePayload);

            } catch (Exception e) {
                System.err.println("Failed to send ban notification: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of("message", "User banned successfully"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error banning user"));
        }
    }

    @PostMapping("/users/{userId}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable String userId, HttpServletRequest httpRequest) {
        try {
            String adminFirebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (adminFirebaseUid == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            // Check if requester is admin
            Optional<UserFirestore> adminOpt = userFirestoreRepository.findByFirebaseUid(adminFirebaseUid);
            if (!adminOpt.isPresent() || !adminOpt.get().isAdmin()) {
                return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
            }

            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            UserFirestore user = userOpt.get();

            // Update user ban status
            user.setIsBanned(false);
            user.setBannedAt(null);
            user.setBannedReason(null);
            userFirestoreRepository.save(user);

            // Remove ban claim
            try {
                firebaseAuthService.setCustomUserClaims(user.getFirebaseUid(), Map.of("banned", false));
            } catch (Exception e) {
                System.err.println("Failed to update claims: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of("message", "User unbanned successfully"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error unbanning user"));
        }
    }

    @PostMapping("/users/{userId}/verify-email")
    public ResponseEntity<?> verifyUserEmail(@PathVariable String userId, HttpServletRequest httpRequest) {
        try {
            String adminFirebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (adminFirebaseUid == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            // Check if requester is admin
            Optional<UserFirestore> adminOpt = userFirestoreRepository.findByFirebaseUid(adminFirebaseUid);
            if (!adminOpt.isPresent() || !adminOpt.get().isAdmin()) {
                return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
            }

            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            UserFirestore user = userOpt.get();

            // Set email verified in Firestore
            user.setEmailVerified(true);
            userFirestoreRepository.save(user);

            // Set email verified in Firebase Auth
            try {
                firebaseAuthService.setEmailVerified(user.getFirebaseUid(), true);
            } catch (Exception e) {
                System.err.println("Failed to update Firebase auth: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of("message", "Email verified successfully"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error verifying email"));
        }
    }

    // Phone Verification Endpoints
    @PostMapping("/users/send-phone-verification")
    public ResponseEntity<?> sendPhoneVerification(Authentication authentication) {
        try {
            String firebaseUid = authentication.getName();
            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(firebaseUid);

            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            UserFirestore user = userOpt.get();
            String phoneNumber = user.getPhoneNumber();

            if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No phone number found for user"));
            }

            // Check rate limiting - max 3 codes per phone per hour
            long currentTime = System.currentTimeMillis();
            long oneHourAgo = currentTime - TimeUnit.HOURS.toMillis(1);

            // Query recent verification attempts
            try {
                var recentAttemptsQuery = db.collection("phoneVerificationCodes")
                    .whereEqualTo("phoneNumber", phoneNumber)
                    .whereGreaterThan("createdAt", oneHourAgo);

                var recentAttempts = recentAttemptsQuery.get().get();
                if (recentAttempts.size() >= 3) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Too many verification attempts. Please try again later."));
                }
            } catch (Exception e) {
                System.err.println("Error checking rate limit: " + e.getMessage());
            }

            // Generate 6-digit code
            SecureRandom random = new SecureRandom();
            String code = String.format("%06d", random.nextInt(1000000));

            // Store verification code in Firestore
            long expiresAt = currentTime + TimeUnit.MINUTES.toMillis(10); // 10 minutes
            Map<String, Object> verificationData = new HashMap<>();
            verificationData.put("userId", firebaseUid);
            verificationData.put("code", code);
            verificationData.put("phoneNumber", phoneNumber);
            verificationData.put("expiresAt", expiresAt);
            verificationData.put("attempts", 0);
            verificationData.put("createdAt", currentTime);

            // Save to Firestore
            db.collection("phoneVerificationCodes").add(verificationData).get();

            // Send SMS
            String message = "Your Kids in Motion verification code is: " + code + ". Valid for 10 minutes.";
            boolean smsSent = smsDeliveryService.sendSms(phoneNumber, message);

            if (!smsSent) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Failed to send verification code"));
            }

            return ResponseEntity.ok(Map.of("message", "Verification code sent successfully"));

        } catch (Exception e) {
            System.err.println("Error sending phone verification: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error sending verification code"));
        }
    }

    @PostMapping("/users/verify-phone")
    public ResponseEntity<?> verifyPhoneCode(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String firebaseUid = authentication.getName();
            String inputCode = request.get("code");

            if (inputCode == null || inputCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Verification code is required"));
            }

            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(firebaseUid);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            UserFirestore user = userOpt.get();
            long currentTime = System.currentTimeMillis();

            // Find verification record
            var verificationQuery = db.collection("phoneVerificationCodes")
                .whereEqualTo("userId", firebaseUid)
                .whereGreaterThan("expiresAt", currentTime)
                .orderBy("expiresAt", com.google.cloud.firestore.Query.Direction.DESCENDING)
                .limit(1);

            var verificationDocs = verificationQuery.get().get();

            if (verificationDocs.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No valid verification code found or code expired"));
            }

            var verificationDoc = verificationDocs.getDocuments().get(0);
            Map<String, Object> verificationData = verificationDoc.getData();

            String storedCode = (String) verificationData.get("code");
            Long attempts = (Long) verificationData.get("attempts");

            if (attempts >= 5) {
                // Delete verification record
                verificationDoc.getReference().delete();
                return ResponseEntity.badRequest().body(Map.of("error", "Too many attempts. Please request a new code."));
            }

            if (!inputCode.equals(storedCode)) {
                // Increment attempts
                verificationDoc.getReference().update("attempts", attempts + 1);
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification code"));
            }

            // Code is valid - verify phone and delete verification record
            user.setPhoneVerified(true);
            user.setUpdatedTimestamp(currentTime);
            userFirestoreRepository.save(user);

            // Delete verification record
            verificationDoc.getReference().delete();

            return ResponseEntity.ok(Map.of("message", "Phone verified successfully"));

        } catch (Exception e) {
            System.err.println("Error verifying phone: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error verifying phone"));
        }
    }

    @PostMapping("/users/{userId}/verify-phone")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminVerifyPhone(@PathVariable String userId, Authentication authentication) {
        try {
            String adminFirebaseUid = authentication.getName();
            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(userId);

            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            UserFirestore user = userOpt.get();
            long currentTime = System.currentTimeMillis();

            // Update phone verification status
            user.setPhoneVerified(true);
            user.setUpdatedTimestamp(currentTime);
            userFirestoreRepository.save(user);

            // Log admin action
            Map<String, Object> adminAction = new HashMap<>();
            adminAction.put("adminUserId", adminFirebaseUid);
            adminAction.put("targetUserId", userId);
            adminAction.put("action", "VERIFY_PHONE");
            adminAction.put("timestamp", currentTime);

            try {
                db.collection("adminActions").add(adminAction);
            } catch (Exception e) {
                System.err.println("Failed to log admin action: " + e.getMessage());
            }

            // Return updated user profile
            return ResponseEntity.ok(buildUserProfileResponse(user, userId));

        } catch (Exception e) {
            System.err.println("Error in admin phone verification: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error verifying phone"));
        }
    }

    // Helper method to create user response for admin operations
    private Map<String, Object> createUserResponseForAdmin(UserFirestore user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("firebaseUid", user.getFirebaseUid());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("name", user.getFullName());
        response.put("email", user.getEmail());
        response.put("userType", user.getUserType());
        response.put("emailVerified", user.getEmailVerified());
        response.put("isBanned", user.getIsBanned());
        response.put("bannedReason", user.getBannedReason());
        response.put("bannedAt", user.getBannedAt());
        response.put("lastLoginAt", user.getLastLoginAt());
        response.put("createdTimestamp", user.getCreatedTimestamp());
        return response;
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable String userId, @RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        try {
            String adminFirebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (adminFirebaseUid == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            // Check if requester is admin
            Optional<UserFirestore> adminOpt = userFirestoreRepository.findByFirebaseUid(adminFirebaseUid);
            if (!adminOpt.isPresent() || !adminOpt.get().isAdmin()) {
                return ResponseEntity.status(403).body(Map.of("error", "You don't have permission to perform this action."));
            }

            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(userId);

            boolean deletedFromFirestore = false;
            boolean deletedFromFirebaseAuth = false;

            // If user exists in Firestore, delete it
            if (userOpt.isPresent()) {
                UserFirestore user = userOpt.get();
                String reason = request.get("reason");

                // Prevent deleting other admin users
                if (user.isAdmin() && !user.getFirebaseUid().equals(adminFirebaseUid)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Cannot delete other admin users"));
                }

                // Delete user from Firestore
                try {
                    userFirestoreRepository.deleteById(user.getId());
                    deletedFromFirestore = true;
                    System.out.println("Deleted user from Firestore: " + userId);
                } catch (Exception e) {
                    System.err.println("Failed to delete user from Firestore: " + e.getMessage());
                }
            } else {
                System.out.println("User not found in Firestore: " + userId);
            }

            // Try to delete from Firebase Auth (regardless of Firestore status)
            try {
                firebaseAuthService.deleteUser(userId);
                deletedFromFirebaseAuth = true;
                System.out.println("Deleted user from Firebase Auth: " + userId);
            } catch (Exception e) {
                System.err.println("Failed to delete user from Firebase Auth (may not exist): " + e.getMessage());
                // Don't fail the request if user doesn't exist in Firebase Auth
            }

            // Return success if deleted from at least one system
            if (deletedFromFirestore || deletedFromFirebaseAuth) {
                String message = String.format("User deleted successfully (Firestore: %s, Firebase Auth: %s)",
                    deletedFromFirestore, deletedFromFirebaseAuth);
                return ResponseEntity.ok(Map.of("message", message));
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            System.err.println("Error deleting user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error deleting user: " + e.getMessage()));
        }
    }

    /**
     * Unsubscribe user from email communications
     * This endpoint can be called when a user clicks the unsubscribe link in emails
     */
    @PostMapping("/users/unsubscribe")
    public ResponseEntity<?> unsubscribeFromEmails(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (!StringUtils.hasText(email)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email address is required"));
            }

            Optional<UserFirestore> userOpt = userFirestoreRepository.findByEmail(email);
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found with email: " + email));
            }

            UserFirestore user = userOpt.get();
            user.setEmailOptedOut(true);
            user.setUpdatedTimestamp(System.currentTimeMillis());
            userFirestoreRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Successfully unsubscribed from email communications"));

        } catch (Exception e) {
            System.err.println("Error unsubscribing user: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Error processing unsubscribe request"));
        }
    }

    /**
     * Re-subscribe user to email communications
     */
    @PostMapping("/users/subscribe")
    public ResponseEntity<?> subscribeToEmails(Authentication authentication) {
        try {
            String firebaseUid = authentication.getName();
            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(firebaseUid);

            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            UserFirestore user = userOpt.get();
            user.setEmailOptedOut(false);
            user.setUpdatedTimestamp(System.currentTimeMillis());
            userFirestoreRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Successfully subscribed to email communications"));

        } catch (Exception e) {
            System.err.println("Error subscribing user: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Error processing subscribe request"));
        }
    }

    /**
     * Set Firebase email verification status to prevent automatic verification emails
     */
    @PostMapping("/admin/users/{uid}/email-verified")
    public ResponseEntity<?> setEmailVerificationStatus(@PathVariable String uid, @RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            Boolean verified = (Boolean) request.get("verified");
            if (verified == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing 'verified' field"));
            }

            // Use FirebaseAuthService to set email verification status
            firebaseAuthService.setEmailVerified(uid, verified);

            logger.info("Email verification status updated for user {}: {}", uid, verified);
            return ResponseEntity.ok(Map.of("message", "Email verification status updated successfully"));

        } catch (Exception e) {
            logger.error("Failed to update email verification status for user {}: {}", uid, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update email verification status"));
        }
    }

    /**
     * Verify email using verification token
     */
    @PostMapping("/users/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            if (token == null || token.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Verification token is required"));
            }

            // Decode token
            String decodedToken;
            try {
                decodedToken = new String(Base64.getDecoder().decode(token));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification token"));
            }

            String[] parts = decodedToken.split("\\|");
            if (parts.length != 2) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid token format"));
            }

            String email = parts[0];
            long timestamp = Long.parseLong(parts[1]);

            // Check if token is expired (24 hours)
            long currentTime = System.currentTimeMillis();
            long tokenAge = currentTime - timestamp;
            long twentyFourHours = 24 * 60 * 60 * 1000;

            if (tokenAge > twentyFourHours) {
                return ResponseEntity.badRequest().body(Map.of("error", "Verification token has expired"));
            }

            // Find user by email and verify them
            Optional<UserFirestore> userOpt = userFirestoreRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            UserFirestore user = userOpt.get();

            // Validate firebaseUid before trying to update Firebase Auth
            String firebaseUid = user.getFirebaseUid();
            if (firebaseUid == null || firebaseUid.trim().isEmpty()) {
                // Try to use document ID as fallback (should be same as firebaseUid)
                firebaseUid = user.getId();
                if (firebaseUid == null || firebaseUid.trim().isEmpty()) {
                    logger.error("User found by email {} but has no firebaseUid or id", email);
                    return ResponseEntity.badRequest().body(Map.of("error", "User account is incomplete. Please try logging in again."));
                }
                // Update the user's firebaseUid field
                user.setFirebaseUid(firebaseUid);
                logger.info("Using document ID as firebaseUid for user: {}", email);
            }

            // Update Firebase verification status
            firebaseAuthService.setEmailVerified(firebaseUid, true);

            // Update Firestore user
            user.setEmailVerified(true);
            userFirestoreRepository.save(user);

            logger.info("Email verified successfully for user: {}", email);
            return ResponseEntity.ok(Map.of("message", "Email verified successfully", "email", email));

        } catch (Exception e) {
            logger.error("Failed to verify email: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to verify email"));
        }
    }

    /**
     * Send custom email verification using SendGrid with beautiful template
     */
    @PostMapping("/users/send-verification-email")
    public ResponseEntity<?> sendCustomEmailVerification(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String firebaseUid = authentication.getName();
            String email = request.get("email");
            String name = request.get("name");

            if (!StringUtils.hasText(email)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email address is required"));
            }

            // Verify the user exists and the email matches
            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(firebaseUid);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            UserFirestore user = userOpt.get();
            if (!email.equals(user.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email verification can only be sent to your registered email"));
            }

            // Use our NotificationService to send branded verification email
            boolean emailSent = notificationService.sendEmailVerificationNotice(email, name);

            if (emailSent) {
                return ResponseEntity.ok(Map.of("message", "Verification email sent successfully"));
            } else {
                return ResponseEntity.internalServerError().body(Map.of("error", "Failed to send verification email"));
            }

        } catch (Exception e) {
            System.err.println("Error sending custom email verification: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Error processing verification request"));
        }
    }
}