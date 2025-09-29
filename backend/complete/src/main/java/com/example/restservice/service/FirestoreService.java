package com.example.restservice.service;

import com.example.restservice.model.VolunteerEmployee;
import com.example.restservice.model.TeamApplication;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.WriteResult;
import com.google.cloud.firestore.CollectionReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class FirestoreService {

    @Autowired(required = false)
    private Firestore firestore;

    @Value("${firebase.enabled:true}")
    private boolean firebaseEnabled;

    private static final String VOLUNTEER_APPLICATIONS_COLLECTION = "volunteerApplications";
    private static final String TEAM_APPLICATIONS_COLLECTION = "teamApplications";
    private static final String MESSAGES_COLLECTION = "messages";

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

    public void syncTeamApplication(TeamApplication teamApplication) {
        if (!firebaseEnabled || firestore == null) {
            return;
        }

        try {
            Map<String, Object> data = convertTeamApplicationToFirestoreData(teamApplication);
            String docId = String.valueOf(teamApplication.getId());

            DocumentReference docRef = firestore.collection(TEAM_APPLICATIONS_COLLECTION).document(docId);
            WriteResult result = docRef.set(data).get();

            System.out.println("Synced team application to Firestore: " + docId + " at " + result.getUpdateTime());
        } catch (InterruptedException | ExecutionException e) {
            System.err.println("Failed to sync team application to Firestore: " + e.getMessage());
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

            CollectionReference messagesRef = firestore.collection(MESSAGES_COLLECTION);
            DocumentReference docRef = messagesRef.add(payload).get();

            System.out.println("Saved message to Firestore: " + docRef.getId());
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

    private Map<String, Object> convertTeamApplicationToFirestoreData(TeamApplication teamApp) {
        Map<String, Object> data = new HashMap<>();

        data.put("id", teamApp.getId());
        data.put("teamName", teamApp.getTeamName());
        data.put("teamSpecificAnswer", teamApp.getTeamSpecificAnswer());
        data.put("status", teamApp.getStatus().toString());
        data.put("applicationDate", teamApp.getApplicationDate());
        data.put("adminNotes", teamApp.getAdminNotes());
        data.put("reviewedDate", teamApp.getReviewedDate());
        data.put("approvedDate", teamApp.getApprovedDate());
        data.put("assignedRole", teamApp.getAssignedRole());

        // Volunteer employee info
        if (teamApp.getVolunteerEmployee() != null) {
            data.put("volunteerEmployeeId", teamApp.getVolunteerEmployee().getId());

            // Include user info for easier querying
            if (teamApp.getVolunteerEmployee().getUser() != null) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("email", teamApp.getVolunteerEmployee().getUser().getEmail());
                userInfo.put("firstName", teamApp.getVolunteerEmployee().getUser().getFirstName());
                userInfo.put("lastName", teamApp.getVolunteerEmployee().getUser().getLastName());
                data.put("userInfo", userInfo);
            }
        }

        return data;
    }
}
