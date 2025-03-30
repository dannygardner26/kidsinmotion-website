package org.kidsinmotion.service;

import org.kidsinmotion.dao.EventDAO;
import org.kidsinmotion.dao.ParticipantDAO;
import org.kidsinmotion.dao.UserDAO;
import org.kidsinmotion.model.Event;
import org.kidsinmotion.model.Participant;
import org.kidsinmotion.model.User;

import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

public class ParticipantService {
    private static final Logger LOGGER = Logger.getLogger(ParticipantService.class.getName());
    private final ParticipantDAO participantDAO;
    private final UserDAO userDAO;
    private final EventDAO eventDAO;
    private final EventService eventService;
    
    /**
     * Default constructor for backward compatibility
     */
    public ParticipantService() {
        this.participantDAO = new ParticipantDAO();
        this.userDAO = new UserDAO();
        this.eventDAO = new EventDAO();
        this.eventService = new EventService();
    }
    
    /**
     * Constructor with dependency injection for testing
     * @param participantDAO the participant DAO
     * @param userDAO the user DAO
     * @param eventDAO the event DAO
     * @param eventService the event service
     */
    public ParticipantService(ParticipantDAO participantDAO, UserDAO userDAO, 
                             EventDAO eventDAO, EventService eventService) {
        this.participantDAO = participantDAO;
        this.userDAO = userDAO;
        this.eventDAO = eventDAO;
        this.eventService = eventService;
    }
    
    /**
     * Get a participant by ID
     * @param id the participant ID
     * @return Optional containing the participant if found
     */
    public Optional<Participant> getParticipantById(int id) {
        return participantDAO.findById(id);
    }
    
    /**
     * Get participants by parent user ID
     * @param parentUserId the parent user ID
     * @return List of participants for the specified parent
     */
    public List<Participant> getParticipantsByParentUserId(int parentUserId) {
        return participantDAO.findByParentUserId(parentUserId);
    }
    
    /**
     * Get participants by event ID
     * @param eventId the event ID
     * @return List of participants for the specified event
     */
    public List<Participant> getParticipantsByEventId(int eventId) {
        return participantDAO.findByEventId(eventId);
    }
    
    /**
     * Register a child for an event
     * @param participant the participant to register
     * @return the registered participant
     * @throws IllegalArgumentException if the parent or event doesn't exist, the event is full, or the child is already registered
     */
    public Participant registerParticipant(Participant participant) {
        // Check if parent exists
        Optional<User> optionalParent = userDAO.findById(participant.getParentUserId());
        if (!optionalParent.isPresent()) {
            throw new IllegalArgumentException("Parent user not found");
        }
        
        // Check if event exists
        Optional<Event> optionalEvent = eventDAO.findById(participant.getEventId());
        if (!optionalEvent.isPresent()) {
            throw new IllegalArgumentException("Event not found");
        }
        
        // Check if event is full
        if (eventService.isEventFull(participant.getEventId())) {
            throw new IllegalArgumentException("Event is full");
        }
        
        // Check if child is already registered
        Optional<Participant> existingParticipant = participantDAO.findByParentEventAndChild(
            participant.getParentUserId(),
            participant.getEventId(),
            participant.getChildFirstName(),
            participant.getChildLastName());
            
        if (existingParticipant.isPresent()) {
            throw new IllegalArgumentException("Child is already registered for this event");
        }
        
        // Save participant
        return participantDAO.save(participant);
    }
    
    /**
     * Cancel a participant registration
     * @param id the participant ID
     * @param parentUserId the parent user ID (for validation)
     * @return true if deleted, false if not found
     * @throws IllegalArgumentException if the participant doesn't belong to the parent
     */
    public boolean cancelRegistration(int id, int parentUserId) {
        Optional<Participant> optionalParticipant = participantDAO.findById(id);
        if (optionalParticipant.isPresent()) {
            Participant participant = optionalParticipant.get();
            
            // Validate that the participant belongs to the parent
            if (participant.getParentUserId() != parentUserId) {
                throw new IllegalArgumentException("Participant does not belong to the parent");
            }
            
            // Delete the participant
            return participantDAO.delete(id);
        }
        return false;
    }
    
    /**
     * Count participants for an event
     * @param eventId the event ID
     * @return the number of participants for the event
     */
    public int countParticipants(int eventId) {
        return participantDAO.countByEventId(eventId);
    }
}