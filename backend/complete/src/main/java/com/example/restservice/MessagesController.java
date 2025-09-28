package com.example.restservice;

import com.example.restservice.service.FirestoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class MessagesController {

    @Autowired
    private FirestoreService firestoreService;

    @PostMapping("/send/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable String userId,
            @RequestBody Map<String, Object> messageData) {

        try {
            // Add metadata to the message
            Map<String, Object> enrichedMessage = new HashMap<>(messageData);
            enrichedMessage.put("userId", userId);
            enrichedMessage.put("timestamp", LocalDateTime.now().toString());
            enrichedMessage.put("status", "sent");

            // Save to Firestore
            firestoreService.saveMessage(userId, enrichedMessage);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Message sent successfully");
            response.put("userId", userId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to send message: " + e.getMessage());

            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or authentication.name == #userId")
    public ResponseEntity<Map<String, Object>> getMessages(@PathVariable String userId) {
        // This would retrieve messages from Firestore - implement as needed
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("messages", new Object[]{});
        response.put("userId", userId);

        return ResponseEntity.ok(response);
    }
}