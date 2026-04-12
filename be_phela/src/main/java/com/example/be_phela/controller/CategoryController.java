package com.example.be_phela.controller;

import com.example.be_phela.dto.request.CategoryCreateDTO;
import com.example.be_phela.dto.response.CategoryResponseDTO;
import com.example.be_phela.mapper.CategoryMapper;
import com.example.be_phela.model.Category;
import com.example.be_phela.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping
public class CategoryController {
    private final CategoryService categoryService;
    private final CategoryMapper categoryMapper;

    public CategoryController(CategoryService categoryService, CategoryMapper categoryMapper) {
        this.categoryService = categoryService;
        this.categoryMapper = categoryMapper;
    }

    @PostMapping("/api/admin/categories")
    public ResponseEntity<CategoryResponseDTO> createCategory(@Valid @RequestBody CategoryCreateDTO categoryCreateDTO) {
        CategoryResponseDTO createdCategory = categoryService.createCategory(categoryCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCategory);
    }

    @GetMapping("/api/admin/categories")
    public ResponseEntity<Page<CategoryResponseDTO>> getAdminCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "categoryName") String sortBy
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        Page<CategoryResponseDTO> categoryPage = categoryService.getAllCategories(pageable);
        return ResponseEntity.ok(categoryPage);
    }

    @GetMapping("/api/categories/getAll")
    public ResponseEntity<Page<CategoryResponseDTO>> getAllCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "categoryName") String sortBy
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        Page<CategoryResponseDTO> categoryPage = categoryService.getAllCategories(pageable);
        return ResponseEntity.ok(categoryPage);
    }

    @GetMapping("/api/admin/categories/{categoryCode}")
    public ResponseEntity<CategoryResponseDTO> getCategoryByCode(@PathVariable String categoryCode) {
        CategoryResponseDTO category = categoryService.getCategoryByCode(categoryCode);
        return ResponseEntity.ok(category);
    }

    @PutMapping("/api/admin/categories/{categoryCode}")
    public ResponseEntity<CategoryResponseDTO> updateCategory(
            @PathVariable String categoryCode,
            @Valid @RequestBody CategoryCreateDTO categoryCreateDTO) {
        CategoryResponseDTO updatedCategory = categoryService.updateCategory(categoryCode, categoryCreateDTO);
        return ResponseEntity.ok(updatedCategory);
    }

    @DeleteMapping("/api/admin/categories/{categoryCode}")
    public ResponseEntity<Void> deleteCategory(@PathVariable String categoryCode) {
        categoryService.deleteCategory(categoryCode);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/admin/categories/search")
    public ResponseEntity<List<CategoryResponseDTO>> findCategoriesByName(@RequestParam String categoryName) {
        List<CategoryResponseDTO> categories = categoryService.findCategoriesByName(categoryName);
        return ResponseEntity.ok(categories);
    }
}
