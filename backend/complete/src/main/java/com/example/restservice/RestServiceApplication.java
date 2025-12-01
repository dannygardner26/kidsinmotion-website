package com.example.restservice;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class})
@EnableAsync
@EnableScheduling
public class RestServiceApplication {

    private static final Logger log = LoggerFactory.getLogger(RestServiceApplication.class);

    public static void main(String[] args) {
        log.info("Starting Kids in Motion API with Firestore backend...");
        SpringApplication.run(RestServiceApplication.class, args);
    }

    // Note: JPA-based initialization is disabled for Firestore migration
    // Role management will be handled through Firestore in the future
}
