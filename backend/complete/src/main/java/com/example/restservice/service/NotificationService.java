package com.example.restservice.service;

import com.example.restservice.model.firestore.EventFirestore;
import com.example.restservice.model.firestore.ParticipantFirestore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private MessagingService messagingService;

    @Autowired
    private EmailDeliveryService emailDeliveryService;

    public static class NotificationDeliveryStatus {
        private boolean emailSent;
        private boolean inboxSent;
        private String emailStatusMessage;
        private String inboxStatusMessage;

        public NotificationDeliveryStatus() {}

        public boolean isEmailSent() { return emailSent; }
        public void setEmailSent(boolean emailSent) { this.emailSent = emailSent; }

        public boolean isInboxSent() { return inboxSent; }
        public void setInboxSent(boolean inboxSent) { this.inboxSent = inboxSent; }

        public String getEmailStatusMessage() { return emailStatusMessage; }
        public void setEmailStatusMessage(String emailStatusMessage) { this.emailStatusMessage = emailStatusMessage; }

        public String getInboxStatusMessage() { return inboxStatusMessage; }
        public void setInboxStatusMessage(String inboxStatusMessage) { this.inboxStatusMessage = inboxStatusMessage; }
    }

    @Async
    public void sendRegistrationNotificationsAsync(ParticipantFirestore participant, EventFirestore event, String userEmail, String userId) {
        try {
            // Send email notification with calendar invite
            if (emailDeliveryService.isEnabled()) {
                String emailBody = buildRegistrationConfirmationEmail(participant, event);
                String calendarInvite = generateCalendarInvite(participant, event);
                String calendarFilename = "event_" + event.getName().replaceAll("[^a-zA-Z0-9]", "_") + ".ics";

                boolean emailSent = emailDeliveryService.sendEmailWithAttachment(
                    userEmail,
                    "Registration Confirmed: " + event.getName(),
                    emailBody,
                    Base64.getEncoder().encodeToString(calendarInvite.getBytes()),
                    calendarFilename,
                    "text/calendar"
                );
                logger.info("Registration confirmation email with calendar invite sent to {}: {}", userEmail, emailSent);
            } else {
                logger.info("Email service is disabled, skipping registration confirmation email for {}", userEmail);
            }

            // Send inbox message
            Map<String, Object> inboxMessage = buildRegistrationInboxMessage(participant, event);
            boolean inboxSent = messagingService.sendInboxMessage(userId, inboxMessage);
            logger.info("Registration inbox message sent to user {}: {}", userId, inboxSent);

        } catch (Exception notificationException) {
            // Log notification failures
            logger.warn("Failed to send registration notifications for user {} and event {}: {}",
                      userId, event.getName(), notificationException.getMessage());
        }
    }

    public NotificationDeliveryStatus sendRegistrationNotifications(ParticipantFirestore participant, EventFirestore event, String userEmail, String userId) {
        NotificationDeliveryStatus status = new NotificationDeliveryStatus();

        try {
            // Send email notification with calendar invite
            if (emailDeliveryService.isEnabled()) {
                String emailBody = buildRegistrationConfirmationEmail(participant, event);
                String calendarInvite = generateCalendarInvite(participant, event);
                String calendarFilename = "event_" + event.getName().replaceAll("[^a-zA-Z0-9]", "_") + ".ics";

                boolean emailSent = emailDeliveryService.sendEmailWithAttachment(
                    userEmail,
                    "Registration Confirmed: " + event.getName(),
                    emailBody,
                    Base64.getEncoder().encodeToString(calendarInvite.getBytes()),
                    calendarFilename,
                    "text/calendar"
                );

                status.setEmailSent(emailSent);
                status.setEmailStatusMessage(emailSent ?
                    "Registration confirmation email sent successfully" :
                    "Failed to send registration confirmation email");

                logger.info("Registration confirmation email with calendar invite sent to {}: {}", userEmail, emailSent);
            } else {
                status.setEmailSent(false);
                status.setEmailStatusMessage("Email service is disabled or not configured");
                logger.info("Email service is disabled, skipping registration confirmation email for {}", userEmail);
            }

            // Send inbox message
            Map<String, Object> inboxMessage = buildRegistrationInboxMessage(participant, event);
            boolean inboxSent = messagingService.sendInboxMessage(userId, inboxMessage);

            status.setInboxSent(inboxSent);
            status.setInboxStatusMessage(inboxSent ?
                "Registration notification sent to inbox" :
                "Failed to send registration notification to inbox");

            logger.info("Registration inbox message sent to user {}: {}", userId, inboxSent);

        } catch (Exception notificationException) {
            logger.warn("Failed to send registration notifications for user {} and event {}: {}",
                      userId, event.getName(), notificationException.getMessage());

            if (!status.isEmailSent()) {
                status.setEmailStatusMessage("Error occurred while sending email: " + notificationException.getMessage());
            }
            if (!status.isInboxSent()) {
                status.setInboxStatusMessage("Error occurred while sending inbox message: " + notificationException.getMessage());
            }
        }

        return status;
    }

    // Helper method to format event date
    private String formatEventDate(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return "TBD";
        }
        try {
            LocalDate date = LocalDate.parse(dateString);
            return date.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
        } catch (Exception e) {
            logger.warn("Failed to parse date string: {}", dateString);
            return "TBD";
        }
    }

    // Helper method to format event time
    private String formatEventTime(String timeString) {
        if (timeString == null || timeString.trim().isEmpty()) {
            return "TBD";
        }
        try {
            LocalTime time = LocalTime.parse(timeString);
            return time.format(DateTimeFormatter.ofPattern("h:mm a"));
        } catch (Exception e) {
            logger.warn("Failed to parse time string: {}", timeString);
            return "TBD";
        }
    }

    // Helper method to format event date and time range
    private String formatEventDateTime(String dateString, String startTime, String endTime) {
        String formattedDate = formatEventDate(dateString);
        String formattedStartTime = formatEventTime(startTime);
        String formattedEndTime = formatEventTime(endTime);

        if ("TBD".equals(formattedDate)) {
            return "Date and time TBD";
        }

        StringBuilder result = new StringBuilder(formattedDate);

        if (!"TBD".equals(formattedStartTime)) {
            result.append(" from ").append(formattedStartTime);
            if (!"TBD".equals(formattedEndTime)) {
                result.append(" to ").append(formattedEndTime);
            }
        } else if (!"TBD".equals(formattedEndTime)) {
            result.append(" until ").append(formattedEndTime);
        }

        return result.toString();
    }

    // Helper method to build registration confirmation email content with better HTML formatting
    private String buildRegistrationConfirmationEmail(ParticipantFirestore participant, EventFirestore event) {
        StringBuilder emailBody = new StringBuilder();

        // Greeting
        String parentName = participant.getParentUserFirstName();
        if (parentName == null || parentName.trim().isEmpty()) {
            parentName = "Parent/Guardian";
        }
        emailBody.append("Dear ").append(parentName).append(",\n\n");

        // Confirmation with emphasis
        emailBody.append("🎉 <strong>Great news!</strong> Your child ").append(participant.getChildName())
                 .append(" has been successfully registered for ").append("<strong>").append(event.getName()).append("</strong>").append(".\n\n");

        // Event Details section with better styling
        emailBody.append("<h3 style=\"color: #2f506a; margin-top: 25px; margin-bottom: 15px;\">📅 Event Details</h3>\n");
        emailBody.append("<div style=\"background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0;\">\n");
        emailBody.append("<p><strong>Event:</strong> ").append(event.getName()).append("</p>\n");
        emailBody.append("<p><strong>Date & Time:</strong> ").append(formatEventDateTime(event.getDate(), event.getStartTime(), event.getEndTime())).append("</p>\n");

        if (event.getLocation() != null && !event.getLocation().trim().isEmpty()) {
            emailBody.append("<p><strong>Location:</strong> ").append(event.getLocation()).append("</p>\n");
        }

        if (event.getAgeGroup() != null && !event.getAgeGroup().trim().isEmpty()) {
            emailBody.append("<p><strong>Age Group:</strong> ").append(event.getAgeGroup()).append("</p>\n");
        }

        if (event.getPrice() != null && event.getPrice() > 0) {
            emailBody.append("<p><strong>Price:</strong> $").append(String.format("%.2f", event.getPrice())).append("</p>\n");
        }

        emailBody.append("</div>\n\n");

        // Child Information section
        emailBody.append("<h3 style=\"color: #2f506a; margin-top: 25px; margin-bottom: 15px;\">👦 Child Information</h3>\n");
        emailBody.append("<div style=\"background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0;\">\n");
        emailBody.append("<p><strong>Name:</strong> ").append(participant.getChildName()).append("</p>\n");
        emailBody.append("<p><strong>Age:</strong> ").append(participant.getChildAge()).append(" years old</p>\n");

        if (participant.getEmergencyContact() != null && !participant.getEmergencyContact().trim().isEmpty()) {
            emailBody.append("<p><strong>Emergency Contact:</strong> ").append(participant.getEmergencyContact()).append("</p>\n");
        }

        emailBody.append("</div>\n\n");

        // Important Notes section
        emailBody.append("<h3 style=\"color: #2f506a; margin-top: 25px; margin-bottom: 15px;\">⚠️ Important Notes</h3>\n");
        emailBody.append("<ul style=\"padding-left: 20px; line-height: 1.8;\">\n");
        emailBody.append("<li>Please ensure you can drop off and pick up your child at the scheduled times</li>\n");
        emailBody.append("<li>Bring any necessary equipment or materials mentioned in the event description</li>\n");
        emailBody.append("<li>Contact us immediately if your child has any medical concerns or allergies</li>\n");
        emailBody.append("</ul>\n\n");

        // Calendar notice
        emailBody.append("<p style=\"background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;\">📅 <strong>Calendar Invitation:</strong> A calendar file is attached to this email. Click it to add this event to your calendar!</p>\n\n");

        // Cancellation Instructions
        emailBody.append("<h3 style=\"color: #2f506a; margin-top: 25px; margin-bottom: 15px;\">❌ Need to Cancel?</h3>\n");
        emailBody.append("<p>To cancel this registration, please visit your <a href=\"https://kidsinmotionpa.org/dashboard\" style=\"color: #e64f50; text-decoration: none;\">dashboard</a> or contact us directly.</p>\n\n");

        // Thank you message
        emailBody.append("<p style=\"margin-top: 30px;\">Thank you for choosing Kids in Motion! We can't wait to see ").append(participant.getChildName()).append(" at the event.</p>");

        return emailBody.toString();
    }

    // Helper method to build registration inbox message
    private Map<String, Object> buildRegistrationInboxMessage(ParticipantFirestore participant, EventFirestore event) {
        Map<String, Object> message = new HashMap<>();

        message.put("id", "registration_" + System.currentTimeMillis());
        message.put("type", "registration-confirmation");
        message.put("title", "Registration Confirmed: " + event.getName());

        String shortMessage = participant.getChildName() + " is registered for " + event.getName() +
                             " on " + formatEventDate(event.getDate()) + ". Check your email for full details.";
        message.put("message", shortMessage);

        message.put("from", "Kids in Motion");
        message.put("timestamp", LocalDateTime.now().toString());
        message.put("read", false);
        message.put("isSystem", true);
        message.put("actionLink", "/dashboard");
        message.put("actionText", "View Registrations");

        return message;
    }

    // Helper method to generate calendar invite (.ics file content)
    private String generateCalendarInvite(ParticipantFirestore participant, EventFirestore event) {
        StringBuilder ics = new StringBuilder();

        // ICS header
        ics.append("BEGIN:VCALENDAR\r\n");
        ics.append("VERSION:2.0\r\n");
        ics.append("PRODID:-//Kids in Motion//Event Registration//EN\r\n");
        ics.append("CALSCALE:GREGORIAN\r\n");
        ics.append("METHOD:REQUEST\r\n");

        // Event details
        ics.append("BEGIN:VEVENT\r\n");
        ics.append("UID:").append(UUID.randomUUID().toString()).append("@kidsinmotionpa.org\r\n");

        // Date and time formatting
        String dtStart = formatDateTimeForICS(event.getDate(), event.getStartTime());
        String dtEnd = formatDateTimeForICS(event.getDate(), event.getEndTime());

        ics.append("DTSTART:").append(dtStart).append("\r\n");
        ics.append("DTEND:").append(dtEnd).append("\r\n");
        ics.append("DTSTAMP:").append(formatCurrentDateTimeForICS()).append("\r\n");

        // Event information
        ics.append("SUMMARY:").append(escapeICSText(event.getName())).append("\r\n");

        StringBuilder description = new StringBuilder();
        description.append("Child: ").append(participant.getChildName()).append("\\n");
        description.append("Age: ").append(participant.getChildAge()).append(" years old\\n");
        if (event.getAgeGroup() != null && !event.getAgeGroup().trim().isEmpty()) {
            description.append("Age Group: ").append(event.getAgeGroup()).append("\\n");
        }
        if (participant.getEmergencyContact() != null && !participant.getEmergencyContact().trim().isEmpty()) {
            description.append("Emergency Contact: ").append(participant.getEmergencyContact()).append("\\n");
        }
        description.append("\\nFor more details visit: kidsinmotionpa.org");

        ics.append("DESCRIPTION:").append(escapeICSText(description.toString())).append("\r\n");

        if (event.getLocation() != null && !event.getLocation().trim().isEmpty()) {
            ics.append("LOCATION:").append(escapeICSText(event.getLocation())).append("\r\n");
        }

        ics.append("STATUS:CONFIRMED\r\n");
        ics.append("TRANSP:OPAQUE\r\n");
        ics.append("ORGANIZER;CN=Kids in Motion:mailto:info@kidsinmotionpa.org\r\n");

        ics.append("END:VEVENT\r\n");
        ics.append("END:VCALENDAR\r\n");

        return ics.toString();
    }

    // Helper method to format date and time for ICS format (YYYYMMDDTHHMMSS)
    private String formatDateTimeForICS(String dateString, String timeString) {
        try {
            LocalDate date = LocalDate.parse(dateString);
            LocalTime time = timeString != null && !timeString.trim().isEmpty()
                ? LocalTime.parse(timeString)
                : LocalTime.of(9, 0); // Default to 9:00 AM if no time specified

            ZonedDateTime zonedDateTime = ZonedDateTime.of(date, time, ZoneId.of("America/New_York"));
            return zonedDateTime.format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'"));
        } catch (Exception e) {
            logger.warn("Failed to parse date/time for ICS: {} / {}", dateString, timeString);
            // Return current time + 1 hour as fallback
            ZonedDateTime fallback = ZonedDateTime.now(ZoneId.of("America/New_York")).plusHours(1);
            return fallback.format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'"));
        }
    }

    // Helper method to format current date and time for ICS format
    private String formatCurrentDateTimeForICS() {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("America/New_York"));
        return now.format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'"));
    }

    // Helper method to escape special characters in ICS text fields
    private String escapeICSText(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                  .replace(",", "\\,")
                  .replace(";", "\\;")
                  .replace("\n", "\\n")
                  .replace("\r", "");
    }

    /**
     * Sends a custom email verification message using the beautiful Kids in Motion template
     * This replaces Firebase's default verification emails with our branded design
     */
    public boolean sendEmailVerification(String userEmail, String userName, String verificationUrl) {
        try {
            if (!emailDeliveryService.isEnabled()) {
                logger.info("Email service is disabled, skipping email verification for {}", userEmail);
                return false;
            }

            String subject = "Verify Your Email Address - Kids in Motion";
            String emailBody = buildEmailVerificationBody(userName, verificationUrl);

            boolean emailSent = emailDeliveryService.sendEmail(userEmail, subject, emailBody);
            logger.info("Email verification sent to {}: {}", userEmail, emailSent);

            return emailSent;
        } catch (Exception e) {
            logger.error("Failed to send email verification to {}: {}", userEmail, e.getMessage());
            return false;
        }
    }

    /**
     * Builds the email verification message body with HTML styling
     */
    private String buildEmailVerificationBody(String userName, String verificationUrl) {
        StringBuilder body = new StringBuilder();

        body.append("Welcome to Kids in Motion").append(userName != null ? ", " + userName : "").append("!\n\n");
        body.append("<strong>Thank you for joining our community!</strong> To complete your account setup and start registering for events, please verify your email address.\n\n");

        // Verification button
        body.append("<div style=\"text-align: center; margin: 30px 0;\">\n");
        body.append("<a href=\"").append(verificationUrl).append("\" style=\"display: inline-block; background-color: #e64f50; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(230, 79, 80, 0.3);\">Verify My Email</a>\n");
        body.append("</div>\n\n");

        body.append("<p style=\"color: #666; font-size: 14px; margin-top: 20px;\">Or copy and paste this link into your browser:</p>\n");
        body.append("<p style=\"background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px;\">").append(verificationUrl).append("</p>\n\n");

        body.append("<div style=\"background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;\">\n");
        body.append("<p style=\"margin: 0; color: #856404;\"><strong>Important:</strong> This verification link will expire in 24 hours for security purposes.</p>\n");
        body.append("</div>\n\n");

        body.append("If you didn't create an account with Kids in Motion, you can safely ignore this email.\n\n");
        body.append("<p style=\"margin-top: 30px;\"><strong>Welcome aboard!</strong></p>");

        return body.toString();
    }

    /**
     * Sends email verification with verification link
     */
    public boolean sendEmailVerificationNotice(String userEmail, String userName) {
        try {
            if (!emailDeliveryService.isEnabled()) {
                logger.info("Email service is disabled, skipping email verification notice for {}", userEmail);
                return false;
            }

            // Create verification token (simple base64 encoded email + timestamp)
            String verificationToken = Base64.getEncoder().encodeToString(
                (userEmail + "|" + System.currentTimeMillis()).getBytes()
            );

            String verificationUrl = "https://kidsinmotionpa.org/verify-email?token=" + verificationToken;
            String subject = "Verify Your Email - Kids in Motion";
            String emailBody = buildEmailVerificationBody(userName, verificationUrl);

            boolean emailSent = emailDeliveryService.sendEmail(userEmail, subject, emailBody);
            logger.info("Email verification sent to {}: {}", userEmail, emailSent);

            return emailSent;
        } catch (Exception e) {
            logger.error("Failed to send email verification to {}: {}", userEmail, e.getMessage());
            return false;
        }
    }

    /**
     * Builds the welcome email message body for new accounts with HTML styling
     */
    private String buildWelcomeEmailBody(String userName) {
        StringBuilder body = new StringBuilder();

        body.append("Welcome to Kids in Motion").append(userName != null ? ", " + userName : "").append("!\n\n");
        body.append("🎉 <strong>Your account has been successfully created!</strong> You can now:\n\n");
        body.append("<div style=\"background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0;\">\n");
        body.append("<ul style=\"padding-left: 20px; line-height: 1.8; margin: 0;\">\n");
        body.append("<li>Register your children for upcoming events</li>\n");
        body.append("<li>View event schedules and details</li>\n");
        body.append("<li>Sign up for volunteer opportunities</li>\n");
        body.append("<li>Stay updated with announcements</li>\n");
        body.append("</ul>\n");
        body.append("</div>\n\n");

        body.append("<div style=\"text-align: center; margin: 30px 0;\">\n");
        body.append("<a href=\"https://kidsinmotionpa.org\" style=\"display: inline-block; background-color: #e64f50; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;\">Get Started →</a>\n");
        body.append("</div>\n\n");

        body.append("If you have any questions, feel free to reach out to us at <a href=\"mailto:info@kidsinmotionpa.org\" style=\"color: #e64f50;\">info@kidsinmotionpa.org</a>.\n\n");
        body.append("<p style=\"margin-top: 30px;\"><strong>Welcome to the family!</strong></p>");

        return body.toString();
    }
}