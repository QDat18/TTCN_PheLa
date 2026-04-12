package com.example.be_phela.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class RevenueReportDTO {
    private double totalRevenue;
    private long totalOrders;
    private List<DailyData> dailyData;
    private String period;
    private Map<String, String> dateRange;

    @Data
    @Builder
    public static class DailyData {
        private String date;
        private double revenue;
        private long orderCount;
    }
}