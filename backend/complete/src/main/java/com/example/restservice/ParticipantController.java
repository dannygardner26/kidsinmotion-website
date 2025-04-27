package com.example.restservice;

import com.example.restservice.model.Participant;
import com.example.restservice.model.User;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.repository.ParticipantRepository;
import com.example.restservice.repository.UserRepository;
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
@RequestMapping("/api/participants")
public class ParticipantController {

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private UserRepository userRepository; // Inject UserRepository to fetch the User entity

    // Fetch registrations for the currently logged-in user
    @GetMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')") // Ensure user is authenticated
    public ResponseEntity<?> getCurrentUserRegistrations() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
             return ResponseEntity.status(401).body(new MessageResponse("Error: User not authenticated"));
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();

        // Fetch the User entity using the ID from the authenticated principal
        User currentUser = userRepository.findById(userId)
                .orElse(null); // Handle case where user might not be found in DB (shouldn't happen if authenticated)

        if (currentUser == null) {
             return ResponseEntity.status(404).body(new MessageResponse("Error: Authenticated user not found in database"));
        }

        // Fetch participants associated with the current user
        List<Participant> registrations = participantRepository.findByParentUser(currentUser);

        // Return the list of Participant entities. Jackson will serialize them.
        // Consider creating a DTO if you need to customize the output format or hide fields.
        return ResponseEntity.ok(registrations);
    }

    // Removed the static inner ParticipantRegistration class
}