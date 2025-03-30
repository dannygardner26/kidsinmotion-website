package org.kidsinmotion.service;

import org.kidsinmotion.dao.EventDAO;
import org.kidsinmotion.dao.UserDAO;
import org.kidsinmotion.dao.VolunteerDAO;
import org.kidsinmotion.model.Event;
import org.kidsinmotion.model.User;
import org.kidsinmotion.model.Volunteer;

import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

public class VolunteerService {
    private static final Logger LOGGER = Logger.getLogger(VolunteerService.class.getName());
    private final VolunteerDAO volunteerDAO;
    private final UserDAO userDAO;
    private final EventDAO eventDAO;
    private final EventService eventService;
    
    /**
     * Default constructor for backward compatibility
     */
    public VolunteerService() {
        this.volunteerDAO = new VolunteerDAO();
        this.userDAO = new UserDAO();
        this.eventDAO = new EventDAO();
        this.eventService = new EventService();
    }
    
    /**
     * Constructor with dependency injection for testing
     * @param volunteerDAO the volunteer DAO
     * @param userDAO the user DAO
     * @param eventDAO the event DAO
     * @param eventService the event service
     */
    public VolunteerService(VolunteerDAO volunteerDAO, UserDAO userDAO, 
                           EventDAO eventDAO, EventService eventService) {
        this.volunteerDAO = volunteerDAO;
        this.userDAO = userDAO;
        this.eventDAO = eventDAO;
        this.eventService = eventService;
    }
    
    /**
     * Get a volunteer by ID
     * @param id the volunteer ID
     * @return Optional containing the volunteer if found
     */
    public Optional<Volunteer> getVolunteerById(int id) {
        return volunteerDAO.findById(id);
    }
    
    /**
     * Get volunteers by user ID
     * @param userId the user ID
     * @return List of volunteers for the specified user
     */
    public List<Volunteer> getVolunteersByUserId(int userId) {
        return volunteerDAO.findByUserId(userId);
    }
    
    /**
     * Get volunteers by event ID
     * @param eventId the event ID
     * @return List of volunteers for the specified event
     */
    public List<Volunteer> getVolunteersByEventId(int eventId) {
        return volunteerDAO.findByEventId(eventId);
    }
    
    /**
     * Get volunteers by status
     * @param status the status to filter by
     * @return List of volunteers with the specified status
     */
    public List<Volunteer> getVolunteersByStatus(String status) {
        return volunteerDAO.findByStatus(status);
    }
    
    /**
     * Sign up a user to volunteer for an event
     * @param userId the user ID
     * @param eventId the event ID
     * @param notes optional notes
     * @return the created volunteer record
     * @throws IllegalArgumentException if the user or event doesn't exist, or the user is already signed up
     */
    public Volunteer signUpVolunteer(int userId, int eventId, String notes) {
        // Check if user exists
        Optional<User> optionalUser = userDAO.findById(userId);
        if (!optionalUser.isPresent()) {
            throw new IllegalArgumentException("User not found");
        }
        
        // Check if event exists
        Optional<Event> optionalEvent = eventDAO.findById(eventId);
        if (!optionalEvent.isPresent()) {
            throw new IllegalArgumentException("Event not found");
        }
        
        // Check if event needs volunteers
        Event event = optionalEvent.get();
        if (!event.getNeedsVolunteers()) {
            throw new IllegalArgumentException("Event is not looking for volunteers");
        }
        
        // Check if user is already signed up
        Optional<Volunteer> existingVolunteer = volunteerDAO.findByUserIdAndEventId(userId, eventId);
        if (existingVolunteer.isPresent()) {
            throw new IllegalArgumentException("User is already signed up to volunteer for this event");
        }
        
        // Create volunteer record
        Volunteer volunteer = new Volunteer(userId, eventId, "PENDING", notes);
        return volunteerDAO.save(volunteer);
    }
    
    /**
     * Cancel a volunteer signup
     * @param id the volunteer ID
     * @param userId the user ID (for validation)
     * @return true if canceled, false if not found
     * @throws IllegalArgumentException if the volunteer record doesn't belong to the user
     */
    public boolean cancelVolunteer(int id, int userId) {
        Optional<Volunteer> optionalVolunteer = volunteerDAO.findById(id);
        if (optionalVolunteer.isPresent()) {
            Volunteer volunteer = optionalVolunteer.get();
            
            // Validate that the volunteer record belongs to the user
            if (volunteer.getUserId() != userId) {
                throw new IllegalArgumentException("Volunteer record does not belong to the user");
            }
            
            // Update status to CANCELED
            return volunteerDAO.updateStatus(id, "CANCELED");
        }
        return false;
    }
    
    /**
     * Confirm a volunteer
     * @param id the volunteer ID
     * @return true if confirmed, false if not found
     * @throws IllegalArgumentException if the volunteer status is not PENDING
     */
    public boolean confirmVolunteer(int id) {
        Optional<Volunteer> optionalVolunteer = volunteerDAO.findById(id);
        if (optionalVolunteer.isPresent()) {
            Volunteer volunteer = optionalVolunteer.get();
            
            // Validate status
            if (!"PENDING".equals(volunteer.getStatus())) {
                throw new IllegalArgumentException("Volunteer is not in PENDING status");
            }
            
            // Update status to CONFIRMED
            return volunteerDAO.updateStatus(id, "CONFIRMED");
        }
        return false;
    }
    
    /**
     * Reject a volunteer
     * @param id the volunteer ID
     * @return true if rejected, false if not found
     * @throws IllegalArgumentException if the volunteer status is not PENDING
     */
    public boolean rejectVolunteer(int id) {
        Optional<Volunteer> optionalVolunteer = volunteerDAO.findById(id);
        if (optionalVolunteer.isPresent()) {
            Volunteer volunteer = optionalVolunteer.get();
            
            // Validate status
            if (!"PENDING".equals(volunteer.getStatus())) {
                throw new IllegalArgumentException("Volunteer is not in PENDING status");
            }
            
            // Update status to REJECTED
            return volunteerDAO.updateStatus(id, "REJECTED");
        }
        return false;
    }
    
    /**
     * Count volunteers for an event
     * @param eventId the event ID
     * @return the number of confirmed volunteers for the event
     */
    public int countVolunteers(int eventId) {
        return volunteerDAO.countByEventId(eventId);
    }
}