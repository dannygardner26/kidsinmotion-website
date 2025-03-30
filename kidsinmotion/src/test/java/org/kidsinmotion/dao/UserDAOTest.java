package org.kidsinmotion.dao;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.kidsinmotion.model.User;
import org.kidsinmotion.util.DatabaseUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for UserDAO.
 * These tests require a test database to be set up.
 */
class UserDAOTest {
    
    private UserDAO userDAO;
    private Connection conn;
    
    @BeforeEach
    void setUp() throws SQLException {
        userDAO = new UserDAO();
        
        // Get a connection and clear the users table for testing
        conn = DatabaseUtil.getConnection();
        try (PreparedStatement stmt = conn.prepareStatement("DELETE FROM users WHERE id > 1")) {
            stmt.executeUpdate();
        }
        
        // Insert test data
        try (PreparedStatement stmt = conn.prepareStatement(
                "INSERT INTO users (email, password_hash, first_name, last_name, role, phone_number) " +
                "VALUES (?, ?, ?, ?, ?, ?)")) {

          
                        
            stmt.setString(1, "admin@kidsinmotion.org");
            stmt.setString(2, "$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG");
            stmt.setString(3, "Admin");
            stmt.setString(4, "User");
            stmt.setString(5, "ADMIN");
            stmt.setString(6, "555-123-4567");
            stmt.executeUpdate();
            
            
            // Test user 1
            stmt.setString(1, "test1@example.com");
            stmt.setString(2, "$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG"); // "password"
            stmt.setString(3, "Test");
            stmt.setString(4, "User1");
            stmt.setString(5, "PARENT");
            stmt.setString(6, "555-123-4567");
            stmt.executeUpdate();
            
            // Test user 2
            stmt.setString(1, "test2@example.com");
            stmt.setString(2, "$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG"); // "password"
            stmt.setString(3, "Test");
            stmt.setString(4, "User2");
            stmt.setString(5, "VOLUNTEER");
            stmt.setString(6, "555-987-6543");
            stmt.executeUpdate();
        }
    }
    
    @Test
    void testFindById() throws SQLException {
        // Find the ID of test1@example.com
        int userId;
        try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM users WHERE email = ?")) {
            stmt.setString(1, "test1@example.com");
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "User should exist");
            userId = rs.getInt("id");
        }
        
        // Test finding by ID
        Optional<User> userOpt = userDAO.findById(userId);
        assertTrue(userOpt.isPresent(), "User should be found");
        
        User user = userOpt.get();
        assertEquals("test1@example.com", user.getEmail());
        assertEquals("Test", user.getFirstName());
        assertEquals("User1", user.getLastName());
        assertEquals("PARENT", user.getRole());
        assertEquals("555-123-4567", user.getPhoneNumber());
    }
    
    @Test
    void testFindByEmail() {
        Optional<User> userOpt = userDAO.findByEmail("test2@example.com");
        assertTrue(userOpt.isPresent(), "User should be found");
        
        User user = userOpt.get();
        assertEquals("Test", user.getFirstName());
        assertEquals("User2", user.getLastName());
        assertEquals("VOLUNTEER", user.getRole());
        assertEquals("555-987-6543", user.getPhoneNumber());
    }
    
    @Test
    void testFindByNonExistentEmail() {
        Optional<User> userOpt = userDAO.findByEmail("nonexistent@example.com");
        assertFalse(userOpt.isPresent(), "User should not be found");
    }
    
    @Test
    void testFindAll() {
        List<User> users = userDAO.findAll();
        // We have the admin user (id=1) plus our two test users
        try {
            printUsersTable();
        } catch (SQLException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        assertTrue(users.size() >= 3, "Should find at least 3 users");
        
        // Verify our test users are in the list
        boolean foundTest1 = false;
        boolean foundTest2 = false;
        
        for (User user : users) {
            if ("test1@example.com".equals(user.getEmail())) {
                foundTest1 = true;
            } else if ("test2@example.com".equals(user.getEmail())) {
                foundTest2 = true;
            }
        }
        
        assertTrue(foundTest1, "Should find test1@example.com");
        assertTrue(foundTest2, "Should find test2@example.com");
    }

    void printUsersTable() throws SQLException {
    Connection conn = null;
    Statement stmt = null;
    ResultSet rs = null;
    
    try {
        conn = DatabaseUtil.getConnection();
        stmt = conn.createStatement();
        rs = stmt.executeQuery("SELECT * FROM users");
        
        System.out.println("==== Users in Database ====");
        int count = 0;
        while (rs.next()) {
            count++;
            System.out.println("ID: " + rs.getInt("id") + 
                ", Email: " + rs.getString("email") + 
                ", First Name: " + rs.getString("first_name") + 
                ", Last Name: " + rs.getString("last_name") + 
                ", Role: " + rs.getString("role"));
        }
        System.out.println("Total users: " + count);
        System.out.println("==========================");
    } finally {
        DatabaseUtil.closeQuietly(rs, stmt, conn);
    }
}
    
    @Test
    void testFindByRole() {
        List<User> parents = userDAO.findByRole("PARENT");
        List<User> volunteers = userDAO.findByRole("VOLUNTEER");
        
        // Check if our test users are found in the right role
        boolean foundTestParent = parents.stream()
                .anyMatch(u -> "test1@example.com".equals(u.getEmail()));
        boolean foundTestVolunteer = volunteers.stream()
                .anyMatch(u -> "test2@example.com".equals(u.getEmail()));
        
        assertTrue(foundTestParent, "Should find parent user");
        assertTrue(foundTestVolunteer, "Should find volunteer user");
    }
    
    @Test
    void testSaveNew() {
        User newUser = new User();
        newUser.setEmail("new@example.com");
        newUser.setPasswordHash("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG");
        newUser.setFirstName("New");
        newUser.setLastName("User");
        newUser.setRole("PARENT");
        newUser.setPhoneNumber("555-111-2222");
        
        User savedUser = userDAO.save(newUser);
        assertNotNull(savedUser.getId(), "ID should be populated");
        
        // Verify the user was saved
        Optional<User> retrievedUser = userDAO.findById(savedUser.getId());
        assertTrue(retrievedUser.isPresent(), "User should be retrievable");
        assertEquals("new@example.com", retrievedUser.get().getEmail());
        assertEquals("New", retrievedUser.get().getFirstName());
    }
    
    @Test
    void testUpdate() throws SQLException {
        // Find the ID of test1@example.com
        int userId;
        try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM users WHERE email = ?")) {
            stmt.setString(1, "test1@example.com");
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "User should exist");
            userId = rs.getInt("id");
        }
        
        // Get the user, update and save
        Optional<User> userOpt = userDAO.findById(userId);
        assertTrue(userOpt.isPresent(), "User should be found");
        
        User user = userOpt.get();
        user.setFirstName("UpdatedFirst");
        user.setLastName("UpdatedLast");
        
        userDAO.save(user);
        
        // Verify the update
        Optional<User> updatedUserOpt = userDAO.findById(userId);
        assertTrue(updatedUserOpt.isPresent(), "User should be found after update");
        
        User updatedUser = updatedUserOpt.get();
        assertEquals("UpdatedFirst", updatedUser.getFirstName());
        assertEquals("UpdatedLast", updatedUser.getLastName());
        assertEquals("test1@example.com", updatedUser.getEmail(), "Email should remain unchanged");
    }
    
    @Test
    void testDelete() throws SQLException {
        // Find the ID of test2@example.com
        int userId;
        try (PreparedStatement stmt = conn.prepareStatement("SELECT id FROM users WHERE email = ?")) {
            stmt.setString(1, "test2@example.com");
            var rs = stmt.executeQuery();
            assertTrue(rs.next(), "User should exist");
            userId = rs.getInt("id");
        }
        
        // Delete the user
        boolean deleted = userDAO.delete(userId);
        assertTrue(deleted, "User should be deleted");
        
        // Verify the user was deleted
        Optional<User> deletedUser = userDAO.findById(userId);
        assertFalse(deletedUser.isPresent(), "User should not be found after deletion");
    }
}