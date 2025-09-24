package com.example.restservice.repository;

import com.example.restservice.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    // Find active announcements that should be delivered to website
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true AND a.sendToWebsite = true " +
           "AND (a.scheduledFor IS NULL OR a.scheduledFor <= :now) " +
           "ORDER BY a.createdAt DESC")
    List<Announcement> findActiveWebsiteAnnouncements(@Param("now") LocalDateTime now);

    // Find announcements by target audience
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true AND a.sendToWebsite = true " +
           "AND a.targetAudience = :targetAudience " +
           "AND (a.scheduledFor IS NULL OR a.scheduledFor <= :now) " +
           "ORDER BY a.createdAt DESC")
    List<Announcement> findAnnouncementsByTargetAudience(
            @Param("targetAudience") Announcement.TargetAudience targetAudience,
            @Param("now") LocalDateTime now
    );

    // Find recent announcements (last 30 days)
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true AND a.sendToWebsite = true " +
           "AND a.createdAt >= :since " +
           "AND (a.scheduledFor IS NULL OR a.scheduledFor <= :now) " +
           "ORDER BY a.createdAt DESC")
    List<Announcement> findRecentAnnouncements(@Param("since") LocalDateTime since, @Param("now") LocalDateTime now);

    // Find all announcements for admin management
    @Query("SELECT a FROM Announcement a ORDER BY a.createdAt DESC")
    List<Announcement> findAllOrderByCreatedAtDesc();

    // Find announcements that need email delivery
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true AND a.sendToEmail = true " +
           "AND (a.scheduledFor IS NULL OR a.scheduledFor <= :now)")
    List<Announcement> findAnnouncementsForEmailDelivery(@Param("now") LocalDateTime now);

    // Find announcements that need SMS delivery
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true AND a.sendToPhone = true " +
           "AND (a.scheduledFor IS NULL OR a.scheduledFor <= :now)")
    List<Announcement> findAnnouncementsForSmsDelivery(@Param("now") LocalDateTime now);
}