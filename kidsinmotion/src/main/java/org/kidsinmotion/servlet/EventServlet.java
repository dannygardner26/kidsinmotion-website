package org.kidsinmotion.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.kidsinmotion.model.Event;
import org.kidsinmotion.service.EventService;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

@WebServlet(urlPatterns = {"/api/events/*"})
public class EventServlet extends HttpServlet {
    private static final Logger LOGGER = Logger.getLogger(EventServlet.class.getName());
    private final EventService eventService = new EventService();
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        
        if (pathInfo == null || "/".equals(pathInfo)) {
            handleGetAllEvents(request, response);
        } else if ("/upcoming".equals(pathInfo)) {
            handleGetUpcomingEvents(request, response);
        } else if ("/past".equals(pathInfo)) {
            handleGetPastEvents(request, response);
        } else if ("/volunteers-needed".equals(pathInfo)) {
            handleGetEventsNeedingVolunteers(request, response);
        } else if (pathInfo.matches("/\\d+")) {
            int eventId = Integer.parseInt(pathInfo.substring(1));
            handleGetEventById(eventId, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        
        if (pathInfo == null || "/".equals(pathInfo)) {
            handleCreateEvent(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        
        if (pathInfo != null && pathInfo.matches("/\\d+")) {
            int eventId = Integer.parseInt(pathInfo.substring(1));
            handleUpdateEvent(eventId, request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        
        if (pathInfo != null && pathInfo.matches("/\\d+")) {
            int eventId = Integer.parseInt(pathInfo.substring(1));
            handleDeleteEvent(eventId, request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    /**
     * Handle get all events
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetAllEvents(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get all events
            List<Event> events = eventService.getAllEvents();
            
            // Send response
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), events);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting all events", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting all events");
        }
    }
    
    /**
     * Handle get upcoming events
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetUpcomingEvents(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get upcoming events
            List<Event> events = eventService.getUpcomingEvents();
            
            // Send response
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), events);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting upcoming events", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting upcoming events");
        }
    }
    
    /**
     * Handle get past events
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetPastEvents(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get past events
            List<Event> events = eventService.getPastEvents();
            
            // Send response
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), events);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting past events", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting past events");
        }
    }
    
    /**
     * Handle get events needing volunteers
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetEventsNeedingVolunteers(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get events needing volunteers
            List<Event> events = eventService.getEventsNeedingVolunteers();
            
            // Send response
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), events);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting events needing volunteers", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting events needing volunteers");
        }
    }
    
    /**
     * Handle get event by ID
     * @param eventId the event ID
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetEventById(int eventId, HttpServletResponse response) throws IOException {
        try {
            // Get event by ID
            Optional<Event> optionalEvent = eventService.getEventById(eventId);
            
            if (optionalEvent.isPresent()) {
                Event event = optionalEvent.get();
                
                // Create response with additional info
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("event", event);
                responseData.put("availableSpots", eventService.getAvailableSpots(eventId));
                responseData.put("volunteersNeeded", eventService.getVolunteersNeeded(eventId));
                
                // Send response
                response.setContentType("application/json");
                objectMapper.writeValue(response.getOutputStream(), responseData);
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Event not found");
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting event by ID", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting event by ID");
        }
    }
    
    /**
     * Handle create event
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleCreateEvent(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Check admin role
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Admin access required");
                return;
            }
            
            // Parse request body
            Event event = objectMapper.readValue(request.getInputStream(), Event.class);
            
            // Create event
            Event createdEvent = eventService.createEvent(event);
            
            // Send response
            response.setStatus(HttpServletResponse.SC_CREATED);
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), createdEvent);
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error creating event", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error creating event");
        }
    }
    
    /**
     * Handle update event
     * @param eventId the event ID
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleUpdateEvent(int eventId, HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Check admin role
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Admin access required");
                return;
            }
            
            // Parse request body
            Event event = objectMapper.readValue(request.getInputStream(), Event.class);
            event.setId(eventId);
            
            // Update event
            Event updatedEvent = eventService.updateEvent(event);
            
            // Send response
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), updatedEvent);
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error updating event", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error updating event");
        }
    }
    
    /**
     * Handle delete event
     * @param eventId the event ID
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleDeleteEvent(int eventId, HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Check admin role
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Admin access required");
                return;
            }
            
            // Delete event
            boolean deleted = eventService.deleteEvent(eventId);
            
            if (deleted) {
                // Send response
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("message", "Event deleted successfully");
                
                response.setContentType("application/json");
                objectMapper.writeValue(response.getOutputStream(), responseData);
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Event not found");
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error deleting event", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error deleting event");
        }
    }
}