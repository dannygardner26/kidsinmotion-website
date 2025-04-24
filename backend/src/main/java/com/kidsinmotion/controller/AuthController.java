package com.kidsinmotion.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(/* @RequestBody LoginCredentials credentials */) {
        // TODO: Implement user login logic
        return ResponseEntity.ok("Login endpoint");
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(/* @RequestBody UserRegistrationDetails userDetails */) {
        // TODO: Implement user registration logic
        return ResponseEntity.ok("Register endpoint");
    }
}