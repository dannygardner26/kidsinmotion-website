package com.example.restservice;

import com.example.restservice.payload.request.BroadcastMessageRequest;
import com.example.restservice.payload.response.BroadcastMessageResponse;
import com.example.restservice.service.MessagingService;
import com.example.restservice.service.MessagingRecipientService;
import com.example.restservice.service.RecipientCategory;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.Collections;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class MessagesController {

    @Autowired
    private MessagingService messagingService;


    @Autowired
    private MessagingRecipientService messagingRecipientService;

    @Value("${app.admin.emails:}")
    private String adminEmails;

    @PostMapping("/send/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable String userId,
            @RequestBody(required = false) Map<String, Object> messageData,
            HttpServletRequest request) {

        if (!isAdminRequest(request)) {
            return ResponseEntity.status(403)
                    .body(error("Admin access required to send inbox messages."));
        }

        try {
            Map<String, Object> enrichedMessage = messageData != null ? new HashMap<>(messageData) : new HashMap<>();
            enrichedMessage.putIfAbsent("userId", userId);
            enrichedMessage.putIfAbsent("status", "sent");
            enrichedMessage.putIfAbsent("from", resolveInitiatedBy(request));
            enrichedMessage.put("timestamp", LocalDateTime.now().toString());

            boolean stored = messagingService.sendInboxMessage(userId, enrichedMessage);

            Map<String, Object> response = new HashMap<>();
            response.put("success", stored);
            response.put("message", stored
                    ? "Message stored in recipient inbox"
                    : "Failed to persist message to inbox. Check server configuration.");
            response.put("userId", userId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(error("Failed to send message: " + e.getMessage()));
        }
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> broadcastMessages(@Valid @RequestBody BroadcastMessageRequest request,
                                               HttpServletRequest httpRequest) {
        if (!isAdminRequest(httpRequest)) {
            return ResponseEntity.status(403)
                    .body(error("Admin access required to broadcast messages."));
        }

        try {
            MessagingService.BroadcastResult result =
                    messagingService.broadcast(request, resolveInitiatedBy(httpRequest));
            return ResponseEntity.ok(BroadcastMessageResponse.from(result));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(error(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError()
                    .body(error("Failed to broadcast messages: " + ex.getMessage()));
        }
    }

    @PostMapping("/recipients/preview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> previewRecipients(@RequestBody Map<String, String> request,
                                                                HttpServletRequest httpRequest) {
        if (!isAdminRequest(httpRequest)) {
            return ResponseEntity.status(403)
                .body(error("Admin access required to preview recipients"));
        }

        try {
            String categoryString = request.get("category");
            if (!StringUtils.hasText(categoryString)) {
                return ResponseEntity.badRequest()
                    .body(error("Category is required"));
            }

            String eventId = null;
            RecipientCategory category = null;

            // Parse event-specific categories
            if (categoryString.startsWith("event-parents-")) {
                eventId = categoryString.substring("event-parents-".length());
                category = RecipientCategory.EVENT_PARENTS;
            } else if (categoryString.startsWith("event-volunteers-")) {
                eventId = categoryString.substring("event-volunteers-".length());
                category = RecipientCategory.EVENT_VOLUNTEERS;
            } else {
                // Parse regular categories
                category = RecipientCategory.fromId(categoryString).orElse(null);
                if (category == null) {
                    return ResponseEntity.badRequest()
                        .body(error("Invalid category: " + categoryString));
                }
            }

            Set<RecipientCategory> categories = Collections.singleton(category);
            MessagingRecipientService.RecipientResolutionResult result =
                messagingRecipientService.resolveRecipients(categories, Collections.emptyList(), eventId);

            Map<String, Object> response = new HashMap<>();
            response.put("recipients", result.getRecipients());
            response.put("count", result.getRecipients().size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(error("Failed to preview recipients: " + e.getMessage()));
        }
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or authentication.name == #userId")
    public ResponseEntity<Map<String, Object>> getMessages(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("messages", new Object[]{});
        response.put("userId", userId);
        return ResponseEntity.ok(response);
    }

    private boolean isAdminRequest(HttpServletRequest request) {
        String firebaseUid = (String) request.getAttribute("firebaseUid");
        String email = (String) request.getAttribute("firebaseEmail");

        if (StringUtils.hasText(email) && matchesAdminEmail(email)) {
            return true;
        }
        return matchesAdminEmail(email);
    }

    private boolean matchesAdminEmail(String email) {
        if (!StringUtils.hasText(email) || !StringUtils.hasText(adminEmails)) {
            return false;
        }
        String[] adminEmailList = adminEmails.split(",");
        for (String adminEmail : adminEmailList) {
            if (adminEmail != null && adminEmail.trim().equalsIgnoreCase(email.trim())) {
                return true;
            }
        }
        return false;
    }

    private String resolveInitiatedBy(HttpServletRequest request) {
        String email = (String) request.getAttribute("firebaseEmail");
        if (StringUtils.hasText(email)) {
            return email;
        }
        String firebaseUid = (String) request.getAttribute("firebaseUid");
        if (StringUtils.hasText(firebaseUid)) {
            return firebaseUid;
        }
        return "Kids in Motion Admin";
    }

    private Map<String, Object> error(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", message);
        return error;
    }
}
