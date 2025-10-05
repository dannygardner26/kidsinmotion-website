package com.example.restservice.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
<<<<<<< HEAD
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
=======
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733

@Configuration
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class FirebaseConfig {

<<<<<<< HEAD
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
=======
    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @PostConstruct
    public void init() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                logger.info("Starting Firebase initialization...");

                String firebaseJson = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
                logger.info("GOOGLE_APPLICATION_CREDENTIALS length: {}", firebaseJson == null ? 0 : firebaseJson.length());

                GoogleCredentials credentials;
                if (firebaseJson != null && !firebaseJson.trim().isEmpty()) {
                    logger.info("Initializing Firebase with secret JSON from env var.");
                    try (InputStream serviceAccount =
                                 new ByteArrayInputStream(firebaseJson.getBytes(StandardCharsets.UTF_8))) {
                        credentials = GoogleCredentials.fromStream(serviceAccount);
                    }
                } else {
                    logger.warn("No GOOGLE_APPLICATION_CREDENTIALS env var found. Falling back to ADC.");
                    credentials = GoogleCredentials.getApplicationDefault();
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .setProjectId("kids-in-motion-website-b1c09")
                        .build();

                FirebaseApp.initializeApp(options);
                logger.info("✅ Firebase initialized successfully with project: kids-in-motion-website-b1c09");
            } else {
                logger.info("Firebase already initialized, skipping.");
            }
        } catch (Exception e) {
            logger.error("❌ Failed to initialize Firebase", e);
        }
    }

    @Bean
    public FirebaseApp firebaseApp() {
        try {
            return FirebaseApp.getInstance();
        } catch (IllegalStateException e) {
            logger.error("FirebaseApp not initialized - this should not happen if @PostConstruct ran properly");
            throw e;
        }
    }

}




>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
