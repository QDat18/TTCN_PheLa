package com.example.be_phela.dto.request;

import jakarta.validation.constraints.*;

public class CategoryCreateDTO {
    @NotBlank(message = "Category name is required")
    @Size(min = 1, max = 100, message = "Category name must be between 1 and 100 characters")
    @Pattern(regexp = "^[\\p{L}\\p{N}\\s\\-_]+$", message = "Category name contains invalid characters")
    private String categoryName;

    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    public CategoryCreateDTO() {
    }

    public CategoryCreateDTO(String categoryName, String description) {
        this.categoryName = categoryName;
        this.description = description;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public static CategoryCreateDTOBuilder builder() {
        return new CategoryCreateDTOBuilder();
    }

    public static class CategoryCreateDTOBuilder {
        private String categoryName;
        private String description;

        CategoryCreateDTOBuilder() {
        }

        public CategoryCreateDTOBuilder categoryName(String categoryName) {
            this.categoryName = categoryName;
            return this;
        }

        public CategoryCreateDTOBuilder description(String description) {
            this.description = description;
            return this;
        }

        public CategoryCreateDTO build() {
            return new CategoryCreateDTO(categoryName, description);
        }
    }
}
