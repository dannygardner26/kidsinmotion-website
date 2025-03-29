package org.kidsinmotion.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.kidsinmotion.model.User;
import org.kidsinmotion.service.UserService;
import org.kidsinmotion.util.JWTUtil;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

@WebServlet(urlPatterns = {"/api/auth/*"})
public class AuthServlet extends HttpServlet {
    private static final Logger LOGGER = Logger.getLogger(AuthServlet.class.getName());
    private final UserService userService = new UserService();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        
        if ("/login".equals(pathInfo)) {
            handleLogin(request, response);
        } else if ("/register".equals(pathInfo)) {
            handleRegister(request, response);
        } else if ("/logout".equals(pathInfo)) {
            handleLogout(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        
        if ("/profile".equals(pathInfo)) {
            handleGetProfile(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        
        if ("/profile".equals(pathInfo)) {
            handleUpdateProfile(request, response);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }
    
    /**
     * Handle user login
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleLogin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Parse request body
            Map<String, String> credentials = objectMapper.readValue(request.getInputStream(), Map.class);
            String email = credentials.get("email");
            String password = credentials.get("password");
            
            // Authenticate user
            Optional<User> optionalUser = userService.authenticateUser(email, password);
            
            if (optionalUser.isPresent()) {
                User user = optionalUser.get();
                
                // Generate JWT token
                String token = JWTUtil.generateToken(user);
                
                // Create response
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("token", token);
                responseData.put("user", createUserResponse(user));
                
                // Set token cookie
                Cookie cookie = new Cookie("token", token);
                cookie.setPath("/");
                cookie.setMaxAge(24 * 60 * 60); // 24 hours
                cookie.setHttpOnly(true);
                response.addCookie(cookie);
                
                // Send response
                response.setContentType("application/json");
                objectMapper.writeValue(response.getOutputStream(), responseData);
            } else {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid credentials");
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error logging in", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error logging in");
        }
    }
    
    /**
     * Handle user registration
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleRegister(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Parse request body
            User user = objectMapper.readValue(request.getInputStream(), User.class);
            
            // Register user
            User registeredUser = userService.registerUser(user);
            
            // Generate JWT token
            String token = JWTUtil.generateToken(registeredUser);
            
            // Create response
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("token", token);
            responseData.put("user", createUserResponse(registeredUser));
            
            // Set token cookie
            Cookie cookie = new Cookie("token", token);
            cookie.setPath("/");
            cookie.setMaxAge(24 * 60 * 60); // 24 hours
            cookie.setHttpOnly(true);
            response.addCookie(cookie);
            
            // Send response
            response.setStatus(HttpServletResponse.SC_CREATED);
            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), responseData);
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error registering user", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error registering user");
        }
    }
    
    /**
     * Handle user logout
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleLogout(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Clear token cookie
        Cookie cookie = new Cookie("token", "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
        
        // Send response
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("message", "Logged out successfully");
        
        response.setContentType("application/json");
        objectMapper.writeValue(response.getOutputStream(), responseData);
    }
    
    /**
     * Handle get user profile
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleGetProfile(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get user ID from request attribute (set by AuthenticationFilter)
            Integer userId = (Integer) request.getAttribute("userId");
            
            // Get user from database
            Optional<User> optionalUser = userService.getUserById(userId);
            
            if (optionalUser.isPresent()) {
                User user = optionalUser.get();
                
                // Create response
                Map<String, Object> responseData = createUserResponse(user);
                
                // Send response
                response.setContentType("application/json");
                objectMapper.writeValue(response.getOutputStream(), responseData);
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "User not found");
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error getting user profile", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error getting user profile");
        }
    }
    
    /**
     * Handle update user profile
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handleUpdateProfile(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // Get user ID from request attribute (set by AuthenticationFilter)
            Integer userId = (Integer) request.getAttribute("userId");
            
            // Get current user from database
            Optional<User> optionalUser = userService.getUserById(userId);
            
            if (optionalUser.isPresent()) {
                User currentUser = optionalUser.get();
                
                // Parse request body
                User updatedUser = objectMapper.readValue(request.getInputStream(), User.class);
                
                // Update user fields
                currentUser.setFirstName(updatedUser.getFirstName());
                currentUser.setLastName(updatedUser.getLastName());
                currentUser.setPhoneNumber(updatedUser.getPhoneNumber());
                
                // Update password if provided
                if (updatedUser.getPasswordHash() != null && !updatedUser.getPasswordHash().isEmpty()) {
                    currentUser.setPasswordHash(updatedUser.getPasswordHash());
                }
                
                // Save updated user
                User savedUser = userService.updateUser(currentUser);
                
                // Create response
                Map<String, Object> responseData = createUserResponse(savedUser);
                
                // Send response
                response.setContentType("application/json");
                objectMapper.writeValue(response.getOutputStream(), responseData);
            } else {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "User not found");
            }
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error updating user profile", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error updating user profile");
        }
    }
    
    /**
     * Create a user response object (without sensitive data)
     * @param user the user
     * @return the user response
     */
    private Map<String, Object> createUserResponse(User user) {
        Map<String, Object> userResponse = new HashMap<>();
        userResponse.put("id", user.getId());
        userResponse.put("email", user.getEmail());
        userResponse.put("firstName", user.getFirstName());
        userResponse.put("lastName", user.getLastName());
        userResponse.put("role", user.getRole());
        userResponse.put("phoneNumber", user.getPhoneNumber());
        return userResponse;
    }
}