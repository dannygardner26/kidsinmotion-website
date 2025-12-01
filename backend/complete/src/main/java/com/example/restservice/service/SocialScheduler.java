package com.example.restservice.service;

import com.example.restservice.model.firestore.EventFirestore;
import com.example.restservice.repository.firestore.EventFirestoreRepository;
import com.example.restservice.service.SocialPublisher.WebhookPayload;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class SocialScheduler {

    private static final Logger logger = LoggerFactory.getLogger(SocialScheduler.class);
    private static final String CONTENT_COLLECTION = "content_bank";

    @Autowired
    private SocialPublisher socialPublisher;

    @Autowired
    private EventFirestoreRepository eventRepository;

    @Autowired(required = false)
    private Firestore firestore;

    @Value("${social.scheduler.enabled:true}")
    private boolean schedulerEnabled;

    @Scheduled(cron = "0 0 10 * * MON,WED,FRI", zone = "America/New_York")
    public void postScheduledContent() {
        if (!schedulerEnabled) {
            logger.info("Social scheduler is disabled");
            return;
        }

        logger.info("Running scheduled social media post...");

        try {
            if (hasUpcomingEvents()) {
                postEventHype();
            } else {
                postEvergreenContent();
            }
        } catch (Exception e) {
            logger.error("Error in scheduled social post: {}", e.getMessage(), e);
        }
    }

    public void triggerManualPost() {
        logger.info("Manually triggering social media post...");
        postScheduledContent();
    }

    private boolean hasUpcomingEvents() {
        try {
            LocalDate today = LocalDate.now();
            LocalDate weekFromNow = today.plusDays(7);

            List<EventFirestore> upcomingEvents = eventRepository.findByDateGreaterThanEqualOrderByDateAsc(today);

            for (EventFirestore event : upcomingEvents) {
                if (event.getDate() != null) {
                    LocalDate eventDate = LocalDate.parse(event.getDate());
                    if (!eventDate.isAfter(weekFromNow)) {
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Error checking upcoming events: {}", e.getMessage());
        }
        return false;
    }

    private void postEventHype() {
        try {
            LocalDate today = LocalDate.now();
            LocalDate weekFromNow = today.plusDays(7);

            List<EventFirestore> upcomingEvents = eventRepository.findByDateGreaterThanEqualOrderByDateAsc(today);

            EventFirestore nextEvent = null;
            for (EventFirestore event : upcomingEvents) {
                if (event.getDate() != null) {
                    LocalDate eventDate = LocalDate.parse(event.getDate());
                    if (!eventDate.isAfter(weekFromNow)) {
                        nextEvent = event;
                        break;
                    }
                }
            }

            if (nextEvent == null) {
                logger.warn("No upcoming event found despite hasUpcomingEvents returning true");
                postEvergreenContent();
                return;
            }

            String eventDate = formatEventDate(nextEvent.getDate());
            String location = nextEvent.getLocation() != null ? nextEvent.getLocation() : "TBA";

            String message = String.format(
                "🚨 COMING UP: %s!\n\n📅 %s\n📍 %s\n\nRegister your kids today at kidsinmotionpa.org! Spots are limited. ⚾️",
                nextEvent.getName(),
                eventDate,
                location
            );

            WebhookPayload payload = WebhookPayload.builder()
                .text(message)
                .imagePrompt("Excited kids playing baseball at a youth sports clinic, action shot, vibrant colors, community sports event")
                .realImageUrl(null)
                .tags("#kidsinmotion #baseball #youthsports #" + nextEvent.getName().replaceAll("\\s+", "").toLowerCase())
                .isEvent(true)
                .build();

            boolean success = socialPublisher.publish(payload);
            if (success) {
                logger.info("Successfully posted event hype for: {}", nextEvent.getName());
            }

        } catch (Exception e) {
            logger.error("Error posting event hype: {}", e.getMessage(), e);
            postEvergreenContent();
        }
    }

    private void postEvergreenContent() {
        if (firestore == null) {
            logger.warn("Firestore not available - cannot post evergreen content");
            return;
        }

        try {
            QuerySnapshot querySnapshot = firestore.collection(CONTENT_COLLECTION)
                .orderBy("lastPosted", Query.Direction.ASCENDING)
                .limit(1)
                .get()
                .get();

            if (querySnapshot.isEmpty()) {
                QuerySnapshot nullLastPosted = firestore.collection(CONTENT_COLLECTION)
                    .whereEqualTo("lastPosted", null)
                    .limit(1)
                    .get()
                    .get();

                if (nullLastPosted.isEmpty()) {
                    logger.warn("No content found in content_bank collection");
                    return;
                }

                processContentDocument(nullLastPosted.getDocuments().get(0));
            } else {
                processContentDocument(querySnapshot.getDocuments().get(0));
            }

        } catch (ExecutionException | InterruptedException e) {
            logger.error("Error querying content bank: {}", e.getMessage(), e);
        }
    }

    private void processContentDocument(DocumentSnapshot doc) {
        try {
            String body = doc.getString("body");
            String tags = doc.getString("tags");
            String imagePrompt = doc.getString("imagePrompt");
            String realImageUrl = doc.getString("realImageUrl");
            String type = doc.getString("type");

            if (body == null || body.isEmpty()) {
                logger.warn("Content document {} has no body", doc.getId());
                return;
            }

            WebhookPayload payload = WebhookPayload.builder()
                .text(body)
                .imagePrompt(imagePrompt)
                .realImageUrl(realImageUrl)
                .tags(tags != null ? tags + " #kidsinmotion" : "#kidsinmotion #baseball")
                .isEvent(false)
                .build();

            boolean success = socialPublisher.publish(payload);

            if (success) {
                doc.getReference().update("lastPosted", new Date()).get();
                logger.info("Posted evergreen content (type: {}) and updated lastPosted", type);
            }

        } catch (Exception e) {
            logger.error("Error processing content document: {}", e.getMessage(), e);
        }
    }

    private String formatEventDate(String dateString) {
        if (dateString == null) return "TBA";
        try {
            LocalDate date = LocalDate.parse(dateString);
            return date.format(DateTimeFormatter.ofPattern("EEEE, MMMM d"));
        } catch (Exception e) {
            return dateString;
        }
    }
}
