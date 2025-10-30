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

    // Helper method to build registration confirmation email content
    private String buildRegistrationConfirmationEmail(ParticipantFirestore participant, EventFirestore event) {
        StringBuilder emailBody = new StringBuilder();

        // Greeting
        String parentName = participant.getParentUserFirstName();
        if (parentName == null || parentName.trim().isEmpty()) {
            parentName = "Parent/Guardian";
        }
        emailBody.append("Dear ").append(parentName).append(",\n\n");

        // Confirmation
        emailBody.append("Your child ").append(participant.getChildName())
                 .append(" has been successfully registered for ").append(event.getName()).append(".\n\n");

        // Event Details section
        emailBody.append("EVENT DETAILS:\n");
        emailBody.append("Event: ").append(event.getName()).append("\n");
        emailBody.append("Date & Time: ").append(formatEventDateTime(event.getDate(), event.getStartTime(), event.getEndTime())).append("\n");

        if (event.getLocation() != null && !event.getLocation().trim().isEmpty()) {
            emailBody.append("Location: ").append(event.getLocation()).append("\n");
        }

        if (event.getAgeGroup() != null && !event.getAgeGroup().trim().isEmpty()) {
            emailBody.append("Age Group: ").append(event.getAgeGroup()).append("\n");
        }

        if (event.getPrice() != null && event.getPrice() > 0) {
            emailBody.append("Price: $").append(String.format("%.2f", event.getPrice())).append("\n");
        }

        emailBody.append("\n");

        // Child Information section
        emailBody.append("CHILD INFORMATION:\n");
        emailBody.append("Name: ").append(participant.getChildName()).append("\n");
        emailBody.append("Age: ").append(participant.getChildAge()).append(" years old\n");

        if (participant.getEmergencyContact() != null && !participant.getEmergencyContact().trim().isEmpty()) {
            emailBody.append("Emergency Contact: ").append(participant.getEmergencyContact()).append("\n");
        }

        emailBody.append("\n");

        // Important Notes section
        emailBody.append("IMPORTANT NOTES:\n");
        emailBody.append("• Please ensure you can drop off and pick up your child at the scheduled times\n");
        emailBody.append("• Bring any necessary equipment or materials mentioned in the event description\n");
        emailBody.append("• Contact us immediately if your child has any medical concerns or allergies\n\n");

        // Cancellation Instructions
        emailBody.append("CANCELLATION:\n");
        emailBody.append("To cancel this registration, please visit your dashboard at kidsinmotionpa.org or contact us directly.\n\n");

        // Signature
        emailBody.append("Thank you,\n");
        emailBody.append("Kids in Motion Team\n");
        emailBody.append("Email: info@kidsinmotionpa.org");

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
}