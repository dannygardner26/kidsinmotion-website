package org.kidsinmotion.filter;

import org.kidsinmotion.util.JWTUtil;

import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

@WebFilter(urlPatterns = {"/api/*"})
public class AuthenticationFilter implements Filter {
    private static final Logger LOGGER = Logger.getLogger(AuthenticationFilter.class.getName());
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
            "/api/auth/login",
            "/api/auth/register",
            "/api/events/public"
    );
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        LOGGER.info("Initializing Authentication Filter");
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String path = httpRequest.getRequestURI();
        
        // Allow public paths without authentication
        if (isPublicPath(path)) {
            chain.doFilter(request, response);
            return;
        }
        
        // Extract token from Authorization header or cookie
        String token = extractToken(httpRequest);
        
        if (token != null && JWTUtil.isTokenValid(token)) {
            // Get user ID and role from token
            Optional<Integer> userId = JWTUtil.getUserIdFromToken(token);
            Optional<String> userRole = JWTUtil.getUserRoleFromToken(token);
            
            // Set user info in request attributes for use in servlets
            userId.ifPresent(id -> httpRequest.setAttribute("userId", id));
            userRole.ifPresent(role -> httpRequest.setAttribute("userRole", role));
            
            // Check if the path requires admin rights
            if (isAdminPath(path) && userRole.isPresent() && !"ADMIN".equals(userRole.get())) {
                httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "Admin access required");
                return;
            }
            
            // Continue with the request
            chain.doFilter(request, response);
        } else {
            // No valid token found, return 401 Unauthorized
            httpResponse.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
        }
    }
    
    @Override
    public void destroy() {
        LOGGER.info("Destroying Authentication Filter");
    }
    
    /**
     * Check if the path is public (doesn't require authentication)
     * @param path the request URI
     * @return true if the path is public, false otherwise
     */
    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }
    
    /**
     * Check if the path requires admin rights
     * @param path the request URI
     * @return true if the path requires admin rights, false otherwise
     */
    private boolean isAdminPath(String path) {
        return path.contains("/admin/");
    }
    
    /**
     * Extract JWT token from Authorization header or cookie
     * @param request the HTTP request
     * @return the JWT token, or null if not found
     */
    private String extractToken(HttpServletRequest request) {
        // Try to get token from Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        
        // Try to get token from cookie
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        
        return null;
    }
}