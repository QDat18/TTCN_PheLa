package com.example.be_phela.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class DashboardStatsDTO {
    private Map<String, Long> orderCountByStatus;
    private double cancellationRate;
    private List<ProductStat> topSellingProducts;
    private List<CategoryStat> productsSoldByCategory;
    private LocalDateTime generatedAt;

    public DashboardStatsDTO() {}

    public DashboardStatsDTO(Map<String, Long> orderCountByStatus, double cancellationRate, List<ProductStat> topSellingProducts, List<CategoryStat> productsSoldByCategory, LocalDateTime generatedAt) {
        this.orderCountByStatus = orderCountByStatus;
        this.cancellationRate = cancellationRate;
        this.topSellingProducts = topSellingProducts;
        this.productsSoldByCategory = productsSoldByCategory;
        this.generatedAt = generatedAt;
    }

    public Map<String, Long> getOrderCountByStatus() { return orderCountByStatus; }
    public void setOrderCountByStatus(Map<String, Long> orderCountByStatus) { this.orderCountByStatus = orderCountByStatus; }

    public double getCancellationRate() { return cancellationRate; }
    public void setCancellationRate(double cancellationRate) { this.cancellationRate = cancellationRate; }

    public List<ProductStat> getTopSellingProducts() { return topSellingProducts; }
    public void setTopSellingProducts(List<ProductStat> topSellingProducts) { this.topSellingProducts = topSellingProducts; }

    public List<CategoryStat> getProductsSoldByCategory() { return productsSoldByCategory; }
    public void setProductsSoldByCategory(List<CategoryStat> productsSoldByCategory) { this.productsSoldByCategory = productsSoldByCategory; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public static DashboardStatsDTOBuilder builder() {
        return new DashboardStatsDTOBuilder();
    }

    public static class DashboardStatsDTOBuilder {
        private Map<String, Long> orderCountByStatus;
        private double cancellationRate;
        private List<ProductStat> topSellingProducts;
        private List<CategoryStat> productsSoldByCategory;
        private LocalDateTime generatedAt;

        public DashboardStatsDTOBuilder orderCountByStatus(Map<String, Long> orderCountByStatus) { this.orderCountByStatus = orderCountByStatus; return this; }
        public DashboardStatsDTOBuilder cancellationRate(double cancellationRate) { this.cancellationRate = cancellationRate; return this; }
        public DashboardStatsDTOBuilder topSellingProducts(List<ProductStat> topSellingProducts) { this.topSellingProducts = topSellingProducts; return this; }
        public DashboardStatsDTOBuilder productsSoldByCategory(List<CategoryStat> productsSoldByCategory) { this.productsSoldByCategory = productsSoldByCategory; return this; }
        public DashboardStatsDTOBuilder generatedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; return this; }

        public DashboardStatsDTO build() {
            return new DashboardStatsDTO(orderCountByStatus, cancellationRate, topSellingProducts, productsSoldByCategory, generatedAt);
        }
    }

    public static class ProductStat {
        private String productId;
        private String productName;
        private long totalQuantity;

        public ProductStat() {}

        public ProductStat(String productId, String productName, long totalQuantity) {
            this.productId = productId;
            this.productName = productName;
            this.totalQuantity = totalQuantity;
        }

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }

        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }

        public long getTotalQuantity() { return totalQuantity; }
        public void setTotalQuantity(long totalQuantity) { this.totalQuantity = totalQuantity; }

        public static ProductStatBuilder builder() {
            return new ProductStatBuilder();
        }

        public static class ProductStatBuilder {
            private String productId;
            private String productName;
            private long totalQuantity;

            public ProductStatBuilder productId(String productId) { this.productId = productId; return this; }
            public ProductStatBuilder productName(String productName) { this.productName = productName; return this; }
            public ProductStatBuilder totalQuantity(long totalQuantity) { this.totalQuantity = totalQuantity; return this; }

            public ProductStat build() {
                return new ProductStat(productId, productName, totalQuantity);
            }
        }
    }

    public static class CategoryStat {
        private String categoryName;
        private long totalQuantity;

        public CategoryStat() {}

        public CategoryStat(String categoryName, long totalQuantity) {
            this.categoryName = categoryName;
            this.totalQuantity = totalQuantity;
        }

        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

        public long getTotalQuantity() { return totalQuantity; }
        public void setTotalQuantity(long totalQuantity) { this.totalQuantity = totalQuantity; }

        public static CategoryStatBuilder builder() {
            return new CategoryStatBuilder();
        }

        public static class CategoryStatBuilder {
            private String categoryName;
            private long totalQuantity;

            public CategoryStatBuilder categoryName(String categoryName) { this.categoryName = categoryName; return this; }
            public CategoryStatBuilder totalQuantity(long totalQuantity) { this.totalQuantity = totalQuantity; return this; }

            public CategoryStat build() {
                return new CategoryStat(categoryName, totalQuantity);
            }
        }
    }
}
