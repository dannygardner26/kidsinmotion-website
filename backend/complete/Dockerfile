# Use the official OpenJDK 17 base image
FROM openjdk:17-jdk-slim

# Set the working directory in the container
WORKDIR /app

# Copy the JAR file from the build directory
COPY build/libs/*.jar app.jar

# Expose the port your app runs on
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=development

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]