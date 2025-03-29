package org.kidsinmotion.dao;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.kidsinmotion.model.Event;
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
 * Integration tests for EventDAO.
 * These tests require a test database to be set up.
 */
class EventDAOTest {
    
    private EventDAO eventDAO;
    private Connection conn;
    private LocalDateTime now;
    
    @BeforeEach
    void setUp() throws SQLException {
        eventDAO = new EventDAO();
        now = LocalDateTime.now();
        
        // Get a connection and clear the events table for testing
        conn = DatabaseUtil.getConnection();
        try (PreparedStatement stmt = conn.prepareStatement("DELETE FROM events")) {
            stmt.executeUpdate();
        }
        
        // Insert test data
        try (PreparedStatement stmt = conn.prepareStatement(
                "INSERT INTO events (title, description, event_type, sport_type, location, " +
                "start_date, end_date, max_participants, needs_volunteers, volunteer_count_needed) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
            
            // Past event
            stmt.setString(1, "Past Event");
            stmt.setString(2, "Past Event Description");
            stmt.setString(3, "CLINIC");
            stmt.setString(4, "BASEBALL");
            stmt.setString(5, "Past Location");
            stmt.setObject(6, now.minusDays(7));
            stmt.setObject(7, now.minusDays(7).plusHours(3));
            stmt.setInt(8, 20);
            stmt.setBoolean(9, true);
            stmt.setInt(10, 5);
            stmt.executeUpdate();
            
            // Upcoming event 1
            stmt.setString(1, "Upcoming Baseball Event");
            stmt.setString(2, "Upcoming Baseball Event Description");
            stmt.setString(3, "CLINIC");
            stmt.setString(4, "BASEBALL");
            stmt.setString(5, "Baseball Field");
            stmt.setObject(6, now.plusDays(7));
            stmt.setObject(7, now.plusDays(7).plusHours(3));
            stmt.setInt(8, 15);
            stmt.setBoolean(9, true);
            stmt.setInt(10, 3);
            stmt.executeUpdate();
            
            // Upcoming event 2
            stmt.setString(1, "Upcoming Soccer Event");
            stmt.setString(2, "Upcoming Soccer Event Description");
            stmt.setString(3, "CLINIC");
            stmt.setString(4, "SOCCER");
            stmt.setString(5, "Soccer Field");
            stmt.setObject(6, now.plusDays(14));
            stmt.setObject(7, now.plusDays(14).plusHours(2));
            stmt.setInt(8, 20);
            stmt.setBoolean(9, false); // Doesn't need volunteers
            stmt.setInt(10, 0);
            stmt.executeUpdate();
        }
    }
    
    @Test
    void testFindById() throws SQLException {
        // Find the ID of "Upcoming Baseball Event"
        int eventId;
        try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM events WHERE title = ?")) {
            stmt.setString(1, "Upcoming Baseball Event");
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "Event should exist");
            eventId = rs.getInt("id");
        }
        
        // Test finding by ID
        Optional<Event> eventOpt = eventDAO.findById(eventId);
        assertTrue(eventOpt.isPresent(), "Event should be found");
        
        Event event = eventOpt.get();
        assertEquals("Upcoming Baseball Event", event.getTitle());
        assertEquals("BASEBALL", event.getSportType());
        assertEquals("Baseball Field", event.getLocation());
        assertTrue(event.getNeedsVolunteers(), "Should need volunteers");
        assertEquals(3, event.getVolunteerCountNeeded(), "Should need 3 volunteers");
    }
    
    @Test
    void testFindAll() {
        List<Event> events = eventDAO.findAll();
        assertEquals(3, events.size(), "Should find 3 events");
        
        // Verify event titles are present
        boolean foundPastEvent = false;
        boolean foundBaseballEvent = false;
        boolean foundSoccerEvent = false;
        
        for (Event event : events) {
            if ("Past Event".equals(event.getTitle())) {
                foundPastEvent = true;
            } else if ("Upcoming Baseball Event".equals(event.getTitle())) {
                foundBaseballEvent = true;
            } else if ("Upcoming Soccer Event".equals(event.getTitle())) {
                foundSoccerEvent = true;
            }
        }
        
        assertTrue(foundPastEvent, "Should find Past Event");
        assertTrue(foundBaseballEvent, "Should find Upcoming Baseball Event");
        assertTrue(foundSoccerEvent, "Should find Upcoming Soccer Event");
    }
    
    @Test
    void testFindUpcoming() {
        List<Event> upcomingEvents = eventDAO.findUpcoming();
        assertEquals(2, upcomingEvents.size(), "Should find 2 upcoming events");
        
        // Upcoming events should not include past events
        boolean foundPastEvent = false;
        boolean foundBaseballEvent = false;
        boolean foundSoccerEvent = false;
        
        for (Event event : upcomingEvents) {
            if ("Past Event".equals(event.getTitle())) {
                foundPastEvent = true;
            } else if ("Upcoming Baseball Event".equals(event.getTitle())) {
                foundBaseballEvent = true;
            } else if ("Upcoming Soccer Event".equals(event.getTitle())) {
                foundSoccerEvent = true;
            }
        }
        
        assertFalse(foundPastEvent, "Should not find Past Event");
        assertTrue(foundBaseballEvent, "Should find Upcoming Baseball Event");
        assertTrue(foundSoccerEvent, "Should find Upcoming Soccer Event");
    }
    
    @Test
    void testFindPast() {
        List<Event> pastEvents = eventDAO.findPast();
        assertEquals(1, pastEvents.size(), "Should find 1 past event");
        
        Event pastEvent = pastEvents.get(0);
        assertEquals("Past Event", pastEvent.getTitle());
    }
    
    @Test
    void testFindBySportType() {
        List<Event> baseballEvents = eventDAO.findBySportType("BASEBALL");
        assertEquals(2, baseballEvents.size(), "Should find 2 baseball events");
        
        List<Event> soccerEvents = eventDAO.findBySportType("SOCCER");
        assertEquals(1, soccerEvents.size(), "Should find 1 soccer event");
        assertEquals("Upcoming Soccer Event", soccerEvents.get(0).getTitle());
        
        List<Event> basketballEvents = eventDAO.findBySportType("BASKETBALL");
        assertEquals(0, basketballEvents.size(), "Should find 0 basketball events");
    }
    
    @Test
    void testFindNeedingVolunteers() {
        List<Event> eventsNeedingVolunteers = eventDAO.findNeedingVolunteers();
        // Should only find upcoming events that need volunteers
        assertEquals(1, eventsNeedingVolunteers.size(), "Should find 1 upcoming event needing volunteers");
        assertEquals("Upcoming Baseball Event", eventsNeedingVolunteers.get(0).getTitle());
    }
    
    @Test
    void testSaveNew() {
        // Create new event
        Event newEvent = new Event();
        newEvent.setTitle("New Basketball Event");
        newEvent.setDescription("New Basketball Event Description");
        newEvent.setEventType("CLINIC");
        newEvent.setSportType("BASKETBALL");
        newEvent.setLocation("Basketball Court");
        newEvent.setStartDate(now.plusDays(21));
        newEvent.setEndDate(now.plusDays(21).plusHours(2));
        newEvent.setMaxParticipants(25);
        newEvent.setNeedsVolunteers(true);
        newEvent.setVolunteerCountNeeded(4);
        
        // Save event
        Event savedEvent = eventDAO.save(newEvent);
        
        // Verify the event was saved
        assertNotNull(savedEvent.getId(), "ID should be populated");
        
        Optional<Event> retrievedEvent = eventDAO.findById(savedEvent.getId());
        assertTrue(retrievedEvent.isPresent(), "Event should be retrievable");
        assertEquals("New Basketball Event", retrievedEvent.get().getTitle());
        assertEquals("BASKETBALL", retrievedEvent.get().getSportType());
    }
    
    @Test
    void testUpdate() throws SQLException {
        // Find the ID of "Upcoming Soccer Event"
        int eventId;
        try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM events WHERE title = ?")) {
            stmt.setString(1, "Upcoming Soccer Event");
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "Event should exist");
            eventId = rs.getInt("id");
        }
        
        // Get the event, update and save
        Optional<Event> eventOpt = eventDAO.findById(eventId);
        assertTrue(eventOpt.isPresent(), "Event should be found");
        
        Event event = eventOpt.get();
        event.setTitle("Updated Soccer Event");
        event.setDescription("Updated Description");
        event.setNeedsVolunteers(true); // Change to needing volunteers
        event.setVolunteerCountNeeded(5);
        
        eventDAO.save(event);
        
        // Verify the update
        Optional<Event> updatedEventOpt = eventDAO.findById(eventId);
        assertTrue(updatedEventOpt.isPresent(), "Event should be found after update");
        
        Event updatedEvent = updatedEventOpt.get();
        assertEquals("Updated Soccer Event", updatedEvent.getTitle());
        assertEquals("Updated Description", updatedEvent.getDescription());
        assertTrue(updatedEvent.getNeedsVolunteers(), "Should need volunteers after update");
        assertEquals(5, updatedEvent.getVolunteerCountNeeded(), "Should need 5 volunteers after update");
        assertEquals("SOCCER", updatedEvent.getSportType(), "Sport type should remain unchanged");
    }
    
    @Test
    void testDelete() throws SQLException {
        // Find the ID of "Past Event"
        int eventId;
        try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM events WHERE title = ?")) {
            stmt.setString(1, "Past Event");
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "Event should exist");
            eventId = rs.getInt("id");
        }
        
        // Delete the event
        boolean deleted = eventDAO.delete(eventId);
        assertTrue(deleted, "Event should be deleted");
        
        // Verify the event was deleted
        Optional<Event> deletedEvent = eventDAO.findById(eventId);
        assertFalse(deletedEvent.isPresent(), "Event should not be found after deletion");
        
        // Verify we now have only 2 events total
        List<Event> allEvents = eventDAO.findAll();
        assertEquals(2, allEvents.size(), "Should have 2 events after deletion");
    }
}