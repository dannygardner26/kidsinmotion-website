package org.kidsinmotion.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kidsinmotion.dao.UserDAO;
import org.kidsinmotion.model.User;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService using Mockito to mock dependencies.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserDAO userDAO;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1);
        testUser.setEmail("test@example.com");
        testUser.setPasswordHash("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG"); // "password"
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole("PARENT");
        testUser.setPhoneNumber("555-123-4567");
    }

    @Test
    void testGetUserById() {
        // Arrange
        when(userDAO.findById(1)).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = userService.getUserById(1);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testUser.getId(), result.get().getId());
        assertEquals(testUser.getEmail(), result.get().getEmail());
        
        // Verify
        verify(userDAO, times(1)).findById(1);
    }

    @Test
    void testGetUserByIdNotFound() {
        // Arrange
        when(userDAO.findById(99)).thenReturn(Optional.empty());

        // Act
        Optional<User> result = userService.getUserById(99);

        // Assert
        assertFalse(result.isPresent());
        
        // Verify
        verify(userDAO, times(1)).findById(99);
    }

    @Test
    void testGetAllUsers() {
        // Arrange
        User user2 = new User();
        user2.setId(2);
        user2.setEmail("user2@example.com");
        when(userDAO.findAll()).thenReturn(Arrays.asList(testUser, user2));

        // Act
        List<User> result = userService.getAllUsers();

        // Assert
        assertEquals(2, result.size());
        assertEquals(testUser.getId(), result.get(0).getId());
        assertEquals(user2.getId(), result.get(1).getId());
        
        // Verify
        verify(userDAO, times(1)).findAll();
    }

    @Test
    void testRegisterUser() {
        // Arrange
        User newUser = new User();
        newUser.setEmail("new@example.com");
        newUser.setPasswordHash("password"); // Plain password
        newUser.setFirstName("New");
        newUser.setLastName("User");
        newUser.setRole("PARENT");
        
        when(userDAO.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(userDAO.save(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            savedUser.setId(2);
            return savedUser;
        });

        // Act
        User result = userService.registerUser(newUser);

        // Assert
        assertEquals(2, result.getId());
        assertEquals("new@example.com", result.getEmail());
        assertTrue(result.getPasswordHash().startsWith("$2a$")); // Check that password was hashed
        
        // Verify
        verify(userDAO, times(1)).findByEmail("new@example.com");
        verify(userDAO, times(1)).save(any(User.class));
    }

    @Test
    void testRegisterUserEmailExists() {
        // Arrange
        User newUser = new User();
        newUser.setEmail("test@example.com"); // Email already exists
        newUser.setPasswordHash("password");
        newUser.setFirstName("New");
        newUser.setLastName("User");
        
        when(userDAO.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(newUser));
        
        // Verify
        verify(userDAO, times(1)).findByEmail("test@example.com");
        verify(userDAO, never()).save(any(User.class));
    }

    @Test
    void testAuthenticateUser() {
        // Arrange
        when(userDAO.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = userService.authenticateUser("test@example.com", "password");

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testUser.getId(), result.get().getId());
        
        // Verify
        verify(userDAO, times(1)).findByEmail("test@example.com");
    }

    @Test
    void testAuthenticateUserInvalidPassword() {
        // Arrange
        when(userDAO.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = userService.authenticateUser("test@example.com", "wrongpassword");

        // Assert
        assertFalse(result.isPresent());
        
        // Verify
        verify(userDAO, times(1)).findByEmail("test@example.com");
    }

    @Test
    void testAuthenticateUserNotFound() {
        // Arrange
        when(userDAO.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act
        Optional<User> result = userService.authenticateUser("nonexistent@example.com", "password");

        // Assert
        assertFalse(result.isPresent());
        
        // Verify
        verify(userDAO, times(1)).findByEmail("nonexistent@example.com");
    }

    @Test
    void testUpdateUser() {
        // Arrange
        User updatedUser = new User();
        updatedUser.setId(1);
        updatedUser.setEmail("test@example.com");
        updatedUser.setPasswordHash("newpassword"); // Plain password
        updatedUser.setFirstName("Updated");
        updatedUser.setLastName("User");
        updatedUser.setRole("PARENT");
        
        when(userDAO.findById(1)).thenReturn(Optional.of(testUser));
        when(userDAO.save(any(User.class))).thenReturn(updatedUser);

        // Act
        User result = userService.updateUser(updatedUser);

        // Assert
        assertEquals("Updated", result.getFirstName());
        assertTrue(result.getPasswordHash().startsWith("$2a$"), "Password should be hashed");
        
        // Verify
        verify(userDAO, times(1)).findById(1);
        verify(userDAO, times(1)).save(any(User.class));
    }

    @Test
    void testUpdateUserNotFound() {
        // Arrange
        User nonExistentUser = new User();
        nonExistentUser.setId(99);
        nonExistentUser.setEmail("nonexistent@example.com");
        
        when(userDAO.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> userService.updateUser(nonExistentUser));
        
        // Verify
        verify(userDAO, times(1)).findById(99);
        verify(userDAO, never()).save(any(User.class));
    }

    @Test
    void testDeleteUser() {
        // Arrange
        when(userDAO.delete(1)).thenReturn(true);

        // Act
        boolean result = userService.deleteUser(1);

        // Assert
        assertTrue(result);
        
        // Verify
        verify(userDAO, times(1)).delete(1);
    }
    
    @Test
    void testDeleteUserNotFound() {
        // Arrange
        when(userDAO.delete(99)).thenReturn(false);

        // Act
        boolean result = userService.deleteUser(99);

        // Assert
        assertFalse(result);
        
        // Verify
        verify(userDAO, times(1)).delete(99);
    }
    
    @Test
    void testIsAdmin() {
        // Arrange
        User adminUser = new User();
        adminUser.setRole("ADMIN");
        
        User parentUser = new User();
        parentUser.setRole("PARENT");

        // Act & Assert
        assertTrue(userService.isAdmin(adminUser));
        assertFalse(userService.isAdmin(parentUser));
    }
}