package com.example.restservice.security;

import com.example.restservice.repository.firestore.UserFirestoreRepository;
import com.example.restservice.model.firestore.UserFirestore;
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
    private UserFirestoreRepository userRepository;

    @Value("${firebase.enabled:true}")
    private boolean firebaseEnabled;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {

        // Always allow OPTIONS requests through (for CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check if this is a public endpoint that doesn't require authentication
        String requestPath = request.getRequestURI();
        String method = request.getMethod();

        // Define public endpoints that should skip authentication
        if (isPublicEndpoint(requestPath, method)) {
            filterChain.doFilter(request, response);
            return;
        }

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
                List<SimpleGrantedAuthority> authorities = resolveAuthorities("test-admin-uid", true);
                UserDetails userDetails = User.builder()
                        .username("test-admin-uid")
                        .password("")
                        .authorities(authorities)
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

                try {
                    FirebaseToken decodedToken = firebaseAuthService.verifyIdToken(idToken);
                    String uid = decodedToken.getUid();
                    String email = decodedToken.getEmail();

                    System.out.println("DEBUG: Firebase token verified successfully - UID: " + uid + ", Email: " + email);

                    // Get user authorities from database
                    List<SimpleGrantedAuthority> authorities = resolveAuthorities(uid, false);

                    // Create a UserDetails object with Firebase UID as username
                    UserDetails userDetails = User.builder()
                            .username(uid)
                            .password("") // No password needed for Firebase auth
                            .authorities(authorities)
                            .build();

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // Store Firebase UID and email in request attributes for use in controllers
                    request.setAttribute("firebaseUid", uid);
                    request.setAttribute("firebaseEmail", email);

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    System.out.println("DEBUG: Firebase authentication set successfully for user: " + email);

                } catch (FirebaseAuthException e) {
                    logger.error("Firebase token validation failed for token: " + idToken.substring(0, Math.min(20, idToken.length())) + "...", e);
                    // Add CORS headers to error response
                    String origin = request.getHeader("Origin");
                    if (origin != null) {
                        response.setHeader("Access-Control-Allow-Origin", origin);
                        response.setHeader("Access-Control-Allow-Credentials", "true");
                    }
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Invalid or expired token\"}");
                    return;
                } catch (Exception e) {
                    logger.error("Unexpected error during Firebase token processing", e);
                    // Add CORS headers to error response
                    String origin = request.getHeader("Origin");
                    if (origin != null) {
                        response.setHeader("Access-Control-Allow-Origin", origin);
                        response.setHeader("Access-Control-Allow-Credentials", "true");
                    }
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Authentication service error\"}");
                    return;
                }
            } else {
                // This shouldn't happen since test-admin-token was handled above
                System.out.println("DEBUG: Unexpected test-admin-token in Firebase processing section");
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

        try {
            return userRepository.findByFirebaseUid(firebaseUid)
                    .map(user -> {
                        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

                        // Always add basic user role
                        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

                        // Check for admin privileges based on UserType
                        if ("ADMIN".equals(user.getUserType())) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                        }

                        // Add team roles if any (teams are now List<String>)
                        if (user.getTeams() != null) {
                            user.getTeams().stream()
                                    .map(teamName -> new SimpleGrantedAuthority("TEAM_" + teamName.toUpperCase()))
                                    .forEach(authorities::add);
                        }

                        return authorities;
                    })
                    .orElseGet(() -> Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
        } catch (Exception e) {
            logger.error("Error resolving authorities for user: " + firebaseUid, e);
            return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
        }
    }

    private boolean isPublicEndpoint(String requestPath, String method) {
        // Match public endpoints from WebSecurityConfig
        if ("GET".equalsIgnoreCase(method)) {
            // Public GET endpoints for events
            if (requestPath.equals("/api/events") ||
                requestPath.equals("/api/events/upcoming") ||
                requestPath.equals("/api/events/past")) {
                return true;
            }

            // Event detail endpoint pattern
            if (requestPath.startsWith("/api/events/") && !requestPath.contains("/participants") && !requestPath.contains("/volunteers")) {
                return true;
            }

            // Public announcement endpoints
            if (requestPath.equals("/api/announcements/recent") ||
                requestPath.equals("/api/announcements/active")) {
                return true;
            }
        }

        // Some auth endpoints are public, but not all
        if (requestPath.startsWith("/api/auth/")) {
            // sync-user and profile endpoints require authentication
            if (requestPath.equals("/api/auth/sync-user") ||
                requestPath.equals("/api/auth/profile") ||
                requestPath.startsWith("/api/auth/profile/")) {
                return false; // These require authentication
            }
            return true; // Other auth endpoints are public
        }

        // Email verification endpoint is public (users click links when not logged in)
        if ("POST".equalsIgnoreCase(method) && requestPath.equals("/api/users/verify-email")) {
            return true;
        }

        // H2 console for development
        if (requestPath.startsWith("/h2-console/")) {
            return true;
        }

        return false;
    }
}


