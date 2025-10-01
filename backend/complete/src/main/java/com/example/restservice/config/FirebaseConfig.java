package com.example.restservice.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            try {
                InputStream serviceAccount = new ClassPathResource("firebase-service-account.json").getInputStream();
                GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);
                String projectId = resolveProjectId(credentials);

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .setProjectId(projectId)
                        .build();

                return FirebaseApp.initializeApp(options);
            } catch (Exception e) {
                System.out.println("Using default Firebase credentials. Make sure GOOGLE_APPLICATION_CREDENTIALS is set.");

                GoogleCredentials credentials = GoogleCredentials.getApplicationDefault();
                String projectId = resolveProjectId(credentials);

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .setProjectId(projectId)
                        .build();

                return FirebaseApp.initializeApp(options);
            }
        } else {
            return FirebaseApp.getInstance();
        }
    }

    private String resolveProjectId(GoogleCredentials credentials) {
        if (credentials instanceof ServiceAccountCredentials sac) {
            String projectId = sac.getProjectId();
            if (hasText(projectId)) {
                return projectId;
            }
        }

        String projectId = credentials.getProjectId();
        if (hasText(projectId)) {
            return projectId;
        }

        projectId = System.getenv("FIREBASE_PROJECT_ID");
        if (hasText(projectId)) {
            return projectId;
        }

        projectId = System.getenv("GOOGLE_CLOUD_PROJECT");
        if (hasText(projectId)) {
            return projectId;
        }

        projectId = System.getenv("GCLOUD_PROJECT");
        if (hasText(projectId)) {
            return projectId;
        }

        logger.error("Firebase project ID could not be determined. Set FIREBASE_PROJECT_ID or ensure credentials include projectId.");
        throw new IllegalStateException("Missing Firebase project ID configuration");
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
