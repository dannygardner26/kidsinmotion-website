package com.example.restservice.repository;

import com.example.restservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByFirebaseUid(String firebaseUid);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Boolean existsByFirebaseUid(String firebaseUid);
    Boolean existsByEmail(String email);
<<<<<<< HEAD
=======

    // Admin search methods
    List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String firstName, String lastName, String email);
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
}
