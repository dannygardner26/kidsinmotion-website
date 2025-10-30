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

    public boolean isEnabled() {
        return emailEnabled && StringUtils.hasText(sendGridApiKey) && StringUtils.hasText(defaultFromAddress);
    }

    public boolean sendEmail(String toAddress, String subject, String body) {
        if (!emailEnabled) {
            logger.debug("Email delivery disabled via configuration - skipping message to {}", toAddress);
            return false;
        }

        if (!StringUtils.hasText(sendGridApiKey)) {
            logger.warn("SendGrid API key not configured - unable to send email to {}", toAddress);
            return false;
        }

        if (!StringUtils.hasText(toAddress)) {
            logger.debug("No email address provided - skipping email delivery");
            return false;
        }

        try {
            Email from = new Email(defaultFromAddress, "Kids in Motion");
            Email to = new Email(toAddress);
            Content content = new Content("text/plain", body);
            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                logger.debug("Email sent successfully to {} via SendGrid", toAddress);
                return true;
            } else {
                logger.error("SendGrid API error sending to {}: HTTP {} - {}",
                    toAddress, response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (IOException ex) {
            logger.error("Failed to send email to {} via SendGrid: {}", toAddress, ex.getMessage());
            return false;
        }
    }

    public boolean sendEmailWithAttachment(String toAddress, String subject, String body, String attachmentContent, String attachmentFilename, String contentType) {
        if (!emailEnabled) {
            logger.debug("Email delivery disabled via configuration - skipping message to {}", toAddress);
            return false;
        }

        if (!StringUtils.hasText(sendGridApiKey)) {
            logger.warn("SendGrid API key not configured - unable to send email to {}", toAddress);
            return false;
        }

        if (!StringUtils.hasText(toAddress)) {
            logger.debug("No email address provided - skipping email delivery");
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
                logger.debug("Added attachment {} with content type {} to email", attachmentFilename, contentType);
            }

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                logger.debug("Email with attachment sent successfully to {} via SendGrid", toAddress);
                return true;
            } else {
                logger.error("SendGrid API error sending email with attachment to {}: HTTP {} - {}",
                    toAddress, response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (IOException ex) {
            logger.error("Failed to send email with attachment to {} via SendGrid: {}", toAddress, ex.getMessage());
            return false;
        }
    }
}
