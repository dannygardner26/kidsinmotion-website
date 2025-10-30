package com.example.restservice.repository;

import com.example.restservice.model.Child;
import com.example.restservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChildRepository extends JpaRepository<Child, Long> {

    // Find all children for a specific parent
    List<Child> findByParentOrderByFirstNameAsc(User parent);

    // Find a specific child by ID and parent (for security)
    Optional<Child> findByIdAndParent(Long id, User parent);

    // Count children for a parent
    long countByParent(User parent);

    // Find children by parent's Firebase UID (useful for API calls)
    @Query("SELECT c FROM Child c WHERE c.parent.firebaseUid = :firebaseUid ORDER BY c.firstName ASC")
    List<Child> findByParentFirebaseUidOrderByFirstNameAsc(@Param("firebaseUid") String firebaseUid);

    // Find a child by ID and parent's Firebase UID (for security in API calls)
    @Query("SELECT c FROM Child c WHERE c.id = :childId AND c.parent.firebaseUid = :firebaseUid")
    Optional<Child> findByIdAndParentFirebaseUid(@Param("childId") Long childId, @Param("firebaseUid") String firebaseUid);

    // Check if a child exists for a parent
    boolean existsByIdAndParent(Long id, User parent);

    // Find children by age range (useful for event age restrictions)
    @Query("SELECT c FROM Child c WHERE c.parent = :parent AND c.age BETWEEN :minAge AND :maxAge ORDER BY c.firstName ASC")
    List<Child> findByParentAndAgeBetweenOrderByFirstNameAsc(@Param("parent") User parent, @Param("minAge") Integer minAge, @Param("maxAge") Integer maxAge);
}