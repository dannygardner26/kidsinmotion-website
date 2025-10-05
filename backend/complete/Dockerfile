# Use a lightweight JRE for running the Spring Boot app
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the fat JAR produced by the Gradle build step
COPY build/libs/app.jar app.jar

EXPOSE 8080

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
