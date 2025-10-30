package com.example.restservice;

import com.example.restservice.model.Role.ERole;
import com.example.restservice.model.Role;
import com.example.restservice.model.User;
import com.example.restservice.model.User.UserType;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.repository.UserRepository;
import com.example.restservice.repository.RoleRepository;
import com.example.restservice.repository.VolunteerEmployeeRepository;
import com.example.restservice.model.VolunteerEmployee;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    VolunteerEmployeeRepository volunteerEmployeeRepository;


    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers(HttpServletRequest request) {
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

            // Check if user is admin by user type
            if (currentUser.getUserType() != UserType.ADMIN) {
                return ResponseEntity.status(403)
                    .body(new MessageResponse("Error: Admin access required"));
            }

            List<User> allUsers = userRepository.findAll();

            List<UserListResponse> userResponses = allUsers.stream()
                    .map(user -> {
                        // Get team assignments
                        List<String> teams = user.getTeams().stream()
                                .map(role -> role.getName().name())
                                .collect(Collectors.toList());

                        UserListResponse response = new UserListResponse();
                        response.setId(user.getId());
                        response.setEmail(user.getEmail());
                        response.setName(user.getFirstName() + " " + user.getLastName());
                        response.setFirstName(user.getFirstName());
                        response.setLastName(user.getLastName());
                        response.setPhoneNumber(user.getPhoneNumber());
                        response.setTeams(teams);
                        response.setResumeLink(user.getResumeLink());
                        response.setPortfolioLink(user.getPortfolioLink());
                        // Note: User model doesn't have createdAt/lastLoginAt fields yet
                        // response.setCreatedAt(user.getCreatedAt());
                        // response.setLastLoginAt(user.getLastLoginAt());

                        // Use actual user type from database
                        response.setUserType(user.getUserType().name());

                        return response;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(userResponses);

        } catch (Exception e) {
            logger.error("Error fetching all users", e);
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to get users - " + e.getMessage()));
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUserAccount(@PathVariable Long userId,
                                             @Valid @RequestBody UserUpdateRequest updateRequest,
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

            // Check if user is admin by user type
            if (currentUser.getUserType() != UserType.ADMIN) {
                return ResponseEntity.status(403)
                    .body(new MessageResponse("Error: Admin access required"));
            }

            // Find the user to update
            User userToUpdate = userRepository.findById(userId)
                    .orElse(null);

            if (userToUpdate == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: User to update not found"));
            }

            // Update user fields
            if (updateRequest.getFirstName() != null && !updateRequest.getFirstName().trim().isEmpty()) {
                userToUpdate.setFirstName(updateRequest.getFirstName().trim());
            }
            if (updateRequest.getLastName() != null && !updateRequest.getLastName().trim().isEmpty()) {
                userToUpdate.setLastName(updateRequest.getLastName().trim());
            }
            if (updateRequest.getEmail() != null && !updateRequest.getEmail().trim().isEmpty()) {
                userToUpdate.setEmail(updateRequest.getEmail().trim());
            }
            if (updateRequest.getPhoneNumber() != null && !updateRequest.getPhoneNumber().trim().isEmpty()) {
                userToUpdate.setPhoneNumber(updateRequest.getPhoneNumber().trim());
            }
            if (updateRequest.getResumeLink() != null) {
                userToUpdate.setResumeLink(updateRequest.getResumeLink().trim().isEmpty() ? null : updateRequest.getResumeLink().trim());
            }
            if (updateRequest.getPortfolioLink() != null) {
                userToUpdate.setPortfolioLink(updateRequest.getPortfolioLink().trim().isEmpty() ? null : updateRequest.getPortfolioLink().trim());
            }

            // Update user type if provided
            if (updateRequest.getUserType() != null) {
                try {
                    UserType userType = UserType.valueOf(updateRequest.getUserType());
                    userToUpdate.setUserType(userType);
                } catch (IllegalArgumentException e) {
                    logger.warn("Invalid user type provided: " + updateRequest.getUserType());
                }
            }

            // Update user teams if provided
            if (updateRequest.getTeams() != null) {
                Set<Role> newTeams = new HashSet<>();

                for (String teamName : updateRequest.getTeams()) {
                    try {
                        ERole eRole = ERole.valueOf(teamName);
                        Role role = roleRepository.findByName(eRole)
                            .orElseGet(() -> {
                                Role newRole = new Role(eRole);
                                return roleRepository.save(newRole);
                            });
                        newTeams.add(role);
                    } catch (IllegalArgumentException e) {
                        logger.warn("Invalid team name provided: " + teamName);
                    }
                }

                userToUpdate.setTeams(newTeams);
            }

            userRepository.save(userToUpdate);

            return ResponseEntity.ok(new MessageResponse("User account updated successfully"));

        } catch (Exception e) {
            logger.error("Error updating user account", e);
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to update user account - " + e.getMessage()));
        }
    }

    // Response class for user list
    public static class UserListResponse {
        private Long id;
        private String email;
        private String name;
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private List<String> teams;
        private String userType;
        private String resumeLink;
        private String portfolioLink;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime lastLoginAt;

        // Getters and setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }

        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }

        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

        public List<String> getTeams() { return teams; }
        public void setTeams(List<String> teams) { this.teams = teams; }

        public String getUserType() { return userType; }
        public void setUserType(String userType) { this.userType = userType; }

        public java.time.LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }

        public java.time.LocalDateTime getLastLoginAt() { return lastLoginAt; }
        public void setLastLoginAt(java.time.LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }

        public String getResumeLink() { return resumeLink; }
        public void setResumeLink(String resumeLink) { this.resumeLink = resumeLink; }

        public String getPortfolioLink() { return portfolioLink; }
        public void setPortfolioLink(String portfolioLink) { this.portfolioLink = portfolioLink; }
    }

    // Request class for user updates
    public static class UserUpdateRequest {
        private String firstName;
        private String lastName;
        private String email;
        private String phoneNumber;
        private String resumeLink;
        private String portfolioLink;
        private String userType;
        private List<String> teams;

        // Getters and setters
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }

        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

        public String getResumeLink() { return resumeLink; }
        public void setResumeLink(String resumeLink) { this.resumeLink = resumeLink; }

        public String getPortfolioLink() { return portfolioLink; }
        public void setPortfolioLink(String portfolioLink) { this.portfolioLink = portfolioLink; }

        public String getUserType() { return userType; }
        public void setUserType(String userType) { this.userType = userType; }

        public List<String> getTeams() { return teams; }
        public void setTeams(List<String> teams) { this.teams = teams; }
    }
}