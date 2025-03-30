package org.kidsinmotion.dao;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.kidsinmotion.model.Event;
import org.kidsinmotion.model.Participant;
import org.kidsinmotion.model.User;
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
 * Integration tests for ParticipantDAO.
 * These tests require a test database to be set up.
 */
class ParticipantDAOTest {
    
    private ParticipantDAO participantDAO;
    private EventDAO eventDAO;
    private UserDAO userDAO;
    private Connection conn;
    
    private int testUserId;
    private int testEventId;
    
    @BeforeEach
    void setUp() throws SQLException {
        participantDAO = new ParticipantDAO();
        eventDAO = new EventDAO();
        userDAO = new UserDAO();
        
        // Get a connection
        conn = DatabaseUtil.getConnection();
        
        // Clear participants table for testing
        try (PreparedStatement stmt = conn.prepareStatement("DELETE FROM participants")) {
            stmt.executeUpdate();
        }
        
        // Set up test user if needed
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT id FROM users WHERE email = ?")) {
            stmt.setString(1, "parent@example.com");
            ResultSet rs = stmt.executeQuery();
            
            if (!rs.next()) {
                // Insert test user
                User testUser = new User();
                testUser.setEmail("parent@example.com");
                testUser.setPasswordHash("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG");
                testUser.setFirstName("Parent");
                testUser.setLastName("User");
                testUser.setRole("PARENT");
                testUser.setPhoneNumber("555-123-4567");
                
                User savedUser = userDAO.save(testUser);
                testUserId = savedUser.getId();
            } else {
                testUserId = rs.getInt("id");
            }
        }
        
        // Set up test event if needed
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT id FROM events WHERE title = ?")) {
            stmt.setString(1, "Test Baseball Clinic");
            ResultSet rs = stmt.executeQuery();
            
            if (!rs.next()) {
                // Insert test event
                Event testEvent = new Event();
                testEvent.setTitle("Test Baseball Clinic");
                testEvent.setDescription("Test description");
                testEvent.setEventType("CLINIC");
                testEvent.setSportType("BASEBALL");
                testEvent.setLocation("Test Field");
                testEvent.setStartDate(LocalDateTime.now().plusDays(7));
                testEvent.setEndDate(LocalDateTime.now().plusDays(7).plusHours(3));
                testEvent.setMaxParticipants(20);
                testEvent.setNeedsVolunteers(true);
                testEvent.setVolunteerCountNeeded(5);
                
                Event savedEvent = eventDAO.save(testEvent);
                testEventId = savedEvent.getId();
            } else {
                testEventId = rs.getInt("id");
            }
        }
        
        // Insert test participants
        try (PreparedStatement stmt = conn.prepareStatement(
                "INSERT INTO participants (parent_user_id, event_id, child_first_name, " +
                "child_last_name, child_age, special_needs, emergency_contact) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)")) {
            
            // Participant 1
            stmt.setInt(1, testUserId);
            stmt.setInt(2, testEventId);
            stmt.setString(3, "John");
            stmt.setString(4, "Doe");
            stmt.setInt(5, 10);
            stmt.setString(6, "None");
            stmt.setString(7, "555-123-4567");
            stmt.executeUpdate();
            
            // Participant 2
            stmt.setInt(1, testUserId);
            stmt.setInt(2, testEventId);
            stmt.setString(3, "Jane");
            stmt.setString(4, "Doe");
            stmt.setInt(5, 8);
            stmt.setString(6, "Allergies");
            stmt.setString(7, "555-123-4567");
            stmt.executeUpdate();
        }
    }
    
    @Test
    void testFindById() throws SQLException {
        // Find the ID of John Doe
        int participantId;
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT id FROM participants WHERE child_first_name = ? AND child_last_name = ?")) {
            stmt.setString(1, "John");
            stmt.setString(2, "Doe");
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "Participant should exist");
            participantId = rs.getInt("id");
        }
        
        // Test finding by ID
        Optional<Participant> participantOpt = participantDAO.findById(participantId);
        assertTrue(participantOpt.isPresent(), "Participant should be found");
        
        Participant participant = participantOpt.get();
        assertEquals("John", participant.getChildFirstName());
        assertEquals("Doe", participant.getChildLastName());
        assertEquals(10, participant.getChildAge());
        assertEquals("None", participant.getSpecialNeeds());
        assertEquals(testUserId, participant.getParentUserId());
        assertEquals(testEventId, participant.getEventId());
        
        // Check that related entities are populated
        assertNotNull(participant.getParentUser(), "Parent user should be populated");
        assertNotNull(participant.getEvent(), "Event should be populated");
        assertEquals("Parent", participant.getParentUser().getFirstName());
        assertEquals("Test Baseball Clinic", participant.getEvent().getTitle());
    }
    
    @Test
    void testFindByParentUserId() {
        List<Participant> participants = participantDAO.findByParentUserId(testUserId);
        assertEquals(2, participants.size(), "Should find 2 participants for parent");
        
        // Verify our test participants are in the list
        boolean foundJohn = false;
        boolean foundJane = false;
        
        for (Participant p : participants) {
            if ("John".equals(p.getChildFirstName()) && "Doe".equals(p.getChildLastName())) {
                foundJohn = true;
            } else if ("Jane".equals(p.getChildFirstName()) && "Doe".equals(p.getChildLastName())) {
                foundJane = true;
            }
        }
        
        assertTrue(foundJohn, "Should find John Doe");
        assertTrue(foundJane, "Should find Jane Doe");
    }
    
    @Test
    void testFindByEventId() {
        List<Participant> participants = participantDAO.findByEventId(testEventId);
        assertEquals(2, participants.size(), "Should find 2 participants for event");
        
        // Verify participants are ordered by last name, first name
        assertEquals("John", participants.get(1).getChildFirstName(), "First participant should be John Doe");
        assertEquals("Jane", participants.get(0).getChildFirstName(), "Second participant should be Jane Doe");
    }

    
    
    @Test
    void testFindByParentEventAndChild() {
        Optional<Participant> participantOpt = participantDAO.findByParentEventAndChild(
                testUserId, testEventId, "John", "Doe");
        
        assertTrue(participantOpt.isPresent(), "Participant should be found");
        assertEquals(10, participantOpt.get().getChildAge(), "Age should match");
        
        // Test finding non-existent participant
        Optional<Participant> nonexistentOpt = participantDAO.findByParentEventAndChild(
                testUserId, testEventId, "Nonexistent", "Child");
        
        assertFalse(nonexistentOpt.isPresent(), "Non-existent participant should not be found");
    }
    
    @Test
    void testSaveNew() {
        Participant newParticipant = new Participant();
        newParticipant.setParentUserId(testUserId);
        newParticipant.setEventId(testEventId);
        newParticipant.setChildFirstName("Sam");
        newParticipant.setChildLastName("Smith");
        newParticipant.setChildAge(9);
        newParticipant.setSpecialNeeds("None");
        newParticipant.setEmergencyContact("555-987-6543");
        
        Participant savedParticipant = participantDAO.save(newParticipant);
        assertNotNull(savedParticipant.getId(), "ID should be populated");
        
        // Verify the participant was saved
        Optional<Participant> retrievedParticipant = participantDAO.findById(savedParticipant.getId());
        assertTrue(retrievedParticipant.isPresent(), "Participant should be retrievable");
        assertEquals("Sam", retrievedParticipant.get().getChildFirstName());
        assertEquals("Smith", retrievedParticipant.get().getChildLastName());
    }
    
    @Test
    void testUpdate() throws SQLException {
        // Find the ID of Jane Doe
        int participantId;
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT id FROM participants WHERE child_first_name = ? AND child_last_name = ?")) {
            stmt.setString(1, "Jane");
            stmt.setString(2, "Doe");
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "Participant should exist");
            participantId = rs.getInt("id");
        }
        
        // Get the participant, update and save
        Optional<Participant> participantOpt = participantDAO.findById(participantId);
        assertTrue(participantOpt.isPresent(), "Participant should be found");
        
        Participant participant = participantOpt.get();
        participant.setChildAge(9); // Update age
        participant.setSpecialNeeds("Updated special needs");
        
        participantDAO.save(participant);
        
        // Verify the update
        Optional<Participant> updatedParticipantOpt = participantDAO.findById(participantId);
        assertTrue(updatedParticipantOpt.isPresent(), "Participant should be found after update");
        
        Participant updatedParticipant = updatedParticipantOpt.get();
        assertEquals(9, updatedParticipant.getChildAge(), "Age should be updated");
        assertEquals("Updated special needs", updatedParticipant.getSpecialNeeds(), "Special needs should be updated");
        assertEquals("Jane", updatedParticipant.getChildFirstName(), "First name should remain unchanged");
    }
    
    @Test
    void testDelete() throws SQLException {
        // Find the ID of Jane Doe
        int participantId;
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT id FROM participants WHERE child_first_name = ? AND child_last_name = ?")) {
            stmt.setString(1, "Jane");
            stmt.setString(2, "Doe");
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "Participant should exist");
            participantId = rs.getInt("id");
        }
        
        // Delete the participant
        boolean deleted = participantDAO.delete(participantId);
        assertTrue(deleted, "Participant should be deleted");
        
        // Verify the participant was deleted
        Optional<Participant> deletedParticipant = participantDAO.findById(participantId);
        assertFalse(deletedParticipant.isPresent(), "Participant should not be found after deletion");
    }
    
    @Test
    void testCountByEventId() {
        int count = participantDAO.countByEventId(testEventId);
        assertEquals(2, count, "Should count 2 participants for the event");
        
        // Test count for non-existent event
        int nonExistentCount = participantDAO.countByEventId(99999);
        assertEquals(0, nonExistentCount, "Should count 0 participants for non-existent event");
    }
}