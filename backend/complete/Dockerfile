# Use the official OpenJDK 17 base image
FROM openjdk:17-jdk-slim

# Set the working directory in the container
WORKDIR /app

# Copy the JAR file from the build directory
COPY build/libs/*.jar app.jar

# Expose the port your app runs on
EXPOSE 8080

# Set environment variables for faster startup
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=development
ENV JAVA_OPTS="-Xmx1g -Xms512m -XX:+UseG1GC -XX:+UseStringDeduplication"

# Run the application with optimized JVM settings
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]