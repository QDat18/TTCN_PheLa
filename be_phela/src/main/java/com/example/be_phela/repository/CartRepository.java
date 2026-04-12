package com.example.be_phela.repository;

import com.example.be_phela.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, String> {
    Optional<Cart> findByCustomer_CustomerId(String customerId);
    boolean existsByCustomer_CustomerId(String customerId);
}
