package com.example.restservice;

import com.example.restservice.model.Role;
import com.example.restservice.model.Role.ERole;
import com.example.restservice.model.User;
import com.example.restservice.payload.request.LoginRequest;
import com.example.restservice.payload.request.SignupRequest;
import com.example.restservice.payload.response.JwtResponse;
import com.example.restservice.payload.response.MessageResponse;
import com.example.restservice.payload.response.UserProfileResponse;
import com.example.restservice.repository.RoleRepository;
import com.example.restservice.repository.UserRepository;
import com.example.restservice.security.jwt.JwtUtils;
import com.example.restservice.security.services.UserDetailsImpl;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600) // Allow all origins for now (adjust in production)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())); // Use email

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                                                 userDetails.getId(),
                                                 // userDetails.getUsername(), // Removed username
                                                 userDetails.getEmail(),
                                                 roles));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        // if (userRepository.existsByUsername(signUpRequest.getUsername())) { // Check by email now
        //     return ResponseEntity
        //             .badRequest()
        //             .body(new MessageResponse("Error: Username is already taken!"));
        // }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User(signUpRequest.getFirstName(),
                             signUpRequest.getLastName(),
                             signUpRequest.getEmail(),
                             encoder.encode(signUpRequest.getPassword()), // Use getPassword() now
                             signUpRequest.getPhoneNumber());

        String strRole = signUpRequest.getRole(); // Get single role string
        Set<Role> roles = new HashSet<>();

        // Determine role based on the string provided
        if (strRole == null || strRole.isBlank()) {
            // Default to ROLE_USER if no role is specified (or handle as error if role is mandatory)
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: Default Role 'USER' is not found."));
            roles.add(userRole);
        } else {
            switch (strRole.toUpperCase()) { // Use toUpperCase for case-insensitivity
                case "ADMIN":
                    Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                            .orElseThrow(() -> new RuntimeException("Error: Role 'ADMIN' is not found."));
                    roles.add(adminRole);
                    break;
                case "PARENT": // Assuming PARENT maps to ROLE_USER or a specific ROLE_PARENT if exists
                case "VOLUNTEER": // Assuming VOLUNTEER maps to ROLE_USER or a specific ROLE_VOLUNTEER if exists
                    // For now, map both Parent and Volunteer to ROLE_USER.
                    // TODO: Create ROLE_PARENT and ROLE_VOLUNTEER if needed and map accordingly.
                    Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                            .orElseThrow(() -> new RuntimeException("Error: Role 'USER' is not found."));
                    roles.add(userRole);
                    break;
                default:
                    // Handle unknown role string - maybe default to USER or throw error
                    return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid role specified!"));
            }
        }

        user.setRoles(roles);
        userRepository.save(user);

        // TODO: Initialize roles if they don't exist on application startup

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @GetMapping("/profile")
    // @PreAuthorize("hasRole('USER') or hasRole('ADMIN')") // Example of method-level security
    public ResponseEntity<?> getUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
             return ResponseEntity.status(401).body(new MessageResponse("Error: User not authenticated"));
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new UserProfileResponse(
                userDetails.getId(),
                // userDetails.getUsername(), // Remove username
                userDetails.getEmail(),
                roles
        ));
    }
}