package com.example.be_phela.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardStatsDTO {
    private Map<String, Long> orderCountByStatus;
    private double cancellationRate;
    private List<ProductStat> topSellingProducts;
    private List<CategoryStat> productsSoldByCategory;
    private LocalDateTime generatedAt;

    @Data
    @Builder
    public static class ProductStat {
        private String productId;
        private String productName;
        private long totalQuantity;
    }

    @Data
    @Builder
    public static class CategoryStat {
        private String categoryName;
        private long totalQuantity;
    }
}
