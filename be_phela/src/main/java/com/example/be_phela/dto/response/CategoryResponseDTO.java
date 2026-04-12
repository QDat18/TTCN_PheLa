package com.example.be_phela.dto.response;

public class CategoryResponseDTO {
    private String categoryCode;
    private String categoryName;
    private String description;

    public CategoryResponseDTO() {
    }

    public CategoryResponseDTO(String categoryCode, String categoryName, String description) {
        this.categoryCode = categoryCode;
        this.categoryName = categoryName;
        this.description = description;
    }

    public String getCategoryCode() {
        return categoryCode;
    }

    public void setCategoryCode(String categoryCode) {
        this.categoryCode = categoryCode;
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

    public static CategoryResponseDTOBuilder builder() {
        return new CategoryResponseDTOBuilder();
    }

    public static class CategoryResponseDTOBuilder {
        private String categoryCode;
        private String categoryName;
        private String description;

        CategoryResponseDTOBuilder() {
        }

        public CategoryResponseDTOBuilder categoryCode(String categoryCode) {
            this.categoryCode = categoryCode;
            return this;
        }

        public CategoryResponseDTOBuilder categoryName(String categoryName) {
            this.categoryName = categoryName;
            return this;
        }

        public CategoryResponseDTOBuilder description(String description) {
            this.description = description;
            return this;
        }

        public CategoryResponseDTO build() {
            return new CategoryResponseDTO(categoryCode, categoryName, description);
        }
    }
}
