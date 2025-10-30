package com.example.restservice.service;

import com.example.restservice.model.Announcement;
import com.example.restservice.model.User;
import com.example.restservice.repository.AnnouncementRepository;
import com.example.restservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

// @Service - Disabled until converted to Firestore
public class AnnouncementService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private UserRepository userRepository;

    // Create a new announcement
    public Announcement createAnnouncement(Announcement announcement, String creatorUid) {
        // Set creator information
        announcement.setCreatedBy(creatorUid);

        // Try to get creator's email from user repository
        Optional<User> creator = userRepository.findByFirebaseUid(creatorUid);
        if (creator.isPresent()) {
            announcement.setCreatedByEmail(creator.get().getEmail());
        }

        // Set creation timestamp
        announcement.setCreatedAt(LocalDateTime.now());

        return announcementRepository.save(announcement);
    }

    // Get active announcements for website display
    public List<Announcement> getActiveWebsiteAnnouncements() {
        return announcementRepository.findActiveWebsiteAnnouncements(LocalDateTime.now());
    }

    // Get announcements by target audience
    public List<Announcement> getAnnouncementsByTargetAudience(Announcement.TargetAudience targetAudience) {
        if (targetAudience == Announcement.TargetAudience.ALL_USERS) {
            return getActiveWebsiteAnnouncements();
        }
        return announcementRepository.findAnnouncementsByTargetAudience(targetAudience, LocalDateTime.now());
    }

    // Get recent announcements (last 30 days)
    public List<Announcement> getRecentAnnouncements() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return announcementRepository.findRecentAnnouncements(thirtyDaysAgo, LocalDateTime.now());
    }

    // Get all announcements for admin management
    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAllOrderByCreatedAtDesc();
    }

    // Get announcement by ID
    public Optional<Announcement> getAnnouncementById(Long id) {
        return announcementRepository.findById(id);
    }

    // Update announcement
    public Announcement updateAnnouncement(Long id, Announcement updatedAnnouncement, String updaterUid) {
        return announcementRepository.findById(id)
                .map(announcement -> {
                    // Update fields
                    announcement.setTitle(updatedAnnouncement.getTitle());
                    announcement.setMessage(updatedAnnouncement.getMessage());
                    announcement.setType(updatedAnnouncement.getType());
                    announcement.setSendToWebsite(updatedAnnouncement.getSendToWebsite());
                    announcement.setSendToEmail(updatedAnnouncement.getSendToEmail());
                    announcement.setSendToPhone(updatedAnnouncement.getSendToPhone());
                    announcement.setTargetAudience(updatedAnnouncement.getTargetAudience());
                    announcement.setScheduledFor(updatedAnnouncement.getScheduledFor());
                    announcement.setIsActive(updatedAnnouncement.getIsActive());

                    return announcementRepository.save(announcement);
                })
                .orElseThrow(() -> new RuntimeException("Announcement not found with id: " + id));
    }

    // Delete announcement (soft delete by setting isActive to false)
    public void deleteAnnouncement(Long id) {
        announcementRepository.findById(id)
                .map(announcement -> {
                    announcement.setIsActive(false);
                    return announcementRepository.save(announcement);
                })
                .orElseThrow(() -> new RuntimeException("Announcement not found with id: " + id));
    }

    // Hard delete announcement (for admin use)
    public void permanentlyDeleteAnnouncement(Long id) {
        announcementRepository.deleteById(id);
    }

    // Get announcements that need email delivery
    public List<Announcement> getAnnouncementsForEmailDelivery() {
        return announcementRepository.findAnnouncementsForEmailDelivery(LocalDateTime.now());
    }

    // Get announcements that need SMS delivery
    public List<Announcement> getAnnouncementsForSmsDelivery() {
        return announcementRepository.findAnnouncementsForSmsDelivery(LocalDateTime.now());
    }

    // Check if user has admin privileges
    public boolean isUserAdmin(String firebaseUid) {
        // Handle test admin case first
        if ("test-admin-uid".equals(firebaseUid)) {
            return true;
        }

        Optional<User> user = userRepository.findByFirebaseUid(firebaseUid);
        if (user.isPresent()) {
            User foundUser = user.get();

            // Check by email for known admin
            if ("kidsinmotion0@gmail.com".equalsIgnoreCase(foundUser.getEmail()) || "kidsinmotion@gmail.com".equalsIgnoreCase(foundUser.getEmail())) {
                return true;
            }

            // Check if user has admin role in their roles collection
            // This should work with the existing role system
            return foundUser.getRoles().stream()
                    .anyMatch(role -> "ROLE_ADMIN".equals(role.getName().toString()));
        }
        return false;
    }
}
