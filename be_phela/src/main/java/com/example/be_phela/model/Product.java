package com.example.be_phela.model;

import com.example.be_phela.model.enums.ProductStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

@Entity(name = "product")
public class Product {
    @Id
    @UuidGenerator
    @Column(name = "product_id", nullable = false, unique = true)
    private String productId;

    @Column(name = "product_code", nullable = false, unique = true)
    private String productCode;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "description")
    private String description;

    @Column(name = "original_price")
    private Double originalPrice;

    @Column(name = "discount_price")
    private Double discountPrice;

    @Column(name = "point_cost")
    private Integer pointCost;

    @Column(name = "is_gift")
    private Boolean isGift;

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ProductStatus status;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @JsonManagedReference
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProductSize> productSizes = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CartItem> cartItems = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Product() {}

    public Product(String productId, String productCode, String productName, String description, Double originalPrice, Double discountPrice, Integer pointCost, Boolean isGift, String imageUrl, ProductStatus status, Category category, List<ProductSize> productSizes, List<OrderItem> orderItems, List<CartItem> cartItems, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.productId = productId;
        this.productCode = productCode;
        this.productName = productName;
        this.description = description;
        this.originalPrice = originalPrice;
        this.discountPrice = discountPrice;
        this.pointCost = pointCost;
        this.isGift = isGift;
        this.imageUrl = imageUrl;
        this.status = status;
        this.category = category;
        this.productSizes = productSizes;
        this.orderItems = orderItems;
        this.cartItems = cartItems;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(Double originalPrice) { this.originalPrice = originalPrice; }
    public Double getDiscountPrice() { return discountPrice; }
    public void setDiscountPrice(Double discountPrice) { this.discountPrice = discountPrice; }
    public Integer getPointCost() { return pointCost; }
    public void setPointCost(Integer pointCost) { this.pointCost = pointCost; }
    public Boolean getIsGift() { return isGift; }
    public void setIsGift(Boolean isGift) { this.isGift = isGift; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public ProductStatus getStatus() { return status; }
    public void setStatus(ProductStatus status) { this.status = status; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public List<ProductSize> getProductSizes() { return productSizes; }
    public void setProductSizes(List<ProductSize> productSizes) { this.productSizes = productSizes; }
    public List<OrderItem> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; }
    public List<CartItem> getCartItems() { return cartItems; }
    public void setCartItems(List<CartItem> cartItems) { this.cartItems = cartItems; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static ProductBuilder builder() { return new ProductBuilder(); }

    public static class ProductBuilder {
        private String productId;
        private String productCode;
        private String productName;
        private String description;
        private Double originalPrice;
        private Double discountPrice;
        private Integer pointCost;
        private Boolean isGift;
        private String imageUrl;
        private ProductStatus status;
        private Category category;
        private List<ProductSize> productSizes = new ArrayList<>();
        private List<OrderItem> orderItems = new ArrayList<>();
        private List<CartItem> cartItems = new ArrayList<>();
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public ProductBuilder productId(String productId) { this.productId = productId; return this; }
        public ProductBuilder productCode(String productCode) { this.productCode = productCode; return this; }
        public ProductBuilder productName(String productName) { this.productName = productName; return this; }
        public ProductBuilder description(String description) { this.description = description; return this; }
        public ProductBuilder originalPrice(Double originalPrice) { this.originalPrice = originalPrice; return this; }
        public ProductBuilder discountPrice(Double discountPrice) { this.discountPrice = discountPrice; return this; }
        public ProductBuilder pointCost(Integer pointCost) { this.pointCost = pointCost; return this; }
        public ProductBuilder isGift(Boolean isGift) { this.isGift = isGift; return this; }
        public ProductBuilder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }
        public ProductBuilder status(ProductStatus status) { this.status = status; return this; }
        public ProductBuilder category(Category category) { this.category = category; return this; }
        public ProductBuilder productSizes(List<ProductSize> productSizes) { this.productSizes = productSizes; return this; }
        public ProductBuilder orderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; return this; }
        public ProductBuilder cartItems(List<CartItem> cartItems) { this.cartItems = cartItems; return this; }
        public ProductBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ProductBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Product build() {
            return new Product(productId, productCode, productName, description, originalPrice, discountPrice, pointCost, isGift, imageUrl, status, category, productSizes, orderItems, cartItems, createdAt, updatedAt);
        }
    }
}
