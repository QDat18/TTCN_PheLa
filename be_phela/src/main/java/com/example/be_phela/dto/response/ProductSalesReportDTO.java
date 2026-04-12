package com.example.be_phela.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductSalesReportDTO {
    private String productId;
    private String productName;
    private long totalQuantitySold;
}
