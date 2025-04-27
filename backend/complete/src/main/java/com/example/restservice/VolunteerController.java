package com.example.restservice;

import com.example.restservice.model.User;
import com.example.restservice.model.Volunteer; // Import the Volunteer entity
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.repository.UserRepository;
import com.example.restservice.repository.VolunteerRepository;
import com.example.restservice.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600) // Allow all origins for now
@RestController
@RequestMapping("/api/volunteers")
public class VolunteerController {

    @Autowired
    private VolunteerRepository volunteerRepository;

    @Autowired
    private UserRepository userRepository; // Inject UserRepository

    // Fetch volunteer signups for the currently logged-in user
    @GetMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')") // Ensure user is authenticated
    public ResponseEntity<?> getCurrentUserVolunteerSignups() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
             return ResponseEntity.status(401).body(new MessageResponse("Error: User not authenticated"));
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();

        // Fetch the User entity
        User currentUser = userRepository.findById(userId)
                .orElse(null);

        if (currentUser == null) {
             return ResponseEntity.status(404).body(new MessageResponse("Error: Authenticated user not found in database"));
        }

        // Fetch volunteer signups associated with the current user
        List<Volunteer> signups = volunteerRepository.findByUser(currentUser);

        // Return the list of Volunteer entities.
        // Consider creating a DTO if needed.
        return ResponseEntity.ok(signups);
    }

    // Removed the static inner VolunteerSignup class
}