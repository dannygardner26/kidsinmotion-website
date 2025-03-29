package org.kidsinmotion.dao;

import org.kidsinmotion.model.Event;
import org.kidsinmotion.util.DatabaseUtil;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

public class EventDAO {
    private static final Logger LOGGER = Logger.getLogger(EventDAO.class.getName());

    /**
     * Find an event by ID
     * @param id the event ID
     * @return Optional containing the event if found
     */
    public Optional<Event> findById(int id) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM events WHERE id = ?");
            stmt.setInt(1, id);
            rs = stmt.executeQuery();
            
            if (rs.next()) {
                return Optional.of(mapResultSetToEvent(rs));
            }
            return Optional.empty();
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding event by ID", e);
            throw new RuntimeException("Error finding event by ID", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find all events
     * @return List of all events
     */
    public List<Event> findAll() {
        Connection conn = null;
        Statement stmt = null;
        ResultSet rs = null;
        List<Event> events = new ArrayList<>();
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.createStatement();
            rs = stmt.executeQuery("SELECT * FROM events ORDER BY start_date");
            
            while (rs.next()) {
                events.add(mapResultSetToEvent(rs));
            }
            return events;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding all events", e);
            throw new RuntimeException("Error finding all events", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find upcoming events (start date is in the future)
     * @return List of upcoming events
     */
    public List<Event> findUpcoming() {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Event> events = new ArrayList<>();
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement(
                "SELECT * FROM events WHERE start_date > NOW() ORDER BY start_date"
            );
            rs = stmt.executeQuery();
            
            while (rs.next()) {
                events.add(mapResultSetToEvent(rs));
            }
            return events;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding upcoming events", e);
            throw new RuntimeException("Error finding upcoming events", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find past events (end date is in the past)
     * @return List of past events
     */
    public List<Event> findPast() {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Event> events = new ArrayList<>();
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement(
                "SELECT * FROM events WHERE end_date < NOW() ORDER BY start_date DESC"
            );
            rs = stmt.executeQuery();
            
            while (rs.next()) {
                events.add(mapResultSetToEvent(rs));
            }
            return events;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding past events", e);
            throw new RuntimeException("Error finding past events", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find events by sport type
     * @param sportType the sport type to filter by
     * @return List of events for the specified sport type
     */
    public List<Event> findBySportType(String sportType) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Event> events = new ArrayList<>();
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement(
                "SELECT * FROM events WHERE sport_type = ? ORDER BY start_date"
            );
            stmt.setString(1, sportType);
            rs = stmt.executeQuery();
            
            while (rs.next()) {
                events.add(mapResultSetToEvent(rs));
            }
            return events;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding events by sport type", e);
            throw new RuntimeException("Error finding events by sport type", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find events that need volunteers
     * @return List of events that need volunteers
     */
    public List<Event> findNeedingVolunteers() {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Event> events = new ArrayList<>();
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement(
                "SELECT * FROM events WHERE needs_volunteers = TRUE AND start_date > NOW() ORDER BY start_date"
            );
            rs = stmt.executeQuery();
            
            while (rs.next()) {
                events.add(mapResultSetToEvent(rs));
            }
            return events;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding events needing volunteers", e);
            throw new RuntimeException("Error finding events needing volunteers", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Save an event (insert if new, update if existing)
     * @param event the event to save
     * @return the saved event with ID populated
     */
    public Event save(Event event) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            
            if (event.getId() == null) {
                // Insert new event
                stmt = conn.prepareStatement(
                    "INSERT INTO events (title, description, event_type, sport_type, location, " +
                    "start_date, end_date, max_participants, needs_volunteers, volunteer_count_needed) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
                );
                stmt.setString(1, event.getTitle());
                stmt.setString(2, event.getDescription());
                stmt.setString(3, event.getEventType());
                stmt.setString(4, event.getSportType());
                stmt.setString(5, event.getLocation());
                stmt.setTimestamp(6, Timestamp.valueOf(event.getStartDate()));
                stmt.setTimestamp(7, Timestamp.valueOf(event.getEndDate()));
                stmt.setInt(8, event.getMaxParticipants());
                stmt.setBoolean(9, event.getNeedsVolunteers());
                stmt.setInt(10, event.getVolunteerCountNeeded());
                
                stmt.executeUpdate();
                rs = stmt.getGeneratedKeys();
                if (rs.next()) {
                    event.setId(rs.getInt(1));
                }
            } else {
                // Update existing event
                stmt = conn.prepareStatement(
                    "UPDATE events SET title = ?, description = ?, event_type = ?, sport_type = ?, " +
                    "location = ?, start_date = ?, end_date = ?, max_participants = ?, " +
                    "needs_volunteers = ?, volunteer_count_needed = ? WHERE id = ?"
                );
                stmt.setString(1, event.getTitle());
                stmt.setString(2, event.getDescription());
                stmt.setString(3, event.getEventType());
                stmt.setString(4, event.getSportType());
                stmt.setString(5, event.getLocation());
                stmt.setTimestamp(6, Timestamp.valueOf(event.getStartDate()));
                stmt.setTimestamp(7, Timestamp.valueOf(event.getEndDate()));
                stmt.setInt(8, event.getMaxParticipants());
                stmt.setBoolean(9, event.getNeedsVolunteers());
                stmt.setInt(10, event.getVolunteerCountNeeded());
                stmt.setInt(11, event.getId());
                
                stmt.executeUpdate();
            }
            
            return event;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error saving event", e);
            throw new RuntimeException("Error saving event", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Delete an event by ID
     * @param id the ID of the event to delete
     * @return true if deleted, false if not found
     */
    public boolean delete(int id) {
        Connection conn = null;
        PreparedStatement stmt = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("DELETE FROM events WHERE id = ?");
            stmt.setInt(1, id);
            
            int rowsAffected = stmt.executeUpdate();
            return rowsAffected > 0;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error deleting event", e);
            throw new RuntimeException("Error deleting event", e);
        } finally {
            DatabaseUtil.closeQuietly(stmt, conn);
        }
    }
    
    /**
     * Map a ResultSet row to an Event object
     * @param rs the ResultSet
     * @return Event object
     * @throws SQLException if mapping fails
     */
    private Event mapResultSetToEvent(ResultSet rs) throws SQLException {
        Event event = new Event();
        event.setId(rs.getInt("id"));
        event.setTitle(rs.getString("title"));
        event.setDescription(rs.getString("description"));
        event.setEventType(rs.getString("event_type"));
        event.setSportType(rs.getString("sport_type"));
        event.setLocation(rs.getString("location"));
        
        Timestamp startTimestamp = rs.getTimestamp("start_date");
        Timestamp endTimestamp = rs.getTimestamp("end_date");
        event.setStartDate(startTimestamp.toLocalDateTime());
        event.setEndDate(endTimestamp.toLocalDateTime());
        
        event.setMaxParticipants(rs.getInt("max_participants"));
        event.setNeedsVolunteers(rs.getBoolean("needs_volunteers"));
        event.setVolunteerCountNeeded(rs.getInt("volunteer_count_needed"));
        event.setCreatedAt(rs.getTimestamp("created_at"));
        event.setUpdatedAt(rs.getTimestamp("updated_at"));
        return event;
    }
}