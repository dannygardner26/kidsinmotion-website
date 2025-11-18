package com.example.restservice;

import com.example.restservice.payload.request.BroadcastMessageRequest;
import com.example.restservice.payload.response.BroadcastMessageResponse;
import com.example.restservice.service.MessagingService;
import com.example.restservice.service.MessagingRecipientService;
import com.example.restservice.service.RecipientCategory;
import com.example.restservice.model.firestore.BroadcastHistoryFirestore;
import com.example.restservice.model.firestore.UserFirestore;
import com.example.restservice.repository.firestore.BroadcastHistoryFirestoreRepository;
import com.example.restservice.repository.firestore.UserFirestoreRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.concurrent.ExecutionException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class MessagesController {

    @Autowired
    private MessagingService messagingService;

    @Autowired
    private MessagingRecipientService messagingRecipientService;

    @Autowired
    private BroadcastHistoryFirestoreRepository broadcastHistoryRepository;

    @Autowired
    private UserFirestoreRepository userFirestoreRepository;

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
            String initiatorFirebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            MessagingService.BroadcastResult result =
                    messagingService.broadcast(request, resolveInitiatedBy(httpRequest));

            // Save broadcast history
            saveBroadcastHistory(request, result, initiatorFirebaseUid);

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

    /**
     * Save broadcast history to database
     */
    private void saveBroadcastHistory(BroadcastMessageRequest request, MessagingService.BroadcastResult result, String initiatorFirebaseUid) {
        try {
            BroadcastHistoryFirestore history = new BroadcastHistoryFirestore();
            history.setInitiatorFirebaseUid(initiatorFirebaseUid);

            // Get initiator name
            try {
                Optional<UserFirestore> initiatorOpt = userFirestoreRepository.findByFirebaseUid(initiatorFirebaseUid);
                if (initiatorOpt.isPresent()) {
                    UserFirestore initiator = initiatorOpt.get();
                    history.setInitiatorName(initiator.getFirstName() + " " + initiator.getLastName());
                } else {
                    history.setInitiatorName("Kids in Motion Admin");
                }
            } catch (Exception e) {
                history.setInitiatorName("Kids in Motion Admin");
            }

            history.setSubject(request.getSubject());
            history.setMessage(request.getMessage());
            history.setRequestedChannels(result.getRequestedChannels());
            history.setCategories(request.getCategories());
            history.setDirectEmails(request.getDirectEmails());
            history.setDirectPhoneNumbers(request.getDirectPhoneNumbers());

            history.setTotalRecipients(result.getTotalRecipients());
            history.setInboxSent(result.getInboxSent());
            history.setInboxSkipped(result.getInboxSkipped());
            history.setEmailSent(result.getEmailSent());
            history.setEmailSkipped(result.getEmailSkipped());
            history.setSmsSent(result.getSmsSent());
            history.setSmsSkipped(result.getSmsSkipped());

            history.setCategoryCounts(result.getCategoryCounts());
            history.setWarnings(result.getGlobalWarnings());

            // Convert failures to serializable format
            List<Map<String, Object>> failuresList = result.getFailures().stream()
                .map(failure -> {
                    Map<String, Object> failureMap = new HashMap<>();
                    failureMap.put("channel", failure.getChannel());
                    failureMap.put("reason", failure.getReason());
                    failureMap.put("recipient", failure.getRecipient());
                    return failureMap;
                })
                .collect(Collectors.toList());
            history.setFailures(failuresList);

            broadcastHistoryRepository.save(history);
        } catch (Exception e) {
            // Don't fail the broadcast if history saving fails
            System.err.println("Failed to save broadcast history: " + e.getMessage());
        }
    }

    /**
     * Get broadcast history for admins
     */
    @GetMapping("/broadcast-history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getBroadcastHistory(HttpServletRequest request) {
        if (!isAdminRequest(request)) {
            return ResponseEntity.status(403)
                    .body(error("Admin access required to view broadcast history."));
        }

        try {
            List<BroadcastHistoryFirestore> history = broadcastHistoryRepository.findRecent(50);

            List<Map<String, Object>> response = history.stream()
                .map(broadcast -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", broadcast.getId());
                    item.put("subject", broadcast.getSubject());
                    item.put("message", broadcast.getMessage());
                    item.put("initiatorName", broadcast.getInitiatorName());
                    item.put("sentTimestamp", broadcast.getSentTimestamp());
                    item.put("totalRecipients", broadcast.getTotalRecipients());
                    item.put("emailSent", broadcast.getEmailSent());
                    item.put("smsSent", broadcast.getSmsSent());
                    item.put("inboxSent", broadcast.getInboxSent());
                    item.put("requestedChannels", broadcast.getRequestedChannels());
                    item.put("warnings", broadcast.getWarnings() != null ? broadcast.getWarnings().size() : 0);
                    item.put("failures", broadcast.getFailures() != null ? broadcast.getFailures().size() : 0);
                    return item;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("history", response));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(error("Failed to retrieve broadcast history: " + e.getMessage()));
        }
    }

    /**
     * Get detailed broadcast receipt for download
     */
    @GetMapping("/broadcast-history/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getBroadcastDetails(@PathVariable String id, HttpServletRequest request) {
        if (!isAdminRequest(request)) {
            return ResponseEntity.status(403)
                    .body(error("Admin access required to view broadcast details."));
        }

        try {
            Optional<BroadcastHistoryFirestore> historyOpt = broadcastHistoryRepository.findById(id);
            if (!historyOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            BroadcastHistoryFirestore broadcast = historyOpt.get();
            Map<String, Object> details = new HashMap<>();
            details.put("id", broadcast.getId());
            details.put("subject", broadcast.getSubject());
            details.put("message", broadcast.getMessage());
            details.put("initiatorName", broadcast.getInitiatorName());
            details.put("sentTimestamp", broadcast.getSentTimestamp());
            details.put("requestedChannels", broadcast.getRequestedChannels());
            details.put("categories", broadcast.getCategories());
            details.put("directEmails", broadcast.getDirectEmails());
            details.put("directPhoneNumbers", broadcast.getDirectPhoneNumbers());
            details.put("totalRecipients", broadcast.getTotalRecipients());
            details.put("inboxSent", broadcast.getInboxSent());
            details.put("inboxSkipped", broadcast.getInboxSkipped());
            details.put("emailSent", broadcast.getEmailSent());
            details.put("emailSkipped", broadcast.getEmailSkipped());
            details.put("smsSent", broadcast.getSmsSent());
            details.put("smsSkipped", broadcast.getSmsSkipped());
            details.put("categoryCounts", broadcast.getCategoryCounts());
            details.put("warnings", broadcast.getWarnings());
            details.put("failures", broadcast.getFailures());

            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(error("Failed to retrieve broadcast details: " + e.getMessage()));
        }
    }

    /**
     * Download broadcast receipt as CSV file
     */
    @GetMapping("/broadcast-history/{id}/download")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> downloadBroadcastReceipt(@PathVariable String id, HttpServletRequest request) {
        if (!isAdminRequest(request)) {
            return ResponseEntity.status(403)
                    .body(error("Admin access required to download broadcast receipt."));
        }

        try {
            Optional<BroadcastHistoryFirestore> historyOpt = broadcastHistoryRepository.findById(id);
            if (!historyOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            BroadcastHistoryFirestore broadcast = historyOpt.get();

            // Generate CSV content
            StringBuilder csv = new StringBuilder();
            csv.append("Kids in Motion - Broadcast Receipt\n\n");
            csv.append("Subject:,").append(escapeCsv(broadcast.getSubject())).append("\n");
            csv.append("Sent By:,").append(escapeCsv(broadcast.getInitiatorName())).append("\n");
            csv.append("Sent Date:,").append(formatTimestamp(broadcast.getSentTimestamp())).append("\n");
            csv.append("Channels:,").append(String.join(", ", broadcast.getRequestedChannels())).append("\n");
            csv.append("Total Recipients:,").append(broadcast.getTotalRecipients()).append("\n\n");

            csv.append("Delivery Summary\n");
            csv.append("Channel,Sent,Skipped\n");
            csv.append("Inbox,").append(broadcast.getInboxSent()).append(",").append(broadcast.getInboxSkipped()).append("\n");
            csv.append("Email,").append(broadcast.getEmailSent()).append(",").append(broadcast.getEmailSkipped()).append("\n");
            csv.append("SMS,").append(broadcast.getSmsSent()).append(",").append(broadcast.getSmsSkipped()).append("\n\n");

            if (broadcast.getCategoryCounts() != null && !broadcast.getCategoryCounts().isEmpty()) {
                csv.append("Recipients by Category\n");
                csv.append("Category,Count\n");
                broadcast.getCategoryCounts().forEach((category, count) ->
                    csv.append(escapeCsv(category)).append(",").append(count).append("\n"));
                csv.append("\n");
            }

            if (broadcast.getWarnings() != null && !broadcast.getWarnings().isEmpty()) {
                csv.append("Warnings\n");
                broadcast.getWarnings().forEach(warning ->
                    csv.append(escapeCsv(warning)).append("\n"));
                csv.append("\n");
            }

            if (broadcast.getFailures() != null && !broadcast.getFailures().isEmpty()) {
                csv.append("Delivery Failures\n");
                csv.append("Channel,Reason,Recipient Info\n");
                broadcast.getFailures().forEach(failure -> {
                    String recipientInfo = failure.containsKey("recipient") ?
                        failure.get("recipient").toString() : "Unknown";
                    csv.append(escapeCsv((String) failure.get("channel")))
                       .append(",").append(escapeCsv((String) failure.get("reason")))
                       .append(",").append(escapeCsv(recipientInfo)).append("\n");
                });
            }

            // Set headers for file download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            String filename = "broadcast-receipt-" + id + "-" +
                DateTimeFormatter.ofPattern("yyyy-MM-dd").format(LocalDateTime.now()) + ".csv";
            headers.setContentDispositionFormData("attachment", filename);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(csv.toString());

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(error("Failed to generate broadcast receipt: " + e.getMessage()));
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String formatTimestamp(Long timestamp) {
        if (timestamp == null) return "";
        return DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .format(LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(timestamp),
                        java.time.ZoneId.systemDefault()));
    }
}
