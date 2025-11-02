package com.example.restservice.repository.firestore;

import com.example.restservice.model.firestore.ConnectionFirestore;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class ConnectionFirestoreRepository {

    private static final String COLLECTION_NAME = "connections";

    @Autowired
    private Firestore firestore;

    public ConnectionFirestore save(ConnectionFirestore connection) throws ExecutionException, InterruptedException {
        CollectionReference connections = firestore.collection(COLLECTION_NAME);

        DocumentReference docRef;
        if (connection.getId() == null || connection.getId().isEmpty()) {
            // Auto-generate ID for new connections
            docRef = connections.document();
            connection.setId(docRef.getId());
        } else {
            // Update existing connection
            docRef = connections.document(connection.getId());
        }

        ApiFuture<WriteResult> result = docRef.set(connection.toMap());
        result.get(); // Wait for completion

        return connection;
    }

    public Optional<ConnectionFirestore> findById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            return Optional.of(ConnectionFirestore.fromMap(document.getData(), document.getId()));
        } else {
            return Optional.empty();
        }
    }

    public Optional<ConnectionFirestore> findByRequesterIdAndReceiverId(String requesterId, String receiverId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("requesterId", requesterId)
                .whereEqualTo("receiverId", receiverId)
                .limit(1)
                .get();

        QuerySnapshot querySnapshot = query.get();

        if (!querySnapshot.getDocuments().isEmpty()) {
            DocumentSnapshot document = querySnapshot.getDocuments().get(0);
            return Optional.of(ConnectionFirestore.fromMap(document.getData(), document.getId()));
        } else {
            return Optional.empty();
        }
    }

    public List<ConnectionFirestore> findByRequesterIdOrReceiverId(String userId) throws ExecutionException, InterruptedException {
        List<ConnectionFirestore> connections = new ArrayList<>();

        // Find connections where user is requester
        ApiFuture<QuerySnapshot> requesterQuery = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("requesterId", userId)
                .get();

        // Find connections where user is receiver
        ApiFuture<QuerySnapshot> receiverQuery = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("receiverId", userId)
                .get();

        QuerySnapshot requesterSnapshot = requesterQuery.get();
        QuerySnapshot receiverSnapshot = receiverQuery.get();

        for (DocumentSnapshot document : requesterSnapshot.getDocuments()) {
            connections.add(ConnectionFirestore.fromMap(document.getData(), document.getId()));
        }

        for (DocumentSnapshot document : receiverSnapshot.getDocuments()) {
            connections.add(ConnectionFirestore.fromMap(document.getData(), document.getId()));
        }

        return connections;
    }

    public List<ConnectionFirestore> findPendingRequestsForUser(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("receiverId", userId)
                .whereEqualTo("status", "PENDING")
                .orderBy("requestedAt", Query.Direction.DESCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<ConnectionFirestore> connections = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            connections.add(ConnectionFirestore.fromMap(document.getData(), document.getId()));
        }

        return connections;
    }

    public List<ConnectionFirestore> findSentRequestsForUser(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("requesterId", userId)
                .whereEqualTo("status", "PENDING")
                .orderBy("requestedAt", Query.Direction.DESCENDING)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<ConnectionFirestore> connections = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            connections.add(ConnectionFirestore.fromMap(document.getData(), document.getId()));
        }

        return connections;
    }

    public List<ConnectionFirestore> findAcceptedConnectionsForUser(String userId) throws ExecutionException, InterruptedException {
        List<ConnectionFirestore> connections = new ArrayList<>();

        // Find accepted connections where user is requester
        ApiFuture<QuerySnapshot> requesterQuery = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("requesterId", userId)
                .whereEqualTo("status", "ACCEPTED")
                .get();

        // Find accepted connections where user is receiver
        ApiFuture<QuerySnapshot> receiverQuery = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("receiverId", userId)
                .whereEqualTo("status", "ACCEPTED")
                .get();

        QuerySnapshot requesterSnapshot = requesterQuery.get();
        QuerySnapshot receiverSnapshot = receiverQuery.get();

        for (DocumentSnapshot document : requesterSnapshot.getDocuments()) {
            connections.add(ConnectionFirestore.fromMap(document.getData(), document.getId()));
        }

        for (DocumentSnapshot document : receiverSnapshot.getDocuments()) {
            connections.add(ConnectionFirestore.fromMap(document.getData(), document.getId()));
        }

        return connections;
    }

    public long countPendingRequestsByRequesterId(String requesterId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("requesterId", requesterId)
                .whereEqualTo("status", "PENDING")
                .get();

        QuerySnapshot querySnapshot = query.get();
        return querySnapshot.size();
    }

    public void deleteById(String id) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> writeResult = firestore.collection(COLLECTION_NAME)
                .document(id)
                .delete();
        writeResult.get(); // Wait for completion
    }

    public ConnectionFirestore updateStatus(String id, String status) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);

        // Get current connection
        Optional<ConnectionFirestore> connectionOpt = findById(id);
        if (!connectionOpt.isPresent()) {
            throw new RuntimeException("Connection not found: " + id);
        }

        ConnectionFirestore connection = connectionOpt.get();
        connection.setStatus(status);

        // Set appropriate timestamp
        long currentTime = System.currentTimeMillis();
        if ("ACCEPTED".equals(status)) {
            connection.setAcceptedAt(currentTime);
        } else if ("REJECTED".equals(status)) {
            connection.setRejectedAt(currentTime);
        }

        // Save updated connection
        ApiFuture<WriteResult> result = docRef.set(connection.toMap());
        result.get(); // Wait for completion

        return connection;
    }
}