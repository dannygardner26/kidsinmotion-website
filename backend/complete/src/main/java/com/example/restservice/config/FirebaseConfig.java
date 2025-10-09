package com.example.restservice.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

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
            } catch (Exception classpathError) {
                // Fallback to environment-provided credentials (default for production)
                System.out.println("ERROR: Failed to load Firebase service account from classpath: " + classpathError.getClass().getSimpleName());
                System.out.println("DEBUG: Attempting to resolve Firebase credentials from environment");

                try {
                    GoogleCredentials credentials = resolveCredentialsFromEnvironment();

                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(credentials)
                            .build();

                    System.out.println("DEBUG: Firebase initialized successfully with environment credentials (forced deployment)");
                    return FirebaseApp.initializeApp(options);
                } catch (Exception credentialResolutionError) {
                    System.err.println("ERROR: Failed to initialize Firebase with both classpath and environment credentials");
                    System.err.println("Classpath error: " + classpathError.getClass().getSimpleName());
                    System.err.println("Credential resolution error: " + credentialResolutionError.getClass().getSimpleName());
                    throw new RuntimeException("Firebase initialization failed", credentialResolutionError);
                }
            }
        } else {
            return FirebaseApp.getInstance();
        }
    }

    private GoogleCredentials resolveCredentialsFromEnvironment() throws IOException {
        String inlineJson = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");
        if (inlineJson == null || inlineJson.isBlank()) {
            inlineJson = System.getenv("FIREBASE_SERVICE_ACCOUNT");
        }
        if (inlineJson != null && !inlineJson.isBlank()) {
            try {
                return GoogleCredentials.fromStream(new ByteArrayInputStream(inlineJson.getBytes(StandardCharsets.UTF_8)));
            } catch (IOException ex) {
                throw new IOException("Failed to parse credentials from inline Firebase service account JSON", ex);
            }
        }

        String configuredCredentialPointer = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
        if (configuredCredentialPointer != null && !configuredCredentialPointer.isBlank()) {
            if (configuredCredentialPointer.trim().startsWith("{")) {
                try {
                    return GoogleCredentials.fromStream(new ByteArrayInputStream(configuredCredentialPointer.getBytes(StandardCharsets.UTF_8)));
                } catch (IOException ex) {
                    throw new IOException("Failed to parse credentials from GOOGLE_APPLICATION_CREDENTIALS inline JSON", ex);
                }
            }

            Path credentialPath = Paths.get(configuredCredentialPointer);
            if (Files.exists(credentialPath)) {
                try (InputStream fileStream = Files.newInputStream(credentialPath)) {
                    return GoogleCredentials.fromStream(fileStream);
                } catch (IOException ex) {
                    throw new IOException("Failed to parse credentials file located via GOOGLE_APPLICATION_CREDENTIALS", ex);
                }
            }

            throw new IOException("Credential file not found at configured GOOGLE_APPLICATION_CREDENTIALS path");
        }

        try {
            return GoogleCredentials.getApplicationDefault();
        } catch (IOException ex) {
            throw new IOException("Failed to resolve Google application default credentials", ex);
        }
    }
}
