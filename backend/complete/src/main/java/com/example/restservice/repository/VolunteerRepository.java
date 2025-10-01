package com.example.restservice.repository;

import com.example.restservice.model.Event;
import com.example.restservice.model.User;
import com.example.restservice.model.Volunteer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VolunteerRepository extends JpaRepository<Volunteer, Long> {

    // Find volunteers signed up by a specific user
    List<Volunteer> findByUser(User user);

    // Find volunteers signed up for a specific event
    List<Volunteer> findByEvent(Event event);

    // Find volunteers signed up by a specific user for a specific event
    List<Volunteer> findByUserAndEvent(User user, Event event);

    // Admin methods
    List<Volunteer> findByUser_Id(Long userId);
}
