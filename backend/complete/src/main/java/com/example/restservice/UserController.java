package com.example.restservice;

import com.example.restservice.model.User;
import com.example.restservice.payload.response.UserProfileResponse;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.repository.firestore.UserFirestoreRepository;
import com.example.restservice.model.firestore.UserFirestore;
import com.example.restservice.security.FirebaseAuthService;
import com.example.restservice.service.MessagingService;
import com.google.firebase.auth.UserRecord;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"https://kidsinmotionpa.org", "https://www.kidsinmotionpa.org"})
public class UserController {

    @Autowired
    private UserFirestoreRepository userFirestoreRepository;

    @Autowired
    private FirebaseAuthService firebaseAuthService;


    @Autowired(required = false)
    private Firestore db;

    @Autowired
    private MessagingService messagingService;

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

                // Check if user needs registration completion (missing username or userType)
                if (user.getUsername() == null || user.getUsername().trim().isEmpty() ||
                    user.getUserType() == null || user.getUserType().trim().isEmpty()) {
                    needsRegistrationCompletion = true;

                    // Auto-generate username if missing
                    if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                        String autoUsername = user.getUserType() != null ?
                            user.getUserType().toLowerCase() : "user";
                        autoUsername += "_" + firebaseUid.substring(Math.max(0, firebaseUid.length() - 6));
                        user.setUsername(autoUsername);
                        user.setUsernameLowercase(autoUsername.toLowerCase());
                        needsUpdate = true;
                    }
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
                        if (!"admin".equals(user.getUsername())) {
                            user.setUsername("admin");
                            user.setUsernameLowercase("admin");
                            // Don't set usernameLastChangedAt to avoid cooldown
                            needsUpdate = true;
                        }
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

                // Extract name from email (simple approach)
                String[] nameParts = firebaseEmail.split("@")[0].split("\\.");
                user.setFirstName(nameParts.length > 0 ? nameParts[0] : "User");
                user.setLastName(nameParts.length > 1 ? nameParts[1] : "");

                // Automatically grant admin privileges to specific emails
                if ("kidsinmotion0@gmail.com".equalsIgnoreCase(firebaseEmail) ||
                    "danny@dannygardner.com".equalsIgnoreCase(firebaseEmail)) {
                    user.setUserType("ADMIN");
                    // Set special admin account details for kidsinmotion0@gmail.com
                    if ("kidsinmotion0@gmail.com".equalsIgnoreCase(firebaseEmail)) {
                        user.setFirstName("Kids In");
                        user.setLastName("Motion");
                        user.setUsername("admin");
                        user.setUsernameLowercase("admin");
                        // Don't set usernameLastChangedAt to avoid cooldown

                        // Set admin password
                        try {
                            firebaseAuthService.setUserPassword(firebaseUid, "admin123");
                        } catch (Exception e) {
                            System.err.println("Failed to set admin password: " + e.getMessage());
                            // Don't fail the whole sync operation
                        }
                    } else {
                        // Auto-generate username for other admin users
                        String autoUsername = user.getUserType().toLowerCase() + "_" + firebaseUid.substring(Math.max(0, firebaseUid.length() - 6));
                        user.setUsername(autoUsername);
                        user.setUsernameLowercase(autoUsername.toLowerCase());
                    }
                } else if (isVolunteerEmail(firebaseEmail)) {
                    user.setUserType("VOLUNTEER");
                    // Auto-generate username for new users
                    String autoUsername = user.getUserType().toLowerCase() + "_" + firebaseUid.substring(Math.max(0, firebaseUid.length() - 6));
                    user.setUsername(autoUsername);
                    user.setUsernameLowercase(autoUsername.toLowerCase());
                } else {
                    user.setUserType("PARENT");
                    // Auto-generate username for new users
                    String autoUsername = user.getUserType().toLowerCase() + "_" + firebaseUid.substring(Math.max(0, firebaseUid.length() - 6));
                    user.setUsername(autoUsername);
                    user.setUsernameLowercase(autoUsername.toLowerCase());
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

            // Handle username change with cooldown validation
            if (updates.containsKey("username")) {
                String newUsername = (String) updates.get("username");

                // Validate username format
                if (newUsername == null || newUsername.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Username cannot be empty"));
                }

                if (!newUsername.matches("^[a-zA-Z0-9_-]+$")) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Username can only contain letters, numbers, underscore, and hyphen"));
                }

                if (newUsername.length() < 3 || newUsername.length() > 20) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Username must be between 3 and 20 characters"));
                }

                String usernameLowercase = newUsername.toLowerCase();

                // Check if username is actually changing (case-insensitive)
                boolean usernameChanged = !usernameLowercase.equals(user.getUsernameLowercase());

                if (usernameChanged) {
                    // Check if username is taken (case-insensitive) - exclude current user
                    if (userFirestoreRepository.existsByUsernameLowercase(usernameLowercase)) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Username is already taken"));
                    }

                    // Check cooldown period (90 days) only for actual changes
                    if (user.getUsernameLastChangedAt() != null) {
                        long daysSinceLastChange = (System.currentTimeMillis() - user.getUsernameLastChangedAt()) / (1000 * 60 * 60 * 24);
                        if (daysSinceLastChange < 90) {
                            long daysRemaining = 90 - daysSinceLastChange;
                            return ResponseEntity.badRequest().body(Map.of("error", "You can only change your username once every 90 days. Please wait " + daysRemaining + " more days."));
                        }
                    }

                    // Update username and set cooldown timestamp only when actually changing
                    user.setUsername(newUsername);
                    user.setUsernameLowercase(usernameLowercase);
                    user.setUsernameLastChangedAt(System.currentTimeMillis());
                } else {
                    // Username didn't change, just update the case if needed
                    user.setUsername(newUsername);
                }
            }

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
            Optional<UserFirestore> userOpt = userFirestoreRepository.findById(userId);

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

            Optional<UserFirestore> userOpt = userFirestoreRepository.findById(userId);
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

        // Get verification status from Firebase and Firestore
        boolean emailVerified = false;
        boolean phoneVerified = user.getPhoneVerified() != null ? user.getPhoneVerified() : false;

        try {
            UserRecord firebaseUser = firebaseAuthService.getUserRecord(firebaseUid);
            emailVerified = firebaseUser.isEmailVerified();
        } catch (Exception e) {
            // Log error but don't fail the request
            System.err.println("Failed to get Firebase user verification status: " + e.getMessage());
        }

        response.setEmailVerified(emailVerified);
        response.setPhoneVerified(phoneVerified);

        return response;
    }

    // Username System Endpoints
    @PostMapping("/users/validate-username")
    public ResponseEntity<?> validateUsername(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("available", false, "message", "Username is required"));
            }

            username = username.trim();
            String usernameLower = username.toLowerCase();

            // Validate format
            if (username.length() < 3 || username.length() > 20) {
                return ResponseEntity.ok(Map.of("available", false, "message", "Username must be 3-20 characters"));
            }
            if (!username.matches("^[a-zA-Z0-9_-]+$")) {
                return ResponseEntity.ok(Map.of("available", false, "message", "Username can only contain letters, numbers, underscore, and hyphen"));
            }

            // Check availability
            boolean exists = userFirestoreRepository.existsByUsernameLowercase(usernameLower);
            if (exists) {
                return ResponseEntity.ok(Map.of("available", false, "message", "Username is already taken"));
            }

            return ResponseEntity.ok(Map.of("available", true, "message", "Username is available"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("available", false, "message", "Error checking username availability"));
        }
    }

    @PostMapping("/users/check-username-cooldown")
    public ResponseEntity<?> checkUsernameCooldown(HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            Optional<UserFirestore> userOpt = userFirestoreRepository.findByFirebaseUid(firebaseUid);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            UserFirestore user = userOpt.get();
            if (user.getUsernameLastChangedAt() == null) {
                return ResponseEntity.ok(Map.of("canChange", true, "daysRemaining", 0));
            }

            long currentTime = System.currentTimeMillis();
            long threeMonthsMs = 90L * 24 * 60 * 60 * 1000; // 90 days in milliseconds
            long timeSinceLastChange = currentTime - user.getUsernameLastChangedAt();

            if (timeSinceLastChange >= threeMonthsMs) {
                return ResponseEntity.ok(Map.of("canChange", true, "daysRemaining", 0));
            } else {
                long timeRemaining = threeMonthsMs - timeSinceLastChange;
                long daysRemaining = timeRemaining / (24 * 60 * 60 * 1000);
                return ResponseEntity.ok(Map.of("canChange", false, "daysRemaining", daysRemaining));
            }

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error checking username cooldown"));
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
                // Username format
                userOpt = userFirestoreRepository.findByUsernameLowercase(identifier.toLowerCase());
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

    // Profile Retrieval
    @GetMapping("/users/profile/{username}")
    public ResponseEntity<?> getUserProfileByUsername(@PathVariable String username, HttpServletRequest request) {
        try {
            String viewerFirebaseUid = (String) request.getAttribute("firebaseUid");
            if (viewerFirebaseUid == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            Optional<UserFirestore> targetUserOpt = userFirestoreRepository.findByUsernameLowercase(username.toLowerCase());
            if (!targetUserOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            UserFirestore targetUser = targetUserOpt.get();
            Optional<UserFirestore> viewerOpt = userFirestoreRepository.findByFirebaseUid(viewerFirebaseUid);

            // Check viewer permissions
            boolean isOwnProfile = viewerFirebaseUid.equals(targetUser.getFirebaseUid());
            boolean isAdmin = viewerOpt.isPresent() && viewerOpt.get().isAdmin();

            Map<String, Object> profileData = new HashMap<>();

            // Basic info always available
            profileData.put("firebaseUid", targetUser.getFirebaseUid());
            profileData.put("firstName", targetUser.getFirstName());
            profileData.put("lastName", targetUser.getLastName());
            profileData.put("username", targetUser.getUsername());
            profileData.put("profilePictureUrl", targetUser.getProfilePictureUrl());
            profileData.put("profileColor", targetUser.getProfileColor());
            profileData.put("userType", targetUser.getUserType());

            if (isOwnProfile || isAdmin) {
                // Full access for own profile or admin
                profileData.put("email", targetUser.getEmail());
                profileData.put("phoneNumber", targetUser.getPhoneNumber());
                profileData.put("grade", targetUser.getGrade());
                profileData.put("school", targetUser.getSchool());
                profileData.put("teams", targetUser.getTeams());
                profileData.put("emailVerified", targetUser.getEmailVerified());
                profileData.put("phoneVerified", targetUser.getPhoneVerified());
                profileData.put("createdTimestamp", targetUser.getCreatedTimestamp());
                profileData.put("lastLoginAt", targetUser.getLastLoginAt());

                if (isAdmin) {
                    profileData.put("isBanned", targetUser.getIsBanned());
                    profileData.put("bannedAt", targetUser.getBannedAt());
                    profileData.put("bannedReason", targetUser.getBannedReason());
                }
            } else {
                // Public users only get basic info (already set above)
                // Future: Add public privacy settings check here if needed
            }

            return ResponseEntity.ok(profileData);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error retrieving user profile"));
        }
    }

    // New endpoint that returns user profile by username with user wrapper
    @GetMapping("/users/username/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username, HttpServletRequest request) {
        try {
            String viewerFirebaseUid = (String) request.getAttribute("firebaseUid");
            if (viewerFirebaseUid == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            Optional<UserFirestore> targetUserOpt = userFirestoreRepository.findByUsernameLowercase(username.toLowerCase());
            if (!targetUserOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            UserFirestore targetUser = targetUserOpt.get();
            Optional<UserFirestore> viewerOpt = userFirestoreRepository.findByFirebaseUid(viewerFirebaseUid);

            // Check viewer permissions
            boolean isOwnProfile = viewerFirebaseUid.equals(targetUser.getFirebaseUid());
            boolean isAdmin = viewerOpt.isPresent() && viewerOpt.get().isAdmin();

            Map<String, Object> profileData = new HashMap<>();

            // Basic info always available
            profileData.put("firebaseUid", targetUser.getFirebaseUid());
            profileData.put("firstName", targetUser.getFirstName());
            profileData.put("lastName", targetUser.getLastName());
            profileData.put("username", targetUser.getUsername());
            profileData.put("profilePictureUrl", targetUser.getProfilePictureUrl());
            profileData.put("profileColor", targetUser.getProfileColor());
            profileData.put("userType", targetUser.getUserType());

            if (isOwnProfile || isAdmin) {
                // Full access for own profile or admin
                profileData.put("email", targetUser.getEmail());
                profileData.put("phoneNumber", targetUser.getPhoneNumber());
                profileData.put("grade", targetUser.getGrade());
                profileData.put("school", targetUser.getSchool());
                profileData.put("teams", targetUser.getTeams());
                profileData.put("emailVerified", targetUser.getEmailVerified());
                profileData.put("phoneVerified", targetUser.getPhoneVerified());
                profileData.put("createdTimestamp", targetUser.getCreatedTimestamp());
                profileData.put("lastLoginAt", targetUser.getLastLoginAt());

                if (isAdmin) {
                    profileData.put("isBanned", targetUser.getIsBanned());
                    profileData.put("bannedAt", targetUser.getBannedAt());
                    profileData.put("bannedReason", targetUser.getBannedReason());
                }
            }

            // Return with user wrapper expected by UserProfile.jsx
            return ResponseEntity.ok(Map.of("user", profileData));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error retrieving user profile"));
        }
    }

    @PutMapping("/users/username/{username}")
    public ResponseEntity<?> updateUserProfileByUsername(@PathVariable String username, @RequestBody Map<String, Object> updates, HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            // Find user by username
            Optional<UserFirestore> userOpt = userFirestoreRepository.findByUsernameLowercase(username.toLowerCase());
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            UserFirestore targetUser = userOpt.get();

            // Check permissions: user can edit own profile or admin can edit any profile
            Optional<UserFirestore> requesterOpt = userFirestoreRepository.findByFirebaseUid(firebaseUid);
            if (!requesterOpt.isPresent()) {
                return ResponseEntity.status(403).body(Map.of("error", "User profile not found"));
            }

            UserFirestore requester = requesterOpt.get();
            boolean isOwnProfile = targetUser.getFirebaseUid().equals(firebaseUid);
            boolean isAdmin = requester.isAdmin();

            if (!isOwnProfile && !isAdmin) {
                return ResponseEntity.status(403).body(Map.of("error", "Permission denied"));
            }

            // Update allowed fields
            if (updates.containsKey("firstName")) {
                targetUser.setFirstName((String) updates.get("firstName"));
            }
            if (updates.containsKey("lastName")) {
                targetUser.setLastName((String) updates.get("lastName"));
            }
            if (updates.containsKey("username")) {
                String newUsername = (String) updates.get("username");
                // Check if username is available (unless it's the same)
                if (!newUsername.equalsIgnoreCase(targetUser.getUsername())) {
                    if (userFirestoreRepository.existsByUsernameLowercase(newUsername.toLowerCase())) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));
                    }
                    targetUser.setUsername(newUsername);
                    targetUser.setUsernameLowercase(newUsername.toLowerCase());
                }
            }
            if (updates.containsKey("phoneNumber")) {
                targetUser.setPhoneNumber((String) updates.get("phoneNumber"));
            }
            if (updates.containsKey("emergencyContactName")) {
                targetUser.setEmergencyContactName((String) updates.get("emergencyContactName"));
            }
            if (updates.containsKey("emergencyContactPhone")) {
                targetUser.setEmergencyContactPhone((String) updates.get("emergencyContactPhone"));
            }
            if (updates.containsKey("emergencyContactRelationship")) {
                targetUser.setEmergencyContactRelationship((String) updates.get("emergencyContactRelationship"));
            }
            if (updates.containsKey("profileVisibility")) {
                targetUser.setProfileVisibility((String) updates.get("profileVisibility"));
            }

            // Admin-only fields
            if (isAdmin && !isOwnProfile) {
                if (updates.containsKey("email")) {
                    targetUser.setEmail((String) updates.get("email"));
                }
                if (updates.containsKey("userType")) {
                    targetUser.setUserType((String) updates.get("userType"));
                }
                if (updates.containsKey("isBanned")) {
                    targetUser.setIsBanned((Boolean) updates.get("isBanned"));
                }
                if (updates.containsKey("isEmailVerified")) {
                    targetUser.setIsEmailVerified((Boolean) updates.get("isEmailVerified"));
                }
            }

            targetUser.setUpdatedTimestamp(System.currentTimeMillis());
            userFirestoreRepository.save(targetUser);

            return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update profile"));
        }
    }

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

            Optional<UserFirestore> userOpt = userFirestoreRepository.findById(userId);
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

            Optional<UserFirestore> userOpt = userFirestoreRepository.findById(userId);
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

            Optional<UserFirestore> userOpt = userFirestoreRepository.findById(userId);
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

    // Helper method to create user response for admin operations
    private Map<String, Object> createUserResponseForAdmin(UserFirestore user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("firebaseUid", user.getFirebaseUid());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("name", user.getFullName());
        response.put("email", user.getEmail());
        response.put("username", user.getUsername());
        response.put("userType", user.getUserType());
        response.put("emailVerified", user.getEmailVerified());
        response.put("isBanned", user.getIsBanned());
        response.put("bannedReason", user.getBannedReason());
        response.put("bannedAt", user.getBannedAt());
        response.put("lastLoginAt", user.getLastLoginAt());
        response.put("createdTimestamp", user.getCreatedTimestamp());
        return response;
    }
}