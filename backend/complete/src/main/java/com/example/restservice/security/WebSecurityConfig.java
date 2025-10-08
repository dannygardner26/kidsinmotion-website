package com.example.restservice.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableMethodSecurity // Enables method-level security like @PreAuthorize
public class WebSecurityConfig {

    @Autowired
    private FirebaseTokenFilter firebaseTokenFilter;

    @Value("${cors.allowed.origins}") // Read allowed origins from properties
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow multiple comma-separated origins via configuration property
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .collect(Collectors.toList()));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true); // Important for cookies, authorization headers
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration); // Apply CORS to /api/** paths
        return source;
    }


    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable) // Disable CSRF as we are using Firebase tokens
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Enable CORS using the bean
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Stateless session
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(request -> "OPTIONS".equals(request.getMethod())).permitAll() // Allow all OPTIONS requests for CORS preflight
                .requestMatchers("/api/auth/**").permitAll() // Allow auth endpoints (for user profile sync)
                .requestMatchers("/h2-console/**").permitAll() // Allow H2 console access (for dev)
                .requestMatchers("/api/events", "/api/events/upcoming", "/api/events/past").permitAll() // Allow public event viewing
                .requestMatchers("/api/events/{id}").permitAll() // Allow public event detail viewing
                .requestMatchers("/api/announcements/recent", "/api/announcements/active").permitAll() // Allow public announcements
                // Admin endpoints (will implement role checking later)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated() // All other requests require authentication
            );

        // Fix H2 console frame options issue
        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()));

        // Add Firebase token filter
        http.addFilterBefore(firebaseTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

