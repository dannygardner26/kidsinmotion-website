package org.kidsinmotion.service;

import org.kidsinmotion.dao.EventDAO;
import org.kidsinmotion.dao.ParticipantDAO;
import org.kidsinmotion.dao.VolunteerDAO;
import org.kidsinmotion.model.Event;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

public class EventService {
    private static final Logger LOGGER = Logger.getLogger(EventService.class.getName());
    private final EventDAO eventDAO;
    private final ParticipantDAO participantDAO;
    private final VolunteerDAO volunteerDAO;
    
    /**
     * Default constructor for backward compatibility
     */
    public EventService() {
        this.eventDAO = new EventDAO();
        this.participantDAO = new ParticipantDAO();
        this.volunteerDAO = new VolunteerDAO();
    }
    
    /**
     * Constructor with dependency injection for testing
     * @param eventDAO the event DAO
     * @param participantDAO the participant DAO
     * @param volunteerDAO the volunteer DAO
     */
    public EventService(EventDAO eventDAO, ParticipantDAO participantDAO, VolunteerDAO volunteerDAO) {
        this.eventDAO = eventDAO;
        this.participantDAO = participantDAO;
        this.volunteerDAO = volunteerDAO;
    }
    
    /**
     * Get an event by ID
     * @param id the event ID
     * @return Optional containing the event if found
     */
    public Optional<Event> getEventById(int id) {
        return eventDAO.findById(id);
    }
    
    /**
     * Get all events
     * @return List of all events
     */
    public List<Event> getAllEvents() {
        return eventDAO.findAll();
    }
    
    /**
     * Get upcoming events
     * @return List of upcoming events
     */
    public List<Event> getUpcomingEvents() {
        return eventDAO.findUpcoming();
    }
    
    /**
     * Get past events
     * @return List of past events
     */
    public List<Event> getPastEvents() {
        return eventDAO.findPast();
    }
    
    /**
     * Get events by sport type
     * @param sportType the sport type to filter by
     * @return List of events for the specified sport type
     */
    public List<Event> getEventsBySportType(String sportType) {
        return eventDAO.findBySportType(sportType);
    }
    
    /**
     * Get events that need volunteers
     * @return List of events that need volunteers
     */
    public List<Event> getEventsNeedingVolunteers() {
        return eventDAO.findNeedingVolunteers();
    }
    
    /**
     * Create a new event
     * @param event the event to create
     * @return the created event
     * @throws IllegalArgumentException if the event data is invalid
     */
    public Event createEvent(Event event) {
        validateEvent(event);
        return eventDAO.save(event);
    }
    
    /**
     * Update an existing event
     * @param event the event to update
     * @return the updated event
     * @throws IllegalArgumentException if the event doesn't exist or data is invalid
     */
    public Event updateEvent(Event event) {
        // Check if event exists
        if (!eventDAO.findById(event.getId()).isPresent()) {
            throw new IllegalArgumentException("Event not found");
        }
        
        validateEvent(event);
        return eventDAO.save(event);
    }
    
    /**
     * Delete an event
     * @param id the ID of the event to delete
     * @return true if deleted, false if not found
     */
    public boolean deleteEvent(int id) {
        return eventDAO.delete(id);
    }
    
    /**
     * Check if an event is full (participants)
     * @param eventId the event ID
     * @return true if the event is full, false otherwise
     */
    public boolean isEventFull(int eventId) {
        Optional<Event> optionalEvent = eventDAO.findById(eventId);
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();
            int participantCount = participantDAO.countByEventId(eventId);
            return participantCount >= event.getMaxParticipants();
        }
        return false;
    }
    
    /**
     * Get the number of available spots for an event
     * @param eventId the event ID
     * @return the number of available spots, or 0 if the event is full or not found
     */
    public int getAvailableSpots(int eventId) {
        Optional<Event> optionalEvent = eventDAO.findById(eventId);
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();
            int participantCount = participantDAO.countByEventId(eventId);
            return Math.max(0, event.getMaxParticipants() - participantCount);
        }
        return 0;
    }
    
    /**
     * Check if an event needs more volunteers
     * @param eventId the event ID
     * @return true if the event needs more volunteers, false otherwise
     */
    public boolean needsMoreVolunteers(int eventId) {
        Optional<Event> optionalEvent = eventDAO.findById(eventId);
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();
            if (event.getNeedsVolunteers()) {
                int volunteerCount = volunteerDAO.countByEventId(eventId);
                return volunteerCount < event.getVolunteerCountNeeded();
            }
        }
        return false;
    }
    
    /**
     * Get the number of volunteers needed for an event
     * @param eventId the event ID
     * @return the number of volunteers still needed, or 0 if the event has enough volunteers or doesn't need any
     */
    public int getVolunteersNeeded(int eventId) {
        Optional<Event> optionalEvent = eventDAO.findById(eventId);
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();
            if (event.getNeedsVolunteers()) {
                int volunteerCount = volunteerDAO.countByEventId(eventId);
                return Math.max(0, event.getVolunteerCountNeeded() - volunteerCount);
            }
        }
        return 0;
    }
    
    /**
     * Validate event data
     * @param event the event to validate
     * @throws IllegalArgumentException if the event data is invalid
     */
    private void validateEvent(Event event) {
        if (event.getTitle() == null || event.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Event title is required");
        }
        
        if (event.getEventType() == null || event.getEventType().trim().isEmpty()) {
            throw new IllegalArgumentException("Event type is required");
        }
        
        if (event.getSportType() == null || event.getSportType().trim().isEmpty()) {
            throw new IllegalArgumentException("Sport type is required");
        }
        
        if (event.getLocation() == null || event.getLocation().trim().isEmpty()) {
            throw new IllegalArgumentException("Event location is required");
        }
        
        if (event.getStartDate() == null) {
            throw new IllegalArgumentException("Start date is required");
        }
        
        if (event.getEndDate() == null) {
            throw new IllegalArgumentException("End date is required");
        }
        
        if (event.getStartDate().isAfter(event.getEndDate())) {
            throw new IllegalArgumentException("Start date must be before end date");
        }
        
        if (event.getMaxParticipants() == null || event.getMaxParticipants() <= 0) {
            throw new IllegalArgumentException("Maximum participants must be a positive number");
        }
        
        if (event.getNeedsVolunteers() && (event.getVolunteerCountNeeded() == null || event.getVolunteerCountNeeded() <= 0)) {
            throw new IllegalArgumentException("Volunteer count needed must be a positive number");
        }
    }
}