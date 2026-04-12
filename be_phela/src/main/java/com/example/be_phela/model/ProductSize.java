package com.example.be_phela.model;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

@Entity(name = "product_size")
public class ProductSize {
    @Id
    @UuidGenerator
    @Column(name = "product_size_id", nullable = false, unique = true)
    private String productSizeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "size_name", nullable = false)
    private String sizeName; // PHÊ, LA, PLUS

    @Column(name = "size_code", nullable = false)
    private String sizeCode; // PHE, LA, PLUS

    @Column(name = "additional_price")
    private Double additionalPrice;

    @Column(name = "final_price", nullable = false)
    private Double finalPrice;

    @Column(name = "stock_quantity")
    private Integer stockQuantity;

    @Column(name = "sku", unique = true)
    private String sku;

    @Column(name = "status")
    private String status; // ACTIVE, INACTIVE

    public ProductSize() {}

    public ProductSize(String productSizeId, Product product, String sizeName, String sizeCode, Double additionalPrice, Double finalPrice, Integer stockQuantity, String sku, String status) {
        this.productSizeId = productSizeId;
        this.product = product;
        this.sizeName = sizeName;
        this.sizeCode = sizeCode;
        this.additionalPrice = additionalPrice;
        this.finalPrice = finalPrice;
        this.stockQuantity = stockQuantity;
        this.sku = sku;
        this.status = status;
    }

    // Getters
    public String getProductSizeId() { return productSizeId; }
    public Product getProduct() { return product; }
    public String getSizeName() { return sizeName; }
    public String getSizeCode() { return sizeCode; }
    public Double getAdditionalPrice() { return additionalPrice; }
    public Double getFinalPrice() { return finalPrice; }
    public Integer getStockQuantity() { return stockQuantity; }
    public String getSku() { return sku; }
    public String getStatus() { return status; }

    // Setters
    public void setProductSizeId(String productSizeId) { this.productSizeId = productSizeId; }
    public void setProduct(Product product) { this.product = product; }
    public void setSizeName(String sizeName) { this.sizeName = sizeName; }
    public void setSizeCode(String sizeCode) { this.sizeCode = sizeCode; }
    public void setAdditionalPrice(Double additionalPrice) { this.additionalPrice = additionalPrice; }
    public void setFinalPrice(Double finalPrice) { this.finalPrice = finalPrice; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
    public void setSku(String sku) { this.sku = sku; }
    public void setStatus(String status) { this.status = status; }

    public static ProductSizeBuilder builder() { return new ProductSizeBuilder(); }

    public static class ProductSizeBuilder {
        private String productSizeId;
        private Product product;
        private String sizeName;
        private String sizeCode;
        private Double additionalPrice;
        private Double finalPrice;
        private Integer stockQuantity;
        private String sku;
        private String status;

        public ProductSizeBuilder productSizeId(String productSizeId) { this.productSizeId = productSizeId; return this; }
        public ProductSizeBuilder product(Product product) { this.product = product; return this; }
        public ProductSizeBuilder sizeName(String sizeName) { this.sizeName = sizeName; return this; }
        public ProductSizeBuilder sizeCode(String sizeCode) { this.sizeCode = sizeCode; return this; }
        public ProductSizeBuilder additionalPrice(Double additionalPrice) { this.additionalPrice = additionalPrice; return this; }
        public ProductSizeBuilder finalPrice(Double finalPrice) { this.finalPrice = finalPrice; return this; }
        public ProductSizeBuilder stockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; return this; }
        public ProductSizeBuilder sku(String sku) { this.sku = sku; return this; }
        public ProductSizeBuilder status(String status) { this.status = status; return this; }

        public ProductSize build() {
            return new ProductSize(productSizeId, product, sizeName, sizeCode, additionalPrice, finalPrice, stockQuantity, sku, status);
        }
    }
}
