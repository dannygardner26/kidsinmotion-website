package org.kidsinmotion.util;

import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for DatabaseUtil.
 */
class DatabaseUtilTest {

    @Test
    void testGetConnection() {
        // When
        Connection connection = null;
        try {
            connection = DatabaseUtil.getConnection();
            
            // Then
            assertNotNull(connection);
            assertFalse(connection.isClosed());
        } catch (SQLException e) {
            fail("Exception thrown: " + e.getMessage());
        } finally {
            if (connection != null) {
                try {
                    connection.close();
                } catch (SQLException e) {
                    // Ignore
                }
            }
        }
    }
    
    @Test
    void testConnectionCanExecuteQuery() {
        // Given
        Connection connection = null;
        Statement stmt = null;
        ResultSet rs = null;
        
        try {
            // When
            connection = DatabaseUtil.getConnection();
            stmt = connection.createStatement();
            rs = stmt.executeQuery("SELECT 1");
            
            // Then
            assertTrue(rs.next());
            assertEquals(1, rs.getInt(1));
        } catch (SQLException e) {
            fail("Exception thrown: " + e.getMessage());
        } finally {
            DatabaseUtil.closeQuietly(rs, stmt, connection);
        }
    }
    
    @Test
    void testCloseQuietlyWithNullResources() {
        // This should not throw exceptions
        DatabaseUtil.closeQuietly(null, null, null);
    }
    
    @Test
    void testCloseQuietlyWithResources() throws SQLException {
        // Given
        Connection connection = DatabaseUtil.getConnection();
        Statement stmt = connection.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT 1");
        
        // When
        DatabaseUtil.closeQuietly(rs, stmt, connection);
        
        // Then
        assertTrue(connection.isClosed());
        assertTrue(stmt.isClosed());
        assertTrue(rs.isClosed());
    }
    
    @Test
    void testCloseQuietlyHandlesExceptions() throws SQLException {
        // Given
        // Create a custom AutoCloseable that throws an exception when closed
        final AtomicBoolean closeCalled = new AtomicBoolean(false);
        AutoCloseable problematicResource = new AutoCloseable() {
            @Override
            public void close() throws Exception {
                closeCalled.set(true);
                throw new RuntimeException("Test exception from close");
            }
        };
        
        // When
        // This should not throw the exception to the caller
        DatabaseUtil.closeQuietly(problematicResource);
        
        // Then
        assertTrue(closeCalled.get(), "close method should have been called");
    }
    
    @Test
    void testMultipleConnections() throws SQLException {
        // When
        Connection conn1 = null;
        Connection conn2 = null;
        
        try {
            conn1 = DatabaseUtil.getConnection();
            conn2 = DatabaseUtil.getConnection();
            
            // Then
            assertNotNull(conn1);
            assertNotNull(conn2);
            assertNotSame(conn1, conn2, "Should return different connection objects");
        } finally {
            DatabaseUtil.closeQuietly(conn1, conn2);
        }
    }
}