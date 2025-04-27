package com.example.restservice.repository;

import com.example.restservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Optional<User> findByUsername(String username); // Removed
    Optional<User> findByEmail(String email); // Add findByEmail for login

    // Boolean existsByUsername(String username); // Removed

    Boolean existsByEmail(String email);
}