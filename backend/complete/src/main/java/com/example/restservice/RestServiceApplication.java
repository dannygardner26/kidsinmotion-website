package com.example.restservice;

import com.example.restservice.model.Role;
import com.example.restservice.model.Role.ERole;
import com.example.restservice.model.User;
import com.example.restservice.repository.RoleRepository;
import com.example.restservice.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.HashSet;
import java.util.Set;

@SpringBootApplication
public class RestServiceApplication {

    private static final Logger log = LoggerFactory.getLogger(RestServiceApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(RestServiceApplication.class, args);
    }

    // This bean runs once on application startup
    @Bean
    CommandLineRunner initDatabase(RoleRepository roleRepository, UserRepository userRepository) {
        return args -> {
            // Check if roles exist, create if not
            if (roleRepository.findByName(ERole.ROLE_USER).isEmpty()) {
                log.info("Creating role: {}", ERole.ROLE_USER);
                roleRepository.save(new Role(ERole.ROLE_USER));
            }
            if (roleRepository.findByName(ERole.ROLE_ADMIN).isEmpty()) {
                log.info("Creating role: {}", ERole.ROLE_ADMIN);
                roleRepository.save(new Role(ERole.ROLE_ADMIN));
            }

            // Create test admin user for development
            String testAdminEmail = "kidsinmotion0@gmail.com";
            if (userRepository.findByEmail(testAdminEmail).isEmpty()) {
                log.info("Creating test admin user: {}", testAdminEmail);

                User testAdmin = new User(
                    "test-admin-uid", // Firebase UID (not used when Firebase is disabled)
                    "Kids in Motion",
                    "Admin",
                    testAdminEmail,
                    "555-123-4567"
                );

                // Assign both USER and ADMIN roles
                Set<Role> roles = new HashSet<>();
                Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                        .orElseThrow(() -> new RuntimeException("Error: User role not found."));
                Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                        .orElseThrow(() -> new RuntimeException("Error: Admin role not found."));
                roles.add(userRole);
                roles.add(adminRole);
                testAdmin.setRoles(roles);

                userRepository.save(testAdmin);
                log.info("Test admin user created successfully!");
            }

            log.info("Database initialization completed. Roles are ready.");
            log.info("Test admin: kidsinmotion0@gmail.com (for development)");
        };
    }
}
