package com.example.restservice;

import com.example.restservice.model.VolunteerEmployee;
import com.example.restservice.model.TeamApplication;
import com.example.restservice.model.User;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.repository.VolunteerEmployeeRepository;
import com.example.restservice.repository.TeamApplicationRepository;
import com.example.restservice.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/volunteer")
public class VolunteerEmployeeController {

    @Autowired
    VolunteerEmployeeRepository volunteerEmployeeRepository;

    @Autowired
    TeamApplicationRepository teamApplicationRepository;

    @Autowired
    UserRepository userRepository;

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

            // Check if user is already registered as volunteer employee
            if (volunteerEmployeeRepository.existsByUser(user)) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You are already registered as a volunteer employee"));
            }

            // Create new volunteer employee registration
            VolunteerEmployee volunteerEmployee = new VolunteerEmployee(user);
            volunteerEmployee.setGrade(request.getGrade());
            volunteerEmployee.setSchool(request.getSchool());
            volunteerEmployee.setPreferredContact(request.getPreferredContact());
            volunteerEmployee.setMotivation(request.getMotivation());
            volunteerEmployee.setSkills(request.getSkills());

            volunteerEmployeeRepository.save(volunteerEmployee);

            return ResponseEntity.ok(new MessageResponse("Volunteer employee registration submitted successfully! We'll review your application."));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to register volunteer employee - " + e.getMessage()));
        }
    }

    // Apply to a specific team (Step 2) - only for approved volunteer employees
    @PostMapping("/team/apply")
    public ResponseEntity<?> applyToTeam(@Valid @RequestBody TeamApplicationRequest request,
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

            // Check if user is an approved volunteer employee
            VolunteerEmployee volunteerEmployee = volunteerEmployeeRepository.findByUser(user)
                    .orElse(null);
            if (volunteerEmployee == null) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You must first register as a volunteer employee"));
            }

            if (volunteerEmployee.getStatus() != VolunteerEmployee.EmployeeStatus.APPROVED) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Your volunteer employee registration must be approved before applying to teams"));
            }

            // Check if user has already applied to this team
            if (teamApplicationRepository.existsByVolunteerEmployeeAndTeamName(volunteerEmployee, request.getTeamName())) {
                return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: You have already applied to this team"));
            }

            // Create new team application
            TeamApplication teamApplication = new TeamApplication(volunteerEmployee, request.getTeamName());
            teamApplication.setTeamSpecificAnswer(request.getTeamSpecificAnswer());

            teamApplicationRepository.save(teamApplication);

            return ResponseEntity.ok(new MessageResponse("Team application submitted successfully! We'll review your application."));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to apply to team - " + e.getMessage()));
        }
    }

    // Get user's volunteer employee status and team applications
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

                // Get team applications
                List<TeamApplication> teamApplications = teamApplicationRepository.findByVolunteerEmployee(volunteerEmployee);
                response.setTeamApplications(teamApplications);
            } else {
                response.setVolunteerEmployeeStatus("NOT_REGISTERED");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to get volunteer status - " + e.getMessage()));
        }
    }

    // Admin endpoints - get all volunteer employees and team applications
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllVolunteerEmployees(HttpServletRequest httpRequest) {
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

            List<VolunteerEmployee> allVolunteerEmployees = volunteerEmployeeRepository.findAll();
            return ResponseEntity.ok(allVolunteerEmployees);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to get volunteer employees - " + e.getMessage()));
        }
    }

    @GetMapping("/admin/team-applications")
    public ResponseEntity<?> getAllTeamApplications(HttpServletRequest httpRequest) {
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

            List<TeamApplication> allApplications = teamApplicationRepository.findAll();
            return ResponseEntity.ok(allApplications);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new MessageResponse("Error: Failed to get team applications - " + e.getMessage()));
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

    // Request DTOs
    public static class VolunteerEmployeeRegistrationRequest {
        private String grade;
        private String school;
        private String preferredContact;
        private String motivation;
        private String skills;

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
    }

    public static class TeamApplicationRequest {
        private String teamName;
        private String teamSpecificAnswer;

        public String getTeamName() { return teamName; }
        public void setTeamName(String teamName) { this.teamName = teamName; }

        public String getTeamSpecificAnswer() { return teamSpecificAnswer; }
        public void setTeamSpecificAnswer(String teamSpecificAnswer) { this.teamSpecificAnswer = teamSpecificAnswer; }
    }

    public static class VolunteerStatusResponse {
        private String volunteerEmployeeStatus;
        private LocalDateTime registrationDate;
        private LocalDateTime approvedDate;
        private List<TeamApplication> teamApplications;

        public String getVolunteerEmployeeStatus() { return volunteerEmployeeStatus; }
        public void setVolunteerEmployeeStatus(String volunteerEmployeeStatus) { this.volunteerEmployeeStatus = volunteerEmployeeStatus; }

        public LocalDateTime getRegistrationDate() { return registrationDate; }
        public void setRegistrationDate(LocalDateTime registrationDate) { this.registrationDate = registrationDate; }

        public LocalDateTime getApprovedDate() { return approvedDate; }
        public void setApprovedDate(LocalDateTime approvedDate) { this.approvedDate = approvedDate; }

        public List<TeamApplication> getTeamApplications() { return teamApplications; }
        public void setTeamApplications(List<TeamApplication> teamApplications) { this.teamApplications = teamApplications; }
    }
}