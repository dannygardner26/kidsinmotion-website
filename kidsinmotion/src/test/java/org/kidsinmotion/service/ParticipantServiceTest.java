package org.kidsinmotion.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kidsinmotion.dao.EventDAO;
import org.kidsinmotion.dao.ParticipantDAO;
import org.kidsinmotion.dao.UserDAO;
import org.kidsinmotion.model.Event;
import org.kidsinmotion.model.Participant;
import org.kidsinmotion.model.User;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ParticipantService using Mockito to mock dependencies.
 */
@ExtendWith(MockitoExtension.class)
class ParticipantServiceTest {

    @Mock
    private ParticipantDAO participantDAO;
    
    @Mock
    private UserDAO userDAO;
    
    @Mock
    private EventDAO eventDAO;
    
    @Mock
    private EventService eventService;

    @InjectMocks
    private ParticipantService participantService;

    private Participant testParticipant;
    private User testParent;
    private Event testEvent;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        // Initialize test data
        now = LocalDateTime.now();
        
        testParent = new User();
        testParent.setId(1);
        testParent.setEmail("parent@example.com");
        testParent.setPasswordHash("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG");
        testParent.setFirstName("Test");
        testParent.setLastName("Parent");
        testParent.setRole("PARENT");
        testParent.setPhoneNumber("555-123-4567");
        
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
        
        testParticipant = new Participant();
        testParticipant.setId(1);
        testParticipant.setParentUserId(testParent.getId());
        testParticipant.setEventId(testEvent.getId());
        testParticipant.setChildFirstName("Child");
        testParticipant.setChildLastName("Test");
        testParticipant.setChildAge(10);
        testParticipant.setSpecialNeeds("None");
        testParticipant.setEmergencyContact("555-123-4567");
        testParticipant.setParentUser(testParent);
        testParticipant.setEvent(testEvent);
    }

    @Test
    void testGetParticipantById() {
        // Arrange
        when(participantDAO.findById(1)).thenReturn(Optional.of(testParticipant));

        // Act
        Optional<Participant> result = participantService.getParticipantById(1);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testParticipant.getId(), result.get().getId());
        assertEquals(testParticipant.getChildFirstName(), result.get().getChildFirstName());
        
        // Verify
        verify(participantDAO, times(1)).findById(1);
    }

    @Test
    void testGetParticipantByIdNotFound() {
        // Arrange
        when(participantDAO.findById(99)).thenReturn(Optional.empty());

        // Act
        Optional<Participant> result = participantService.getParticipantById(99);

        // Assert
        assertFalse(result.isPresent());
        
        // Verify
        verify(participantDAO, times(1)).findById(99);
    }

    @Test
    void testGetParticipantsByParentUserId() {
        // Arrange
        List<Participant> participants = Arrays.asList(testParticipant);
        when(participantDAO.findByParentUserId(1)).thenReturn(participants);

        // Act
        List<Participant> result = participantService.getParticipantsByParentUserId(1);

        // Assert
        assertEquals(1, result.size());
        assertEquals(testParticipant.getId(), result.get(0).getId());
        
        // Verify
        verify(participantDAO, times(1)).findByParentUserId(1);
    }

    @Test
    void testGetParticipantsByEventId() {
        // Arrange
        List<Participant> participants = Arrays.asList(testParticipant);
        when(participantDAO.findByEventId(1)).thenReturn(participants);

        // Act
        List<Participant> result = participantService.getParticipantsByEventId(1);

        // Assert
        assertEquals(1, result.size());
        assertEquals(testParticipant.getId(), result.get(0).getId());
        
        // Verify
        verify(participantDAO, times(1)).findByEventId(1);
    }

    @Test
    void testRegisterParticipant() {
        // Arrange
        Participant newParticipant = new Participant();
        newParticipant.setParentUserId(1);
        newParticipant.setEventId(1);
        newParticipant.setChildFirstName("New");
        newParticipant.setChildLastName("Child");
        newParticipant.setChildAge(8);
        newParticipant.setSpecialNeeds("Allergies");
        newParticipant.setEmergencyContact("555-987-6543");
        
        when(userDAO.findById(1)).thenReturn(Optional.of(testParent));
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));
        when(eventService.isEventFull(1)).thenReturn(false);
        when(participantDAO.findByParentEventAndChild(1, 1, "New", "Child")).thenReturn(Optional.empty());
        when(participantDAO.save(any(Participant.class))).thenAnswer(invocation -> {
            Participant savedParticipant = invocation.getArgument(0);
            savedParticipant.setId(2);
            return savedParticipant;
        });

        // Act
        Participant result = participantService.registerParticipant(newParticipant);

        // Assert
        assertEquals(2, result.getId());
        assertEquals("New", result.getChildFirstName());
        assertEquals("Child", result.getChildLastName());
        
        // Verify
        verify(userDAO, times(1)).findById(1);
        verify(eventDAO, times(1)).findById(1);
        verify(eventService, times(1)).isEventFull(1);
        verify(participantDAO, times(1)).findByParentEventAndChild(1, 1, "New", "Child");
        verify(participantDAO, times(1)).save(any(Participant.class));
    }

    @Test
    void testRegisterParticipantParentNotFound() {
        // Arrange
        Participant newParticipant = new Participant();
        newParticipant.setParentUserId(99);
        newParticipant.setEventId(1);
        newParticipant.setChildFirstName("New");
        newParticipant.setChildLastName("Child");
        
        when(userDAO.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.registerParticipant(newParticipant));
        
        // Verify
        verify(userDAO, times(1)).findById(99);
        verify(eventDAO, never()).findById(anyInt());
        verify(eventService, never()).isEventFull(anyInt());
        verify(participantDAO, never()).save(any(Participant.class));
    }

    @Test
    void testRegisterParticipantEventNotFound() {
        // Arrange
        Participant newParticipant = new Participant();
        newParticipant.setParentUserId(1);
        newParticipant.setEventId(99);
        newParticipant.setChildFirstName("New");
        newParticipant.setChildLastName("Child");
        
        when(userDAO.findById(1)).thenReturn(Optional.of(testParent));
        when(eventDAO.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.registerParticipant(newParticipant));
        
        // Verify
        verify(userDAO, times(1)).findById(1);
        verify(eventDAO, times(1)).findById(99);
        verify(eventService, never()).isEventFull(anyInt());
        verify(participantDAO, never()).save(any(Participant.class));
    }

    @Test
    void testRegisterParticipantEventFull() {
        // Arrange
        Participant newParticipant = new Participant();
        newParticipant.setParentUserId(1);
        newParticipant.setEventId(1);
        newParticipant.setChildFirstName("New");
        newParticipant.setChildLastName("Child");
        
        when(userDAO.findById(1)).thenReturn(Optional.of(testParent));
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));
        when(eventService.isEventFull(1)).thenReturn(true);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.registerParticipant(newParticipant));
        
        // Verify
        verify(userDAO, times(1)).findById(1);
        verify(eventDAO, times(1)).findById(1);
        verify(eventService, times(1)).isEventFull(1);
        verify(participantDAO, never()).save(any(Participant.class));
    }

    @Test
    void testRegisterParticipantChildAlreadyRegistered() {
        // Arrange
        Participant newParticipant = new Participant();
        newParticipant.setParentUserId(1);
        newParticipant.setEventId(1);
        newParticipant.setChildFirstName("Child");
        newParticipant.setChildLastName("Test");
        
        when(userDAO.findById(1)).thenReturn(Optional.of(testParent));
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));
        when(eventService.isEventFull(1)).thenReturn(false);
        when(participantDAO.findByParentEventAndChild(1, 1, "Child", "Test")).thenReturn(Optional.of(testParticipant));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.registerParticipant(newParticipant));
        
        // Verify
        verify(userDAO, times(1)).findById(1);
        verify(eventDAO, times(1)).findById(1);
        verify(eventService, times(1)).isEventFull(1);
        verify(participantDAO, times(1)).findByParentEventAndChild(1, 1, "Child", "Test");
        verify(participantDAO, never()).save(any(Participant.class));
    }

    @Test
    void testCancelRegistration() {
        // Arrange
        when(participantDAO.findById(1)).thenReturn(Optional.of(testParticipant));
        when(participantDAO.delete(1)).thenReturn(true);

        // Act
        boolean result = participantService.cancelRegistration(1, 1);

        // Assert
        assertTrue(result);
        
        // Verify
        verify(participantDAO, times(1)).findById(1);
        verify(participantDAO, times(1)).delete(1);
    }

    @Test
    void testCancelRegistrationParticipantNotFound() {
        // Arrange
        when(participantDAO.findById(99)).thenReturn(Optional.empty());

        // Act
        boolean result = participantService.cancelRegistration(99, 1);

        // Assert
        assertFalse(result);
        
        // Verify
        verify(participantDAO, times(1)).findById(99);
        verify(participantDAO, never()).delete(anyInt());
    }

    @Test
    void testCancelRegistrationWrongParent() {
        // Arrange
        when(participantDAO.findById(1)).thenReturn(Optional.of(testParticipant));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> participantService.cancelRegistration(1, 2));
        
        // Verify
        verify(participantDAO, times(1)).findById(1);
        verify(participantDAO, never()).delete(anyInt());
    }

    @Test
    void testCountParticipants() {
        // Arrange
        when(participantDAO.countByEventId(1)).thenReturn(10);

        // Act
        int result = participantService.countParticipants(1);

        // Assert
        assertEquals(10, result);
        
        // Verify
        verify(participantDAO, times(1)).countByEventId(1);
    }
}