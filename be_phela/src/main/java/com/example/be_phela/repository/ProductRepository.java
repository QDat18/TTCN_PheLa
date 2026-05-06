package com.example.be_phela.repository;

import com.example.be_phela.model.Product;
import com.example.be_phela.model.enums.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, String> {
    @Override
    Optional<Product> findById(String id);
    List<Product> findByCategory_CategoryCode(String categoryCode);
    List<Product> findByStatus(ProductStatus status);
    Optional<Product> findByProductCode(String productCode);
    boolean existsByProductCode(String productCode);

    Page<Product> findByProductNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String productName, String description, Pageable pageable);

    Page<Product> findByProductNameStartingWithIgnoreCaseOrDescriptionStartingWithIgnoreCase(
            String productName, String description, Pageable pageable);

    Page<Product> findByCategory_CategoryCode(String categoryCode, Pageable pageable);
    @Query("SELECT p FROM product p WHERE p.category.categoryCode = :categoryCode AND " +
            "(LOWER(p.productName) LIKE LOWER(CONCAT(:prefix, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT(:prefix, '%')))")
    Page<Product> findByCategoryCodeAndPrefixSearch(
            @Param("categoryCode") String categoryCode,
            @Param("prefix") String prefix,
            Pageable pageable);
}
