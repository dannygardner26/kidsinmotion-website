package com.example.restservice;

import com.example.restservice.model.User;
import com.example.restservice.payload.response.UserProfileResponse;
import com.example.restservice.repository.firestore.UserFirestoreRepository;
import com.example.restservice.model.firestore.UserFirestore;
import com.example.restservice.security.FirebaseAuthService;
import com.google.firebase.auth.UserRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"https://kidsinmotionpa.org", "https://www.kidsinmotionpa.org"})
public class UserController {

    @Autowired
    private UserFirestoreRepository userFirestoreRepository;

    @Autowired
    private FirebaseAuthService firebaseAuthService;

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
            if (existingUser.isPresent()) {
                user = existingUser.get();
                boolean needsUpdate = false;

                // Update email if it has changed
                if (!firebaseEmail.equals(user.getEmail())) {
                    user.setEmail(firebaseEmail);
                    needsUpdate = true;
                }

                // Update user type if they should be admin or volunteer but aren't
                if ("kidsinmotion0@gmail.com".equalsIgnoreCase(firebaseEmail) ||
                    "danny@dannygardner.com".equalsIgnoreCase(firebaseEmail)) {
                    if (!"ADMIN".equals(user.getUserType())) {
                        user.setUserType("ADMIN");
                        needsUpdate = true;
                    }
                } else if (isVolunteerEmail(firebaseEmail)) {
                    if (!"VOLUNTEER".equals(user.getUserType())) {
                        user.setUserType("VOLUNTEER");
                        needsUpdate = true;
                    }
                }

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
                } else if (isVolunteerEmail(firebaseEmail)) {
                    user.setUserType("VOLUNTEER");
                } else {
                    user.setUserType("PARENT");
                }

                userFirestoreRepository.save(user);
            }

            // Return user profile data with verification status
            UserProfileResponse response = buildUserProfileResponse(user, firebaseUid);
            return ResponseEntity.ok(response);

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

            // Update allowed fields
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
            List<UserFirestore> users = userFirestoreRepository.findAll();
            return ResponseEntity.ok(Map.of("users", users));
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
}