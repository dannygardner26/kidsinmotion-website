package com.example.restservice.repository;

import com.example.restservice.model.TeamApplication;
import com.example.restservice.model.VolunteerEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeamApplicationRepository extends JpaRepository<TeamApplication, Long> {
    List<TeamApplication> findByVolunteerEmployee(VolunteerEmployee volunteerEmployee);
    List<TeamApplication> findByVolunteerEmployeeUserId(Long userId);
    List<TeamApplication> findByStatus(TeamApplication.ApplicationStatus status);
    List<TeamApplication> findByStatusOrderByApplicationDateDesc(TeamApplication.ApplicationStatus status);
    List<TeamApplication> findByTeamName(String teamName);
    List<TeamApplication> findByTeamNameAndStatus(String teamName, TeamApplication.ApplicationStatus status);
    Optional<TeamApplication> findByVolunteerEmployeeAndTeamName(VolunteerEmployee volunteerEmployee, String teamName);
    boolean existsByVolunteerEmployeeAndTeamName(VolunteerEmployee volunteerEmployee, String teamName);
}