package com.example.restservice;

import com.example.restservice.model.VolunteerEmployee;
import com.example.restservice.model.User;
import com.example.restservice.model.Role;
import com.example.restservice.model.Role.ERole;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.repository.VolunteerEmployeeRepository;
import com.example.restservice.repository.UserRepository;
import com.example.restservice.repository.RoleRepository;
import com.example.restservice.service.FirestoreService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/volunteer")
public class VolunteerEmployeeController {

    @Autowired
    VolunteerEmployeeRepository volunteerEmployeeRepository;


    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    FirestoreService firestoreService;

    // Register as a volunteer employee (Step 1)
    @PostMapping("/employee/register")
    public ResponseEntity<?> registerVolunteerEmployee(@Valid @RequestBody VolunteerEmployeeRegistrationRequest request,
                                                      HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            User user = userRepository.findByFirebaseUid(firebaseUid)
                    .orElse(null);
            if (user == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: User not found"));
            }

            // Check if user is an admin - admins shouldn't register as volunteers
            String email = (String) httpRequest.getAttribute("firebaseEmail");
            if (isAdminEmail(email)) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Admin users cannot register as volunteer employees"));
            }

            // Update user profile fields if provided
            boolean userUpdated = false;
            if (request.getFirstName() != null && !request.getFirstName().trim().isEmpty()) {
                user.setFirstName(request.getFirstName().trim());
                userUpdated = true;
            }
            if (request.getLastName() != null && !request.getLastName().trim().isEmpty()) {
                user.setLastName(request.getLastName().trim());
                userUpdated = true;
            }
            if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
                user.setPhoneNumber(request.getPhoneNumber().trim());
                userUpdated = true;
            }
            if (request.getResumeLink() != null && !request.getResumeLink().trim().isEmpty()) {
                user.setResumeLink(request.getResumeLink().trim());
                userUpdated = true;
            }
            if (request.getPortfolioLink() != null && !request.getPortfolioLink().trim().isEmpty()) {
                user.setPortfolioLink(request.getPortfolioLink().trim());
                userUpdated = true;
            }

            if (userUpdated) {
                userRepository.save(user);
                System.out.println("DEBUG: Updated user profile - firstName: " + user.getFirstName() +
                                 ", lastName: " + user.getLastName() + ", phone: " + user.getPhoneNumber() +
                                 ", resume: " + user.getResumeLink() + ", portfolio: " + user.getPortfolioLink());
            }

            // Check if user already has a volunteer employee registration - update it instead of creating new
            VolunteerEmployee volunteerEmployee = volunteerEmployeeRepository.findByUser(user)
                    .orElse(null);

            System.out.println("DEBUG: VolunteerEmployee found: " + (volunteerEmployee != null ? volunteerEmployee.getId() : "null"));

            boolean isUpdate = false;
            if (volunteerEmployee != null) {
                System.out.println("DEBUG: Updating existing volunteer employee with ID: " + volunteerEmployee.getId());
                // Update existing registration
                isUpdate = true;
                volunteerEmployee.setGrade(request.getGrade());
                volunteerEmployee.setSchool(request.getSchool());
                volunteerEmployee.setPreferredContact(request.getPreferredContact());
                volunteerEmployee.setMotivation(request.getMotivation());
                volunteerEmployee.setSkills(request.getSkills());
                // Reset status to pending when resubmitting
                volunteerEmployee.setStatus(VolunteerEmployee.EmployeeStatus.PENDING);
                volunteerEmployee.setApprovedDate(null);
                volunteerEmployee.setApprovedBy(null);
            } else {
                // Create new volunteer employee registration
                volunteerEmployee = new VolunteerEmployee(user);
                volunteerEmployee.setGrade(request.getGrade());
                volunteerEmployee.setSchool(request.getSchool());
                volunteerEmployee.setPreferredContact(request.getPreferredContact());
                volunteerEmployee.setMotivation(request.getMotivation());
                volunteerEmployee.setSkills(request.getSkills());
            }

            volunteerEmployeeRepository.save(volunteerEmployee);

            // Sync to Firestore
            // firestoreService.syncVolunteerApplication(volunteerEmployee); // Commented out due to Java module access issue

            String message = isUpdate ?
                "Volunteer employee application updated and resubmitted successfully! We'll review your changes." :
                "Volunteer employee registration submitted successfully! We'll review your application.";

            return ResponseEntity.ok(new MessageResponse(message));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to register volunteer employee - " + e.getMessage()));
        }
    }



    // Get user's volunteer employee status
    @GetMapping("/status")
    public ResponseEntity<?> getVolunteerStatus(HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            User user = userRepository.findByFirebaseUid(firebaseUid)
                    .orElse(null);
            if (user == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: User not found"));
            }

            VolunteerEmployee volunteerEmployee = volunteerEmployeeRepository.findByUser(user)
                    .orElse(null);

            VolunteerStatusResponse response = new VolunteerStatusResponse();

            if (volunteerEmployee != null) {
                response.setVolunteerEmployeeStatus(volunteerEmployee.getStatus().name());
                response.setRegistrationDate(volunteerEmployee.getRegistrationDate());
                response.setApprovedDate(volunteerEmployee.getApprovedDate());

                // Include the actual volunteer employee data for form population
                response.setGrade(volunteerEmployee.getGrade());
                response.setSchool(volunteerEmployee.getSchool());
                response.setPreferredContact(volunteerEmployee.getPreferredContact());
                response.setMotivation(volunteerEmployee.getMotivation());
                response.setSkills(volunteerEmployee.getSkills());

                // Include user information
                response.setFirstName(volunteerEmployee.getUser().getFirstName());
                response.setLastName(volunteerEmployee.getUser().getLastName());
                response.setEmail(volunteerEmployee.getUser().getEmail());
                response.setPhoneNumber(volunteerEmployee.getUser().getPhoneNumber());
                response.setResumeLink(volunteerEmployee.getUser().getResumeLink());
                response.setPortfolioLink(volunteerEmployee.getUser().getPortfolioLink());

            } else {
                response.setVolunteerEmployeeStatus("NOT_REGISTERED");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to get volunteer status - " + e.getMessage()));
        }
    }

    // Admin endpoints - get all volunteer employees
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllVolunteerEmployees(HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            String email = (String) httpRequest.getAttribute("firebaseEmail");

            System.out.println("DEBUG: Volunteer admin endpoint - UID: " + firebaseUid + ", Email: " + email);

            if (firebaseUid == null || email == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated - UID: " + firebaseUid + ", Email: " + email));
            }

            // Check if user is admin
            if (!isAdminEmail(email)) {
                System.out.println("DEBUG: Admin check failed for email: " + email);
                return ResponseEntity.status(403)
                    .body(new MessageResponse("Error: Admin access required - Email: " + email + " is not in admin list"));
            }

            List<VolunteerEmployee> allVolunteerEmployees = volunteerEmployeeRepository.findAll();
            return ResponseEntity.ok(allVolunteerEmployees);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to get volunteer employees - " + e.getMessage()));
        }
    }


    // Admin endpoint to update volunteer employee status
    @PostMapping("/admin/update-status")
    public ResponseEntity<?> updateVolunteerStatus(@Valid @RequestBody VolunteerStatusUpdateRequest request,
                                                   HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            String email = (String) httpRequest.getAttribute("firebaseEmail");

            if (firebaseUid == null || email == null) {
                return ResponseEntity.status(401)
                    .body(new MessageResponse("Error: User not authenticated"));
            }

            // Check if user is admin
            if (!isAdminEmail(email)) {
                return ResponseEntity.status(403)
                    .body(new MessageResponse("Error: Admin access required"));
            }

            // Get admin user for tracking who made the change
            User adminUser = userRepository.findByFirebaseUid(firebaseUid)
                    .orElse(null);
            if (adminUser == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: Admin user not found"));
            }

            // Find the volunteer employee to update
            VolunteerEmployee volunteerEmployee = volunteerEmployeeRepository.findById(request.getVolunteerEmployeeId())
                    .orElse(null);
            if (volunteerEmployee == null) {
                return ResponseEntity.status(404)
                    .body(new MessageResponse("Error: Volunteer employee not found"));
            }

            // Update status
            VolunteerEmployee.EmployeeStatus newStatus;
            try {
                newStatus = VolunteerEmployee.EmployeeStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Invalid status. Valid values: PENDING, APPROVED, REJECTED, SUSPENDED"));
            }

            volunteerEmployee.setStatus(newStatus);
            volunteerEmployee.setAdminNotes(request.getAdminNotes());

            // If approving, set approval date and approver
            if (newStatus == VolunteerEmployee.EmployeeStatus.APPROVED) {
                volunteerEmployee.setApprovedDate(LocalDateTime.now());
                volunteerEmployee.setApprovedBy(adminUser);

                // Update user type to VOLUNTEER when volunteer application is approved
                User volunteerUser = volunteerEmployee.getUser();
                if (volunteerUser.getUserType() == User.UserType.PARENT) {
                    volunteerUser.setUserType(User.UserType.VOLUNTEER);
                    userRepository.save(volunteerUser);
                    System.out.println("DEBUG: Updated user type to VOLUNTEER for approved volunteer: " + volunteerUser.getEmail());
                }
            } else if (newStatus == VolunteerEmployee.EmployeeStatus.REJECTED) {
                // If rejecting and user has no team roles, revert to PARENT
                User volunteerUser = volunteerEmployee.getUser();
                if (volunteerUser.getUserType() == User.UserType.VOLUNTEER && volunteerUser.getTeams().isEmpty()) {
                    volunteerUser.setUserType(User.UserType.PARENT);
                    userRepository.save(volunteerUser);
                    System.out.println("DEBUG: Reverted user type to PARENT for rejected volunteer with no teams: " + volunteerUser.getEmail());
                }
            }

            volunteerEmployeeRepository.save(volunteerEmployee);

            // Sync to Firestore
            // firestoreService.syncVolunteerApplication(volunteerEmployee); // Commented out due to Java module access issue

            return ResponseEntity.ok(new MessageResponse("Volunteer employee status updated successfully to " + newStatus.name()));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to update volunteer status - " + e.getMessage()));
        }
    }


    // Helper method to check if an email should have admin privileges
    private boolean isAdminEmail(String email) {
        String[] adminEmails = {"kidsinmotion0@gmail.com", "kidsinmotion@gmail.com", "danny@example.com", "admin@kidsinmotion.org"};
        if (email == null) return false;

        for (String adminEmail : adminEmails) {
            if (adminEmail.equalsIgnoreCase(email.trim())) {
                return true;
            }
        }
        return false;
    }

    // Helper method to map team names to team role enums (Discord-like system)
    private ERole getTeamRole(String teamName) {
        if (teamName == null) return null;

        switch (teamName.toLowerCase().trim()) {
            case "fundraising":
                return ERole.TEAM_FUNDRAISING;
            case "social media":
            case "social media team":
                return ERole.TEAM_SOCIAL_MEDIA;
            case "coach":
                return ERole.TEAM_COACH;
            case "event coordination":
                return ERole.TEAM_EVENT_COORDINATION;
            default:
                return null;
        }
    }

    // Request DTOs
    public static class VolunteerEmployeeRegistrationRequest {
        private String grade;
        private String school;
        private String preferredContact;
        private String motivation;
        private String skills;

        // User profile fields
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private String resumeLink;
        private String portfolioLink;

        // Getters and setters
        public String getGrade() { return grade; }
        public void setGrade(String grade) { this.grade = grade; }

        public String getSchool() { return school; }
        public void setSchool(String school) { this.school = school; }

        public String getPreferredContact() { return preferredContact; }
        public void setPreferredContact(String preferredContact) { this.preferredContact = preferredContact; }

        public String getMotivation() { return motivation; }
        public void setMotivation(String motivation) { this.motivation = motivation; }

        public String getSkills() { return skills; }
        public void setSkills(String skills) { this.skills = skills; }

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }

        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }

        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

        public String getResumeLink() { return resumeLink; }
        public void setResumeLink(String resumeLink) { this.resumeLink = resumeLink; }

        public String getPortfolioLink() { return portfolioLink; }
        public void setPortfolioLink(String portfolioLink) { this.portfolioLink = portfolioLink; }
    }


    public static class VolunteerStatusUpdateRequest {
        private Long volunteerEmployeeId;
        private String status;
        private String adminNotes;

        public Long getVolunteerEmployeeId() { return volunteerEmployeeId; }
        public void setVolunteerEmployeeId(Long volunteerEmployeeId) { this.volunteerEmployeeId = volunteerEmployeeId; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getAdminNotes() { return adminNotes; }
        public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    }

    public static class VolunteerStatusResponse {
        private String volunteerEmployeeStatus;
        private LocalDateTime registrationDate;
        private LocalDateTime approvedDate;

        // Volunteer employee data fields
        private String grade;
        private String school;
        private String preferredContact;
        private String motivation;
        private String skills;

        // User information fields
        private String firstName;
        private String lastName;
        private String email;
        private String phoneNumber;
        private String resumeLink;
        private String portfolioLink;

        public String getVolunteerEmployeeStatus() { return volunteerEmployeeStatus; }
        public void setVolunteerEmployeeStatus(String volunteerEmployeeStatus) { this.volunteerEmployeeStatus = volunteerEmployeeStatus; }

        public LocalDateTime getRegistrationDate() { return registrationDate; }
        public void setRegistrationDate(LocalDateTime registrationDate) { this.registrationDate = registrationDate; }

        public LocalDateTime getApprovedDate() { return approvedDate; }
        public void setApprovedDate(LocalDateTime approvedDate) { this.approvedDate = approvedDate; }


        public String getGrade() { return grade; }
        public void setGrade(String grade) { this.grade = grade; }

        public String getSchool() { return school; }
        public void setSchool(String school) { this.school = school; }

        public String getPreferredContact() { return preferredContact; }
        public void setPreferredContact(String preferredContact) { this.preferredContact = preferredContact; }

        public String getMotivation() { return motivation; }
        public void setMotivation(String motivation) { this.motivation = motivation; }

        public String getSkills() { return skills; }
        public void setSkills(String skills) { this.skills = skills; }

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
    }

}