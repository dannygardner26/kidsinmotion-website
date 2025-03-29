package org.kidsinmotion.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kidsinmotion.dao.EventDAO;
import org.kidsinmotion.dao.UserDAO;
import org.kidsinmotion.dao.VolunteerDAO;
import org.kidsinmotion.model.Event;
import org.kidsinmotion.model.User;
import org.kidsinmotion.model.Volunteer;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for VolunteerService using Mockito to mock dependencies.
 */
@ExtendWith(MockitoExtension.class)
class VolunteerServiceTest {

    @Mock
    private VolunteerDAO volunteerDAO;
    
    @Mock
    private UserDAO userDAO;
    
    @Mock
    private EventDAO eventDAO;
    
    @Mock
    private EventService eventService;

    @InjectMocks
    private VolunteerService volunteerService;

    private Volunteer testVolunteer;
    private User testUser;
    private Event testEvent;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        // Initialize test data
        now = LocalDateTime.now();
        
        testUser = new User();
        testUser.setId(1);
        testUser.setEmail("volunteer@example.com");
        testUser.setPasswordHash("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG");
        testUser.setFirstName("Test");
        testUser.setLastName("Volunteer");
        testUser.setRole("VOLUNTEER");
        testUser.setPhoneNumber("555-123-4567");
        
        testEvent = new Event();
        testEvent.setId(1);
        testEvent.setTitle("Test Event");
        testEvent.setDescription("Test Description");
        testEvent.setEventType("CLINIC");
        testEvent.setSportType("BASEBALL");
        testEvent.setLocation("Test Location");
        testEvent.setStartDate(now.plusDays(1));
        testEvent.setEndDate(now.plusDays(1).plusHours(3));
        testEvent.setMaxParticipants(20);
        testEvent.setNeedsVolunteers(true);
        testEvent.setVolunteerCountNeeded(5);
        
        testVolunteer = new Volunteer();
        testVolunteer.setId(1);
        testVolunteer.setUserId(testUser.getId());
        testVolunteer.setEventId(testEvent.getId());
        testVolunteer.setStatus("CONFIRMED");
        testVolunteer.setNotes("Test notes");
        testVolunteer.setUser(testUser);
        testVolunteer.setEvent(testEvent);
    }

    @Test
    void testGetVolunteerById() {
        // Arrange
        when(volunteerDAO.findById(1)).thenReturn(Optional.of(testVolunteer));

        // Act
        Optional<Volunteer> result = volunteerService.getVolunteerById(1);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testVolunteer.getId(), result.get().getId());
        assertEquals(testVolunteer.getStatus(), result.get().getStatus());
        
        // Verify
        verify(volunteerDAO, times(1)).findById(1);
    }

    @Test
    void testGetVolunteerByIdNotFound() {
        // Arrange
        when(volunteerDAO.findById(99)).thenReturn(Optional.empty());

        // Act
        Optional<Volunteer> result = volunteerService.getVolunteerById(99);

        // Assert
        assertFalse(result.isPresent());
        
        // Verify
        verify(volunteerDAO, times(1)).findById(99);
    }

    @Test
    void testGetVolunteersByUserId() {
        // Arrange
        List<Volunteer> volunteers = Arrays.asList(testVolunteer);
        when(volunteerDAO.findByUserId(1)).thenReturn(volunteers);

        // Act
        List<Volunteer> result = volunteerService.getVolunteersByUserId(1);

        // Assert
        assertEquals(1, result.size());
        assertEquals(testVolunteer.getId(), result.get(0).getId());
        
        // Verify
        verify(volunteerDAO, times(1)).findByUserId(1);
    }

    @Test
    void testGetVolunteersByEventId() {
        // Arrange
        List<Volunteer> volunteers = Arrays.asList(testVolunteer);
        when(volunteerDAO.findByEventId(1)).thenReturn(volunteers);

        // Act
        List<Volunteer> result = volunteerService.getVolunteersByEventId(1);

        // Assert
        assertEquals(1, result.size());
        assertEquals(testVolunteer.getId(), result.get(0).getId());
        
        // Verify
        verify(volunteerDAO, times(1)).findByEventId(1);
    }

    @Test
    void testGetVolunteersByStatus() {
        // Arrange
        List<Volunteer> volunteers = Arrays.asList(testVolunteer);
        when(volunteerDAO.findByStatus("CONFIRMED")).thenReturn(volunteers);

        // Act
        List<Volunteer> result = volunteerService.getVolunteersByStatus("CONFIRMED");

        // Assert
        assertEquals(1, result.size());
        assertEquals(testVolunteer.getId(), result.get(0).getId());
        assertEquals("CONFIRMED", result.get(0).getStatus());
        
        // Verify
        verify(volunteerDAO, times(1)).findByStatus("CONFIRMED");
    }

    @Test
    void testSignUpVolunteer() {
        // Arrange
        when(userDAO.findById(1)).thenReturn(Optional.of(testUser));
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));
        when(volunteerDAO.findByUserIdAndEventId(1, 1)).thenReturn(Optional.empty());
        when(volunteerDAO.save(any(Volunteer.class))).thenAnswer(invocation -> {
            Volunteer savedVolunteer = invocation.getArgument(0);
            savedVolunteer.setId(2);
            return savedVolunteer;
        });

        // Act
        Volunteer result = volunteerService.signUpVolunteer(1, 1, "Can help with equipment");

        // Assert
        assertEquals(2, result.getId());
        assertEquals(1, result.getUserId());
        assertEquals(1, result.getEventId());
        assertEquals("PENDING", result.getStatus());
        assertEquals("Can help with equipment", result.getNotes());
        
        // Verify
        verify(userDAO, times(1)).findById(1);
        verify(eventDAO, times(1)).findById(1);
        verify(volunteerDAO, times(1)).findByUserIdAndEventId(1, 1);
        verify(volunteerDAO, times(1)).save(any(Volunteer.class));
    }

    @Test
    void testSignUpVolunteerUserNotFound() {
        // Arrange
        when(userDAO.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> volunteerService.signUpVolunteer(99, 1, "Notes"));
        
        // Verify
        verify(userDAO, times(1)).findById(99);
        verify(eventDAO, never()).findById(anyInt());
        verify(volunteerDAO, never()).save(any(Volunteer.class));
    }

    @Test
    void testSignUpVolunteerEventNotFound() {
        // Arrange
        when(userDAO.findById(1)).thenReturn(Optional.of(testUser));
        when(eventDAO.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> volunteerService.signUpVolunteer(1, 99, "Notes"));
        
        // Verify
        verify(userDAO, times(1)).findById(1);
        verify(eventDAO, times(1)).findById(99);
        verify(volunteerDAO, never()).save(any(Volunteer.class));
    }

    @Test
    void testSignUpVolunteerEventDoesNotNeedVolunteers() {
        // Arrange
        Event eventWithoutVolunteers = new Event();
        eventWithoutVolunteers.setId(2);
        eventWithoutVolunteers.setTitle("Event No Volunteers");
        eventWithoutVolunteers.setNeedsVolunteers(false);
        
        when(userDAO.findById(1)).thenReturn(Optional.of(testUser));
        when(eventDAO.findById(2)).thenReturn(Optional.of(eventWithoutVolunteers));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> volunteerService.signUpVolunteer(1, 2, "Notes"));
        
        // Verify
        verify(userDAO, times(1)).findById(1);
        verify(eventDAO, times(1)).findById(2);
        verify(volunteerDAO, never()).save(any(Volunteer.class));
    }

    @Test
    void testSignUpVolunteerAlreadySignedUp() {
        // Arrange
        when(userDAO.findById(1)).thenReturn(Optional.of(testUser));
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));
        when(volunteerDAO.findByUserIdAndEventId(1, 1)).thenReturn(Optional.of(testVolunteer));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> volunteerService.signUpVolunteer(1, 1, "Notes"));
        
        // Verify
        verify(userDAO, times(1)).findById(1);
        verify(eventDAO, times(1)).findById(1);
        verify(volunteerDAO, times(1)).findByUserIdAndEventId(1, 1);
        verify(volunteerDAO, never()).save(any(Volunteer.class));
    }

    @Test
    void testCancelVolunteer() {
        // Arrange
        when(volunteerDAO.findById(1)).thenReturn(Optional.of(testVolunteer));
        when(volunteerDAO.updateStatus(1, "CANCELED")).thenReturn(true);

        // Act
        boolean result = volunteerService.cancelVolunteer(1, 1);

        // Assert
        assertTrue(result);
        
        // Verify
        verify(volunteerDAO, times(1)).findById(1);
        verify(volunteerDAO, times(1)).updateStatus(1, "CANCELED");
    }

    @Test
    void testCancelVolunteerNotFound() {
        // Arrange
        when(volunteerDAO.findById(99)).thenReturn(Optional.empty());

        // Act
        boolean result = volunteerService.cancelVolunteer(99, 1);

        // Assert
        assertFalse(result);
        
        // Verify
        verify(volunteerDAO, times(1)).findById(99);
        verify(volunteerDAO, never()).updateStatus(anyInt(), anyString());
    }

    @Test
    void testCancelVolunteerWrongUser() {
        // Arrange
        when(volunteerDAO.findById(1)).thenReturn(Optional.of(testVolunteer));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> volunteerService.cancelVolunteer(1, 2));
        
        // Verify
        verify(volunteerDAO, times(1)).findById(1);
        verify(volunteerDAO, never()).updateStatus(anyInt(), anyString());
    }

    @Test
    void testConfirmVolunteer() {
        // Arrange
        Volunteer pendingVolunteer = new Volunteer();
        pendingVolunteer.setId(2);
        pendingVolunteer.setUserId(testUser.getId());
        pendingVolunteer.setEventId(testEvent.getId());
        pendingVolunteer.setStatus("PENDING");
        
        when(volunteerDAO.findById(2)).thenReturn(Optional.of(pendingVolunteer));
        when(volunteerDAO.updateStatus(2, "CONFIRMED")).thenReturn(true);

        // Act
        boolean result = volunteerService.confirmVolunteer(2);

        // Assert
        assertTrue(result);
        
        // Verify
        verify(volunteerDAO, times(1)).findById(2);
        verify(volunteerDAO, times(1)).updateStatus(2, "CONFIRMED");
    }

    @Test
    void testConfirmVolunteerNotFound() {
        // Arrange
        when(volunteerDAO.findById(99)).thenReturn(Optional.empty());

        // Act
        boolean result = volunteerService.confirmVolunteer(99);

        // Assert
        assertFalse(result);
        
        // Verify
        verify(volunteerDAO, times(1)).findById(99);
        verify(volunteerDAO, never()).updateStatus(anyInt(), anyString());
    }

    @Test
    void testConfirmVolunteerNotPending() {
        // Arrange
        when(volunteerDAO.findById(1)).thenReturn(Optional.of(testVolunteer)); // Already CONFIRMED

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> volunteerService.confirmVolunteer(1));
        
        // Verify
        verify(volunteerDAO, times(1)).findById(1);
        verify(volunteerDAO, never()).updateStatus(anyInt(), anyString());
    }
    
    @Test
    void testRejectVolunteer() {
        // Arrange
        Volunteer pendingVolunteer = new Volunteer();
        pendingVolunteer.setId(2);
        pendingVolunteer.setUserId(testUser.getId());
        pendingVolunteer.setEventId(testEvent.getId());
        pendingVolunteer.setStatus("PENDING");
        
        when(volunteerDAO.findById(2)).thenReturn(Optional.of(pendingVolunteer));
        when(volunteerDAO.updateStatus(2, "REJECTED")).thenReturn(true);

        // Act
        boolean result = volunteerService.rejectVolunteer(2);

        // Assert
        assertTrue(result);
        
        // Verify
        verify(volunteerDAO, times(1)).findById(2);
        verify(volunteerDAO, times(1)).updateStatus(2, "REJECTED");
    }
    
    @Test
    void testRejectVolunteerNotFound() {
        // Arrange
        when(volunteerDAO.findById(99)).thenReturn(Optional.empty());

        // Act
        boolean result = volunteerService.rejectVolunteer(99);

        // Assert
        assertFalse(result);
        
        // Verify
        verify(volunteerDAO, times(1)).findById(99);
        verify(volunteerDAO, never()).updateStatus(anyInt(), anyString());
    }
    
    @Test
    void testRejectVolunteerNotPending() {
        // Arrange
        when(volunteerDAO.findById(1)).thenReturn(Optional.of(testVolunteer)); // Already CONFIRMED

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> volunteerService.rejectVolunteer(1));
        
        // Verify
        verify(volunteerDAO, times(1)).findById(1);
        verify(volunteerDAO, never()).updateStatus(anyInt(), anyString());
    }
    
    @Test
    void testCountVolunteers() {
        // Arrange
        when(volunteerDAO.countByEventId(1)).thenReturn(3);

        // Act
        int result = volunteerService.countVolunteers(1);

        // Assert
        assertEquals(3, result);
        
        // Verify
        verify(volunteerDAO, times(1)).countByEventId(1);
    }
}