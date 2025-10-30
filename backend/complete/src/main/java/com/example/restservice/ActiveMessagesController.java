package com.example.restservice;

import com.example.restservice.repository.firestore.UserFirestoreRepository;
import com.example.restservice.model.firestore.UserFirestore;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = {"https://kidsinmotionpa.org", "https://www.kidsinmotionpa.org"})
@RestController
@RequestMapping("/api/messages")
public class ActiveMessagesController {

    @Autowired
    private UserFirestoreRepository userRepository;


    @GetMapping("/inbox")
    public ResponseEntity<?> getInboxMessages(HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "User not authenticated"));
            }

            // Return empty inbox for now - this would normally fetch user's messages
            Map<String, Object> response = new HashMap<>();
            response.put("messages", new ArrayList<>());
            response.put("unreadCount", 0);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Failed to fetch inbox: " + e.getMessage()));
        }
    }

}