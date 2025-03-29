package org.kidsinmotion.dao;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.kidsinmotion.model.Event;
import org.kidsinmotion.model.User;
import org.kidsinmotion.model.Volunteer;
import org.kidsinmotion.util.DatabaseUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for VolunteerDAO.
 * These tests require a test database to be set up.
 */
class VolunteerDAOTest {
    
    private VolunteerDAO volunteerDAO;
    private UserDAO userDAO;
    private EventDAO eventDAO;
    private Connection conn;
    
    private int testUser1Id;
    private int testUser2Id;
    private int testEventId;
    private int otherEventId;
    
    @BeforeEach
    void setUp() throws SQLException {
        volunteerDAO = new VolunteerDAO();
        userDAO = new UserDAO();
        eventDAO = new EventDAO();
        
        // Get a connection
        conn = DatabaseUtil.getConnection();
        
        // Clear volunteers table for testing
        try (PreparedStatement stmt = conn.prepareStatement("DELETE FROM volunteers")) {
            stmt.executeUpdate();
        }
        
        // Set up test users if needed
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT id FROM users WHERE email = ?")) {
            
            // First test user
            stmt.setString(1, "volunteer1@example.com");
            ResultSet rs = stmt.executeQuery();
            
            if (!rs.next()) {
                // Insert first test user
                User testUser1 = new User();
                testUser1.setEmail("volunteer1@example.com");
                testUser1.setPasswordHash("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG");
                testUser1.setFirstName("Volunteer");
                testUser1.setLastName("One");
                testUser1.setRole("VOLUNTEER");
                testUser1.setPhoneNumber("555-111-1111");
                
                User savedUser1 = userDAO.save(testUser1);
                testUser1Id = savedUser1.getId();
            } else {
                testUser1Id = rs.getInt("id");
            }
            
            // Second test user
            stmt.setString(1, "volunteer2@example.com");
            rs = stmt.executeQuery();
            
            if (!rs.next()) {
                // Insert second test user
                User testUser2 = new User();
                testUser2.setEmail("volunteer2@example.com");
                testUser2.setPasswordHash("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG");
                testUser2.setFirstName("Volunteer");
                testUser2.setLastName("Two");
                testUser2.setRole("VOLUNTEER");
                testUser2.setPhoneNumber("555-222-2222");
                
                User savedUser2 = userDAO.save(testUser2);
                testUser2Id = savedUser2.getId();
            } else {
                testUser2Id = rs.getInt("id");
            }
        }
        
        // Set up test events if needed
        LocalDateTime now = LocalDateTime.now();
        
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT id FROM events WHERE title = ?")) {
            
            // Main test event
            stmt.setString(1, "Volunteer Test Event");
            ResultSet rs = stmt.executeQuery();
            
            if (!rs.next()) {
                // Insert test event
                Event testEvent = new Event();
                testEvent.setTitle("Volunteer Test Event");
                testEvent.setDescription("Test event for volunteer tests");
                testEvent.setEventType("CLINIC");
                testEvent.setSportType("BASEBALL");
                testEvent.setLocation("Test Field");
                testEvent.setStartDate(now.plusDays(7));
                testEvent.setEndDate(now.plusDays(7).plusHours(3));
                testEvent.setMaxParticipants(20);
                testEvent.setNeedsVolunteers(true);
                testEvent.setVolunteerCountNeeded(5);
                
                Event savedEvent = eventDAO.save(testEvent);
                testEventId = savedEvent.getId();
            } else {
                testEventId = rs.getInt("id");
            }
            
            // Other test event
            stmt.setString(1, "Other Test Event");
            rs = stmt.executeQuery();
            
            if (!rs.next()) {
                // Insert other test event
                Event otherEvent = new Event();
                otherEvent.setTitle("Other Test Event");
                otherEvent.setDescription("Another test event for volunteer tests");
                otherEvent.setEventType("CLINIC");
                otherEvent.setSportType("SOCCER");
                otherEvent.setLocation("Other Field");
                otherEvent.setStartDate(now.plusDays(14));
                otherEvent.setEndDate(now.plusDays(14).plusHours(2));
                otherEvent.setMaxParticipants(15);
                otherEvent.setNeedsVolunteers(true);
                otherEvent.setVolunteerCountNeeded(3);
                
                Event savedEvent = eventDAO.save(otherEvent);
                otherEventId = savedEvent.getId();
            } else {
                otherEventId = rs.getInt("id");
            }
        }
        
        // Insert test volunteers
        try (PreparedStatement stmt = conn.prepareStatement(
                "INSERT INTO volunteers (user_id, event_id, status, notes) " +
                "VALUES (?, ?, ?, ?)")) {
            
            // Volunteer 1 for main event (CONFIRMED)
            stmt.setInt(1, testUser1Id);
            stmt.setInt(2, testEventId);
            stmt.setString(3, "CONFIRMED");
            stmt.setString(4, "Experienced baseball coach");
            stmt.executeUpdate();
            
            // Volunteer 2 for main event (PENDING)
            stmt.setInt(1, testUser2Id);
            stmt.setInt(2, testEventId);
            stmt.setString(3, "PENDING");
            stmt.setString(4, "Available all day");
            stmt.executeUpdate();
            
            // Volunteer 1 for other event (PENDING)
            stmt.setInt(1, testUser1Id);
            stmt.setInt(2, otherEventId);
            stmt.setString(3, "PENDING");
            stmt.setString(4, "Can help with equipment");
            stmt.executeUpdate();
        }
    }
    
    @Test
    void testFindById() throws SQLException {
        // Find the ID of Volunteer 1 for main event
        int volunteerId;
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT id FROM volunteers WHERE user_id = ? AND event_id = ?")) {
            stmt.setInt(1, testUser1Id);
            stmt.setInt(2, testEventId);
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "Volunteer should exist");
            volunteerId = rs.getInt("id");
        }
        
        // Test finding by ID
        Optional<Volunteer> volunteerOpt = volunteerDAO.findById(volunteerId);
        assertTrue(volunteerOpt.isPresent(), "Volunteer should be found");
        
        Volunteer volunteer = volunteerOpt.get();
        assertEquals(testUser1Id, volunteer.getUserId());
        assertEquals(testEventId, volunteer.getEventId());
        assertEquals("CONFIRMED", volunteer.getStatus());
        assertEquals("Experienced baseball coach", volunteer.getNotes());
        
        // Check that related entities are populated
        assertNotNull(volunteer.getUser(), "User should be populated");
        assertNotNull(volunteer.getEvent(), "Event should be populated");
        assertEquals("Volunteer", volunteer.getUser().getFirstName());
        assertEquals("Volunteer Test Event", volunteer.getEvent().getTitle());
    }
    
    @Test
    void testFindByUserId() {
        // Test finding volunteers for User 1
        List<Volunteer> user1Volunteers = volunteerDAO.findByUserId(testUser1Id);
        assertEquals(2, user1Volunteers.size(), "Should find 2 volunteers for User 1");
        
        // Verify our test volunteers are in the list
        boolean foundForMainEvent = false;
        boolean foundForOtherEvent = false;
        
        for (Volunteer v : user1Volunteers) {
            if (v.getEventId() == testEventId) {
                foundForMainEvent = true;
                assertEquals("CONFIRMED", v.getStatus(), "Status should be CONFIRMED");
            } else if (v.getEventId() == otherEventId) {
                foundForOtherEvent = true;
                assertEquals("PENDING", v.getStatus(), "Status should be PENDING");
            }
        }
        
        assertTrue(foundForMainEvent, "Should find volunteer for main event");
        assertTrue(foundForOtherEvent, "Should find volunteer for other event");
        
        // Test finding volunteers for User 2
        List<Volunteer> user2Volunteers = volunteerDAO.findByUserId(testUser2Id);
        assertEquals(1, user2Volunteers.size(), "Should find 1 volunteer for User 2");
        assertEquals(testEventId, user2Volunteers.get(0).getEventId(), "Event ID should match");
        assertEquals("PENDING", user2Volunteers.get(0).getStatus(), "Status should be PENDING");
    }
    
    @Test
    void testFindByEventId() {
        // Test finding volunteers for main event
        List<Volunteer> mainEventVolunteers = volunteerDAO.findByEventId(testEventId);
        assertEquals(2, mainEventVolunteers.size(), "Should find 2 volunteers for main event");
        
        // Verify both users are in the list
        boolean foundUser1 = false;
        boolean foundUser2 = false;
        
        for (Volunteer v : mainEventVolunteers) {
            if (v.getUserId() == testUser1Id) {
                foundUser1 = true;
                assertEquals("CONFIRMED", v.getStatus(), "Status should be CONFIRMED");
            } else if (v.getUserId() == testUser2Id) {
                foundUser2 = true;
                assertEquals("PENDING", v.getStatus(), "Status should be PENDING");
            }
        }
        
        assertTrue(foundUser1, "Should find User 1");
        assertTrue(foundUser2, "Should find User 2");
        
        // Test finding volunteers for other event
        List<Volunteer> otherEventVolunteers = volunteerDAO.findByEventId(otherEventId);
        assertEquals(1, otherEventVolunteers.size(), "Should find 1 volunteer for other event");
        assertEquals(testUser1Id, otherEventVolunteers.get(0).getUserId(), "User ID should match");
        assertEquals("PENDING", otherEventVolunteers.get(0).getStatus(), "Status should be PENDING");
    }
    
    @Test
    void testFindByStatus() {
        // Test finding CONFIRMED volunteers
        List<Volunteer> confirmedVolunteers = volunteerDAO.findByStatus("CONFIRMED");
        assertEquals(1, confirmedVolunteers.size(), "Should find 1 CONFIRMED volunteer");
        assertEquals(testUser1Id, confirmedVolunteers.get(0).getUserId(), "User ID should match");
        assertEquals(testEventId, confirmedVolunteers.get(0).getEventId(), "Event ID should match");
        
        // Test finding PENDING volunteers
        List<Volunteer> pendingVolunteers = volunteerDAO.findByStatus("PENDING");
        assertEquals(2, pendingVolunteers.size(), "Should find 2 PENDING volunteers");
        
        // Test finding CANCELED volunteers (none)
        List<Volunteer> canceledVolunteers = volunteerDAO.findByStatus("CANCELED");
        assertEquals(0, canceledVolunteers.size(), "Should find 0 CANCELED volunteers");
    }
    
    @Test
    void testFindByUserIdAndEventId() {
        // Test finding User 1 for main event
        Optional<Volunteer> volunteerOpt = volunteerDAO.findByUserIdAndEventId(testUser1Id, testEventId);
        assertTrue(volunteerOpt.isPresent(), "Volunteer should be found");
        assertEquals("CONFIRMED", volunteerOpt.get().getStatus(), "Status should be CONFIRMED");
        
        // Test finding User 2 for main event
        volunteerOpt = volunteerDAO.findByUserIdAndEventId(testUser2Id, testEventId);
        assertTrue(volunteerOpt.isPresent(), "Volunteer should be found");
        assertEquals("PENDING", volunteerOpt.get().getStatus(), "Status should be PENDING");
        
        // Test finding User 1 for other event
        volunteerOpt = volunteerDAO.findByUserIdAndEventId(testUser1Id, otherEventId);
        assertTrue(volunteerOpt.isPresent(), "Volunteer should be found");
        assertEquals("PENDING", volunteerOpt.get().getStatus(), "Status should be PENDING");
        
        // Test finding non-existent combination
        volunteerOpt = volunteerDAO.findByUserIdAndEventId(testUser2Id, otherEventId);
        assertFalse(volunteerOpt.isPresent(), "Volunteer should not be found");
    }
    
    @Test
    void testSaveNew() {
        // Create new volunteer
        Volunteer newVolunteer = new Volunteer();
        newVolunteer.setUserId(testUser2Id);
        newVolunteer.setEventId(otherEventId);
        newVolunteer.setStatus("CONFIRMED");
        newVolunteer.setNotes("Can help with setup");
        
        // Save volunteer
        Volunteer savedVolunteer = volunteerDAO.save(newVolunteer);
        assertNotNull(savedVolunteer.getId(), "ID should be populated");
        
        // Verify the volunteer was saved
        Optional<Volunteer> retrievedVolunteer = volunteerDAO.findById(savedVolunteer.getId());
        assertTrue(retrievedVolunteer.isPresent(), "Volunteer should be retrievable");
        assertEquals(testUser2Id, retrievedVolunteer.get().getUserId());
        assertEquals(otherEventId, retrievedVolunteer.get().getEventId());
        assertEquals("CONFIRMED", retrievedVolunteer.get().getStatus());
        assertEquals("Can help with setup", retrievedVolunteer.get().getNotes());
    }
    
    @Test
    void testUpdate() throws SQLException {
        // Find the ID of User 2 for main event
        int volunteerId;
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT id FROM volunteers WHERE user_id = ? AND event_id = ?")) {
            stmt.setInt(1, testUser2Id);
            stmt.setInt(2, testEventId);
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "Volunteer should exist");
            volunteerId = rs.getInt("id");
        }
        
        // Get the volunteer, update and save
        Optional<Volunteer> volunteerOpt = volunteerDAO.findById(volunteerId);
        assertTrue(volunteerOpt.isPresent(), "Volunteer should be found");
        
        Volunteer volunteer = volunteerOpt.get();
        volunteer.setStatus("CONFIRMED"); // Change status from PENDING to CONFIRMED
        volunteer.setNotes("Updated notes");
        
        volunteerDAO.save(volunteer);
        
        // Verify the update
        Optional<Volunteer> updatedVolunteerOpt = volunteerDAO.findById(volunteerId);
        assertTrue(updatedVolunteerOpt.isPresent(), "Volunteer should be found after update");
        
        Volunteer updatedVolunteer = updatedVolunteerOpt.get();
        assertEquals("CONFIRMED", updatedVolunteer.getStatus(), "Status should be updated to CONFIRMED");
        assertEquals("Updated notes", updatedVolunteer.getNotes(), "Notes should be updated");
        assertEquals(testUser2Id, updatedVolunteer.getUserId(), "User ID should remain unchanged");
        assertEquals(testEventId, updatedVolunteer.getEventId(), "Event ID should remain unchanged");
    }
    
    @Test
    void testUpdateStatus() throws SQLException {
        // Find the ID of User 1 for other event
        int volunteerId;
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT id FROM volunteers WHERE user_id = ? AND event_id = ?")) {
            stmt.setInt(1, testUser1Id);
            stmt.setInt(2, otherEventId);
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "Volunteer should exist");
            volunteerId = rs.getInt("id");
        }
        
        // Update status
        boolean updated = volunteerDAO.updateStatus(volunteerId, "CONFIRMED");
        assertTrue(updated, "Status should be updated");
        
        // Verify the update
        Optional<Volunteer> updatedVolunteerOpt = volunteerDAO.findById(volunteerId);
        assertTrue(updatedVolunteerOpt.isPresent(), "Volunteer should be found after update");
        assertEquals("CONFIRMED", updatedVolunteerOpt.get().getStatus(), "Status should be updated to CONFIRMED");
        
        // Test updating non-existent volunteer
        boolean nonExistentUpdated = volunteerDAO.updateStatus(9999, "CONFIRMED");
        assertFalse(nonExistentUpdated, "Non-existent volunteer should not be updated");
    }
    
    @Test
    void testDelete() throws SQLException {
        // Find the ID of User 2 for main event
        int volunteerId;
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT id FROM volunteers WHERE user_id = ? AND event_id = ?")) {
            stmt.setInt(1, testUser2Id);
            stmt.setInt(2, testEventId);
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "Volunteer should exist");
            volunteerId = rs.getInt("id");
        }
        
        // Delete the volunteer
        boolean deleted = volunteerDAO.delete(volunteerId);
        assertTrue(deleted, "Volunteer should be deleted");
        
        // Verify the volunteer was deleted
        Optional<Volunteer> deletedVolunteer = volunteerDAO.findById(volunteerId);
        assertFalse(deletedVolunteer.isPresent(), "Volunteer should not be found after deletion");
        
        // Verify User 2 is no longer volunteering for main event
        Optional<Volunteer> volunteerOpt = volunteerDAO.findByUserIdAndEventId(testUser2Id, testEventId);
        assertFalse(volunteerOpt.isPresent(), "Volunteer should not be found after deletion");
        
        // Verify we now have only 2 volunteers total
        List<Volunteer> allVolunteers = volunteerDAO.findByStatus("CONFIRMED");
        allVolunteers.addAll(volunteerDAO.findByStatus("PENDING"));
        allVolunteers.addAll(volunteerDAO.findByStatus("CANCELED"));
        assertEquals(2, allVolunteers.size(), "Should have 2 volunteers total after deletion");
    }
    
    @Test
    void testCountByEventId() {
        // Test count for main event
        int mainEventCount = volunteerDAO.countByEventId(testEventId);
        assertEquals(1, mainEventCount, "Should count 1 CONFIRMED volunteer for main event");
        
        // Test count for other event
        int otherEventCount = volunteerDAO.countByEventId(otherEventId);
        assertEquals(0, otherEventCount, "Should count 0 CONFIRMED volunteers for other event");
        
        // Test count for non-existent event
        int nonExistentCount = volunteerDAO.countByEventId(9999);
        assertEquals(0, nonExistentCount, "Should count 0 volunteers for non-existent event");
        
        // Update status of User 1 for other event to CONFIRMED
        try {
            int volunteerId;
            try (PreparedStatement stmt = conn.prepareStatement(
                    "SELECT id FROM volunteers WHERE user_id = ? AND event_id = ?")) {
                stmt.setInt(1, testUser1Id);
                stmt.setInt(2, otherEventId);
                var rs = stmt.executeQuery();
                assertTrue(rs.next(), "Volunteer should exist");
                volunteerId = rs.getInt("id");
            }
            
            volunteerDAO.updateStatus(volunteerId, "CONFIRMED");
            
            // Recheck count for other event
            otherEventCount = volunteerDAO.countByEventId(otherEventId);
            assertEquals(1, otherEventCount, "Should now count 1 CONFIRMED volunteer for other event");
        } catch (SQLException e) {
            fail("SQLException: " + e.getMessage());
        }
    }
}