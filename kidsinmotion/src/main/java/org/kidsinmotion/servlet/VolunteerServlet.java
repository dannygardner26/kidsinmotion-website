package org.kidsinmotion.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.kidsinmotion.model.Volunteer;
import org.kidsinmotion.service.VolunteerService;

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

@WebServlet(urlPatterns = {"/api/volunteers/*", "/api/events/*/volunteers"})
public class VolunteerServlet extends HttpServlet {
    private static final Logger LOGGER = Logger.getLogger(VolunteerServlet.class.getName());
    private final VolunteerService volunteerService = new VolunteerService();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String servletPath = request.getServletPath();
        
        if ("/api/volunteers".equals(servletPath)) {
            if ("/me".equals(pathInfo)) {
                handleGetMyVolunteers(request, response);
            } else if (pathInfo == null || "/".equals(pathInfo)) {
                handleGetAllVolunteers(request, response);
            } else if (pathInfo.matches("/\\d+")) {
                int volunteerId = Integer.parseInt(pathInfo.substring(1));
                handleGetVolunteerById(volunteerId, response);
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND);
            }
        } else if ("/api/events".equals(servletPath) && pathInfo.matches("/\\d+/volunteers")) {
            int eventId = Integer.parseInt(pathInfo.substring(1, pathInfo.indexOf("/volunteers")));
            handleGetVolunteersByEventId(eventId, request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String servletPath = request.getServletPath();
        
        if ("/api/events".equals(servletPath) && pathInfo.matches("/\\d+/volunteers")) {
            int eventId = Integer.parseInt(pathInfo.substring(1, pathInfo.indexOf("/volunteers")));
            handleSignUpVolunteer(eventId, request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String servletPath = request.getServletPath();
        
        if ("/api/volunteers".equals(servletPath) && pathInfo.matches("/\\d+")) {
            int volunteerId = Integer.parseInt(pathInfo.substring(1));
            handleCancelVolunteer(volunteerId, request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String servletPath = request.getServletPath();
        
        if ("/api/volunteers".equals(servletPath) && pathInfo.matches("/\\d+/(confirm|reject)")) {
            int volunteerId = Integer.parseInt(pathInfo.substring(1, pathInfo.indexOf("/", 1)));
            
            if (pathInfo.endsWith("/confirm")) {
                handleConfirmVolunteer(volunteerId, request, response);
            } else if (pathInfo.endsWith("/reject")) {
                handleRejectVolunteer(volunteerId, request, response);
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND);
            }
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    /**
     * Handle get all volunteers
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetAllVolunteers(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Check admin role
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Admin access required");
                return;
            }
            
            // Get status parameter
            String status = request.getParameter("status");
            
            // Get volunteers
            List<Volunteer> volunteers;
            if (status != null && !status.isEmpty()) {
                volunteers = volunteerService.getVolunteersByStatus(status);
            } else {
                volunteers = volunteerService.getVolunteersByStatus("PENDING");
            }
            
            // Send response
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), volunteers);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting all volunteers", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting all volunteers");
        }
    }
    
    /**
     * Handle get my volunteers
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetMyVolunteers(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get user ID from request attribute
            Integer userId = (Integer) request.getAttribute("userId");
            
            // Get volunteers for the user
            List<Volunteer> volunteers = volunteerService.getVolunteersByUserId(userId);
            
            // Send response
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), volunteers);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting my volunteers", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting my volunteers");
        }
    }
    
    /**
     * Handle get volunteer by ID
     * @param volunteerId the volunteer ID
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetVolunteerById(int volunteerId, HttpServletResponse response) throws IOException {
        try {
            // Get volunteer by ID
            Optional<Volunteer> optionalVolunteer = volunteerService.getVolunteerById(volunteerId);
            
            if (optionalVolunteer.isPresent()) {
                Volunteer volunteer = optionalVolunteer.get();
                
                // Send response
                response.setContentType("application/json");
                objectMapper.writeValue(response.getOutputStream(), volunteer);
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Volunteer not found");
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting volunteer by ID", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting volunteer by ID");
        }
    }
    
    /**
     * Handle get volunteers by event ID
     * @param eventId the event ID
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetVolunteersByEventId(int eventId, HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Check admin role
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Admin access required");
                return;
            }
            
            // Get volunteers for the event
            List<Volunteer> volunteers = volunteerService.getVolunteersByEventId(eventId);
            
            // Send response
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), volunteers);
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting volunteers by event ID", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting volunteers by event ID");
        }
    }
    
    /**
     * Handle sign up volunteer
     * @param eventId the event ID
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleSignUpVolunteer(int eventId, HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get user ID from request attribute
            Integer userId = (Integer) request.getAttribute("userId");
            
            // Parse request body
            Map<String, String> requestData = objectMapper.readValue(request.getInputStream(), Map.class);
            String notes = requestData.get("notes");
            
            // Sign up volunteer
            Volunteer volunteer = volunteerService.signUpVolunteer(userId, eventId, notes);
            
            // Send response
            response.setStatus(HttpServletResponse.SC_CREATED);
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), volunteer);
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error signing up volunteer", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error signing up volunteer");
        }
    }
    
    /**
     * Handle cancel volunteer
     * @param volunteerId the volunteer ID
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleCancelVolunteer(int volunteerId, HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get user ID from request attribute
            Integer userId = (Integer) request.getAttribute("userId");
            
            // Cancel volunteer
            boolean canceled = volunteerService.cancelVolunteer(volunteerId, userId);
            
            if (canceled) {
                // Send response
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("message", "Volunteer signup canceled successfully");
                
                response.setContentType("application/json");
                objectMapper.writeValue(response.getOutputStream(), responseData);
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Volunteer not found");
            }
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error canceling volunteer", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error canceling volunteer");
        }
    }
    
    /**
     * Handle confirm volunteer
     * @param volunteerId the volunteer ID
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleConfirmVolunteer(int volunteerId, HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Check admin role
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Admin access required");
                return;
            }
            
            // Confirm volunteer
            boolean confirmed = volunteerService.confirmVolunteer(volunteerId);
            
            if (confirmed) {
                // Send response
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("message", "Volunteer confirmed successfully");
                
                response.setContentType("application/json");
                objectMapper.writeValue(response.getOutputStream(), responseData);
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Volunteer not found");
            }
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error confirming volunteer", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error confirming volunteer");
        }
    }
    
    /**
     * Handle reject volunteer
     * @param volunteerId the volunteer ID
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleRejectVolunteer(int volunteerId, HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Check admin role
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Admin access required");
                return;
            }
            
            // Reject volunteer
            boolean rejected = volunteerService.rejectVolunteer(volunteerId);
            
            if (rejected) {
                // Send response
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("message", "Volunteer rejected successfully");
                
                response.setContentType("application/json");
                objectMapper.writeValue(response.getOutputStream(), responseData);
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Volunteer not found");
            }
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error rejecting volunteer", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error rejecting volunteer");
        }
    }
}