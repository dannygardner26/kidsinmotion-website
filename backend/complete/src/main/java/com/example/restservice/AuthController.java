package com.example.restservice;

import com.example.restservice.model.Role;
import com.example.restservice.model.Role.ERole;
import com.example.restservice.model.User;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.payload.response.UserProfileResponse;
import com.example.restservice.repository.RoleRepository;
import com.example.restservice.repository.UserRepository;
import com.example.restservice.security.FirebaseAuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
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

    @PostMapping("/sync-user")
    public ResponseEntity<?> syncUser(HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");
            String email = (String) request.getAttribute("firebaseEmail");
            
            if (firebaseUid == null || email == null) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Firebase authentication required"));
            }

            // Check if user already exists
            User user = userRepository.findByFirebaseUid(firebaseUid).orElse(null);
            
            if (user == null) {
                // Create new user from Firebase data
                // Get additional info from Firebase token
                String authHeader = request.getHeader("Authorization");
                String idToken = authHeader.substring(7);
                String name = firebaseAuthService.getNameFromToken(idToken);
                
                // Parse name into first and last name (simple approach)
                String firstName = "";
                String lastName = "";
                if (name != null) {
                    String[] nameParts = name.split(" ", 2);
                    firstName = nameParts[0];
                    lastName = nameParts.length > 1 ? nameParts[1] : "";
                }
                
                user = new User(firebaseUid, firstName, lastName, email, ""); // Phone will be empty initially
                
                // Assign default role
                Set<Role> roles = new HashSet<>();
                Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                        .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                roles.add(userRole);
                user.setRoles(roles);
                
                userRepository.save(user);
                
                return ResponseEntity.ok(new MessageResponse("User created successfully!"));
            } else {
                // Update existing user's email if it changed
                if (!user.getEmail().equals(email)) {
                    user.setEmail(email);
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
}




