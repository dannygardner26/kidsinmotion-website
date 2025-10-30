# Multi-stage build
FROM gradle:8.5-jdk17 AS build

# Copy the backend source
WORKDIR /app
COPY backend/complete/ .

# Build the application
RUN gradle clean build --no-daemon

# Runtime stage
FROM openjdk:17-jre-slim

# Create app directory
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]