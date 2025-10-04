package com.example.restservice.config;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FirestoreConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirestoreConfig.class);

    @Value("${firebase.enabled:true}")
    private boolean firebaseEnabled;

    @Bean
    public Firestore firestore() {
        if (!firebaseEnabled) {
            logger.info("Firebase is disabled - skipping Firestore bean creation");
            return null;
        }

        try {
            logger.info("Creating Firestore client from Firebase instance");
            return FirestoreClient.getFirestore();
        } catch (Exception e) {
            logger.error("Failed to get Firestore client: {}", e.getMessage(), e);
            return null;
        }
    }
}