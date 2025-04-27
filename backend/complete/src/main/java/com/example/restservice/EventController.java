package com.example.restservice;

import com.example.restservice.model.Event; // Import the Event entity
import com.example.restservice.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600) // Allow all origins for now
@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired
    private EventRepository eventRepository;

    // Fetch all events, ordered by date
    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepository.findAllByOrderByDateAsc();
    }

    // Fetch upcoming events (today or later), ordered by date
    @GetMapping("/upcoming")
    public List<Event> getUpcomingEvents() {
        LocalDate today = LocalDate.now();
        return eventRepository.findByDateGreaterThanEqualOrderByDateAsc(today);
    }

    // Fetch past events (before today), ordered by date descending
    @GetMapping("/past")
    public List<Event> getPastEvents() {
        LocalDate today = LocalDate.now();
        return eventRepository.findByDateLessThanOrderByDateDesc(today);
    }

    // Removed the static inner Event class as we are now using the Event entity from the model package
}