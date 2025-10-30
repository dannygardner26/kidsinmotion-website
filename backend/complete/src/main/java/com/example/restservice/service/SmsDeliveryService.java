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
        return smsEnabled && StringUtils.hasText(accountSid) && StringUtils.hasText(authToken) && StringUtils.hasText(fromNumber);
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
            Message.creator(new PhoneNumber(normalized), new PhoneNumber(fromNumber), messageBody).create();
            logger.debug("SMS sent successfully to {}", normalized);
            return true;
        } catch (ApiException ex) {
            logger.error("Failed to send SMS to {}: {}", normalized, ex.getMessage());
            return false;
        } catch (RuntimeException ex) {
            logger.error("Unexpected error sending SMS to {}: {}", normalized, ex.getMessage());
            return false;
        }
    }

    private String normalizePhoneNumber(String rawNumber) {
        if (!StringUtils.hasText(rawNumber)) {
            return null;
        }

        String digits = rawNumber.replaceAll("[^0-9]", "");
        if (digits.length() == 10) {
            // Assume US number without country code
            return "+1" + digits;
        }
        if (digits.length() == 11 && digits.startsWith("1")) {
            return "+" + digits;
        }
        if (rawNumber.startsWith("+")) {
            return rawNumber;
        }
        return null;
    }
}
