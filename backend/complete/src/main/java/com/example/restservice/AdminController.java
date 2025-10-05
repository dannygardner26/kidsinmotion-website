package com.example.restservice;

import com.example.restservice.model.User;
import com.example.restservice.model.Participant;
import com.example.restservice.model.Volunteer;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.repository.UserRepository;
import com.example.restservice.repository.ParticipantRepository;
import com.example.restservice.repository.VolunteerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

// CORS handled by WebSecurityConfig - removed wildcard origin for security
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private VolunteerRepository volunteerRepository;

    // Get all users for admin dashboard
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String search) {

        try {
            List<User> users;
            if (search != null && !search.trim().isEmpty()) {
                users = userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                    search.trim(), search.trim(), search.trim());
            } else {
                users = userRepository.findAll();
            }

            // Create response with user stats
            Map<String, Object> response = new HashMap<>();
            response.put("users", users);
            response.put("totalUsers", users.size());
            response.put("page", page);
            response.put("size", size);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error fetching users: " + e.getMessage()));
        }
    }

    // Get user details with activity
    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserDetails(@PathVariable Long userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOpt.get();

            // Get user's registrations and volunteer activities
            List<Participant> registrations = participantRepository.findByParentUser_Id(userId);
            List<Volunteer> volunteerActivities = volunteerRepository.findByUser_Id(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("user", user);
            response.put("registrations", registrations);
            response.put("volunteerActivities", volunteerActivities);
            response.put("totalRegistrations", registrations.size());
            response.put("totalVolunteerEvents", volunteerActivities.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error fetching user details: " + e.getMessage()));
        }
    }

    // Get dashboard statistics
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDashboardStats() {
        try {
            long totalUsers = userRepository.count();
            long totalParticipants = participantRepository.count();
            long totalVolunteers = volunteerRepository.count();

            // Get recent registrations (last 30 days)
            // Note: This is a simplified version - you may want to add date filtering
            List<Participant> recentRegistrations = participantRepository.findTop10ByOrderByIdDesc();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", totalUsers);
            stats.put("totalParticipants", totalParticipants);
            stats.put("totalVolunteers", totalVolunteers);
            stats.put("recentRegistrations", recentRegistrations);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error fetching stats: " + e.getMessage()));
        }
    }

    // Update user status/role
    @PutMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long userId,
                                       @RequestBody Map<String, Object> updates) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOpt.get();

            // Update allowed fields
            if (updates.containsKey("firstName")) {
                user.setFirstName((String) updates.get("firstName"));
            }
            if (updates.containsKey("lastName")) {
                user.setLastName((String) updates.get("lastName"));
            }
            if (updates.containsKey("email")) {
                user.setEmail((String) updates.get("email"));
            }
            if (updates.containsKey("phoneNumber")) {
                user.setPhoneNumber((String) updates.get("phoneNumber"));
            }

            userRepository.save(user);

            return ResponseEntity.ok(new MessageResponse("User updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error updating user: " + e.getMessage()));
        }
    }

    // Get all registrations for admin oversight
    @GetMapping("/registrations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllRegistrations(
            @RequestParam(required = false) Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        try {
            List<Participant> registrations;
            if (eventId != null) {
                registrations = participantRepository.findByEvent_Id(eventId);
            } else {
                registrations = participantRepository.findAll();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("registrations", registrations);
            response.put("totalRegistrations", registrations.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error fetching registrations: " + e.getMessage()));
        }
    }
}

