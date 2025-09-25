package com.example.restservice;

import com.example.restservice.model.Role;
import com.example.restservice.model.Role.ERole;
import com.example.restservice.model.User;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.payload.response.UserProfileResponse;
import com.example.restservice.repository.RoleRepository;
import com.example.restservice.repository.UserRepository;
import com.example.restservice.security.FirebaseAuthService;
import com.google.firebase.auth.FirebaseToken;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

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
            String firebaseUid = (String) request.getAttribute("firebaseUid");
            String email = (String) request.getAttribute("firebaseEmail");
            
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
            FirebaseToken decodedToken = firebaseAuthService.verifyIdToken(idToken);
            String name = decodedToken != null ? decodedToken.getName() : null;
            String phoneNumber = null;
            if (decodedToken != null) {
                Object phoneClaim = decodedToken.getClaims().get("phone_number");
                if (phoneClaim instanceof String phoneString && !phoneString.isBlank()) {
                    phoneNumber = phoneString;
                }
            }

            // Parse name into first and last name (simple approach)
            String firstName = "";
            String lastName = "";
            if (name != null && !name.isBlank()) {
                String[] nameParts = name.trim().split("\\s+", 2);
                firstName = nameParts[0];
                lastName = nameParts.length > 1 ? nameParts[1] : "";
            }

            if ((firstName == null || firstName.isBlank()) && email != null && email.contains("@")) {
                firstName = email.substring(0, email.indexOf("@"));
            }
            if (firstName == null || firstName.isBlank()) {
                firstName = "Volunteer";
            }
            if (lastName == null || lastName.isBlank()) {
                lastName = "User";
            }

            if (phoneNumber == null || phoneNumber.isBlank()) {
                phoneNumber = "pending";
            }
            if (phoneNumber.length() > 20) {
                phoneNumber = phoneNumber.substring(0, 20);
            }

            // Check if user already exists
            User user = userRepository.findByFirebaseUid(firebaseUid).orElse(null);
            
            if (user == null) {
                // Create new user from Firebase data
                user = new User(firebaseUid, firstName, lastName, email, phoneNumber);
                
                // Assign roles based on email
                Set<Role> roles = new HashSet<>();
                Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                        .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                roles.add(userRole);

                // Check if this email should have admin privileges
                if (isAdminEmail(email)) {
                    Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                            .orElseThrow(() -> new RuntimeException("Error: Admin role is not found."));
                    roles.add(adminRole);
                }

                user.setRoles(roles);
                
                userRepository.save(user);
                
                return ResponseEntity.ok(new MessageResponse("User created successfully!"));
            } else {
                // Update existing user details if missing
                boolean updated = false;

                if (!user.getEmail().equals(email)) {
                    user.setEmail(email);
                    updated = true;
                }
                if ((user.getFirstName() == null || user.getFirstName().isBlank()) && firstName != null) {
                    user.setFirstName(firstName);
                    updated = true;
                }
                if ((user.getLastName() == null || user.getLastName().isBlank()) && lastName != null) {
                    user.setLastName(lastName);
                    updated = true;
                }
                if ((user.getPhoneNumber() == null || user.getPhoneNumber().isBlank()) && phoneNumber != null) {
                    user.setPhoneNumber(phoneNumber);
                    updated = true;
                }

                if (updated) {
                    userRepository.save(user);
                }

                return ResponseEntity.ok(new MessageResponse("User synchronized successfully!"));
            }
            
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
                user.setFirstName(updateRequest.getFirstName());
            }
            if (updateRequest.getLastName() != null) {
                user.setLastName(updateRequest.getLastName());
            }
            if (updateRequest.getPhoneNumber() != null) {
                user.setPhoneNumber(updateRequest.getPhoneNumber());
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





