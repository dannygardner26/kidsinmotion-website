package org.kidsinmotion.dao;

import org.kidsinmotion.model.User;
import org.kidsinmotion.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Data Access Object for User entities.
 * Handles database operations related to User objects.
 */
public class UserDAO {
    private static final Logger LOGGER = Logger.getLogger(UserDAO.class.getName());

    /**
     * Find a user by ID
     * @param id the user ID
     * @return Optional containing the user if found
     */
    public Optional<User> findById(int id) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
            stmt.setInt(1, id);
            rs = stmt.executeQuery();
            
            if (rs.next()) {
                return Optional.of(mapResultSetToUser(rs));
            }
            return Optional.empty();
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding user by ID", e);
            throw new RuntimeException("Error finding user by ID", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find a user by email
     * @param email the user's email
     * @return Optional containing the user if found
     */
    public Optional<User> findByEmail(String email) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM users WHERE email = ?");
            stmt.setString(1, email);
            rs = stmt.executeQuery();
            
            if (rs.next()) {
                return Optional.of(mapResultSetToUser(rs));
            }
            return Optional.empty();
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding user by email", e);
            throw new RuntimeException("Error finding user by email", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find all users
     * @return List of all users
     */
    public List<User> findAll() {
        Connection conn = null;
        Statement stmt = null;
        ResultSet rs = null;
        List<User> users = new ArrayList<>();
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.createStatement();
            rs = stmt.executeQuery("SELECT * FROM users ORDER BY last_name, first_name");
            
            while (rs.next()) {
                users.add(mapResultSetToUser(rs));
            }
            return users;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding all users", e);
            throw new RuntimeException("Error finding all users", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Find users by role
     * @param role the role to filter by
     * @return List of users with the specified role
     */
    public List<User> findByRole(String role) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        List<User> users = new ArrayList<>();
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM users WHERE role = ? ORDER BY last_name, first_name");
            stmt.setString(1, role);
            rs = stmt.executeQuery();
            
            while (rs.next()) {
                users.add(mapResultSetToUser(rs));
            }
            return users;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error finding users by role", e);
            throw new RuntimeException("Error finding users by role", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Save a user (insert if new, update if existing)
     * @param user the user to save
     * @return the saved user with ID populated
     */
    public User save(User user) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            
            if (user.getId() == null) {
                // Insert new user
                stmt = conn.prepareStatement(
                    "INSERT INTO users (email, password_hash, first_name, last_name, role, phone_number) " +
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
                );
                stmt.setString(1, user.getEmail());
                stmt.setString(2, user.getPasswordHash());
                stmt.setString(3, user.getFirstName());
                stmt.setString(4, user.getLastName());
                stmt.setString(5, user.getRole());
                stmt.setString(6, user.getPhoneNumber());
                
                stmt.executeUpdate();
                rs = stmt.getGeneratedKeys();
                if (rs.next()) {
                    user.setId(rs.getInt(1));
                }
            } else {
                // Update existing user
                stmt = conn.prepareStatement(
                    "UPDATE users SET email = ?, password_hash = ?, first_name = ?, " +
                    "last_name = ?, role = ?, phone_number = ? WHERE id = ?"
                );
                stmt.setString(1, user.getEmail());
                stmt.setString(2, user.getPasswordHash());
                stmt.setString(3, user.getFirstName());
                stmt.setString(4, user.getLastName());
                stmt.setString(5, user.getRole());
                stmt.setString(6, user.getPhoneNumber());
                stmt.setInt(7, user.getId());
                
                stmt.executeUpdate();
            }
            
            return user;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error saving user", e);
            throw new RuntimeException("Error saving user", e);
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, conn);
        }
    }
    
    /**
     * Delete a user by ID
     * @param id the ID of the user to delete
     * @return true if deleted, false if not found
     */
    public boolean delete(int id) {
        Connection conn = null;
        PreparedStatement stmt = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            stmt = conn.prepareStatement("DELETE FROM users WHERE id = ?");
            stmt.setInt(1, id);
            
            int rowsAffected = stmt.executeUpdate();
            return rowsAffected > 0;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error deleting user", e);
            throw new RuntimeException("Error deleting user", e);
        } finally {
            DatabaseUtil.closeQuietly(stmt, conn);
        }
    }
    
    /**
     * Map a ResultSet row to a User object
     * @param rs the ResultSet
     * @return User object
     * @throws SQLException if mapping fails
     */
    private User mapResultSetToUser(ResultSet rs) throws SQLException {
        User user = new User();
        user.setId(rs.getInt("id"));
        user.setEmail(rs.getString("email"));
        user.setPasswordHash(rs.getString("password_hash"));
        user.setFirstName(rs.getString("first_name"));
        user.setLastName(rs.getString("last_name"));
        user.setRole(rs.getString("role"));
        user.setPhoneNumber(rs.getString("phone_number"));
        user.setCreatedAt(rs.getTimestamp("created_at"));
        user.setUpdatedAt(rs.getTimestamp("updated_at"));
        return user;
    }
}