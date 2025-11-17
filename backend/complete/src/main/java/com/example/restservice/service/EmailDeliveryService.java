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

            // Create HTML email template with unsubscribe functionality
            String htmlBody = createHtmlEmailTemplate(subject, body, toAddress);
            Content htmlContent = new Content("text/html", htmlBody);
            Content plainContent = new Content("text/plain", body); // Fallback for plain text

            Mail mail = new Mail(from, subject, to, htmlContent);
            mail.addContent(plainContent); // Add both HTML and plain text versions

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

    /**
     * Creates a professional HTML email template with Kids in Motion branding and unsubscribe functionality
     */
    private String createHtmlEmailTemplate(String subject, String body, String toAddress) {
        // Create unsubscribe link (you can implement unsubscribe functionality later)
        String unsubscribeUrl = "https://kidsinmotionpa.org/unsubscribe?email=" + java.net.URLEncoder.encode(toAddress, java.nio.charset.StandardCharsets.UTF_8);

        // Convert plain text body to HTML (preserve line breaks)
        String htmlBody = body.replace("\n", "<br>");

        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #f8fafc;">
                    <tr>
                        <td style="padding: 40px 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #4f46e5 0%%, #7c3aed 100%%); border-radius: 12px 12px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Kids in Motion</h1>
                                        <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 16px;">Empowering every kid to play and learn through sports</p>
                                    </td>
                                </tr>

                                <!-- Subject -->
                                <tr>
                                    <td style="padding: 30px 40px 10px 40px;">
                                        <h2 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 600; line-height: 1.3;">%s</h2>
                                    </td>
                                </tr>

                                <!-- Body Content -->
                                <tr>
                                    <td style="padding: 0 40px 30px 40px;">
                                        <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                                            %s
                                        </div>
                                    </td>
                                </tr>

                                <!-- Call to Action (optional) -->
                                <tr>
                                    <td style="padding: 0 40px 40px 40px; text-align: center;">
                                        <a href="https://kidsinmotionpa.org/dashboard" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%%, #7c3aed 100%%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                            View Dashboard
                                        </a>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%">
                                            <tr>
                                                <td style="text-align: center;">
                                                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                                        <strong>Kids in Motion</strong><br>
                                                        📧 info@kidsinmotionpa.org | 📞 (484) 885-6284
                                                    </p>
                                                    <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
                                                        🌐 <a href="https://kidsinmotionpa.org" style="color: #4f46e5; text-decoration: none;">kidsinmotionpa.org</a>
                                                    </p>

                                                    <!-- Unsubscribe -->
                                                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                                        Don't want to receive these emails?
                                                        <a href="%s" style="color: #6b7280; text-decoration: underline;">Unsubscribe here</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """, subject, subject, htmlBody, unsubscribeUrl);
    }
}
