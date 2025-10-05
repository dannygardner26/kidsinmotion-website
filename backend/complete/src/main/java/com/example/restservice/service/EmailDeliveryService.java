package com.example.restservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class EmailDeliveryService {

    private static final Logger logger = LoggerFactory.getLogger(EmailDeliveryService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

<<<<<<< HEAD
    @Value("")
    private boolean emailEnabled;

    @Value("")
=======
    @Value("${app.messaging.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.messaging.email.from:no-reply@kidsinmotion.org}")
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
    private String defaultFromAddress;

    public boolean isEnabled() {
        return emailEnabled && mailSender != null;
    }

    public boolean sendEmail(String toAddress, String subject, String body) {
        if (!emailEnabled) {
            logger.debug("Email delivery disabled via configuration - skipping message to {}", toAddress);
            return false;
        }

        if (mailSender == null) {
            logger.warn("JavaMailSender bean not configured - unable to send email to {}", toAddress);
            return false;
        }

        if (!StringUtils.hasText(toAddress)) {
            logger.debug("No email address provided - skipping email delivery");
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toAddress);
            message.setSubject(subject);
            message.setText(body);
            if (StringUtils.hasText(defaultFromAddress)) {
                message.setFrom(defaultFromAddress);
            }

            mailSender.send(message);
            logger.debug("Email sent successfully to {}", toAddress);
            return true;
        } catch (MailException ex) {
            logger.error("Failed to send email to {}: {}", toAddress, ex.getMessage());
            return false;
        }
    }
}
