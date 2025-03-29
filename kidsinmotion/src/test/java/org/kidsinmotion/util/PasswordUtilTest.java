package org.kidsinmotion.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for PasswordUtil.
 */
class PasswordUtilTest {

    @Test
    void testHashPassword() {
        // When
        String hashedPassword = PasswordUtil.hashPassword("password123");
        
        // Then
        assertNotNull(hashedPassword);
        assertTrue(hashedPassword.startsWith("$2a$"), "Hash should use BCrypt format");
        assertNotEquals("password123", hashedPassword, "Hash should be different from original password");
    }
    
    @Test
    void testCheckPasswordSuccess() {
        // Given
        String plainPassword = "password123";
        String hashedPassword = PasswordUtil.hashPassword(plainPassword);
        
        // When
        boolean result = PasswordUtil.checkPassword(plainPassword, hashedPassword);
        
        // Then
        assertTrue(result, "Password should match its hash");
    }
    
    @Test
    void testCheckPasswordFailure() {
        // Given
        String plainPassword = "password123";
        String hashedPassword = PasswordUtil.hashPassword(plainPassword);
        
        // When
        boolean result = PasswordUtil.checkPassword("wrongpassword", hashedPassword);
        
        // Then
        assertFalse(result, "Different password should not match the hash");
    }
    
    @Test
    void testCheckPasswordWithNullInputs() {
        // When & Then
        assertFalse(PasswordUtil.checkPassword(null, "hash"), "Null password should not match");
        assertFalse(PasswordUtil.checkPassword("password", null), "Password should not match null hash");
        assertFalse(PasswordUtil.checkPassword(null, null), "Null password should not match null hash");
    }
    
    @Test
    void testCheckPasswordWithInvalidHash() {
        // Given
        String plainPassword = "password123";
        String invalidHash = "invalid$hash$format";
        
        // When & Then
        assertFalse(PasswordUtil.checkPassword(plainPassword, invalidHash), 
                    "Password should not match invalid hash format");
    }
    
    @Test
    void testDifferentPasswordsYieldDifferentHashes() {
        // When
        String hash1 = PasswordUtil.hashPassword("password1");
        String hash2 = PasswordUtil.hashPassword("password2");
        
        // Then
        assertNotEquals(hash1, hash2, "Different passwords should have different hashes");
    }
    
    @Test
    void testSamePasswordYieldsDifferentHashesDueToSalt() {
        // When
        String hash1 = PasswordUtil.hashPassword("password123");
        String hash2 = PasswordUtil.hashPassword("password123");
        
        // Then
        assertNotEquals(hash1, hash2, "Same password should still have different hashes due to salt");
    }
}