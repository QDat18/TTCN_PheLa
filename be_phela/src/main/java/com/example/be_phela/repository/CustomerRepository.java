package com.example.be_phela.repository;

import com.example.be_phela.model.Customer;
import com.example.be_phela.model.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.example.be_phela.dto.response.CustomerCancelledCountProjection;
import java.util.Optional;
import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByUsername(String username);
    Optional<Customer> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);

    java.util.List<Customer> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrFullnameContainingIgnoreCase(
            String username, String email, String fullname);


    @Transactional
    @Modifying
    @Query("UPDATE customer c SET c.latitude = :latitude, c.longitude = :longitude WHERE c.username = :username")
    int updateLocation(@Param("username") String username,
                       @Param("latitude") double latitude,
                       @Param("longitude") double longitude);

    @Transactional
    @Modifying
    @Query("UPDATE customer c SET c.status = :status WHERE c.customerId = :customerId")
    void updateStatus(@Param("customerId") String customerId, @Param("status") Status status);

    @Query("SELECT c.customerId as customerId, COUNT(o.id) as cancelledCount " +
           "FROM customer c " +
           "LEFT JOIN orders o ON o.customer.customerId = c.customerId AND o.status = 'CANCELLED' " +
           "WHERE c.customerId IN :customerIds " +
           "GROUP BY c.customerId")
    List<CustomerCancelledCountProjection> findCancelledCountsForCustomerIds(@Param("customerIds") List<String> customerIds);
}
