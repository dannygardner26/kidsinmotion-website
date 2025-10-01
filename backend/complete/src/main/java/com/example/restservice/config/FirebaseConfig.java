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
                // Try serviceAccountKey.json first (for local development)
                InputStream serviceAccount = new ClassPathResource("serviceAccountKey.json").getInputStream();
                GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);
                String projectId = resolveProjectId(credentials);

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .setProjectId(projectId)
                        .build();

                logger.info("Initializing Firebase with serviceAccountKey.json");
                return FirebaseApp.initializeApp(options);
            } catch (Exception e) {
                logger.info("serviceAccountKey.json not found, using Application Default Credentials");

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
        String projectId = null;

        if (credentials instanceof ServiceAccountCredentials sac) {
            projectId = sac.getProjectId();
            if (hasText(projectId)) {
                logger.info("Resolved project ID from service account: {}", projectId);
                return projectId;
            }
        }

        projectId = System.getenv("FIREBASE_PROJECT_ID");
        if (hasText(projectId)) {
            logger.info("Resolved project ID from FIREBASE_PROJECT_ID: {}", projectId);
            return projectId;
        }

        projectId = System.getenv("GOOGLE_CLOUD_PROJECT");
        if (hasText(projectId)) {
            logger.info("Resolved project ID from GOOGLE_CLOUD_PROJECT: {}", projectId);
            return projectId;
        }

        projectId = System.getenv("GCLOUD_PROJECT");
        if (hasText(projectId)) {
            logger.info("Resolved project ID from GCLOUD_PROJECT: {}", projectId);
            return projectId;
        }

        // Hardcode as fallback for Cloud Run
        projectId = "kids-in-motion-website-b1c09";
        logger.warn("Could not resolve project ID from credentials or environment. Using hardcoded fallback: {}", projectId);
        return projectId;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}




