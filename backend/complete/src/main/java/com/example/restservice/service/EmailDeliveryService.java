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
            Email from = new Email(defaultFromAddress, "Kids in Motion Team");
            Email to = new Email(toAddress);

            // Create HTML email template with unsubscribe functionality
            String htmlBody = createHtmlEmailTemplate(subject, body, toAddress);
            Content plainContent = new Content("text/plain", body); // Plain text version - MUST be first
            Content htmlContent = new Content("text/html", htmlBody);

            // SendGrid requires text/plain to come FIRST, then text/html
            Mail mail = new Mail(from, subject, to, plainContent);
            mail.addContent(htmlContent); // Add HTML version second

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
            Email from = new Email(defaultFromAddress, "Kids in Motion Team");
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
     * Colors match website theme: Primary #2f506a (indigo-dye), Secondary #e64f50 (imperial-red), Background #ede9e7 (isabelline)
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
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
            </head>
            <body style="margin: 0; padding: 0; background-color: #ede9e7; font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #ede9e7;">
                    <tr>
                        <td style="padding: 40px 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(47, 80, 106, 0.15); overflow: hidden;">

                                <!-- Header with Logo and Brand -->
                                <tr>
                                    <td style="padding: 0; background: linear-gradient(135deg, #2f506a 0%%, #3a6587 100%%);">
                                        <!-- Logo Section -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%">
                                            <tr>
                                                <td style="padding: 30px 40px; text-align: center;">
                                                    <!-- Sports Icon as Logo Alternative -->
                                                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); border-radius: 50%%; padding: 20px; margin-bottom: 15px;">
                                                        <div style="width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px;">⚽</div>
                                                    </div>
                                                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; font-family: 'Montserrat', sans-serif; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Kids in Motion</h1>
                                                    <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 500;">Empowering every kid to play and learn through sports</p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Decorative Wave -->
                                        <div style="height: 20px; background: #ffffff; clip-path: ellipse(100%% 100%% at 50%% 0%%);"></div>
                                    </td>
                                </tr>

                                <!-- Subject -->
                                <tr>
                                    <td style="padding: 30px 40px 15px 40px;">
                                        <h2 style="margin: 0; color: #2f506a; font-size: 24px; font-weight: 600; line-height: 1.3; font-family: 'Montserrat', sans-serif;">%s</h2>
                                        <div style="width: 50px; height: 3px; background-color: #e64f50; margin: 15px 0 0 0; border-radius: 2px;"></div>
                                    </td>
                                </tr>

                                <!-- Body Content -->
                                <tr>
                                    <td style="padding: 15px 40px 30px 40px;">
                                        <div style="color: #383838; font-size: 16px; line-height: 1.7; font-family: 'Open Sans', sans-serif;">
                                            %s
                                        </div>
                                    </td>
                                </tr>

                                <!-- Call to Action Button -->
                                <tr>
                                    <td style="padding: 0 40px 40px 40px; text-align: center;">
                                        <a href="https://kidsinmotionpa.org/dashboard" style="display: inline-block; background: linear-gradient(135deg, #e64f50 0%%, #eb7172 100%%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: 'Montserrat', sans-serif; box-shadow: 0 4px 12px rgba(230, 79, 80, 0.3); transition: transform 0.2s ease;">
                                            View Dashboard →
                                        </a>
                                    </td>
                                </tr>

                                <!-- Features Section -->
                                <tr>
                                    <td style="padding: 20px 40px; background-color: #f8f9fa;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%">
                                            <tr>
                                                <td style="width: 33.33%%; text-align: center; padding: 10px;">
                                                    <div style="color: #e64f50; font-size: 24px; margin-bottom: 8px;">🏆</div>
                                                    <p style="margin: 0; color: #2f506a; font-size: 12px; font-weight: 600;">Programs</p>
                                                </td>
                                                <td style="width: 33.33%%; text-align: center; padding: 10px;">
                                                    <div style="color: #e64f50; font-size: 24px; margin-bottom: 8px;">👨‍👩‍👧‍👦</div>
                                                    <p style="margin: 0; color: #2f506a; font-size: 12px; font-weight: 600;">Community</p>
                                                </td>
                                                <td style="width: 33.33%%; text-align: center; padding: 10px;">
                                                    <div style="color: #e64f50; font-size: 24px; margin-bottom: 8px;">⚡</div>
                                                    <p style="margin: 0; color: #2f506a; font-size: 12px; font-weight: 600;">Growth</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 30px 40px; background-color: #2f506a; color: #ffffff;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%">
                                            <tr>
                                                <td style="text-align: center;">
                                                    <div style="margin-bottom: 20px;">
                                                        <h3 style="margin: 0 0 10px 0; color: #ffffff; font-size: 18px; font-weight: 700; font-family: 'Montserrat', sans-serif;">Kids in Motion</h3>
                                                        <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.5;">
                                                            Building confidence through sports • Creating lasting memories
                                                        </p>
                                                    </div>

                                                    <!-- Contact Information -->
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="margin-bottom: 20px;">
                                                        <tr>
                                                            <td style="text-align: center; padding: 5px;">
                                                                <span style="color: #e64f50; margin-right: 8px;">📧</span>
                                                                <a href="mailto:info@kidsinmotionpa.org" style="color: rgba(255, 255, 255, 0.9); text-decoration: none; font-size: 14px;">info@kidsinmotionpa.org</a>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="text-align: center; padding: 5px;">
                                                                <span style="color: #e64f50; margin-right: 8px;">📞</span>
                                                                <a href="tel:+14848856284" style="color: rgba(255, 255, 255, 0.9); text-decoration: none; font-size: 14px;">(484) 885-6284</a>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="text-align: center; padding: 5px;">
                                                                <span style="color: #e64f50; margin-right: 8px;">🌐</span>
                                                                <a href="https://kidsinmotionpa.org" style="color: rgba(255, 255, 255, 0.9); text-decoration: none; font-size: 14px;">kidsinmotionpa.org</a>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <!-- Social Links -->
                                                    <div style="margin-bottom: 15px;">
                                                        <a href="https://kidsinmotionpa.org/events" style="display: inline-block; background: rgba(230, 79, 80, 0.2); color: #ffffff; text-decoration: none; padding: 8px 16px; margin: 0 5px; border-radius: 20px; font-size: 12px; font-weight: 500;">View Events</a>
                                                        <a href="https://kidsinmotionpa.org/volunteer" style="display: inline-block; background: rgba(230, 79, 80, 0.2); color: #ffffff; text-decoration: none; padding: 8px 16px; margin: 0 5px; border-radius: 20px; font-size: 12px; font-weight: 500;">Volunteer</a>
                                                    </div>

                                                    <!-- Unsubscribe -->
                                                    <p style="margin: 0; color: rgba(255, 255, 255, 0.6); font-size: 11px; border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 15px;">
                                                        Don't want to receive these emails?
                                                        <a href="%s" style="color: rgba(255, 255, 255, 0.8); text-decoration: underline;">Unsubscribe here</a>
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
