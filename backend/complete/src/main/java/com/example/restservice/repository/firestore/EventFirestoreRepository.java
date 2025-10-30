package com.example.restservice.repository.firestore;

import com.example.restservice.model.firestore.EventFirestore;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class EventFirestoreRepository {

    private static final String COLLECTION_NAME = "events";

    @Autowired
    private Firestore firestore;

    public EventFirestore save(EventFirestore event) throws ExecutionException, InterruptedException {
        CollectionReference events = firestore.collection(COLLECTION_NAME);

        if (event.getId() == null || event.getId().isEmpty()) {
            // Create new event with auto-generated ID
            DocumentReference docRef = events.document();
            event.setId(docRef.getId());
            ApiFuture<WriteResult> result = docRef.set(event.toMap());
            result.get(); // Wait for completion
        } else {
            // Update existing event
            DocumentReference docRef = events.document(event.getId());
            ApiFuture<WriteResult> result = docRef.set(event.toMap());
            result.get(); // Wait for completion
        }

        return event;
    }

    public Optional<EventFirestore> findById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            return Optional.of(EventFirestore.fromMap(document.getData(), document.getId()));
        } else {
            return Optional.empty();
        }
    }

    public List<EventFirestore> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .orderBy("date", Query.Direction.ASCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<EventFirestore> events = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            events.add(EventFirestore.fromMap(document.getData(), document.getId()));
        }

        return events;
    }

    public List<EventFirestore> findAllByOrderByDateAsc() throws ExecutionException, InterruptedException {
        return findAll(); // Already ordered by date ascending
    }

    public List<EventFirestore> findByDateGreaterThanEqualOrderByDateAsc(LocalDate date) throws ExecutionException, InterruptedException {
        String dateString = date.toString();

        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereGreaterThanOrEqualTo("date", dateString)
                .orderBy("date", Query.Direction.ASCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<EventFirestore> events = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            events.add(EventFirestore.fromMap(document.getData(), document.getId()));
        }

        return events;
    }

    public List<EventFirestore> findByDateLessThanOrderByDateDesc(LocalDate date) throws ExecutionException, InterruptedException {
        String dateString = date.toString();

        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereLessThan("date", dateString)
                .orderBy("date", Query.Direction.DESCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<EventFirestore> events = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            events.add(EventFirestore.fromMap(document.getData(), document.getId()));
        }

        return events;
    }

    public void deleteById(String id) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> writeResult = firestore.collection(COLLECTION_NAME)
                .document(id)
                .delete();
        writeResult.get(); // Wait for completion
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
}