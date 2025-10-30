package com.example.restservice.model;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, unique = true, nullable = false)
    private ERole name;

    public Role() {

    }

    public Role(ERole name) {
        this.name = name;
    }

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public ERole getName() {
        return name;
    }

    public void setName(ERole name) {
        this.name = name;
    }

    // Enum for team roles only (Discord-like system)
    // User type (Parent/Admin/Volunteer) is stored separately
    public enum ERole {
        TEAM_COACH,
        TEAM_SOCIAL_MEDIA,
        TEAM_FUNDRAISING,
        TEAM_EVENT_COORDINATION
    }
}