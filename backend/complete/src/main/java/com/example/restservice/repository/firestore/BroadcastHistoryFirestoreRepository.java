package com.example.restservice.repository.firestore;

import com.example.restservice.model.firestore.BroadcastHistoryFirestore;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class BroadcastHistoryFirestoreRepository {

    private static final String COLLECTION_NAME = "broadcastHistory";

    @Autowired
    private Firestore firestore;

    public BroadcastHistoryFirestore save(BroadcastHistoryFirestore broadcastHistory) throws ExecutionException, InterruptedException {
        String docId = broadcastHistory.getId();

        if (docId == null) {
            // Generate a new document ID
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document();
            docId = docRef.getId();
            broadcastHistory.setId(docId);
        }

        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(docId);
        ApiFuture<WriteResult> result = docRef.set(broadcastHistory.toMap());
        result.get(); // Wait for completion

        return broadcastHistory;
    }

    public Optional<BroadcastHistoryFirestore> findById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            return Optional.of(BroadcastHistoryFirestore.fromMap(document.getData(), document.getId()));
        } else {
            return Optional.empty();
        }
    }

    public List<BroadcastHistoryFirestore> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .orderBy("sentTimestamp", Query.Direction.DESCENDING)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<BroadcastHistoryFirestore> broadcastHistories = new ArrayList<>();

        for (QueryDocumentSnapshot document : documents) {
            broadcastHistories.add(BroadcastHistoryFirestore.fromMap(document.getData(), document.getId()));
        }

        return broadcastHistories;
    }

    public List<BroadcastHistoryFirestore> findByInitiator(String initiatorFirebaseUid) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("initiatorFirebaseUid", initiatorFirebaseUid)
                .orderBy("sentTimestamp", Query.Direction.DESCENDING)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<BroadcastHistoryFirestore> broadcastHistories = new ArrayList<>();

        for (QueryDocumentSnapshot document : documents) {
            broadcastHistories.add(BroadcastHistoryFirestore.fromMap(document.getData(), document.getId()));
        }

        return broadcastHistories;
    }

    public List<BroadcastHistoryFirestore> findRecent(int limit) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .orderBy("sentTimestamp", Query.Direction.DESCENDING)
                .limit(limit)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<BroadcastHistoryFirestore> broadcastHistories = new ArrayList<>();

        for (QueryDocumentSnapshot document : documents) {
            broadcastHistories.add(BroadcastHistoryFirestore.fromMap(document.getData(), document.getId()));
        }

        return broadcastHistories;
    }

    public void deleteById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<WriteResult> result = docRef.delete();
        result.get(); // Wait for completion
    }

    public long count() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        return future.get().size();
    }
}