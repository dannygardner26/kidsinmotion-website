package com.example.restservice;

import com.example.restservice.model.firestore.ConnectionFirestore;
import com.example.restservice.model.firestore.UserFirestore;
import com.example.restservice.repository.firestore.ConnectionFirestoreRepository;
import com.example.restservice.repository.firestore.UserFirestoreRepository;
import com.example.restservice.service.MessagingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/connections")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ConnectionController {

    @Autowired
    private ConnectionFirestoreRepository connectionRepository;

    @Autowired
    private UserFirestoreRepository userRepository;

    @Autowired
    private MessagingService messagingService;

    @PostMapping("/request")
    public ResponseEntity<?> sendConnectionRequest(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }

            String receiverUsername = request.get("receiverUsername");
            if (receiverUsername == null || receiverUsername.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Receiver username is required"));
            }

            // Look up receiver by username
            Optional<UserFirestore> receiverOpt = userRepository.findByUsernameLowercase(receiverUsername.toLowerCase());
            if (!receiverOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            UserFirestore receiver = receiverOpt.get();
            if (firebaseUid.equals(receiver.getFirebaseUid())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot send connection request to yourself"));
            }

            // Check if connection already exists
            Optional<ConnectionFirestore> existingConnection = connectionRepository.findByRequesterIdAndReceiverId(firebaseUid, receiver.getFirebaseUid());
            if (existingConnection.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Connection request already exists"));
            }

            // Check reverse connection
            Optional<ConnectionFirestore> reverseConnection = connectionRepository.findByRequesterIdAndReceiverId(receiver.getFirebaseUid(), firebaseUid);
            if (reverseConnection.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Connection already exists or pending"));
            }

            // Check pending request limit
            long pendingCount = connectionRepository.countPendingRequestsByRequesterId(firebaseUid);
            if (pendingCount >= 20) {
                return ResponseEntity.badRequest().body(Map.of("error", "You have reached the maximum number of pending connection requests (20)"));
            }

            // Create new connection
            ConnectionFirestore connection = new ConnectionFirestore(firebaseUid, receiver.getFirebaseUid());
            connection = connectionRepository.save(connection);

            // Send inbox message to receiver
            Optional<UserFirestore> requesterOpt = userRepository.findByFirebaseUid(firebaseUid);
            if (requesterOpt.isPresent()) {
                UserFirestore requester = requesterOpt.get();
                String message = requester.getFullName() + " sent you a connection request.";

                // Note: MessagingService would need to be updated to support inbox messages
                // This is a placeholder for the inbox notification functionality
                try {
                    // messagingService.sendInboxMessage(receiver.getFirebaseUid(), message, "CONNECTION_REQUEST");
                } catch (Exception e) {
                    // Log error but don't fail the request
                    System.err.println("Failed to send inbox notification: " + e.getMessage());
                }
            }

            return ResponseEntity.ok(connection);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send connection request"));
        }
    }

    @PutMapping("/{connectionId}/accept")
    public ResponseEntity<?> acceptConnectionRequest(@PathVariable String connectionId, HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }

            Optional<ConnectionFirestore> connectionOpt = connectionRepository.findById(connectionId);
            if (!connectionOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Connection not found"));
            }

            ConnectionFirestore connection = connectionOpt.get();
            if (!firebaseUid.equals(connection.getReceiverId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only accept your own connection requests"));
            }

            if (!"PENDING".equals(connection.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Connection request is not pending"));
            }

            // Update status to accepted
            connection = connectionRepository.updateStatus(connectionId, "ACCEPTED");

            // Send inbox message to requester
            Optional<UserFirestore> receiverOpt = userRepository.findByFirebaseUid(firebaseUid);
            if (receiverOpt.isPresent()) {
                UserFirestore receiver = receiverOpt.get();
                String message = receiver.getFullName() + " accepted your connection request.";

                try {
                    // messagingService.sendInboxMessage(connection.getRequesterId(), message, "CONNECTION_ACCEPTED");
                } catch (Exception e) {
                    System.err.println("Failed to send inbox notification: " + e.getMessage());
                }
            }

            return ResponseEntity.ok(connection);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to accept connection request"));
        }
    }

    @PutMapping("/{connectionId}/reject")
    public ResponseEntity<?> rejectConnectionRequest(@PathVariable String connectionId, HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }

            Optional<ConnectionFirestore> connectionOpt = connectionRepository.findById(connectionId);
            if (!connectionOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Connection not found"));
            }

            ConnectionFirestore connection = connectionOpt.get();
            if (!firebaseUid.equals(connection.getReceiverId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only reject your own connection requests"));
            }

            if (!"PENDING".equals(connection.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Connection request is not pending"));
            }

            // Update status to rejected (silent, no notification)
            connection = connectionRepository.updateStatus(connectionId, "REJECTED");

            return ResponseEntity.ok(Map.of("message", "Connection request rejected"));

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to reject connection request"));
        }
    }

    @DeleteMapping("/{connectionId}")
    public ResponseEntity<?> removeConnection(@PathVariable String connectionId, HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }

            Optional<ConnectionFirestore> connectionOpt = connectionRepository.findById(connectionId);
            if (!connectionOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Connection not found"));
            }

            ConnectionFirestore connection = connectionOpt.get();
            if (!firebaseUid.equals(connection.getRequesterId()) && !firebaseUid.equals(connection.getReceiverId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only remove your own connections"));
            }

            connectionRepository.deleteById(connectionId);

            return ResponseEntity.ok(Map.of("message", "Connection removed successfully"));

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to remove connection"));
        }
    }

    @GetMapping("/my-connections")
    public ResponseEntity<?> getMyConnections(HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }

            List<ConnectionFirestore> connections = connectionRepository.findAcceptedConnectionsForUser(firebaseUid);
            List<Map<String, Object>> connectionsWithProfiles = new ArrayList<>();

            for (ConnectionFirestore connection : connections) {
                // Get the other user's profile
                String otherUserId = firebaseUid.equals(connection.getRequesterId()) ?
                    connection.getReceiverId() : connection.getRequesterId();

                Optional<UserFirestore> otherUserOpt = userRepository.findByFirebaseUid(otherUserId);
                if (otherUserOpt.isPresent()) {
                    UserFirestore otherUser = otherUserOpt.get();

                    Map<String, Object> connectionData = new HashMap<>();
                    connectionData.put("id", connection.getId());
                    connectionData.put("status", connection.getStatus());
                    connectionData.put("acceptedAt", connection.getAcceptedAt());

                    // Filter user data based on privacy settings
                    Map<String, Object> userData = new HashMap<>();
                    userData.put("firebaseUid", otherUser.getFirebaseUid());
                    userData.put("firstName", otherUser.getFirstName());
                    userData.put("lastName", otherUser.getLastName());
                    userData.put("username", otherUser.getUsername());
                    userData.put("profilePictureUrl", otherUser.getProfilePictureUrl());
                    userData.put("profileColor", otherUser.getProfileColor());
                    userData.put("userType", otherUser.getUserType());

                    // Include contact info based on privacy settings
                    if (otherUser.getConnectionPrivacySettings() != null) {
                        Map<String, Object> privacy = otherUser.getConnectionPrivacySettings();
                        if (Boolean.TRUE.equals(privacy.get("shareEmail"))) {
                            userData.put("email", otherUser.getEmail());
                        }
                        if (Boolean.TRUE.equals(privacy.get("sharePhone"))) {
                            userData.put("phoneNumber", otherUser.getPhoneNumber());
                        }
                    }

                    connectionData.put("user", userData);
                    connectionsWithProfiles.add(connectionData);
                }
            }

            return ResponseEntity.ok(connectionsWithProfiles);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get connections"));
        }
    }

    @GetMapping("/pending-requests")
    public ResponseEntity<?> getPendingRequests(HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }

            List<ConnectionFirestore> receivedRequests = connectionRepository.findPendingRequestsForUser(firebaseUid);
            List<ConnectionFirestore> sentRequests = connectionRepository.findSentRequestsForUser(firebaseUid);

            List<Map<String, Object>> receivedWithProfiles = new ArrayList<>();
            List<Map<String, Object>> sentWithProfiles = new ArrayList<>();

            // Process received requests
            for (ConnectionFirestore connection : receivedRequests) {
                Optional<UserFirestore> requesterOpt = userRepository.findByFirebaseUid(connection.getRequesterId());
                if (requesterOpt.isPresent()) {
                    UserFirestore requester = requesterOpt.get();
                    Map<String, Object> requestData = new HashMap<>();
                    requestData.put("id", connection.getId());
                    requestData.put("requestedAt", connection.getRequestedAt());

                    Map<String, Object> userData = new HashMap<>();
                    userData.put("firebaseUid", requester.getFirebaseUid());
                    userData.put("firstName", requester.getFirstName());
                    userData.put("lastName", requester.getLastName());
                    userData.put("username", requester.getUsername());
                    userData.put("profilePictureUrl", requester.getProfilePictureUrl());
                    userData.put("profileColor", requester.getProfileColor());

                    requestData.put("user", userData);
                    receivedWithProfiles.add(requestData);
                }
            }

            // Process sent requests
            for (ConnectionFirestore connection : sentRequests) {
                Optional<UserFirestore> receiverOpt = userRepository.findByFirebaseUid(connection.getReceiverId());
                if (receiverOpt.isPresent()) {
                    UserFirestore receiver = receiverOpt.get();
                    Map<String, Object> requestData = new HashMap<>();
                    requestData.put("id", connection.getId());
                    requestData.put("requestedAt", connection.getRequestedAt());

                    Map<String, Object> userData = new HashMap<>();
                    userData.put("firebaseUid", receiver.getFirebaseUid());
                    userData.put("firstName", receiver.getFirstName());
                    userData.put("lastName", receiver.getLastName());
                    userData.put("username", receiver.getUsername());
                    userData.put("profilePictureUrl", receiver.getProfilePictureUrl());
                    userData.put("profileColor", receiver.getProfileColor());

                    requestData.put("user", userData);
                    sentWithProfiles.add(requestData);
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("received", receivedWithProfiles);
            result.put("sent", sentWithProfiles);

            return ResponseEntity.ok(result);

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get pending requests"));
        }
    }

    @GetMapping("/status/{username}")
    public ResponseEntity<?> getConnectionStatus(@PathVariable String username, HttpServletRequest httpRequest) {
        try {
            String firebaseUid = (String) httpRequest.getAttribute("firebaseUid");
            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
            }

            // Look up user by username
            Optional<UserFirestore> targetUserOpt = userRepository.findByUsernameLowercase(username.toLowerCase());
            if (!targetUserOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }

            UserFirestore targetUser = targetUserOpt.get();
            if (firebaseUid.equals(targetUser.getFirebaseUid())) {
                return ResponseEntity.ok(Map.of("status", "SELF"));
            }

            // Check connection from current user to target user
            Optional<ConnectionFirestore> connection1 = connectionRepository.findByRequesterIdAndReceiverId(firebaseUid, targetUser.getFirebaseUid());
            if (connection1.isPresent()) {
                String status = connection1.get().getStatus();
                if ("PENDING".equals(status)) {
                    return ResponseEntity.ok(Map.of("status", "PENDING_SENT", "connectionId", connection1.get().getId()));
                } else if ("ACCEPTED".equals(status)) {
                    return ResponseEntity.ok(Map.of("status", "ACCEPTED", "connectionId", connection1.get().getId()));
                }
            }

            // Check connection from target user to current user
            Optional<ConnectionFirestore> connection2 = connectionRepository.findByRequesterIdAndReceiverId(targetUser.getFirebaseUid(), firebaseUid);
            if (connection2.isPresent()) {
                String status = connection2.get().getStatus();
                if ("PENDING".equals(status)) {
                    return ResponseEntity.ok(Map.of("status", "PENDING_RECEIVED", "connectionId", connection2.get().getId()));
                } else if ("ACCEPTED".equals(status)) {
                    return ResponseEntity.ok(Map.of("status", "ACCEPTED", "connectionId", connection2.get().getId()));
                }
            }

            return ResponseEntity.ok(Map.of("status", "NONE"));

        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get connection status"));
        }
    }
}