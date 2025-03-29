package org.kidsinmotion.dao;

import org.kidsinmotion.model.Participant;
import org.kidsinmotion.model.User;
import org.kidsinmotion.model.Event;
import org.kidsinmotion.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Data Access Object for Participant entities.
 * Handles database operations related to Participant objects.
 */
public class ParticipantDAO {
    private static final Logger LOGGER = Logger.getLogger(ParticipantDAO.class.getName());
    private final UserDAO userDAO = new UserDAO();
    private final EventDAO eventDAO = new EventDAO();

    /**
     * Find a participant by ID
     * @param id the participant ID
     * @return Optional containing the participant if found
     */
    public Optional<Participant> findById(int id) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM participants WHERE id = ?");
            stmt.setInt(1, id);
            rs = stmt.executeQuery();
            
            if (rs.next()) {
                Participant participant = mapResultSetToParticipant(rs);
                populateRelatedEntities(participant);
                return Optional.of(participant);
            }
            return Optional.empty();
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding participant by ID", e);
            throw new RuntimeException("Error finding participant by ID", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find participants by parent user ID
     * @param parentUserId the parent user ID
     * @return List of participants for the specified parent
     */
    public List<Participant> findByParentUserId(int parentUserId) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Participant> participants = new ArrayList<>();
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM participants WHERE parent_user_id = ? ORDER BY created_at DESC");
            stmt.setInt(1, parentUserId);
            rs = stmt.executeQuery();
            
            while (rs.next()) {
                Participant participant = mapResultSetToParticipant(rs);
                populateRelatedEntities(participant);
                participants.add(participant);
            }
            return participants;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding participants by parent user ID", e);
            throw new RuntimeException("Error finding participants by parent user ID", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find participants by event ID
     * @param eventId the event ID
     * @return List of participants for the specified event
     */
    public List<Participant> findByEventId(int eventId) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<Participant> participants = new ArrayList<>();
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM participants WHERE event_id = ? ORDER BY child_last_name, child_first_name");
            stmt.setInt(1, eventId);
            rs = stmt.executeQuery();
            
            while (rs.next()) {
                Participant participant = mapResultSetToParticipant(rs);
                populateRelatedEntities(participant);
                participants.add(participant);
            }
            return participants;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding participants by event ID", e);
            throw new RuntimeException("Error finding participants by event ID", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find participant by parent user ID, event ID, and child name
     * @param parentUserId the parent user ID
     * @param eventId the event ID
     * @param childFirstName the child's first name
     * @param childLastName the child's last name
     * @return Optional containing the participant if found
     */
    public Optional<Participant> findByParentEventAndChild(int parentUserId, int eventId, 
                                                         String childFirstName, String childLastName) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement(
                "SELECT * FROM participants WHERE parent_user_id = ? AND event_id = ? " +
                "AND child_first_name = ? AND child_last_name = ?"
            );
            stmt.setInt(1, parentUserId);
            stmt.setInt(2, eventId);
            stmt.setString(3, childFirstName);
            stmt.setString(4, childLastName);
            rs = stmt.executeQuery();
            
            if (rs.next()) {
                Participant participant = mapResultSetToParticipant(rs);
                populateRelatedEntities(participant);
                return Optional.of(participant);
            }
            return Optional.empty();
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding participant by parent, event, and child", e);
            throw new RuntimeException("Error finding participant by parent, event, and child", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Save a participant (insert if new, update if existing)
     * @param participant the participant to save
     * @return the saved participant with ID populated
     */
    public Participant save(Participant participant) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            
            if (participant.getId() == null) {
                // Insert new participant
                stmt = conn.prepareStatement(
                    "INSERT INTO participants (parent_user_id, event_id, child_first_name, " +
                    "child_last_name, child_age, special_needs, emergency_contact) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
                );
                stmt.setInt(1, participant.getParentUserId());
                stmt.setInt(2, participant.getEventId());
                stmt.setString(3, participant.getChildFirstName());
                stmt.setString(4, participant.getChildLastName());
                stmt.setInt(5, participant.getChildAge());
                stmt.setString(6, participant.getSpecialNeeds());
                stmt.setString(7, participant.getEmergencyContact());
                
                stmt.executeUpdate();
                rs = stmt.getGeneratedKeys();
                if (rs.next()) {
                    participant.setId(rs.getInt(1));
                }
            } else {
                // Update existing participant
                stmt = conn.prepareStatement(
                    "UPDATE participants SET parent_user_id = ?, event_id = ?, child_first_name = ?, " +
                    "child_last_name = ?, child_age = ?, special_needs = ?, emergency_contact = ? " +
                    "WHERE id = ?"
                );
                stmt.setInt(1, participant.getParentUserId());
                stmt.setInt(2, participant.getEventId());
                stmt.setString(3, participant.getChildFirstName());
                stmt.setString(4, participant.getChildLastName());
                stmt.setInt(5, participant.getChildAge());
                stmt.setString(6, participant.getSpecialNeeds());
                stmt.setString(7, participant.getEmergencyContact());
                stmt.setInt(8, participant.getId());
                
                stmt.executeUpdate();
            }
            
            return participant;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error saving participant", e);
            throw new RuntimeException("Error saving participant", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Delete a participant by ID
     * @param id the ID of the participant to delete
     * @return true if deleted, false if not found
     */
    public boolean delete(int id) {
        Connection conn = null;
        PreparedStatement stmt = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("DELETE FROM participants WHERE id = ?");
            stmt.setInt(1, id);
            
            int rowsAffected = stmt.executeUpdate();
            return rowsAffected > 0;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error deleting participant", e);
            throw new RuntimeException("Error deleting participant", e);
        } finally {
            DatabaseUtil.closeQuietly(stmt, conn);
        }
    }
    
    /**
     * Count participants for an event
     * @param eventId the event ID
     * @return the number of participants for the event
     */
    public int countByEventId(int eventId) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT COUNT(*) FROM participants WHERE event_id = ?");
            stmt.setInt(1, eventId);
            rs = stmt.executeQuery();
            
            if (rs.next()) {
                return rs.getInt(1);
            }
            return 0;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error counting participants by event ID", e);
            throw new RuntimeException("Error counting participants by event ID", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Map a ResultSet row to a Participant object
     * @param rs the ResultSet
     * @return Participant object
     * @throws SQLException if mapping fails
     */
    private Participant mapResultSetToParticipant(ResultSet rs) throws SQLException {
        Participant participant = new Participant();
        participant.setId(rs.getInt("id"));
        participant.setParentUserId(rs.getInt("parent_user_id"));
        participant.setEventId(rs.getInt("event_id"));
        participant.setChildFirstName(rs.getString("child_first_name"));
        participant.setChildLastName(rs.getString("child_last_name"));
        participant.setChildAge(rs.getInt("child_age"));
        participant.setSpecialNeeds(rs.getString("special_needs"));
        participant.setEmergencyContact(rs.getString("emergency_contact"));
        participant.setCreatedAt(rs.getTimestamp("created_at"));
        participant.setUpdatedAt(rs.getTimestamp("updated_at"));
        return participant;
    }
    
    /**
     * Populate related entities (User, Event) for a Participant
     * @param participant the Participant to populate
     */
    private void populateRelatedEntities(Participant participant) {
        userDAO.findById(participant.getParentUserId()).ifPresent(participant::setParentUser);
        eventDAO.findById(participant.getEventId()).ifPresent(participant::setEvent);
    }
}