package org.kidsinmotion.service;

import org.kidsinmotion.dao.UserDAO;
import org.kidsinmotion.model.User;
import org.kidsinmotion.util.PasswordUtil;

import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

public class UserService {
    private static final Logger LOGGER = Logger.getLogger(UserService.class.getName());
    private final UserDAO userDAO;
    
    /**
     * Default constructor for backward compatibility
     */
    public UserService() {
        this.userDAO = new UserDAO();
    }
    
    /**
     * Constructor with dependency injection for testing
     * @param userDAO the user DAO
     */
    public UserService(UserDAO userDAO) {
        this.userDAO = userDAO;
    }
    
    /**
     * Get a user by ID
     * @param id the user ID
     * @return Optional containing the user if found
     */
    public Optional<User> getUserById(int id) {
        return userDAO.findById(id);
    }
    
    /**
     * Get all users
     * @return List of all users
     */
    public List<User> getAllUsers() {
        return userDAO.findAll();
    }
    
    /**
     * Get users by role
     * @param role the role to filter by
     * @return List of users with the specified role
     */
    public List<User> getUsersByRole(String role) {
        return userDAO.findByRole(role);
    }
    
    /**
     * Register a new user
     * @param user the user to register
     * @return the registered user
     * @throws IllegalArgumentException if the email is already in use
     */
    public User registerUser(User user) {
        // Check if email is already in use
        if (userDAO.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }
        
        // Hash the password
        String hashedPassword = PasswordUtil.hashPassword(user.getPasswordHash());
        user.setPasswordHash(hashedPassword);
        
        // Set default role if not specified
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("PARENT");
        }
        
        return userDAO.save(user);
    }
    
    /**
     * Update an existing user
     * @param user the user to update
     * @return the updated user
     * @throws IllegalArgumentException if the user doesn't exist
     */
    public User updateUser(User user) {
        // Check if user exists
        if (!userDAO.findById(user.getId()).isPresent()) {
            throw new IllegalArgumentException("User not found");
        }
        
        // If password is changed, hash it
        if (user.getPasswordHash() != null && !user.getPasswordHash().startsWith("$2a$")) {
            String hashedPassword = PasswordUtil.hashPassword(user.getPasswordHash());
            user.setPasswordHash(hashedPassword);
        }
        
        return userDAO.save(user);
    }
    
    /**
     * Delete a user
     * @param id the ID of the user to delete
     * @return true if deleted, false if not found
     */
    public boolean deleteUser(int id) {
        return userDAO.delete(id);
    }
    
    /**
     * Authenticate a user
     * @param email the user's email
     * @param password the user's password (plaintext)
     * @return Optional containing the user if authentication succeeds
     */
    public Optional<User> authenticateUser(String email, String password) {
        Optional<User> optionalUser = userDAO.findByEmail(email);
        
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            if (PasswordUtil.checkPassword(password, user.getPasswordHash())) {
                return optionalUser;
            }
        }
        
        return Optional.empty();
    }
    
    /**
     * Check if a user is an admin
     * @param user the user to check
     * @return true if the user is an admin, false otherwise
     */
    public boolean isAdmin(User user) {
        return "ADMIN".equals(user.getRole());
    }
}