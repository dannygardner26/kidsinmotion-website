package com.example.restservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class SocialPublisher {

    private static final Logger logger = LoggerFactory.getLogger(SocialPublisher.class);

    @Value("${social.webhook.url:https://hook.us2.make.com/3ec73tq9edwgq35eeabzcu4mt1258wxk}")
    private String webhookUrl;

    @Value("${social.publisher.enabled:true}")
    private boolean publisherEnabled;

    private final RestTemplate restTemplate;

    public SocialPublisher() {
        this.restTemplate = new RestTemplate();
    }

    public boolean publish(WebhookPayload payload) {
        if (!publisherEnabled) {
            logger.info("Social publisher disabled - would have posted: {}", payload.getText().substring(0, Math.min(50, payload.getText().length())));
            return true;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<WebhookPayload> request = new HttpEntity<>(payload, headers);

            logger.info("Sending social post to webhook: {}...", payload.getText().substring(0, Math.min(50, payload.getText().length())));
            logger.debug("Payload - imagePrompt: {}, realImageUrl: {}", payload.getImagePrompt(), payload.getRealImageUrl());

            ResponseEntity<String> response = restTemplate.postForEntity(webhookUrl, request, String.class);

            logger.info("Webhook response status: {}", response.getStatusCode());

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Successfully published to social media webhook");
                return true;
            } else {
                logger.warn("Webhook returned non-success status: {}", response.getStatusCode());
                return false;
            }

        } catch (RestClientException e) {
            logger.error("Failed to publish to social webhook: {}", e.getMessage(), e);
            return false;
        }
    }

    public static class WebhookPayload {
        private String text;
        private String imagePrompt;
        private String realImageUrl;
        private String tags;
        private boolean isEvent;

        public WebhookPayload() {}

        public WebhookPayload(String text, String imagePrompt, String realImageUrl, String tags, boolean isEvent) {
            this.text = text;
            this.imagePrompt = imagePrompt;
            this.realImageUrl = realImageUrl;
            this.tags = tags;
            this.isEvent = isEvent;
        }

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }

        public String getImagePrompt() { return imagePrompt; }
        public void setImagePrompt(String imagePrompt) { this.imagePrompt = imagePrompt; }

        public String getRealImageUrl() { return realImageUrl; }
        public void setRealImageUrl(String realImageUrl) { this.realImageUrl = realImageUrl; }

        public String getTags() { return tags; }
        public void setTags(String tags) { this.tags = tags; }

        public boolean isEvent() { return isEvent; }
        public void setEvent(boolean event) { isEvent = event; }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String text;
            private String imagePrompt;
            private String realImageUrl;
            private String tags = "#kidsinmotion #baseball";
            private boolean isEvent = false;

            public Builder text(String text) { this.text = text; return this; }
            public Builder imagePrompt(String imagePrompt) { this.imagePrompt = imagePrompt; return this; }
            public Builder realImageUrl(String realImageUrl) { this.realImageUrl = realImageUrl; return this; }
            public Builder tags(String tags) { this.tags = tags; return this; }
            public Builder isEvent(boolean isEvent) { this.isEvent = isEvent; return this; }

            public WebhookPayload build() {
                return new WebhookPayload(text, imagePrompt, realImageUrl, tags, isEvent);
            }
        }
    }
}
