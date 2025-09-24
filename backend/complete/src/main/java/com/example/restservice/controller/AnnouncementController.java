package com.example.restservice.controller;

import com.example.restservice.model.Announcement;
import com.example.restservice.service.AnnouncementService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    // Get active announcements for website display (public endpoint)
    @GetMapping("/active")
    public ResponseEntity<List<Announcement>> getActiveAnnouncements() {
        try {
            List<Announcement> announcements = announcementService.getActiveWebsiteAnnouncements();
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get recent announcements (public endpoint)
    @GetMapping("/recent")
    public ResponseEntity<List<Announcement>> getRecentAnnouncements() {
        try {
            List<Announcement> announcements = announcementService.getRecentAnnouncements();
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get announcements by target audience (requires authentication)
    @GetMapping("/by-audience/{audience}")
    public ResponseEntity<List<Announcement>> getAnnouncementsByAudience(
            @PathVariable String audience,
            HttpServletRequest request) {
        try {
            // Convert string to enum
            Announcement.TargetAudience targetAudience = Announcement.TargetAudience.valueOf(audience.toUpperCase());
            List<Announcement> announcements = announcementService.getAnnouncementsByTargetAudience(targetAudience);
            return ResponseEntity.ok(announcements);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Create new announcement (admin only)
    @PostMapping
    public ResponseEntity<Announcement> createAnnouncement(
            @RequestBody Announcement announcement,
            HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Check if user is admin
            if (!announcementService.isUserAdmin(firebaseUid)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Announcement createdAnnouncement = announcementService.createAnnouncement(announcement, firebaseUid);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdAnnouncement);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get all announcements for admin management
    @GetMapping("/admin/all")
    public ResponseEntity<List<Announcement>> getAllAnnouncements(HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Check if user is admin
            if (!announcementService.isUserAdmin(firebaseUid)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            List<Announcement> announcements = announcementService.getAllAnnouncements();
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get announcement by ID (admin only)
    @GetMapping("/{id}")
    public ResponseEntity<Announcement> getAnnouncementById(
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Check if user is admin
            if (!announcementService.isUserAdmin(firebaseUid)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Optional<Announcement> announcement = announcementService.getAnnouncementById(id);
            return announcement.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Update announcement (admin only)
    @PutMapping("/{id}")
    public ResponseEntity<Announcement> updateAnnouncement(
            @PathVariable Long id,
            @RequestBody Announcement announcement,
            HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Check if user is admin
            if (!announcementService.isUserAdmin(firebaseUid)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Announcement updatedAnnouncement = announcementService.updateAnnouncement(id, announcement, firebaseUid);
            return ResponseEntity.ok(updatedAnnouncement);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Delete announcement (admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnnouncement(
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Check if user is admin
            if (!announcementService.isUserAdmin(firebaseUid)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            announcementService.deleteAnnouncement(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Permanently delete announcement (admin only)
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> permanentlyDeleteAnnouncement(
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Check if user is admin
            if (!announcementService.isUserAdmin(firebaseUid)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            announcementService.permanentlyDeleteAnnouncement(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Test endpoint for creating sample announcements (development only)
    @PostMapping("/test/sample")
    public ResponseEntity<Announcement> createSampleAnnouncement(HttpServletRequest request) {
        try {
            String firebaseUid = (String) request.getAttribute("firebaseUid");

            if (firebaseUid == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Check if user is admin
            if (!announcementService.isUserAdmin(firebaseUid)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Create a sample announcement
            Announcement sampleAnnouncement = new Announcement();
            sampleAnnouncement.setTitle("Welcome to Kids in Motion!");
            sampleAnnouncement.setMessage("Thank you for being part of our community. Stay tuned for upcoming events and opportunities to get involved!");
            sampleAnnouncement.setType(Announcement.AnnouncementType.ANNOUNCEMENT);
            sampleAnnouncement.setSendToWebsite(true);
            sampleAnnouncement.setSendToEmail(false);
            sampleAnnouncement.setSendToPhone(false);
            sampleAnnouncement.setTargetAudience(Announcement.TargetAudience.ALL_USERS);

            Announcement createdAnnouncement = announcementService.createAnnouncement(sampleAnnouncement, firebaseUid);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdAnnouncement);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}