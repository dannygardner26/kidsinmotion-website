package org.kidsinmotion.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.kidsinmotion.model.User;

import java.security.Key;
import java.util.Date;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

public class JWTUtil {
    private static final Logger LOGGER = Logger.getLogger(JWTUtil.class.getName());
    private static final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private static long EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    /**
     * Generate a JWT token for a user
     * @param user the user
     * @return the JWT token
     */
    public static String generateToken(User user) {
        return Jwts.builder()
                .setSubject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("role", user.getRole())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SECRET_KEY)
                .compact();
    }
    
    /**
     * Parse a JWT token and extract the claims
     * @param token the JWT token
     * @return Optional containing the claims if the token is valid
     */
    public static Optional<Claims> parseToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(SECRET_KEY)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return Optional.of(claims);
        } catch (ExpiredJwtException e) {
            LOGGER.log(Level.INFO, "Expired JWT token");
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Invalid JWT token", e);
        }
        return Optional.empty();
    }
    
    /**
     * Extract the user ID from a JWT token
     * @param token the JWT token
     * @return Optional containing the user ID if the token is valid
     */
    public static Optional<Integer> getUserIdFromToken(String token) {
        Optional<Claims> claims = parseToken(token);
        return claims.map(c -> Integer.parseInt(c.getSubject()));
    }
    
    /**
     * Extract the user role from a JWT token
     * @param token the JWT token
     * @return Optional containing the user role if the token is valid
     */
    public static Optional<String> getUserRoleFromToken(String token) {
        Optional<Claims> claims = parseToken(token);
        return claims.map(c -> c.get("role", String.class));
    }
    
    /**
     * Check if a token is valid and not expired
     * @param token the JWT token
     * @return true if the token is valid and not expired, false otherwise
     */
    public static boolean isTokenValid(String token) {
        return parseToken(token).isPresent();
    }
}