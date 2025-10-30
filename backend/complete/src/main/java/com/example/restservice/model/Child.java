package com.example.restservice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Entity
@Table(name = "children")
public class Child {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must not exceed 50 characters")
    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Min(value = 4, message = "Age must be at least 4")
    @Max(value = 18, message = "Age must not exceed 18")
    @Column(name = "age", nullable = false)
    private Integer age;

    @Size(max = 20, message = "Grade must not exceed 20 characters")
    @Column(name = "grade", length = 20)
    private String grade;

    @Size(max = 500, message = "Baseball experience must not exceed 500 characters")
    @Column(name = "baseball_experience", length = 500)
    private String baseballExperience;

    @Size(max = 500, message = "Medical concerns must not exceed 500 characters")
    @Column(name = "medical_concerns", length = 500)
    private String medicalConcerns;

    @Size(max = 500, message = "Food allergies must not exceed 500 characters")
    @Column(name = "food_allergies", length = 500)
    private String foodAllergies;

    @Size(max = 1000, message = "Additional information must not exceed 1000 characters")
    @Column(name = "additional_information", length = 1000)
    private String additionalInformation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_user_id", nullable = false)
    @JsonIgnore
    private User parent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Constructors
    public Child() {}

    public Child(String firstName, String lastName, Integer age, User parent) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.age = age;
        this.parent = parent;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // JPA lifecycle methods
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public String getBaseballExperience() { return baseballExperience; }
    public void setBaseballExperience(String baseballExperience) { this.baseballExperience = baseballExperience; }

    public String getMedicalConcerns() { return medicalConcerns; }
    public void setMedicalConcerns(String medicalConcerns) { this.medicalConcerns = medicalConcerns; }

    public String getFoodAllergies() { return foodAllergies; }
    public void setFoodAllergies(String foodAllergies) { this.foodAllergies = foodAllergies; }

    public String getAdditionalInformation() { return additionalInformation; }
    public void setAdditionalInformation(String additionalInformation) { this.additionalInformation = additionalInformation; }

    public User getParent() { return parent; }
    public void setParent(User parent) { this.parent = parent; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    public String getFullName() {
        return firstName + " " + lastName;
    }

    @Override
    public String toString() {
        return "Child{" +
                "id=" + id +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", age=" + age +
                ", grade='" + grade + '\'' +
                '}';
    }
}