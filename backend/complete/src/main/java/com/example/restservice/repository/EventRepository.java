package com.example.restservice.repository;

import com.example.restservice.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    // Find events occurring on or after a specific date (upcoming)
    List<Event> findByDateGreaterThanEqualOrderByDateAsc(LocalDate date);

    // Find events occurring before a specific date (past)
    List<Event> findByDateLessThanOrderByDateDesc(LocalDate date);

    // Find all events ordered by date
    List<Event> findAllByOrderByDateAsc();
}