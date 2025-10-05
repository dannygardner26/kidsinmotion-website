package com.example.restservice.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirestoreConfig {

    @Value("${firebase.enabled:true}")
    private boolean firebaseEnabled;

    @PostConstruct
    public void initFirebase() {
        if (!firebaseEnabled) {
            System.out.println("Firebase is disabled - skipping initialization");
            return;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                // Try to load service account key from file
                InputStream serviceAccount = null;
                try {
                    serviceAccount = new FileInputStream("src/main/resources/firebase-service-account.json");
                } catch (Exception e) {
                    System.out.println("Service account file not found, trying default credentials");
                }

                FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder();

                if (serviceAccount != null) {
                    optionsBuilder.setCredentials(GoogleCredentials.fromStream(serviceAccount));
                } else {
                    // Use default credentials (for production with environment variables)
                    optionsBuilder.setCredentials(GoogleCredentials.getApplicationDefault());
                }

                FirebaseApp.initializeApp(optionsBuilder.build());
                System.out.println("Firebase initialized successfully");
            }
        } catch (IOException e) {
            System.err.println("Failed to initialize Firebase: " + e.getMessage());
            System.out.println("Continuing without Firebase integration");
        }
    }

    @Bean
    public Firestore firestore() {
        if (!firebaseEnabled) {
            return null;
        }

        try {
            return FirestoreClient.getFirestore();
        } catch (Exception e) {
            System.err.println("Failed to get Firestore client: " + e.getMessage());
            return null;
        }
    }
}