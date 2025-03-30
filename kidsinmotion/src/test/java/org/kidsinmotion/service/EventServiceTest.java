package org.kidsinmotion.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kidsinmotion.dao.EventDAO;
import org.kidsinmotion.dao.ParticipantDAO;
import org.kidsinmotion.dao.VolunteerDAO;
import org.kidsinmotion.model.Event;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EventService using Mockito to mock dependencies.
 */
@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventDAO eventDAO;
    
    @Mock
    private ParticipantDAO participantDAO;
    
    @Mock
    private VolunteerDAO volunteerDAO;

    @InjectMocks
    private EventService eventService;

    private Event testEvent;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        now = LocalDateTime.now();
        
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
    }

    @Test
    void testGetEventById() {
        // Arrange
        System.out.println("Setting up mock: eventDAO.findById(1) should return: " + testEvent);
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));

        // Act
        Optional<Event> result = eventService.getEventById(1);
        System.out.println("Result from eventService.getEventById(1): " + result);

        // Assert
        assertTrue(result.isPresent(), "Result should be present with mocked data");
        assertEquals(testEvent.getId(), result.get().getId());
        assertEquals(testEvent.getTitle(), result.get().getTitle());
        
        // Verify
        verify(eventDAO, times(1)).findById(1);
    }

    @Test
    void testGetEventByIdNotFound() {
        // Arrange
        when(eventDAO.findById(99)).thenReturn(Optional.empty());

        // Act
        Optional<Event> result = eventService.getEventById(99);

        // Assert
        assertFalse(result.isPresent());
        
        // Verify
        verify(eventDAO, times(1)).findById(99);
    }

    @Test
    void testGetAllEvents() {
        // Arrange
        Event event2 = new Event();
        event2.setId(2);
        event2.setTitle("Event 2");
        when(eventDAO.findAll()).thenReturn(Arrays.asList(testEvent, event2));

        // Act
        List<Event> result = eventService.getAllEvents();

        // Assert
        assertEquals(2, result.size());
        assertEquals(testEvent.getId(), result.get(0).getId());
        assertEquals(event2.getId(), result.get(1).getId());
        
        // Verify
        verify(eventDAO, times(1)).findAll();
    }

    @Test
    void testGetUpcomingEvents() {
        // Arrange
        when(eventDAO.findUpcoming()).thenReturn(Arrays.asList(testEvent));

        // Act
        List<Event> result = eventService.getUpcomingEvents();

        // Assert
        assertEquals(1, result.size());
        assertEquals(testEvent.getId(), result.get(0).getId());
        
        // Verify
        verify(eventDAO, times(1)).findUpcoming();
    }

    @Test
    void testGetPastEvents() {
        // Arrange
        Event pastEvent = new Event();
        pastEvent.setId(2);
        pastEvent.setTitle("Past Event");
        pastEvent.setStartDate(now.minusDays(7));
        pastEvent.setEndDate(now.minusDays(7).plusHours(3));
        
        when(eventDAO.findPast()).thenReturn(Arrays.asList(pastEvent));

        // Act
        List<Event> result = eventService.getPastEvents();

        // Assert
        assertEquals(1, result.size());
        assertEquals(pastEvent.getId(), result.get(0).getId());
        
        // Verify
        verify(eventDAO, times(1)).findPast();
    }

    @Test
    void testIsEventFull() {
        // Arrange
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));
        when(participantDAO.countByEventId(1)).thenReturn(20); // Event is full

        // Act
        boolean result = eventService.isEventFull(1);

        // Assert
        assertTrue(result);
        
        // Verify
        verify(eventDAO, times(1)).findById(1);
        verify(participantDAO, times(1)).countByEventId(1);
    }

    @Test
    void testIsEventNotFull() {
        // Arrange
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));
        when(participantDAO.countByEventId(1)).thenReturn(10); // Event has space

        // Act
        boolean result = eventService.isEventFull(1);

        // Assert
        assertFalse(result);
        
        // Verify
        verify(eventDAO, times(1)).findById(1);
        verify(participantDAO, times(1)).countByEventId(1);
    }

    @Test
    void testGetAvailableSpots() {
        // Arrange
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));
        when(participantDAO.countByEventId(1)).thenReturn(15); // 5 spots available

        // Act
        int result = eventService.getAvailableSpots(1);

        // Assert
        assertEquals(5, result);
        
        // Verify
        verify(eventDAO, times(1)).findById(1);
        verify(participantDAO, times(1)).countByEventId(1);
    }

    @Test
    void testNeedsMoreVolunteers() {
        // Arrange
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));
        when(volunteerDAO.countByEventId(1)).thenReturn(3); // Needs 2 more volunteers

        // Act
        boolean result = eventService.needsMoreVolunteers(1);

        // Assert
        assertTrue(result);
        
        // Verify
        verify(eventDAO, times(1)).findById(1);
        verify(volunteerDAO, times(1)).countByEventId(1);
    }

    @Test
    void testDoesNotNeedMoreVolunteers() {
        // Arrange
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));
        when(volunteerDAO.countByEventId(1)).thenReturn(5); // Has enough volunteers

        // Act
        boolean result = eventService.needsMoreVolunteers(1);

        // Assert
        assertFalse(result);
        
        // Verify
        verify(eventDAO, times(1)).findById(1);
        verify(volunteerDAO, times(1)).countByEventId(1);
    }

    @Test
    void testGetVolunteersNeeded() {
        // Arrange
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));
        when(volunteerDAO.countByEventId(1)).thenReturn(3); // Needs 2 more volunteers

        // Act
        int result = eventService.getVolunteersNeeded(1);

        // Assert
        assertEquals(2, result);
        
        // Verify
        verify(eventDAO, times(1)).findById(1);
        verify(volunteerDAO, times(1)).countByEventId(1);
    }

    @Test
    void testCreateEvent() {
        // Arrange
        Event newEvent = new Event();
        newEvent.setTitle("New Event");
        newEvent.setDescription("New Description");
        newEvent.setEventType("CLINIC");
        newEvent.setSportType("SOCCER");
        newEvent.setLocation("New Location");
        newEvent.setStartDate(now.plusDays(2));
        newEvent.setEndDate(now.plusDays(2).plusHours(2));
        newEvent.setMaxParticipants(15);
        newEvent.setNeedsVolunteers(true);
        newEvent.setVolunteerCountNeeded(3);
        
        when(eventDAO.save(any(Event.class))).thenAnswer(invocation -> {
            Event savedEvent = invocation.getArgument(0);
            savedEvent.setId(2);
            return savedEvent;
        });

        // Act
        Event result = eventService.createEvent(newEvent);

        // Assert
        assertEquals(2, result.getId());
        assertEquals("New Event", result.getTitle());
        
        // Verify
        verify(eventDAO, times(1)).save(any(Event.class));
    }

    @Test
    void testCreateEventWithInvalidData() {
        // Arrange
        Event invalidEvent = new Event();
        // Missing required fields

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> eventService.createEvent(invalidEvent));
        
        // Verify
        verify(eventDAO, never()).save(any(Event.class));
    }

    @Test
    void testUpdateEvent() {
        // Arrange
        when(eventDAO.findById(1)).thenReturn(Optional.of(testEvent));
        
        Event updatedEvent = new Event();
        updatedEvent.setId(1);
        updatedEvent.setTitle("Updated Event");
        updatedEvent.setDescription("Updated Description");
        updatedEvent.setEventType("CLINIC");
        updatedEvent.setSportType("BASEBALL");
        updatedEvent.setLocation("Updated Location");
        updatedEvent.setStartDate(now.plusDays(3));
        updatedEvent.setEndDate(now.plusDays(3).plusHours(3));
        updatedEvent.setMaxParticipants(25);
        updatedEvent.setNeedsVolunteers(true);
        updatedEvent.setVolunteerCountNeeded(7);
        
        when(eventDAO.save(any(Event.class))).thenReturn(updatedEvent);

        // Act
        Event result = eventService.updateEvent(updatedEvent);

        // Assert
        assertEquals("Updated Event", result.getTitle());
        assertEquals("Updated Location", result.getLocation());
        
        // Verify
        verify(eventDAO, times(1)).findById(1);
        verify(eventDAO, times(1)).save(any(Event.class));
    }

    @Test
    void testUpdateEventNotFound() {
        // Arrange
        Event nonExistentEvent = new Event();
        nonExistentEvent.setId(99);
        nonExistentEvent.setTitle("Non-existent Event");
        nonExistentEvent.setDescription("Description");
        nonExistentEvent.setEventType("CLINIC");
        nonExistentEvent.setSportType("BASEBALL");
        nonExistentEvent.setLocation("Location");
        nonExistentEvent.setStartDate(now.plusDays(1));
        nonExistentEvent.setEndDate(now.plusDays(1).plusHours(3));
        nonExistentEvent.setMaxParticipants(20);
        nonExistentEvent.setNeedsVolunteers(true);
        nonExistentEvent.setVolunteerCountNeeded(5);
        
        when(eventDAO.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> eventService.updateEvent(nonExistentEvent));
        
        // Verify
        verify(eventDAO, times(1)).findById(99);
        verify(eventDAO, never()).save(any(Event.class));
    }

    @Test
    void testDeleteEvent() {
        // Arrange
        when(eventDAO.delete(1)).thenReturn(true);

        // Act
        boolean result = eventService.deleteEvent(1);

        // Assert
        assertTrue(result);
        
        // Verify
        verify(eventDAO, times(1)).delete(1);
    }

    @Test
    void testDeleteEventNotFound() {
        // Arrange
        when(eventDAO.delete(99)).thenReturn(false);

        // Act
        boolean result = eventService.deleteEvent(99);

        // Assert
        assertFalse(result);
        
        // Verify
        verify(eventDAO, times(1)).delete(99);
    }
}