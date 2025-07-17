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
    CommandLineRunner initDatabase(RoleRepository roleRepository) {
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
            
            log.info("Database initialization completed. Roles are ready.");
            log.info("Admin users will be created automatically when they first sign in via Firebase.");
        };
    }
}
