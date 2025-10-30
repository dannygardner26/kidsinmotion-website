package com.example.restservice.service;

import com.example.restservice.model.firestore.EventFirestore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
public class CalendarInviteService {

    private static final Logger logger = LoggerFactory.getLogger(CalendarInviteService.class);
    private static final DateTimeFormatter ICAL_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
    private static final ZoneId TIMEZONE = ZoneId.of("America/New_York"); // Eastern Time for Pennsylvania

    public String generateICalInvite(EventFirestore event, String participantName) {
        if (event == null) {
            logger.warn("Cannot generate calendar invite for null event");
            return null;
        }

        try {
            StringBuilder ical = new StringBuilder();

            // ICS header
            ical.append("BEGIN:VCALENDAR\r\n");
            ical.append("VERSION:2.0\r\n");
            ical.append("PRODID:-//Kids in Motion//Event Management//EN\r\n");
            ical.append("METHOD:REQUEST\r\n");
            ical.append("CALSCALE:GREGORIAN\r\n");

            // Event details
            ical.append("BEGIN:VEVENT\r\n");
            ical.append("UID:").append(generateUID(event.getId())).append("\r\n");
            ical.append("DTSTAMP:").append(formatDateTimeForICal(LocalDateTime.now())).append("\r\n");

            // Parse event date and times
            LocalDate eventDate = parseEventDate(event.getDate());
            LocalTime startTime = parseEventTime(event.getStartTime());
            LocalTime endTime = parseEventTime(event.getEndTime());

            if (eventDate != null) {
                if (startTime != null) {
                    LocalDateTime startDateTime = LocalDateTime.of(eventDate, startTime);
                    ical.append("DTSTART:").append(formatDateTimeForICal(startDateTime)).append("\r\n");

                    if (endTime != null) {
                        LocalDateTime endDateTime = LocalDateTime.of(eventDate, endTime);
                        ical.append("DTEND:").append(formatDateTimeForICal(endDateTime)).append("\r\n");
                    } else {
                        // Default to 2 hours if no end time
                        LocalDateTime endDateTime = startDateTime.plusHours(2);
                        ical.append("DTEND:").append(formatDateTimeForICal(endDateTime)).append("\r\n");
                    }
                } else {
                    // All-day event if no start time
                    ical.append("DTSTART;VALUE=DATE:").append(eventDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"))).append("\r\n");
                    ical.append("DTEND;VALUE=DATE:").append(eventDate.plusDays(1).format(DateTimeFormatter.ofPattern("yyyyMMdd"))).append("\r\n");
                }
            }

            // Event details
            ical.append("SUMMARY:").append(escapeICalText(event.getName())).append("\r\n");

            if (event.getDescription() != null && !event.getDescription().trim().isEmpty()) {
                ical.append("DESCRIPTION:").append(escapeICalText(event.getDescription())).append("\r\n");
            }

            if (event.getLocation() != null && !event.getLocation().trim().isEmpty()) {
                ical.append("LOCATION:").append(escapeICalText(event.getLocation())).append("\r\n");
            }

            // Status and priority
            ical.append("STATUS:CONFIRMED\r\n");
            ical.append("PRIORITY:5\r\n");

            // Organizer
            ical.append("ORGANIZER;CN=Kids in Motion:mailto:info@kidsinmotionpa.org\r\n");

            // Attendee (participant)
            if (participantName != null && !participantName.trim().isEmpty()) {
                ical.append("ATTENDEE;CN=").append(escapeICalText(participantName))
                      .append(";RSVP=TRUE;PARTSTAT=NEEDS-ACTION:mailto:participant@kidsinmotionpa.org\r\n");
            }

            // Categories
            ical.append("CATEGORIES:Kids in Motion Event");
            if (event.getAgeGroup() != null && !event.getAgeGroup().trim().isEmpty()) {
                ical.append(",").append(escapeICalText(event.getAgeGroup()));
            }
            ical.append("\r\n");

            // End event
            ical.append("END:VEVENT\r\n");

            // End calendar
            ical.append("END:VCALENDAR\r\n");

            return ical.toString();

        } catch (Exception e) {
            logger.error("Error generating calendar invite for event {}: {}", event.getId(), e.getMessage());
            return null;
        }
    }

    public String generateBase64ICalInvite(EventFirestore event, String participantName) {
        String icalContent = generateICalInvite(event, participantName);
        if (icalContent != null) {
            return Base64.getEncoder().encodeToString(icalContent.getBytes());
        }
        return null;
    }

    private String generateUID(String eventId) {
        return eventId + "@kidsinmotionpa.org";
    }

    private String formatDateTimeForICal(LocalDateTime dateTime) {
        return dateTime.atZone(TIMEZONE).toInstant().atZone(ZoneId.of("UTC")).format(ICAL_FORMAT);
    }

    private LocalDate parseEventDate(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(dateString);
        } catch (Exception e) {
            logger.warn("Failed to parse event date: {}", dateString);
            return null;
        }
    }

    private LocalTime parseEventTime(String timeString) {
        if (timeString == null || timeString.trim().isEmpty()) {
            return null;
        }
        try {
            // Handle various time formats
            if (timeString.matches("\\d{1,2}:\\d{2}")) {
                return LocalTime.parse(timeString + ":00");
            }
            return LocalTime.parse(timeString);
        } catch (Exception e) {
            logger.warn("Failed to parse event time: {}", timeString);
            return null;
        }
    }

    private String escapeICalText(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                  .replace(",", "\\,")
                  .replace(";", "\\;")
                  .replace("\n", "\\n")
                  .replace("\r", "");
    }
}