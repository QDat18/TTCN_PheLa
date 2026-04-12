package com.example.be_phela.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity(name = "category")
public class Category {

    @Id
    @Column(name = "category_code", nullable = false, unique = true)
    private String categoryCode;

    @Column(name = "category_name", nullable = false)
    private String categoryName;

    @Column(name = "description")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Product> products;

    public Category() {}

    public Category(String categoryCode, String categoryName, String description, LocalDateTime createdAt, LocalDateTime updatedAt, List<Product> products) {
        this.categoryCode = categoryCode;
        this.categoryName = categoryName;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.products = products;
    }

    public String getCategoryCode() { return categoryCode; }
    public void setCategoryCode(String categoryCode) { this.categoryCode = categoryCode; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<Product> getProducts() { return products; }
    public void setProducts(List<Product> products) { this.products = products; }

    public static CategoryBuilder builder() { return new CategoryBuilder(); }

    public static class CategoryBuilder {
        private String categoryCode;
        private String categoryName;
        private String description;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<Product> products;

        public CategoryBuilder categoryCode(String categoryCode) { this.categoryCode = categoryCode; return this; }
        public CategoryBuilder categoryName(String categoryName) { this.categoryName = categoryName; return this; }
        public CategoryBuilder description(String description) { this.description = description; return this; }
        public CategoryBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public CategoryBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public CategoryBuilder products(List<Product> products) { this.products = products; return this; }

        public Category build() {
            return new Category(categoryCode, categoryName, description, createdAt, updatedAt, products);
        }
    }
}
