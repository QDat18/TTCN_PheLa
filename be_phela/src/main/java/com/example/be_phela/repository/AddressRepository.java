package com.example.be_phela.repository;

import com.example.be_phela.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.authentication.jaas.JaasPasswordCallbackHandler;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, String> {
    Optional<Address> findByCustomer_CustomerIdAndIsDefaultTrue(String customerId);

    List<Address> findByCustomer_CustomerId(String customerId);
}
