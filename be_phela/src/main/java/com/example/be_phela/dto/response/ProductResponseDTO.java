package com.example.be_phela.dto.response;

import com.example.be_phela.model.Category;
import com.example.be_phela.model.enums.ProductStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductResponseDTO {
    private String productId;
    private String productCode;
    private String productName;
    private String description;
    private Double originalPrice;
    private String imageUrl;
    private String categoryCode;
    private ProductStatus status;
    private List<ProductSizeResponseDTO> sizes;

    // Manual Getters
    public String getProductId() { return productId; }
    public String getProductCode() { return productCode; }
    public String getProductName() { return productName; }
    public String getDescription() { return description; }
    public Double getOriginalPrice() { return originalPrice; }
    public String getImageUrl() { return imageUrl; }
    public String getCategoryCode() { return categoryCode; }
    public ProductStatus getStatus() { return status; }
    public List<ProductSizeResponseDTO> getSizes() { return sizes; }

    // Manual Builder
    public static ProductResponseDTOBuilder builder() {
        return new ProductResponseDTOBuilder();
    }

    public static class ProductResponseDTOBuilder {
        private String productId;
        private String productCode;
        private String productName;
        private String description;
        private Double originalPrice;
        private String imageUrl;
        private String categoryCode;
        private ProductStatus status;
        private List<ProductSizeResponseDTO> sizes;

        public ProductResponseDTOBuilder productId(String productId) { this.productId = productId; return this; }
        public ProductResponseDTOBuilder productCode(String productCode) { this.productCode = productCode; return this; }
        public ProductResponseDTOBuilder productName(String productName) { this.productName = productName; return this; }
        public ProductResponseDTOBuilder description(String description) { this.description = description; return this; }
        public ProductResponseDTOBuilder originalPrice(Double originalPrice) { this.originalPrice = originalPrice; return this; }
        public ProductResponseDTOBuilder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }
        public ProductResponseDTOBuilder categoryCode(String categoryCode) { this.categoryCode = categoryCode; return this; }
        public ProductResponseDTOBuilder status(ProductStatus status) { this.status = status; return this; }
        public ProductResponseDTOBuilder sizes(List<ProductSizeResponseDTO> sizes) { this.sizes = sizes; return this; }

        public ProductResponseDTO build() {
            return new ProductResponseDTO(productId, productCode, productName, description, originalPrice, imageUrl, categoryCode, status, sizes);
        }
    }
}
