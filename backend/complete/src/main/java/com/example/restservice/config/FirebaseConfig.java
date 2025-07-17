package com.example.restservice.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            // For development, you can use the default credentials
            // In production, set GOOGLE_APPLICATION_CREDENTIALS environment variable
            // or place service-account-key.json in src/main/resources
            
            try {
                // Try to load from classpath first
                InputStream serviceAccount = new ClassPathResource("firebase-service-account.json").getInputStream();
                GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);
                
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();
                
                return FirebaseApp.initializeApp(options);
            } catch (Exception e) {
                // Fallback to default credentials (useful for local development)
                System.out.println("Using default Firebase credentials. Make sure GOOGLE_APPLICATION_CREDENTIALS is set.");
                
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.getApplicationDefault())
                        .build();
                
                return FirebaseApp.initializeApp(options);
            }
        } else {
            return FirebaseApp.getInstance();
        }
    }
}