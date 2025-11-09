package com.example.restservice.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Attachments;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.annotation.PostConstruct;
import java.io.IOException;

@Service
public class EmailDeliveryService {

    private static final Logger logger = LoggerFactory.getLogger(EmailDeliveryService.class);

    @Value("${app.messaging.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.messaging.email.from:noreply@kidsinmotionpa.org}")
    private String defaultFromAddress;

    @Value("${sendgrid.api.key:}")
    private String sendGridApiKey;

    @PostConstruct
    public void validateConfiguration() {
        logger.info("=== EmailDeliveryService Configuration ===");
        logger.info("Email delivery enabled: {}", emailEnabled);
        logger.info("SendGrid API key configured: {}", StringUtils.hasText(sendGridApiKey) ? "YES" : "NO");
        logger.info("Default from address: {}", StringUtils.hasText(defaultFromAddress) ? defaultFromAddress : "NOT CONFIGURED");

        if (!emailEnabled) {
            logger.warn("Email delivery is DISABLED. Set app.messaging.email.enabled=true to enable");
        } else if (!StringUtils.hasText(sendGridApiKey)) {
            logger.error("Email delivery is ENABLED but SendGrid API key is NOT CONFIGURED. Set SENDGRID_API_KEY environment variable");
        } else if (!StringUtils.hasText(defaultFromAddress)) {
            logger.error("Email delivery is ENABLED but default from address is NOT CONFIGURED. Set app.messaging.email.from property");
        } else {
            logger.info("Email delivery is properly configured and ready to send emails");
        }
        logger.info("==========================================");
    }

    public boolean isEnabled() {
        return emailEnabled && StringUtils.hasText(sendGridApiKey) && StringUtils.hasText(defaultFromAddress);
    }

    public boolean sendEmail(String toAddress, String subject, String body) {
        // Note: If you see Office365 relay errors (e.g., "SmtpClientAuthentication is disabled"),
        // ensure you're sending directly through SendGrid (smtp.sendgrid.net) and not relaying through Microsoft 365.
        // The sender email must be authenticated in SendGrid domain authentication.

        logger.info("Attempting to send email - From: {}, To: {}, Subject: {}", defaultFromAddress, toAddress, subject);
        logger.debug("SendGrid API key status: {}", StringUtils.hasText(sendGridApiKey) ? "Present" : "Not configured");

        if (!emailEnabled) {
            logger.warn("Email delivery disabled via configuration - skipping message to {}", toAddress);
            return false;
        }

        if (!StringUtils.hasText(sendGridApiKey)) {
            logger.error("SendGrid API key not configured. Set SENDGRID_API_KEY environment variable - unable to send email to {}", toAddress);
            return false;
        }

        if (!StringUtils.hasText(toAddress)) {
            logger.warn("No email address provided - skipping email delivery");
            return false;
        }

        if (!StringUtils.hasText(defaultFromAddress)) {
            logger.error("Invalid sender email address: {}", defaultFromAddress);
            return false;
        }

        try {
            Email from = new Email(defaultFromAddress, "Kids in Motion");
            Email to = new Email(toAddress);
            Content content = new Content("text/plain", body);
            Mail mail = new Mail(from, subject, to, content);

            logger.debug("Preparing SendGrid request - Endpoint: mail/send, Method: POST");

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            logger.info("Sending email to SendGrid API...");
            Response response = sg.api(request);

            // Log full response details
            logger.info("SendGrid API response - Status: {}, Headers: {}",
                response.getStatusCode(), response.getHeaders());
            logger.debug("SendGrid API response body: {}", response.getBody());

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                logger.info("Email sent successfully to {} via SendGrid", toAddress);
                return true;
            } else {
                logger.error("SendGrid API error sending to {}: HTTP {} - Response headers: {} - Response body: {}",
                    toAddress, response.getStatusCode(), response.getHeaders(), response.getBody());
                return false;
            }
        } catch (IOException ex) {
            logger.error("Failed to send email to {} via SendGrid - IOException: {}", toAddress, ex.getMessage(), ex);
            return false;
        } catch (Exception ex) {
            logger.error("Unexpected error sending email to {} via SendGrid: {}", toAddress, ex.getMessage(), ex);
            return false;
        }
    }

    public boolean sendEmailWithAttachment(String toAddress, String subject, String body, String attachmentContent, String attachmentFilename, String contentType) {
        logger.info("Attempting to send email with attachment - From: {}, To: {}, Subject: {}, Attachment: {}",
            defaultFromAddress, toAddress, subject, attachmentFilename);
        logger.debug("SendGrid API key status: {}", StringUtils.hasText(sendGridApiKey) ? "Present" : "Not configured");

        if (!emailEnabled) {
            logger.warn("Email delivery disabled via configuration - skipping message to {}", toAddress);
            return false;
        }

        if (!StringUtils.hasText(sendGridApiKey)) {
            logger.error("SendGrid API key not configured. Set SENDGRID_API_KEY environment variable - unable to send email to {}", toAddress);
            return false;
        }

        if (!StringUtils.hasText(toAddress)) {
            logger.warn("No email address provided - skipping email delivery");
            return false;
        }

        if (!StringUtils.hasText(defaultFromAddress)) {
            logger.error("Invalid sender email address: {}", defaultFromAddress);
            return false;
        }

        try {
            Email from = new Email(defaultFromAddress, "Kids in Motion");
            Email to = new Email(toAddress);
            Content content = new Content("text/plain", body);
            Mail mail = new Mail(from, subject, to, content);

            // Add attachment
            if (StringUtils.hasText(attachmentContent) && StringUtils.hasText(attachmentFilename)) {
                Attachments attachment = new Attachments();
                attachment.setContent(attachmentContent);
                attachment.setType(contentType);
                attachment.setFilename(attachmentFilename);
                attachment.setDisposition("attachment");
                mail.addAttachments(attachment);
                logger.info("Added attachment {} with content type {} to email", attachmentFilename, contentType);
            }

            logger.debug("Preparing SendGrid request with attachment - Endpoint: mail/send, Method: POST");

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            logger.info("Sending email with attachment to SendGrid API...");
            Response response = sg.api(request);

            // Log full response details
            logger.info("SendGrid API response - Status: {}, Headers: {}",
                response.getStatusCode(), response.getHeaders());
            logger.debug("SendGrid API response body: {}", response.getBody());

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                logger.info("Email with attachment sent successfully to {} via SendGrid", toAddress);
                return true;
            } else {
                logger.error("SendGrid API error sending email with attachment to {}: HTTP {} - Response headers: {} - Response body: {}",
                    toAddress, response.getStatusCode(), response.getHeaders(), response.getBody());
                return false;
            }
        } catch (IOException ex) {
            logger.error("Failed to send email with attachment to {} via SendGrid - IOException: {}", toAddress, ex.getMessage(), ex);
            return false;
        } catch (Exception ex) {
            logger.error("Unexpected error sending email with attachment to {} via SendGrid: {}", toAddress, ex.getMessage(), ex);
            return false;
        }
    }
}
