package com.example.restservice;

import com.example.restservice.model.Role;
import com.example.restservice.model.Role.ERole;
import com.example.restservice.model.User;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.payload.response.UserProfileResponse;
import com.example.restservice.repository.RoleRepository;
import com.example.restservice.repository.UserRepository;
import com.example.restservice.security.FirebaseAuthService;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    FirebaseAuthService firebaseAuthService;

    @Value("${app.admin.emails:}")
    private String adminEmails;

    @PostMapping("/sync-user")
    public ResponseEntity<?> syncUser(HttpServletRequest request) {
        try {
            logger.info("AuthController: sync-user endpoint called");
            String firebaseUid = (String) request.getAttribute("firebaseUid");
            String email = (String) request.getAttribute("firebaseEmail");
            logger.info("AuthController: firebaseUid={}, email={}", firebaseUid, email);
            
            if (firebaseUid == null || email == null) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Firebase authentication required"));
            }

            String authHeader = request.getHeader("Authorization");
            String idToken = authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
            if (idToken == null || idToken.isBlank()) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Firebase token missing"));
            }

            // Handle test admin token differently
            FirebaseToken decodedToken = null;
            String name = null;
            String phoneNumber = null;

            if ("test-admin-token".equals(idToken)) {
                // For test admin, use predefined values
                name = "Test Admin";
                phoneNumber = "555-0123";
            } else {
                // For regular Firebase tokens, decode them
                decodedToken = firebaseAuthService.verifyIdToken(idToken);
                if (decodedToken != null) {
                    name = decodedToken.getName();
                    Object phoneClaim = decodedToken.getClaims().get("phone_number");
                    if (phoneClaim instanceof String phoneString && !phoneString.isBlank()) {
                        phoneNumber = phoneString;
                    }
                }

                if ((name == null || name.isBlank()) || (phoneNumber == null || phoneNumber.isBlank())) {
                    try {
                        UserRecord userRecord = firebaseAuthService.getUserRecord(firebaseUid);
                        if (userRecord != null) {
                            if ((name == null || name.isBlank()) && userRecord.getDisplayName() != null && !userRecord.getDisplayName().isBlank()) {
                                name = userRecord.getDisplayName();
                            }
                            if ((phoneNumber == null || phoneNumber.isBlank()) && userRecord.getPhoneNumber() != null && !userRecord.getPhoneNumber().isBlank()) {
                                phoneNumber = userRecord.getPhoneNumber();
                            }
                        }
                    } catch (FirebaseAuthException e) {
                        logger.warn("Failed to fetch Firebase user record for {}: {}", firebaseUid, e.getMessage());
                    }
                }
            }

            String firebaseFirstName = "";
            String firebaseLastName = "";
            if (name != null && !name.isBlank()) {
                String[] nameParts = name.trim().split("\\s+", 2);
                firebaseFirstName = nameParts[0];
                if (nameParts.length > 1) {
                    firebaseLastName = nameParts[1];
                }
            }

            String emailDerivedFirstName = null;
            if (email != null && email.contains("@")) {
                emailDerivedFirstName = email.substring(0, email.indexOf("@"));
            }

            String defaultFirstName = firebaseFirstName;
            String defaultLastName = firebaseLastName;

            if ((defaultFirstName == null || defaultFirstName.isBlank()) && emailDerivedFirstName != null && !emailDerivedFirstName.isBlank()) {
                defaultFirstName = emailDerivedFirstName;
            }
            if (defaultFirstName == null || defaultFirstName.isBlank()) {
                defaultFirstName = "Volunteer";
            }
            if (defaultLastName == null || defaultLastName.isBlank()) {
                defaultLastName = "User";
            }

            if (phoneNumber != null && phoneNumber.length() > 20) {
                phoneNumber = phoneNumber.substring(0, 20);
            }

            User user = userRepository.findByFirebaseUid(firebaseUid).orElse(null);

            if (user == null) {
                String phoneForNewUser = (phoneNumber == null || phoneNumber.isBlank()) ? "pending" : phoneNumber;
                user = new User(firebaseUid, defaultFirstName, defaultLastName, email, phoneForNewUser);

                Set<Role> roles = new HashSet<>();
                Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                        .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                roles.add(userRole);

                if (isAdminEmail(email)) {
                    Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                            .orElseThrow(() -> new RuntimeException("Error: Admin role is not found."));
                    roles.add(adminRole);
                }

                user.setRoles(roles);

                try {
                    userRepository.save(user);
                    return ResponseEntity.ok(new MessageResponse("User created successfully!"));
                } catch (DataIntegrityViolationException ex) {
                    user = userRepository.findByFirebaseUid(firebaseUid).orElse(null);
                    if (user == null) {
                        throw ex;
                    }
                }
            }

            boolean updated = false;

            if (!user.getEmail().equals(email)) {
                user.setEmail(email);
                updated = true;
            }

            boolean isAutoFirstName = user.getFirstName() == null
                    || user.getFirstName().isBlank()
                    || "Volunteer".equalsIgnoreCase(user.getFirstName())
                    || (emailDerivedFirstName != null && user.getFirstName().equalsIgnoreCase(emailDerivedFirstName));

            if ((user.getFirstName() == null || user.getFirstName().isBlank()) && defaultFirstName != null && !defaultFirstName.isBlank()) {
                user.setFirstName(defaultFirstName);
                updated = true;
            } else if (firebaseFirstName != null && !firebaseFirstName.isBlank() && !firebaseFirstName.equals(user.getFirstName()) && isAutoFirstName) {
                user.setFirstName(firebaseFirstName);
                updated = true;
            }

            boolean isAutoLastName = user.getLastName() == null
                    || user.getLastName().isBlank()
                    || "User".equalsIgnoreCase(user.getLastName());

            if ((user.getLastName() == null || user.getLastName().isBlank()) && defaultLastName != null && !defaultLastName.isBlank()) {
                user.setLastName(defaultLastName);
                updated = true;
            } else if (firebaseLastName != null && !firebaseLastName.isBlank() && !firebaseLastName.equals(user.getLastName()) && isAutoLastName) {
                user.setLastName(firebaseLastName);
                updated = true;
            }

            if (phoneNumber != null && !phoneNumber.isBlank()) {
                String normalizedPhone = phoneNumber.length() > 20 ? phoneNumber.substring(0, 20) : phoneNumber;
                if (!normalizedPhone.equals(user.getPhoneNumber())) {
                    user.setPhoneNumber(normalizedPhone);
                    updated = true;
                }
            } else if (user.getPhoneNumber() == null || user.getPhoneNumber().isBlank()) {
                user.setPhoneNumber("pending");
                updated = true;
            }

            if (updated) {
                userRepository.save(user);
            }

            return ResponseEntity.ok(new MessageResponse("User synchronized successfully!"));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Failed to sync user - " + e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");
            
            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            User user = userRepository.findByFirebaseUid(firebaseUid)
                    .orElse(null);

            if (user == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: User not found in database"));
            }

            List<String> roles = user.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toList());

            UserProfileResponse profile = new UserProfileResponse(
                    user.getId(),
                    user.getEmail(),
                    roles
            );
            
            // Add additional user info
            profile.setFirstName(user.getFirstName());
            profile.setLastName(user.getLastName());
            profile.setPhoneNumber(user.getPhoneNumber());
            profile.setResumeLink(user.getResumeLink());
            profile.setPortfolioLink(user.getPortfolioLink());

            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to get user profile - " + e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@Valid @RequestBody UpdateProfileRequest updateRequest, 
                                             HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");
            
            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            User user = userRepository.findByFirebaseUid(firebaseUid)
                    .orElse(null);

            if (user == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: User not found in database"));
            }

            // Update user profile
            if (updateRequest.getFirstName() != null) {
                String firstName = updateRequest.getFirstName().trim();
                if (!firstName.isEmpty()) {
                    user.setFirstName(firstName);
                }
            }
            if (updateRequest.getLastName() != null) {
                String lastName = updateRequest.getLastName().trim();
                if (!lastName.isEmpty()) {
                    user.setLastName(lastName);
                }
            }
            if (updateRequest.getPhoneNumber() != null) {
                String newPhoneNumber = updateRequest.getPhoneNumber().trim();
                if (!newPhoneNumber.isEmpty()) {
                    if (newPhoneNumber.length() > 20) {
                        newPhoneNumber = newPhoneNumber.substring(0, 20);
                    }
                    user.setPhoneNumber(newPhoneNumber);
                } else {
                    user.setPhoneNumber("pending");
                }
            }

            userRepository.save(user);

            return ResponseEntity.ok(new MessageResponse("Profile updated successfully!"));
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to update profile - " + e.getMessage()));
        }
    }

    // Request class for profile updates
    public static class UpdateProfileRequest {
        private String firstName;
        private String lastName;
        private String phoneNumber;

        // Getters and setters
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    }

    // Test login endpoint for development (when Firebase is disabled)
    @PostMapping("/test-login")
    public ResponseEntity<?> testLogin(@Valid @RequestBody TestLoginRequest loginRequest) {
        try {
            // Simple test login for development - only works for test admin
            if ("kidsinmotion0@gmail.com".equals(loginRequest.getEmail()) &&
                "admin123".equals(loginRequest.getPassword())) {

                User user = userRepository.findByEmail(loginRequest.getEmail())
                        .orElse(null);

                if (user != null) {
                    List<String> roles = user.getRoles().stream()
                            .map(role -> role.getName().name())
                            .collect(Collectors.toList());

                    UserProfileResponse profile = new UserProfileResponse(
                            user.getId(),
                            user.getEmail(),
                            roles
                    );
                    profile.setFirstName(user.getFirstName());
                    profile.setLastName(user.getLastName());
                    profile.setPhoneNumber(user.getPhoneNumber());
                    profile.setResumeLink(user.getResumeLink());
                    profile.setPortfolioLink(user.getPortfolioLink());

                    return ResponseEntity.ok(profile);
                }
            }

            return ResponseEntity.status(401)
                .body(new MessageResponse("Error: Invalid credentials"));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Login failed - " + e.getMessage()));
        }
    }

    // Test login request class
    public static class TestLoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    // Helper method to check if an email should have admin privileges
    private boolean isAdminEmail(String email) {
        if (adminEmails == null || adminEmails.trim().isEmpty()) {
            return false;
        }

        String[] adminEmailList = adminEmails.split(",");
        for (String adminEmail : adminEmailList) {
            if (adminEmail.trim().equalsIgnoreCase(email.trim())) {
                return true;
            }
        }
        return false;
    }
}



