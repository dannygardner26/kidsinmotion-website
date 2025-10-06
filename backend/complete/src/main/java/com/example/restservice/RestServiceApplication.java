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

@SpringBootApplication(exclude = {
    org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration.class,
    org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration.class
})
public class RestServiceApplication {

    private static final Logger log = LoggerFactory.getLogger(RestServiceApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(RestServiceApplication.class, args);
    }

    // Database initialization disabled - using Firestore instead
    // TODO: Migrate this initialization logic to Firestore
    /*
    @Bean
    CommandLineRunner initDatabase(RoleRepository roleRepository, UserRepository userRepository) {
        return args -> {
            log.info("Database initialization skipped - using Firestore");
        };
    }
    */
}
