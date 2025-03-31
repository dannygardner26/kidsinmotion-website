package org.kidsinmotion.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.kidsinmotion.model.Participant;
import org.kidsinmotion.service.ParticipantService;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

@WebServlet(urlPatterns = {"/api/participants/*", "/api/events/*/participants"})
public class ParticipantServlet extends HttpServlet {
    private static final Logger LOGGER = Logger.getLogger(ParticipantServlet.class.getName());
    private final ParticipantService participantService = new ParticipantService();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String servletPath = request.getServletPath();
        
        if ("/api/participants".equals(servletPath)) {
            if ("/me".equals(pathInfo)) {
                handleGetMyParticipants(request, response);
            } else if (pathInfo == null || "/".equals(pathInfo)) {
                handleGetAllParticipants(request, response);
            } else if (pathInfo.matches("/\\d+")) {
                int participantId = Integer.parseInt(pathInfo.substring(1));
                handleGetParticipantById(participantId, request, response);
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND);
            }
        } else if ("/api/events".equals(servletPath) && pathInfo.matches("/\\d+/participants")) {
            int eventId = Integer.parseInt(pathInfo.substring(1, pathInfo.indexOf("/participants")));
            handleGetParticipantsByEventId(eventId, request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String servletPath = request.getServletPath();
        
        if ("/api/events".equals(servletPath) && pathInfo.matches("/\\d+/participants")) {
            int eventId = Integer.parseInt(pathInfo.substring(1, pathInfo.indexOf("/participants")));
            handleRegisterParticipant(eventId, request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String servletPath = request.getServletPath();
        
        if ("/api/participants".equals(servletPath) && pathInfo.matches("/\\d+")) {
            int participantId = Integer.parseInt(pathInfo.substring(1));
            handleCancelRegistration(participantId, request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    /**
     * Handle get all participants
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetAllParticipants(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Check admin role
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Admin access required");
                return;
            }
            
            // TODO: Implement this method if needed
            response.sendError(HttpServletResponse.SC_NOT_IMPLEMENTED, "Not implemented yet");
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting all participants", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting all participants");
        }
    }
    
    /**
     * Handle get my participants
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetMyParticipants(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get user ID from request attribute
            Integer parentUserId = (Integer) request.getAttribute("userId");
            
            // Get participants for the parent
            List<Participant> participants = participantService.getParticipantsByParentUserId(parentUserId);
            
            // Send response
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), participants);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting my participants", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting my participants");
        }
    }
    
    /**
     * Handle get participant by ID
     * @param participantId the participant ID
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetParticipantById(int participantId, HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get participant by ID
            Optional<Participant> optionalParticipant = participantService.getParticipantById(participantId);
            
            if (optionalParticipant.isPresent()) {
                Participant participant = optionalParticipant.get();
                
                // Check if the participant belongs to the requesting user or if the user is an admin
                Integer userId = (Integer) request.getAttribute("userId");
                String userRole = (String) request.getAttribute("userRole");
                
                if (participant.getParentUserId().equals(userId) || "ADMIN".equals(userRole)) {
                    // Send response
                    response.setContentType("application/json");
                    objectMapper.writeValue(response.getOutputStream(), participant);
                } else {
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied");
                }
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Participant not found");
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting participant by ID", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting participant by ID");
        }
    }
    
    /**
     * Handle get participants by event ID
     * @param eventId the event ID
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetParticipantsByEventId(int eventId, HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Check admin role
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Admin access required");
                return;
            }
            
            // Get participants for the event
            List<Participant> participants = participantService.getParticipantsByEventId(eventId);
            
            // Send response
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), participants);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting participants by event ID", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting participants by event ID");
        }
    }
    
    /**
     * Handle register participant
     * @param eventId the event ID
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleRegisterParticipant(int eventId, HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get user ID from request attribute
            Integer parentUserId = (Integer) request.getAttribute("userId");
            
            // Parse request body
            Participant participant = objectMapper.readValue(request.getInputStream(), Participant.class);
            participant.setParentUserId(parentUserId);
            participant.setEventId(eventId);
            
            // Register participant
            Participant registeredParticipant = participantService.registerParticipant(participant);
            
            // Send response
            response.setStatus(HttpServletResponse.SC_CREATED);
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), registeredParticipant);
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error registering participant", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error registering participant");
        }
    }
    
    /**
     * Handle cancel registration
     * @param participantId the participant ID
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleCancelRegistration(int participantId, HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get user ID from request attribute
            Integer parentUserId = (Integer) request.getAttribute("userId");
            
            // Cancel registration
            boolean canceled = participantService.cancelRegistration(participantId, parentUserId);
            
            if (canceled) {
                // Send response
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("message", "Registration canceled successfully");
                
                response.setContentType("application/json");
                objectMapper.writeValue(response.getOutputStream(), responseData);
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Participant not found");
            }
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error canceling registration", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error canceling registration");
        }
    }
}