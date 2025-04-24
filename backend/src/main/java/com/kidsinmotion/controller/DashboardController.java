package com.kidsinmotion.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @GetMapping
    public ResponseEntity<?> getDashboardData(/* Principal principal */) {
        // TODO: Implement logic to fetch dashboard data for the authenticated user
        return ResponseEntity.ok("Dashboard data endpoint");
    }
}