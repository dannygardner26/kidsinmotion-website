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
import org.springframework.security.crypto.password.PasswordEncoder;

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
    CommandLineRunner initDatabase(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Check if roles exist, create if not
            if (roleRepository.findByName(ERole.ROLE_USER).isEmpty()) {
                log.info("Creating role: {}", ERole.ROLE_USER);
                roleRepository.save(new Role(ERole.ROLE_USER));
            }
            Role adminRole = null;
            if (roleRepository.findByName(ERole.ROLE_ADMIN).isEmpty()) {
                log.info("Creating role: {}", ERole.ROLE_ADMIN);
                adminRole = roleRepository.save(new Role(ERole.ROLE_ADMIN));
            } else {
                adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                        .orElseThrow(() -> new RuntimeException("Error: Role ADMIN not found even though it should exist."));
            }

            // Define admin details
            String adminEmail = "admin@kidsinmotion.org";
            String adminPassword = "password";
            String adminFirstName = "Admin";
            String adminLastName = "User";
            String adminPhoneNumber = "000-000-0000"; // Placeholder phone number

            // Check if admin user exists by email, create if not
            if (!userRepository.existsByEmail(adminEmail)) {
                log.info("Creating default admin user with email: {}", adminEmail);
                User adminUser = new User();
                adminUser.setEmail(adminEmail);
                adminUser.setPassword(passwordEncoder.encode(adminPassword)); // Encode the default password
                adminUser.setFirstName(adminFirstName);
                adminUser.setLastName(adminLastName);
                adminUser.setPhoneNumber(adminPhoneNumber);

                Set<Role> roles = new HashSet<>();
                roles.add(adminRole);
                adminUser.setRoles(roles);

                userRepository.save(adminUser);
                log.info("Default admin user created successfully.");
            } else {
                log.info("Admin user with email '{}' already exists.", adminEmail);
            }
        };
    }
}
