package com.example.restservice;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.*;

@CrossOrigin(origins = {"https://kidsinmotionpa.org", "https://www.kidsinmotionpa.org"})
@RestController
@RequestMapping("/api/children")
public class ChildrenController {

    // Get children for the current user
    @GetMapping
    public ResponseEntity<?> getChildren(HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "User not authenticated"));
            }

            // For now, return empty list - frontend will use Firestore fallback
            // This can be enhanced later to fetch from Firestore in the backend
            List<Map<String, Object>> children = new ArrayList<>();
            return ResponseEntity.ok(children);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to fetch children: " + e.getMessage()));
        }
    }

    // Create a new child
    @PostMapping
    public ResponseEntity<?> createChild(@RequestBody Map<String, Object> childData,
                                       HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "User not authenticated"));
            }

            // For now, return a success response - frontend will handle Firestore
            return ResponseEntity.ok(Map.of(
                "message", "Child creation handled by frontend Firestore integration",
                "success", true
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to create child: " + e.getMessage()));
        }
    }

    // Update a child
    @PutMapping("/{id}")
    public ResponseEntity<?> updateChild(@PathVariable String id,
                                       @RequestBody Map<String, Object> childData,
                                       HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "User not authenticated"));
            }

            // For now, return a success response - frontend will handle Firestore
            return ResponseEntity.ok(Map.of(
                "message", "Child update handled by frontend Firestore integration",
                "success", true
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to update child: " + e.getMessage()));
        }
    }

    // Delete a child
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteChild(@PathVariable String id, HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "User not authenticated"));
            }

            // For now, return a success response - frontend will handle Firestore
            return ResponseEntity.ok(Map.of(
                "message", "Child deletion handled by frontend Firestore integration",
                "success", true
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to delete child: " + e.getMessage()));
        }
    }

    // Get a specific child
    @GetMapping("/{id}")
    public ResponseEntity<?> getChild(@PathVariable String id, HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "User not authenticated"));
            }

            // For now, return empty response - frontend will use Firestore
            return ResponseEntity.ok(Map.of("message", "Use Firestore for child data"));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to fetch child: " + e.getMessage()));
        }
    }
}