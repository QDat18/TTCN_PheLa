package com.example.be_phela.repository;

import com.example.be_phela.model.Branch;
import com.example.be_phela.model.enums.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface BranchRepository extends JpaRepository<Branch, String> {
    Optional<Branch> findByBranchName(String branchName);
    Optional<Branch> findByBranchCode(String branchCode);
    List<Branch> findAll();
    List<Branch> findByStatus(ProductStatus status);
    List<Branch> findByStatusAndCityContainsIgnoreCase(ProductStatus status, String city);
    List<Branch> findByStatusAndDistrictContainsIgnoreCase(ProductStatus status, String district);
    Boolean existsByBranchCode(String branchCode);
    List<Branch> findByCityContainsIgnoreCase(String city);
    List<Branch> findByDistrictContainsIgnoreCase(String district);
    List<Branch> findByBranchNameContainingIgnoreCaseOrBranchCodeContainingIgnoreCaseOrAddressContainingIgnoreCase(
            String branchName, String branchCode, String address);
}
