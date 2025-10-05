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
<<<<<<< HEAD
}
=======

    // Admin methods
    List<Participant> findByEvent_Id(Long eventId);
    List<Participant> findByParentUser_Id(Long parentUserId);
    List<Participant> findTop10ByOrderByIdDesc();
}
>>>>>>> db03c1d12b4d8355fc970330f2d440837c0e2733
