package com.example.restservice.repository.firestore;

import com.example.restservice.model.firestore.VolunteerFirestore;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class VolunteerFirestoreRepository {

    private static final String COLLECTION_NAME = "volunteers";

    @Autowired
    private Firestore firestore;

    public VolunteerFirestore save(VolunteerFirestore volunteer) throws ExecutionException, InterruptedException {
        CollectionReference volunteers = firestore.collection(COLLECTION_NAME);

        if (volunteer.getId() == null || volunteer.getId().isEmpty()) {
            // Create new volunteer with auto-generated ID
            DocumentReference docRef = volunteers.document();
            volunteer.setId(docRef.getId());
            ApiFuture<WriteResult> result = docRef.set(volunteer.toMap());
            result.get(); // Wait for completion
        } else {
            // Update existing volunteer
            DocumentReference docRef = volunteers.document(volunteer.getId());
            ApiFuture<WriteResult> result = docRef.set(volunteer.toMap());
            result.get(); // Wait for completion
        }

        return volunteer;
    }

    public Optional<VolunteerFirestore> findById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            return Optional.of(VolunteerFirestore.fromMap(document.getData(), document.getId()));
        } else {
            return Optional.empty();
        }
    }

    public List<VolunteerFirestore> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .orderBy("signupDate", Query.Direction.DESCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<VolunteerFirestore> volunteers = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            volunteers.add(VolunteerFirestore.fromMap(document.getData(), document.getId()));
        }

        return volunteers;
    }

    public List<VolunteerFirestore> findByEventId(String eventId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("eventId", eventId)
                .orderBy("userLastName", Query.Direction.ASCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<VolunteerFirestore> volunteers = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            volunteers.add(VolunteerFirestore.fromMap(document.getData(), document.getId()));
        }

        return volunteers;
    }

    public List<VolunteerFirestore> findByUserId(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("userId", userId)
                .orderBy("signupDate", Query.Direction.DESCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<VolunteerFirestore> volunteers = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            volunteers.add(VolunteerFirestore.fromMap(document.getData(), document.getId()));
        }

        return volunteers;
    }

    public List<VolunteerFirestore> findByUserIdAndEventId(String userId, String eventId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("userId", userId)
                .whereEqualTo("eventId", eventId)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<VolunteerFirestore> volunteers = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            volunteers.add(VolunteerFirestore.fromMap(document.getData(), document.getId()));
        }

        return volunteers;
    }

    public List<VolunteerFirestore> findByStatus(String status) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("status", status)
                .orderBy("signupDate", Query.Direction.DESCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<VolunteerFirestore> volunteers = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            volunteers.add(VolunteerFirestore.fromMap(document.getData(), document.getId()));
        }

        return volunteers;
    }

    public List<VolunteerFirestore> findByEventIdAndStatus(String eventId, String status) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("eventId", eventId)
                .whereEqualTo("status", status)
                .orderBy("userLastName", Query.Direction.ASCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<VolunteerFirestore> volunteers = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            volunteers.add(VolunteerFirestore.fromMap(document.getData(), document.getId()));
        }

        return volunteers;
    }

    public void deleteById(String id) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> writeResult = firestore.collection(COLLECTION_NAME)
                .document(id)
                .delete();
        writeResult.get(); // Wait for completion
    }

    public void deleteByEventId(String eventId) throws ExecutionException, InterruptedException {
        // First get all volunteers for the event
        List<VolunteerFirestore> volunteers = findByEventId(eventId);

        // Delete each volunteer
        for (VolunteerFirestore volunteer : volunteers) {
            deleteById(volunteer.getId());
        }
    }

    public void deleteByUserId(String userId) throws ExecutionException, InterruptedException {
        // First get all volunteers for the user
        List<VolunteerFirestore> volunteers = findByUserId(userId);

        // Delete each volunteer
        for (VolunteerFirestore volunteer : volunteers) {
            deleteById(volunteer.getId());
        }
    }

    public boolean existsById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        return document.exists();
    }

    public long count() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME).get();
        QuerySnapshot querySnapshot = query.get();
        return querySnapshot.size();
    }

    public long countByEventId(String eventId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("eventId", eventId)
                .get();
        QuerySnapshot querySnapshot = query.get();
        return querySnapshot.size();
    }
}