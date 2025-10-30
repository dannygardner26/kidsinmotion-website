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
    private boolean firebaseEnabled = true; // Force enable for development

    @PostConstruct
    public void initFirebase() {
        // Force Firebase initialization for development
        System.out.println("DEBUG: Forcing Firebase initialization");

        System.out.println("DEBUG: Firebase is enabled, attempting initialization");
        System.out.println("DEBUG: firebase.enabled = " + firebaseEnabled);

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                // Try multiple approaches to load credentials
                InputStream serviceAccount = null;

                // First try file path from environment
                String credentialsPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
                if (credentialsPath != null && !credentialsPath.isEmpty()) {
                    try {
                        serviceAccount = new FileInputStream(credentialsPath);
                        System.out.println("DEBUG: Loaded credentials from GOOGLE_APPLICATION_CREDENTIALS: " + credentialsPath);
                    } catch (Exception e) {
                        System.out.println("DEBUG: Failed to load from GOOGLE_APPLICATION_CREDENTIALS: " + e.getMessage());
                    }
                }

                // Try to load service account key from file in resources
                if (serviceAccount == null) {
                    try {
                        serviceAccount = new FileInputStream("src/main/resources/firebase-service-account.json");
                        System.out.println("DEBUG: Loaded credentials from resources file");
                    } catch (Exception e) {
                        System.out.println("DEBUG: Service account file not found in resources: " + e.getMessage());
                    }
                }

                FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder();

                if (serviceAccount != null) {
                    optionsBuilder.setCredentials(GoogleCredentials.fromStream(serviceAccount));
                    System.out.println("DEBUG: Using explicit credentials stream");
                } else {
                    // Use default credentials (for production with environment variables)
                    optionsBuilder.setCredentials(GoogleCredentials.getApplicationDefault());
                    System.out.println("DEBUG: Using default application credentials");
                }

                optionsBuilder.setProjectId("kids-in-motion-website-b1c09");
                FirebaseApp.initializeApp(optionsBuilder.build());
                System.out.println("Firebase initialized successfully from FirestoreConfig");
            } else {
                System.out.println("Firebase already initialized, using existing app");
            }
        } catch (Exception e) {
            System.err.println("Failed to initialize Firebase: " + e.getMessage());
            e.printStackTrace();
            // Force throw exception to stop startup - we need Firebase
            throw new RuntimeException("Firebase initialization failed but is required: " + e.getMessage(), e);
        }
    }

    @Bean
    public Firestore firestore() {
        // Force enable Firebase for development
        System.out.println("DEBUG: Creating Firestore bean, firebaseEnabled = " + firebaseEnabled);

        try {
            Firestore firestore = FirestoreClient.getFirestore();
            if (firestore == null) {
                throw new RuntimeException("FirestoreClient.getFirestore() returned null - Firebase may not be properly initialized");
            }
            System.out.println("Firestore bean created successfully");
            return firestore;
        } catch (Exception e) {
            System.err.println("Failed to get Firestore client: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create Firestore bean: " + e.getMessage(), e);
        }
    }
}