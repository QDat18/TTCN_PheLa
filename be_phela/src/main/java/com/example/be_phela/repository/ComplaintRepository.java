package com.example.be_phela.repository;

import com.example.be_phela.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, String> {
    List<Complaint> findByCustomer_CustomerIdOrderByCreatedAtDesc(String customerId);
    Optional<Complaint> findByOrder_Id(String orderId);
    List<Complaint> findAllByOrderByCreatedAtDesc();
}
