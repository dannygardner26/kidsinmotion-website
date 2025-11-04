package com.example.restservice.service;

import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class SmsDeliveryService {

    private static final Logger logger = LoggerFactory.getLogger(SmsDeliveryService.class);

    @Value("${app.messaging.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.from-number:}")
    private String fromNumber;

    private volatile boolean initialized = false;

    public boolean isEnabled() {
        boolean hasCredentials = StringUtils.hasText(accountSid) && StringUtils.hasText(authToken) && StringUtils.hasText(fromNumber);
        boolean isConfigured = smsEnabled && hasCredentials;

        if (smsEnabled && !hasCredentials) {
            logger.warn("SMS is enabled but Twilio credentials are incomplete. AccountSID: {}, AuthToken: {}, FromNumber: {}",
                StringUtils.hasText(accountSid) ? "configured" : "missing",
                StringUtils.hasText(authToken) ? "configured" : "missing",
                StringUtils.hasText(fromNumber) ? "configured" : "missing");
        }

        return isConfigured;
    }

    public boolean sendSms(String rawPhoneNumber, String messageBody) {
        if (!smsEnabled) {
            logger.debug("SMS delivery disabled via configuration - skipping message to {}", rawPhoneNumber);
            return false;
        }

        if (!StringUtils.hasText(accountSid) || !StringUtils.hasText(authToken) || !StringUtils.hasText(fromNumber)) {
            logger.warn("Twilio credentials not configured - unable to send SMS to {}", rawPhoneNumber);
            return false;
        }

        String normalized = normalizePhoneNumber(rawPhoneNumber);
        if (!StringUtils.hasText(normalized)) {
            logger.debug("Unable to normalize phone number '{}' for SMS delivery", rawPhoneNumber);
            return false;
        }

        if (!initialized) {
            synchronized (this) {
                if (!initialized) {
                    Twilio.init(accountSid, authToken);
                    initialized = true;
                }
            }
        }

        try {
            logger.info("Attempting to send SMS to {} from {}", normalized, fromNumber);
            Message message = Message.creator(new PhoneNumber(normalized), new PhoneNumber(fromNumber), messageBody).create();
            logger.info("SMS sent successfully to {} with SID: {}", normalized, message.getSid());
            return true;
        } catch (ApiException ex) {
            logger.error("Twilio API error sending SMS to {}: {} (Code: {})", normalized, ex.getMessage(), ex.getCode());
            return false;
        } catch (RuntimeException ex) {
            logger.error("Unexpected error sending SMS to {}: {}", normalized, ex.getMessage(), ex);
            return false;
        }
    }

    /**
     * Test method for administrators to verify SMS delivery without triggering verification flow
     */
    public boolean testSmsDelivery(String phoneNumber, String customMessage) {
        if (!isEnabled()) {
            logger.warn("SMS test attempted but SMS service is not enabled or configured");
            return false;
        }

        String testMessage = customMessage != null ? customMessage : "Test SMS from Kids in Motion - SMS service is working correctly!";
        logger.info("Admin SMS test initiated for phone number: {}", phoneNumber);

        boolean result = sendSms(phoneNumber, testMessage);

        if (result) {
            logger.info("Admin SMS test successful for: {}", phoneNumber);
        } else {
            logger.error("Admin SMS test failed for: {}", phoneNumber);
        }

        return result;
    }

    private String normalizePhoneNumber(String rawNumber) {
        if (!StringUtils.hasText(rawNumber)) {
            logger.debug("Phone number is null or empty");
            return null;
        }

        // Log original input for debugging
        logger.debug("Normalizing phone number: {}", rawNumber);

        String digits = rawNumber.replaceAll("[^0-9]", "");

        if (digits.length() == 10) {
            // Assume US number without country code
            String normalized = "+1" + digits;
            logger.debug("Normalized 10-digit number {} to {}", rawNumber, normalized);
            return normalized;
        }
        if (digits.length() == 11 && digits.startsWith("1")) {
            String normalized = "+" + digits;
            logger.debug("Normalized 11-digit number {} to {}", rawNumber, normalized);
            return normalized;
        }
        if (rawNumber.startsWith("+")) {
            logger.debug("Phone number {} already in international format", rawNumber);
            return rawNumber;
        }

        logger.warn("Unable to normalize phone number: {} (digits: {})", rawNumber, digits);
        return null;
    }
}
