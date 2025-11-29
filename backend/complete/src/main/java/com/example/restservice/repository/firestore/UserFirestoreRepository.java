package com.example.restservice.repository.firestore;

import com.example.restservice.model.firestore.UserFirestore;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class UserFirestoreRepository {

    private static final String COLLECTION_NAME = "users";

    @Autowired
    private Firestore firestore;

    public UserFirestore save(UserFirestore user) throws ExecutionException, InterruptedException {
        CollectionReference users = firestore.collection(COLLECTION_NAME);

        // Use firebaseUid as the document ID for easy lookup
        String documentId = user.getFirebaseUid();
        if (documentId == null || documentId.isEmpty()) {
            // Fallback to auto-generated ID if no firebaseUid
            DocumentReference docRef = users.document();
            documentId = docRef.getId();
        }

        user.setId(documentId);
        DocumentReference docRef = users.document(documentId);
        ApiFuture<WriteResult> result = docRef.set(user.toMap());
        result.get(); // Wait for completion

        return user;
    }

    public Optional<UserFirestore> findById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            return Optional.of(UserFirestore.fromMap(document.getData(), document.getId()));
        } else {
            return Optional.empty();
        }
    }

    public Optional<UserFirestore> findByFirebaseUid(String firebaseUid) throws ExecutionException, InterruptedException {
        // First try direct lookup by document ID (should be firebaseUid)
        Optional<UserFirestore> directLookup = findById(firebaseUid);
        if (directLookup.isPresent()) {
            return directLookup;
        }

        // Fallback to query if direct lookup fails
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("firebaseUid", firebaseUid)
                .limit(1)
                .get();

        QuerySnapshot querySnapshot = query.get();

        if (!querySnapshot.getDocuments().isEmpty()) {
            DocumentSnapshot document = querySnapshot.getDocuments().get(0);
            return Optional.of(UserFirestore.fromMap(document.getData(), document.getId()));
        } else {
            return Optional.empty();
        }
    }

    public Optional<UserFirestore> findByEmail(String email) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("email", email)
                .limit(1)
                .get();

        QuerySnapshot querySnapshot = query.get();

        if (!querySnapshot.getDocuments().isEmpty()) {
            DocumentSnapshot document = querySnapshot.getDocuments().get(0);
            return Optional.of(UserFirestore.fromMap(document.getData(), document.getId()));
        } else {
            return Optional.empty();
        }
    }

    public List<UserFirestore> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<UserFirestore> users = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            users.add(UserFirestore.fromMap(document.getData(), document.getId()));
        }

        // Sort in-memory with null-safe comparison
        users.sort((u1, u2) -> {
            String lastName1 = u1.getLastName();
            String lastName2 = u2.getLastName();
            if (lastName1 == null && lastName2 == null) return 0;
            if (lastName1 == null) return 1;
            if (lastName2 == null) return -1;
            return lastName1.compareToIgnoreCase(lastName2);
        });

        return users;
    }

    public List<UserFirestore> findByUserType(String userType) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("userType", userType)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<UserFirestore> users = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            users.add(UserFirestore.fromMap(document.getData(), document.getId()));
        }

        // Sort in-memory with null-safe comparison
        users.sort((u1, u2) -> {
            String lastName1 = u1.getLastName();
            String lastName2 = u2.getLastName();
            if (lastName1 == null && lastName2 == null) return 0;
            if (lastName1 == null) return 1;
            if (lastName2 == null) return -1;
            return lastName1.compareToIgnoreCase(lastName2);
        });

        return users;
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

    public boolean existsByFirebaseUid(String firebaseUid) throws ExecutionException, InterruptedException {
        return findByFirebaseUid(firebaseUid).isPresent();
    }

    public boolean existsByEmail(String email) throws ExecutionException, InterruptedException {
        return findByEmail(email).isPresent();
    }


    public Optional<UserFirestore> findByPhoneNumber(String phoneNumber) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("phoneNumber", phoneNumber)
                .limit(1)
                .get();

        QuerySnapshot querySnapshot = query.get();

        if (!querySnapshot.getDocuments().isEmpty()) {
            DocumentSnapshot document = querySnapshot.getDocuments().get(0);
            return Optional.of(UserFirestore.fromMap(document.getData(), document.getId()));
        } else {
            return Optional.empty();
        }
    }

    public Optional<UserFirestore> findByEmailOrPhoneNumber(String email, String phoneNumber) throws ExecutionException, InterruptedException {
        // Try email first
        Optional<UserFirestore> byEmail = findByEmail(email);
        if (byEmail.isPresent()) {
            return byEmail;
        }

        // Try phone number
        return findByPhoneNumber(phoneNumber);
    }

    public List<UserFirestore> findAllExcludingBanned() throws ExecutionException, InterruptedException {
        // Get ALL users first, then filter in memory
        // This is because Firestore doesn't support "whereEqualTo null OR whereEqualTo false"
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME).get();

        QuerySnapshot querySnapshot = query.get();
        List<UserFirestore> users = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            UserFirestore user = UserFirestore.fromMap(document.getData(), document.getId());
            // Include users where isBanned is null, false, or not set
            if (user.getIsBanned() == null || !user.getIsBanned()) {
                users.add(user);
            }
        }

        // Sort in-memory with null-safe comparison
        users.sort((u1, u2) -> {
            String lastName1 = u1.getLastName();
            String lastName2 = u2.getLastName();
            if (lastName1 == null && lastName2 == null) return 0;
            if (lastName1 == null) return 1;
            if (lastName2 == null) return -1;
            return lastName1.compareToIgnoreCase(lastName2);
        });

        return users;
    }

    public List<UserFirestore> findByUserTypeExcludingBanned(String userType) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("userType", userType)
                .whereEqualTo("isBanned", false)
                .get();

        QuerySnapshot querySnapshot = query.get();
        List<UserFirestore> users = new ArrayList<>();

        for (DocumentSnapshot document : querySnapshot.getDocuments()) {
            UserFirestore user = UserFirestore.fromMap(document.getData(), document.getId());
            // Double check - only include if not banned
            if (user.getIsBanned() == null || !user.getIsBanned()) {
                users.add(user);
            }
        }

        // Sort in-memory with null-safe comparison
        users.sort((u1, u2) -> {
            String lastName1 = u1.getLastName();
            String lastName2 = u2.getLastName();
            if (lastName1 == null && lastName2 == null) return 0;
            if (lastName1 == null) return 1;
            if (lastName2 == null) return -1;
            return lastName1.compareToIgnoreCase(lastName2);
        });

        return users;
    }

    public long count() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> query = firestore.collection(COLLECTION_NAME).get();
        QuerySnapshot querySnapshot = query.get();
        return querySnapshot.size();
    }
}