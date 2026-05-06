package com.example.be_phela.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class DashboardSummaryDTO {
    private long totalProducts;
    private long totalStaff;
    private double totalRevenueMonth;
    private long totalOrdersDay;
    private List<RevenueReportDTO.DailyData> weeklyRevenueData;
    private Map<String, Long> orderCountByStatus;
    private List<DashboardStatsDTO.ProductStat> topSellingProducts;
    private LocalDateTime generatedAt;

    public DashboardSummaryDTO() {}

    public DashboardSummaryDTO(long totalProducts, long totalStaff, double totalRevenueMonth, long totalOrdersDay, 
                             List<RevenueReportDTO.DailyData> weeklyRevenueData, Map<String, Long> orderCountByStatus, 
                             List<DashboardStatsDTO.ProductStat> topSellingProducts, LocalDateTime generatedAt) {
        this.totalProducts = totalProducts;
        this.totalStaff = totalStaff;
        this.totalRevenueMonth = totalRevenueMonth;
        this.totalOrdersDay = totalOrdersDay;
        this.weeklyRevenueData = weeklyRevenueData;
        this.orderCountByStatus = orderCountByStatus;
        this.topSellingProducts = topSellingProducts;
        this.generatedAt = generatedAt;
    }

    // Getters and Setters
    public long getTotalProducts() { return totalProducts; }
    public void setTotalProducts(long totalProducts) { this.totalProducts = totalProducts; }

    public long getTotalStaff() { return totalStaff; }
    public void setTotalStaff(long totalStaff) { this.totalStaff = totalStaff; }

    public double getTotalRevenueMonth() { return totalRevenueMonth; }
    public void setTotalRevenueMonth(double totalRevenueMonth) { this.totalRevenueMonth = totalRevenueMonth; }

    public long getTotalOrdersDay() { return totalOrdersDay; }
    public void setTotalOrdersDay(long totalOrdersDay) { this.totalOrdersDay = totalOrdersDay; }

    public List<RevenueReportDTO.DailyData> getWeeklyRevenueData() { return weeklyRevenueData; }
    public void setWeeklyRevenueData(List<RevenueReportDTO.DailyData> weeklyRevenueData) { this.weeklyRevenueData = weeklyRevenueData; }

    public Map<String, Long> getOrderCountByStatus() { return orderCountByStatus; }
    public void setOrderCountByStatus(Map<String, Long> orderCountByStatus) { this.orderCountByStatus = orderCountByStatus; }

    public List<DashboardStatsDTO.ProductStat> getTopSellingProducts() { return topSellingProducts; }
    public void setTopSellingProducts(List<DashboardStatsDTO.ProductStat> topSellingProducts) { this.topSellingProducts = topSellingProducts; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public static DashboardSummaryDTOBuilder builder() {
        return new DashboardSummaryDTOBuilder();
    }

    public static class DashboardSummaryDTOBuilder {
        private long totalProducts;
        private long totalStaff;
        private double totalRevenueMonth;
        private long totalOrdersDay;
        private List<RevenueReportDTO.DailyData> weeklyRevenueData;
        private Map<String, Long> orderCountByStatus;
        private List<DashboardStatsDTO.ProductStat> topSellingProducts;
        private LocalDateTime generatedAt;

        public DashboardSummaryDTOBuilder totalProducts(long totalProducts) { this.totalProducts = totalProducts; return this; }
        public DashboardSummaryDTOBuilder totalStaff(long totalStaff) { this.totalStaff = totalStaff; return this; }
        public DashboardSummaryDTOBuilder totalRevenueMonth(double totalRevenueMonth) { this.totalRevenueMonth = totalRevenueMonth; return this; }
        public DashboardSummaryDTOBuilder totalOrdersDay(long totalOrdersDay) { this.totalOrdersDay = totalOrdersDay; return this; }
        public DashboardSummaryDTOBuilder weeklyRevenueData(List<RevenueReportDTO.DailyData> weeklyRevenueData) { this.weeklyRevenueData = weeklyRevenueData; return this; }
        public DashboardSummaryDTOBuilder orderCountByStatus(Map<String, Long> orderCountByStatus) { this.orderCountByStatus = orderCountByStatus; return this; }
        public DashboardSummaryDTOBuilder topSellingProducts(List<DashboardStatsDTO.ProductStat> topSellingProducts) { this.topSellingProducts = topSellingProducts; return this; }
        public DashboardSummaryDTOBuilder generatedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; return this; }

        public DashboardSummaryDTO build() {
            return new DashboardSummaryDTO(totalProducts, totalStaff, totalRevenueMonth, totalOrdersDay, 
                                         weeklyRevenueData, orderCountByStatus, topSellingProducts, generatedAt);
        }
    }
}
