package com.example.restservice.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class FirebaseConfig {

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            // For development, you can use the default credentials
            // In production, set GOOGLE_APPLICATION_CREDENTIALS environment variable
            // or place service-account-key.json in src/main/resources
            
            try {
                // Try to load from classpath first
                System.out.println("DEBUG: Attempting to load firebase-service-account.json from classpath");
                InputStream serviceAccount = new ClassPathResource("firebase-service-account.json").getInputStream();
                GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();

                System.out.println("DEBUG: Firebase initialized successfully with service account from classpath");
                return FirebaseApp.initializeApp(options);
            } catch (Exception e) {
                // Fallback to default credentials (useful for local development)
                System.out.println("ERROR: Failed to load Firebase service account from classpath: " + e.getMessage());
                System.out.println("DEBUG: Attempting to use default Firebase credentials");

                try {
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.getApplicationDefault())
                            .build();

                    System.out.println("DEBUG: Firebase initialized successfully with application default credentials");
                    return FirebaseApp.initializeApp(options);
                } catch (Exception defaultCredentialsError) {
                    System.err.println("ERROR: Failed to initialize Firebase with both classpath and default credentials");
                    System.err.println("Classpath error: " + e.getMessage());
                    System.err.println("Default credentials error: " + defaultCredentialsError.getMessage());
                    throw new RuntimeException("Firebase initialization failed", defaultCredentialsError);
                }
            }
        } else {
            return FirebaseApp.getInstance();
        }
    }
}