package com.example.restservice.repository;

import com.example.restservice.model.Event;
import com.example.restservice.model.Participant;
import com.example.restservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    // Find participants registered by a specific parent user
    List<Participant> findByParentUser(User parentUser);

    // Find participants registered for a specific event
    List<Participant> findByEvent(Event event);

    // Find participants registered by a specific parent for a specific event
    List<Participant> findByParentUserAndEvent(User parentUser, Event event);

    // Count participants for a specific event
    long countByEvent(Event event);

    // Admin methods
    List<Participant> findByEventId(Long eventId);
    List<Participant> findByUserId(Long userId);
    List<Participant> findTop10ByOrderByIdDesc();
}