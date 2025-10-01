package com.example.restservice.repository;

import com.example.restservice.model.VolunteerEmployee;
import com.example.restservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface VolunteerEmployeeRepository extends JpaRepository<VolunteerEmployee, Long> {
    Optional<VolunteerEmployee> findByUser(User user);
    Optional<VolunteerEmployee> findByUser_Id(Long userId);
    List<VolunteerEmployee> findByStatus(VolunteerEmployee.EmployeeStatus status);
    List<VolunteerEmployee> findByStatusOrderByRegistrationDateDesc(VolunteerEmployee.EmployeeStatus status);
    boolean existsByUser(User user);
}
