package com.example.restservice;

import com.example.restservice.service.FirestoreService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = {"https://kidsinmotionpa.org", "https://www.kidsinmotionpa.org"})
@RestController
@RequestMapping("/api/messages")
public class ActiveMessagesController {

    @Autowired
    private FirestoreService firestoreService;

    @GetMapping("/inbox")
    public ResponseEntity<?> getInboxMessages(HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "User not authenticated"));
            }

            // Fetch messages from Firestore
            try {
                List<Map<String, Object>> messages = firestoreService.getUserMessages(firebaseUid);
                int unreadCount = (int) messages.stream()
                    .filter(msg -> !Boolean.TRUE.equals(msg.get("read")))
                    .count();

                Map<String, Object> response = new HashMap<>();
                response.put("messages", messages);
                response.put("unreadCount", unreadCount);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                // If Firestore is not available, return empty inbox
                System.err.println("Failed to fetch messages from Firestore: " + e.getMessage());
                Map<String, Object> response = new HashMap<>();
                response.put("messages", new ArrayList<>());
                response.put("unreadCount", 0);
                return ResponseEntity.ok(response);
            }

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to fetch inbox: " + e.getMessage()));
        }
    }

    @PutMapping("/inbox/{messageId}/read")
    public ResponseEntity<?> markMessageAsRead(@PathVariable String messageId, HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "User not authenticated"));
            }

            boolean updated = firestoreService.markMessageAsRead(firebaseUid, messageId);
            
            if (updated) {
                return ResponseEntity.ok(Map.of("success", true));
            } else {
                return ResponseEntity.status(404)
                    .body(Map.of("error", "Message not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to mark message as read: " + e.getMessage()));
        }
    }

}