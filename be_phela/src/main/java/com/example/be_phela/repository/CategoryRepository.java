package com.example.be_phela.repository;

import com.example.be_phela.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, String> {
    List<Category> findByCategoryNameContainingIgnoreCase(String categoryName);

    Optional<Category> findByCategoryCode(String categoryCode);
}
