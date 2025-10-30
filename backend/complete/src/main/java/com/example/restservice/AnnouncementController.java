package com.example.restservice;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    // Get active announcements (public endpoint)
    @GetMapping("/active")
    public ResponseEntity<?> getActiveAnnouncements() {
        // Return empty list for now - can be enhanced later
        List<Map<String, Object>> announcements = new ArrayList<>();
        return ResponseEntity.ok(announcements);
    }

    // Get recent announcements (public endpoint)
    @GetMapping("/recent")
    public ResponseEntity<?> getRecentAnnouncements() {
        // Return empty list for now - can be enhanced later
        List<Map<String, Object>> announcements = new ArrayList<>();
        return ResponseEntity.ok(announcements);
    }
}