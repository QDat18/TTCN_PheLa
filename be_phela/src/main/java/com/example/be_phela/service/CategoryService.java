package com.example.be_phela.service;

import com.example.be_phela.dto.request.CategoryCreateDTO;
import com.example.be_phela.dto.response.CategoryResponseDTO;
import com.example.be_phela.interService.ICategoryService;
import com.example.be_phela.mapper.CategoryMapper;
import com.example.be_phela.model.Category;
import com.example.be_phela.repository.CategoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CategoryService implements ICategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryService(CategoryRepository categoryRepository, CategoryMapper categoryMapper) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
    }
    @Override
    public String generateCategoryCode() {
        long count = categoryRepository.count();
        return String.format("DM%04d", count + 1);
    }

    @Override
    public CategoryResponseDTO createCategory(CategoryCreateDTO categoryDTO) {
        Category category = categoryMapper.toCategory(categoryDTO);
        category.setCategoryCode(generateCategoryCode());
        category.setCategoryName(categoryDTO.getCategoryName());
        category.setDescription(categoryDTO.getDescription());
        Category savedCategory = categoryRepository.save(category);
        return categoryMapper.toCategoryResponseDTO(savedCategory);
    }

    @Override
    public Page<CategoryResponseDTO> getAllCategories(Pageable pageable) {
        Page<Category> categoryPage = categoryRepository.findAll(pageable);
        List<CategoryResponseDTO> categoryDTOs = categoryPage.getContent().stream()
                .map(categoryMapper::toCategoryResponseDTO)
                .collect(Collectors.toList());
        return new PageImpl<>(categoryDTOs, pageable, categoryPage.getTotalElements());
    }

    @Override
    public CategoryResponseDTO getCategoryByCode(String categoryCode) {
        Category category = categoryRepository.findByCategoryCode(categoryCode)
                .orElseThrow(() -> new RuntimeException("Category not found with code: " + categoryCode));
        return categoryMapper.toCategoryResponseDTO(category);
    }

    @Override
    public CategoryResponseDTO updateCategory(String categoryCode,CategoryCreateDTO categoryDTO) {
        Category existingCategory = categoryRepository.findByCategoryCode(categoryCode)
                .orElseThrow(() -> new RuntimeException("Category not found with code: " + categoryCode));
        existingCategory.setCategoryName(categoryDTO.getCategoryName());
        existingCategory.setDescription(categoryDTO.getDescription());
        Category updatedCategory = categoryRepository.save(existingCategory);
        return categoryMapper.toCategoryResponseDTO(updatedCategory);
    }

    @Override
    public void deleteCategory(String categoryCode) {
        Category category = categoryRepository.findByCategoryCode(categoryCode)
                .orElseThrow(() -> new RuntimeException("Category not found with code: " + categoryCode));
        categoryRepository.delete(category);
    }

    @Override
    public List<CategoryResponseDTO> findCategoriesByName(String categoryName) {
        List<Category> categories = categoryRepository.findByCategoryNameContainingIgnoreCase(categoryName);
        return categories.stream()
                .map(categoryMapper::toCategoryResponseDTO)
                .collect(Collectors.toList());
    }

}
