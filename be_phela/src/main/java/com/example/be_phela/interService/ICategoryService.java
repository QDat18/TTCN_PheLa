package com.example.be_phela.interService;

import com.example.be_phela.dto.request.CategoryCreateDTO;
import com.example.be_phela.dto.response.CategoryResponseDTO;
import com.example.be_phela.model.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ICategoryService {
    String generateCategoryCode();
    CategoryResponseDTO createCategory(CategoryCreateDTO categoryDTO);
    Page<CategoryResponseDTO> getAllCategories(Pageable pageable);
    CategoryResponseDTO getCategoryByCode(String categoryCode);
    CategoryResponseDTO updateCategory(String categoryCode, CategoryCreateDTO categoryDTO);
    void deleteCategory(String categoryCode);
    List<CategoryResponseDTO> findCategoriesByName(String categoryName);
}
