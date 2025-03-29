package org.kidsinmotion.util;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.kidsinmotion.model.User;

import java.lang.reflect.Field;
import java.security.Key;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for JWTUtil.
 */
class JWTUtilTest {

    private User testUser;
    
    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(123);
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setRole("ADMIN");
    }
    
    @Test
    void testGenerateToken() {
        // When
        String token = JWTUtil.generateToken(testUser);
        
        // Then
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }
    
    @Test
    void testParseValidToken() {
        // Given
        String token = JWTUtil.generateToken(testUser);
        
        // When
        Optional<Claims> claims = JWTUtil.parseToken(token);
        
        // Then
        assertTrue(claims.isPresent());
        assertEquals("123", claims.get().getSubject());
        assertEquals("test@example.com", claims.get().get("email", String.class));
        assertEquals("ADMIN", claims.get().get("role", String.class));
    }
    
    @Test
    void testParseInvalidToken() {
        // Given
        String invalidToken = "invalid.token.string";
        
        // When
        Optional<Claims> claims = JWTUtil.parseToken(invalidToken);
        
        // Then
        assertFalse(claims.isPresent());
    }
    
    @Test
    void testGetUserIdFromToken() {
        // Given
        String token = JWTUtil.generateToken(testUser);
        
        // When
        Optional<Integer> userId = JWTUtil.getUserIdFromToken(token);
        
        // Then
        assertTrue(userId.isPresent());
        assertEquals(123, userId.get());
    }
    
    @Test
    void testGetUserRoleFromToken() {
        // Given
        String token = JWTUtil.generateToken(testUser);
        
        // When
        Optional<String> userRole = JWTUtil.getUserRoleFromToken(token);
        
        // Then
        assertTrue(userRole.isPresent());
        assertEquals("ADMIN", userRole.get());
    }
    
    @Test
    void testIsTokenValid() {
        // Given
        String validToken = JWTUtil.generateToken(testUser);
        String invalidToken = "invalid.token.string";
        
        // When & Then
        assertTrue(JWTUtil.isTokenValid(validToken));
        assertFalse(JWTUtil.isTokenValid(invalidToken));
    }
    
    @Test
    void testExpiredToken() throws Exception {
        // This test requires reflection to modify the EXPIRATION_TIME
        // Note: This approach is not recommended for production code but can be useful for testing
        
        // Save the original expiration time
        Field expirationTimeField = JWTUtil.class.getDeclaredField("EXPIRATION_TIME");
        expirationTimeField.setAccessible(true);
        long originalExpirationTime = (long) expirationTimeField.get(null);
        
        try {
            // Set expiration time to a very small value to force expiration
            expirationTimeField.set(null, 1L); // 1 millisecond
            
            // Generate token with very short expiration
            String token = JWTUtil.generateToken(testUser);
            
            // Wait for token to expire
            Thread.sleep(10);
            
            // Test all methods with expired token
            assertFalse(JWTUtil.parseToken(token).isPresent());
            assertFalse(JWTUtil.getUserIdFromToken(token).isPresent());
            assertFalse(JWTUtil.getUserRoleFromToken(token).isPresent());
            assertFalse(JWTUtil.isTokenValid(token));
            
        } finally {
            // Restore the original expiration time
            expirationTimeField.set(null, originalExpirationTime);
        }
    }
}