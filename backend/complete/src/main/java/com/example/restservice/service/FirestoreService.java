package com.example.restservice.service;

import com.example.restservice.model.VolunteerEmployee;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.WriteResult;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class FirestoreService {

    @Autowired(required = false)
    private Firestore firestore;

    @Value("${firebase.enabled:true}")
    private boolean firebaseEnabled;

    private static final String VOLUNTEER_APPLICATIONS_COLLECTION = "volunteerApplications";

    public void syncVolunteerApplication(VolunteerEmployee volunteerEmployee) {
        if (!firebaseEnabled || firestore == null) {
            return;
        }

        try {
            Map<String, Object> data = convertVolunteerToFirestoreData(volunteerEmployee);
            String docId = String.valueOf(volunteerEmployee.getId());

            DocumentReference docRef = firestore.collection(VOLUNTEER_APPLICATIONS_COLLECTION).document(docId);
            WriteResult result = docRef.set(data).get();

            System.out.println("Synced volunteer application to Firestore: " + docId + " at " + result.getUpdateTime());
        } catch (InterruptedException | ExecutionException e) {
            System.err.println("Failed to sync volunteer application to Firestore: " + e.getMessage());
        }
    }


    public boolean saveMessage(String userId, Map<String, Object> messageData) {
        if (!firebaseEnabled || firestore == null) {
            System.out.println("Firestore messaging disabled - skipping inbox write for user " + userId);
            return false;
        }

        if (userId == null || userId.trim().isEmpty()) {
            System.err.println("Cannot save message without a user identifier");
            return false;
        }

        try {
            Map<String, Object> payload = messageData != null ? new HashMap<>(messageData) : new HashMap<>();
            payload.putIfAbsent("userId", userId);
            payload.putIfAbsent("timestamp", java.time.LocalDateTime.now().toString());

            DocumentReference docRef = firestore.collection("users")
                .document(userId)
                .collection("messages")
                .add(payload).get();

            System.out.println("Saved message to Firestore user messages: users/" + userId + "/messages/" + docRef.getId());
            return true;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("Interrupted while saving message to Firestore: " + e.getMessage());
            return false;
        } catch (ExecutionException e) {
            System.err.println("Failed to save message to Firestore: " + e.getMessage());
            return false;
        }
    }

    public List<Map<String, Object>> getUserMessages(String userId) {
        if (!firebaseEnabled || firestore == null) {
            return new ArrayList<>();
        }

        if (userId == null || userId.trim().isEmpty()) {
            return new ArrayList<>();
        }

        try {
            CollectionReference messagesRef = firestore.collection("users")
                .document(userId)
                .collection("messages");

            List<QueryDocumentSnapshot> documents = messagesRef
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get()
                .get()
                .getDocuments();

            List<Map<String, Object>> messages = new ArrayList<>();
            for (QueryDocumentSnapshot doc : documents) {
                Map<String, Object> messageData = new HashMap<>(doc.getData());
                messageData.put("id", doc.getId());
                messages.add(messageData);
            }

            return messages;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("Interrupted while fetching messages from Firestore: " + e.getMessage());
            return new ArrayList<>();
        } catch (ExecutionException e) {
            System.err.println("Failed to fetch messages from Firestore: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public boolean markMessageAsRead(String userId, String messageId) {
        if (!firebaseEnabled || firestore == null) {
            return false;
        }

        if (userId == null || userId.trim().isEmpty() || messageId == null || messageId.trim().isEmpty()) {
            return false;
        }

        try {
            DocumentReference messageRef = firestore.collection("users")
                .document(userId)
                .collection("messages")
                .document(messageId);

            Map<String, Object> updates = new HashMap<>();
            updates.put("read", true);
            updates.put("readAt", java.time.Instant.now().toEpochMilli());

            messageRef.update(updates).get();
            return true;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("Interrupted while marking message as read: " + e.getMessage());
            return false;
        } catch (ExecutionException e) {
            System.err.println("Failed to mark message as read: " + e.getMessage());
            return false;
        }
    }

    private Map<String, Object> convertVolunteerToFirestoreData(VolunteerEmployee volunteer) {
        Map<String, Object> data = new HashMap<>();

        // Basic volunteer info
        data.put("id", volunteer.getId());
        data.put("grade", volunteer.getGrade());
        data.put("school", volunteer.getSchool());
        data.put("preferredContact", volunteer.getPreferredContact());
        data.put("motivation", volunteer.getMotivation());
        data.put("skills", volunteer.getSkills());
        data.put("status", volunteer.getStatus().toString());
        data.put("registrationDate", volunteer.getRegistrationDate());
        data.put("adminNotes", volunteer.getAdminNotes());
        data.put("approvedDate", volunteer.getApprovedDate());

        // User info
        if (volunteer.getUser() != null) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", volunteer.getUser().getId());
            userInfo.put("email", volunteer.getUser().getEmail());
            userInfo.put("firstName", volunteer.getUser().getFirstName());
            userInfo.put("lastName", volunteer.getUser().getLastName());
            userInfo.put("phoneNumber", volunteer.getUser().getPhoneNumber());
            userInfo.put("resumeLink", volunteer.getUser().getResumeLink());
            userInfo.put("portfolioLink", volunteer.getUser().getPortfolioLink());
            userInfo.put("firebaseUid", volunteer.getUser().getFirebaseUid());
            data.put("user", userInfo);
        }

        return data;
    }

}
