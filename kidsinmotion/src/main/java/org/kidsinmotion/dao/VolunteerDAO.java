package org.kidsinmotion.dao;

import org.kidsinmotion.model.Volunteer;
import org.kidsinmotion.model.User;
import org.kidsinmotion.model.Event;
import org.kidsinmotion.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

public class VolunteerDAO {
    private static final Logger LOGGER = Logger.getLogger(VolunteerDAO.class.getName());
    private final UserDAO userDAO = new UserDAO();
    private final EventDAO eventDAO = new EventDAO();

    /**
     * Find a volunteer record by ID
     * @param id the volunteer ID
     * @return Optional containing the volunteer if found
     */
    public Optional<Volunteer> findById(int id) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM volunteers WHERE id = ?");
            stmt.setInt(1, id);
            rs = stmt.executeQuery();
            
            if (rs.next()) {
                Volunteer volunteer = mapResultSetToVolunteer(rs);
                populateRelatedEntities(volunteer);
                return Optional.of(volunteer);
            }
            return Optional.empty();
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding volunteer by ID", e);
            throw new RuntimeException("Error finding volunteer by ID", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find volunteers by user ID
     * @param userId the user ID
     * @return List of volunteers for the specified user
     */
    public List<Volunteer> findByUserId(int userId) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Volunteer> volunteers = new ArrayList<>();
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM volunteers WHERE user_id = ? ORDER BY created_at DESC");
            stmt.setInt(1, userId);
            rs = stmt.executeQuery();
            
            while (rs.next()) {
                Volunteer volunteer = mapResultSetToVolunteer(rs);
                populateRelatedEntities(volunteer);
                volunteers.add(volunteer);
            }
            return volunteers;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding volunteers by user ID", e);
            throw new RuntimeException("Error finding volunteers by user ID", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find volunteers by event ID
     * @param eventId the event ID
     * @return List of volunteers for the specified event
     */
    public List<Volunteer> findByEventId(int eventId) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Volunteer> volunteers = new ArrayList<>();
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM volunteers WHERE event_id = ? ORDER BY created_at");
            stmt.setInt(1, eventId);
            rs = stmt.executeQuery();
            
            while (rs.next()) {
                Volunteer volunteer = mapResultSetToVolunteer(rs);
                populateRelatedEntities(volunteer);
                volunteers.add(volunteer);
            }
            return volunteers;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding volunteers by event ID", e);
            throw new RuntimeException("Error finding volunteers by event ID", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find volunteers by status
     * @param status the status to filter by
     * @return List of volunteers with the specified status
     */
    public List<Volunteer> findByStatus(String status) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Volunteer> volunteers = new ArrayList<>();
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM volunteers WHERE status = ? ORDER BY created_at");
            stmt.setString(1, status);
            rs = stmt.executeQuery();
            
            while (rs.next()) {
                Volunteer volunteer = mapResultSetToVolunteer(rs);
                populateRelatedEntities(volunteer);
                volunteers.add(volunteer);
            }
            return volunteers;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding volunteers by status", e);
            throw new RuntimeException("Error finding volunteers by status", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find volunteer by user ID and event ID
     * @param userId the user ID
     * @param eventId the event ID
     * @return Optional containing the volunteer if found
     */
    public Optional<Volunteer> findByUserIdAndEventId(int userId, int eventId) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM volunteers WHERE user_id = ? AND event_id = ?");
            stmt.setInt(1, userId);
            stmt.setInt(2, eventId);
            rs = stmt.executeQuery();
            
            if (rs.next()) {
                Volunteer volunteer = mapResultSetToVolunteer(rs);
                populateRelatedEntities(volunteer);
                return Optional.of(volunteer);
            }
            return Optional.empty();
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding volunteer by user ID and event ID", e);
            throw new RuntimeException("Error finding volunteer by user ID and event ID", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Save a volunteer record (insert if new, update if existing)
     * @param volunteer the volunteer to save
     * @return the saved volunteer with ID populated
     */
    public Volunteer save(Volunteer volunteer) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            
            if (volunteer.getId() == null) {
                // Insert new volunteer
                stmt = conn.prepareStatement(
                    "INSERT INTO volunteers (user_id, event_id, status, notes) VALUES (?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
                );
                stmt.setInt(1, volunteer.getUserId());
                stmt.setInt(2, volunteer.getEventId());
                stmt.setString(3, volunteer.getStatus());
                stmt.setString(4, volunteer.getNotes());
                
                stmt.executeUpdate();
                rs = stmt.getGeneratedKeys();
                if (rs.next()) {
                    volunteer.setId(rs.getInt(1));
                }
            } else {
                // Update existing volunteer
                stmt = conn.prepareStatement(
                    "UPDATE volunteers SET user_id = ?, event_id = ?, status = ?, notes = ? WHERE id = ?"
                );
                stmt.setInt(1, volunteer.getUserId());
                stmt.setInt(2, volunteer.getEventId());
                stmt.setString(3, volunteer.getStatus());
                stmt.setString(4, volunteer.getNotes());
                stmt.setInt(5, volunteer.getId());
                
                stmt.executeUpdate();
            }
            
            return volunteer;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error saving volunteer", e);
            throw new RuntimeException("Error saving volunteer", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Update volunteer status
     * @param id the volunteer ID
     * @param status the new status
     * @return true if updated, false if not found
     */
    public boolean updateStatus(int id, String status) {
        Connection conn = null;
        PreparedStatement stmt = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("UPDATE volunteers SET status = ? WHERE id = ?");
            stmt.setString(1, status);
            stmt.setInt(2, id);
            
            int rowsAffected = stmt.executeUpdate();
            return rowsAffected > 0;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error updating volunteer status", e);
            throw new RuntimeException("Error updating volunteer status", e);
        } finally {
            DatabaseUtil.closeQuietly(stmt, conn);
        }
    }
    
    /**
     * Delete a volunteer record by ID
     * @param id the ID of the volunteer to delete
     * @return true if deleted, false if not found
     */
    public boolean delete(int id) {
        Connection conn = null;
        PreparedStatement stmt = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("DELETE FROM volunteers WHERE id = ?");
            stmt.setInt(1, id);
            
            int rowsAffected = stmt.executeUpdate();
            return rowsAffected > 0;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error deleting volunteer", e);
            throw new RuntimeException("Error deleting volunteer", e);
        } finally {
            DatabaseUtil.closeQuietly(stmt, conn);
        }
    }
    
    /**
     * Count volunteers for an event
     * @param eventId the event ID
     * @return the number of volunteers for the event
     */
    public int countByEventId(int eventId) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT COUNT(*) FROM volunteers WHERE event_id = ? AND status = 'CONFIRMED'");
            stmt.setInt(1, eventId);
            rs = stmt.executeQuery();
            
            if (rs.next()) {
                return rs.getInt(1);
            }
            return 0;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error counting volunteers by event ID", e);
            throw new RuntimeException("Error counting volunteers by event ID", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Map a ResultSet row to a Volunteer object
     * @param rs the ResultSet
     * @return Volunteer object
     * @throws SQLException if mapping fails
     */
    private Volunteer mapResultSetToVolunteer(ResultSet rs) throws SQLException {
        Volunteer volunteer = new Volunteer();
        volunteer.setId(rs.getInt("id"));
        volunteer.setUserId(rs.getInt("user_id"));
        volunteer.setEventId(rs.getInt("event_id"));
        volunteer.setStatus(rs.getString("status"));
        volunteer.setNotes(rs.getString("notes"));
        volunteer.setCreatedAt(rs.getTimestamp("created_at"));
        volunteer.setUpdatedAt(rs.getTimestamp("updated_at"));
        return volunteer;
    }
    
    /**
     * Populate related entities (User, Event) for a Volunteer
     * @param volunteer the Volunteer to populate
     */
    private void populateRelatedEntities(Volunteer volunteer) {
        userDAO.findById(volunteer.getUserId()).ifPresent(volunteer::setUser);
        eventDAO.findById(volunteer.getEventId()).ifPresent(volunteer::setEvent);
    }
}