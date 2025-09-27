package com.example.restservice.security;

import com.example.restservice.repository.UserRepository;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class FirebaseTokenFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseTokenFilter.class);

    @Autowired
    private FirebaseAuthService firebaseAuthService;

    @Autowired
    private UserRepository userRepository;

    @Value("${firebase.enabled:true}")
    private boolean firebaseEnabled;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {

        // Check for test-admin-token first, even when Firebase is disabled
        String authHeader = request.getHeader("Authorization");
        System.out.println("DEBUG: Authorization header: " + authHeader);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String idToken = authHeader.substring(7);
            System.out.println("DEBUG: Extracted token: " + idToken);

            // Handle test admin token for development (works even when Firebase is disabled)
            if ("test-admin-token".equals(idToken)) {
                System.out.println("DEBUG: Processing test-admin-token");

                // Create authentication for test admin user
                UserDetails userDetails = User.builder()
                        .username("test-admin-uid")
                        .password("")
                        .authorities(new ArrayList<>())
                        .build();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Store test admin info in request attributes
                request.setAttribute("firebaseUid", "test-admin-uid");
                request.setAttribute("firebaseEmail", "kidsinmotion0@gmail.com");

                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("DEBUG: Test admin authentication set successfully");

                filterChain.doFilter(request, response);
                return;
            }
        }

        // Skip Firebase authentication if disabled
        if (!firebaseEnabled) {
            System.out.println("DEBUG: Firebase authentication disabled, no test-admin-token found, proceeding as anonymous");
            filterChain.doFilter(request, response);
            return;
        }

        // Now process regular Firebase tokens (authHeader and idToken already extracted above)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String idToken = authHeader.substring(7);

            // Skip test-admin-token since it was already processed above
            if (!"test-admin-token".equals(idToken)) {
                System.out.println("DEBUG: Processing regular Firebase token");
            } else {
                // This shouldn't happen since test-admin-token was handled above
                System.out.println("DEBUG: Unexpected test-admin-token in Firebase processing section");
            }

            try {
                FirebaseToken decodedToken = firebaseAuthService.verifyIdToken(idToken);
                String uid = decodedToken.getUid();
                String email = decodedToken.getEmail();

                // Create a UserDetails object with Firebase UID as username
                UserDetails userDetails = User.builder()
                        .username(uid)
                        .password("") // No password needed for Firebase auth
                        .authorities(new ArrayList<>()) // Will be populated from database
                        .build();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Store Firebase UID and email in request attributes for use in controllers
                request.setAttribute("firebaseUid", uid);
                request.setAttribute("firebaseEmail", email);

                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (FirebaseAuthException e) {
                logger.error("Firebase token validation failed", e);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"Invalid or expired token\"}");
                response.setContentType("application/json");
                return;
            }
        } else {
            System.out.println("DEBUG: No Authorization header found, proceeding as anonymous");
        }

        filterChain.doFilter(request, response);
    }

    private List<SimpleGrantedAuthority> resolveAuthorities(String firebaseUid, boolean testAdmin) {
        if (testAdmin) {
            return List.of(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("ROLE_USER")
            );
        }

        return userRepository.findByFirebaseUid(firebaseUid)
                .map(user -> user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                        .collect(Collectors.toList()))
                .filter(authorities -> !authorities.isEmpty())
                .orElseGet(() -> Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
    }
}


