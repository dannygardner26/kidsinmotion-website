package com.example.restservice.repository.firestore;

import com.example.restservice.model.firestore.ParticipantFirestore;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class ParticipantFirestoreRepository {

    private static final String COLLECTION_NAME = "participants";

    @Autowired
    private Firestore firestore;

    public ParticipantFirestore save(ParticipantFirestore participant) throws ExecutionException, InterruptedException {
        CollectionReference participants = firestore.collection(COLLECTION_NAME);

        if (participant.getId() == null || participant.getId().isEmpty()) {
            // Create new participant with auto-generated ID
            DocumentReference docRef = participants.document();
            participant.setId(docRef.getId());
            ApiFuture<WriteResult> result = docRef.set(participant.toMap());
            result.get(); // Wait for completion
        } else {
            // Update existing participant
            DocumentReference docRef = participants.document(participant.getId());
            ApiFuture<WriteResult> result = docRef.set(participant.toMap());
            result.get(); // Wait for completion
        }

        return participant;
    }

    public Optional<ParticipantFirestore> findById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            return Optional.of(ParticipantFirestore.fromMap(document.getData(), document.getId()));
        } else {
            return Optional.empty();
        }
    }

    public List<ParticipantFirestore> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .orderBy("registrationDate", Query.Direction.DESCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<ParticipantFirestore> participants = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            participants.add(ParticipantFirestore.fromMap(document.getData(), document.getId()));
        }

        return participants;
    }

    public List<ParticipantFirestore> findByEventId(String eventId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("eventId", eventId)
                .orderBy("childName", Query.Direction.ASCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<ParticipantFirestore> participants = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            participants.add(ParticipantFirestore.fromMap(document.getData(), document.getId()));
        }

        return participants;
    }

    public List<ParticipantFirestore> findByParentUserId(String parentUserId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("parentUserId", parentUserId)
                .orderBy("registrationDate", Query.Direction.DESCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<ParticipantFirestore> participants = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            participants.add(ParticipantFirestore.fromMap(document.getData(), document.getId()));
        }

        return participants;
    }

    public List<ParticipantFirestore> findByParentUserIdAndEventId(String parentUserId, String eventId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("parentUserId", parentUserId)
                .whereEqualTo("eventId", eventId)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<ParticipantFirestore> participants = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            participants.add(ParticipantFirestore.fromMap(document.getData(), document.getId()));
        }

        return participants;
    }

    public List<ParticipantFirestore> findByParentUserIdAndEventIdAndChildName(String parentUserId, String eventId, String childName) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("parentUserId", parentUserId)
                .whereEqualTo("eventId", eventId)
                .whereEqualTo("childName", childName)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<ParticipantFirestore> participants = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            participants.add(ParticipantFirestore.fromMap(document.getData(), document.getId()));
        }

        return participants;
    }

    public List<ParticipantFirestore> findByStatus(String status) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("status", status)
                .orderBy("registrationDate", Query.Direction.DESCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<ParticipantFirestore> participants = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            participants.add(ParticipantFirestore.fromMap(document.getData(), document.getId()));
        }

        return participants;
    }

    public List<ParticipantFirestore> findByEventIdAndStatus(String eventId, String status) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("eventId", eventId)
                .whereEqualTo("status", status)
                .orderBy("childName", Query.Direction.ASCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<ParticipantFirestore> participants = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            participants.add(ParticipantFirestore.fromMap(document.getData(), document.getId()));
        }

        return participants;
    }

    public void deleteById(String id) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> writeResult = firestore.collection(COLLECTION_NAME)
                .document(id)
                .delete();
        writeResult.get(); // Wait for completion
    }

    public void deleteByEventId(String eventId) throws ExecutionException, InterruptedException {
        // First get all participants for the event
        List<ParticipantFirestore> participants = findByEventId(eventId);

        // Delete each participant
        for (ParticipantFirestore participant : participants) {
            deleteById(participant.getId());
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