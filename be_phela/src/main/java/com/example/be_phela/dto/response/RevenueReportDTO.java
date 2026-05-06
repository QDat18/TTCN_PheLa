package com.example.be_phela.dto.response;

import java.util.List;
import java.util.Map;

public class RevenueReportDTO {
    private double totalRevenue;
    private long totalOrders;
    private List<DailyData> dailyData;
    private String period;
    private Map<String, String> dateRange;

    public RevenueReportDTO() {}

    public RevenueReportDTO(double totalRevenue, long totalOrders, List<DailyData> dailyData, String period, Map<String, String> dateRange) {
        this.totalRevenue = totalRevenue;
        this.totalOrders = totalOrders;
        this.dailyData = dailyData;
        this.period = period;
        this.dateRange = dateRange;
    }

    public double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; }

    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

    public List<DailyData> getDailyData() { return dailyData; }
    public void setDailyData(List<DailyData> dailyData) { this.dailyData = dailyData; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public Map<String, String> getDateRange() { return dateRange; }
    public void setDateRange(Map<String, String> dateRange) { this.dateRange = dateRange; }

    public static RevenueReportDTOBuilder builder() {
        return new RevenueReportDTOBuilder();
    }

    public static class RevenueReportDTOBuilder {
        private double totalRevenue;
        private long totalOrders;
        private List<DailyData> dailyData;
        private String period;
        private Map<String, String> dateRange;

        public RevenueReportDTOBuilder totalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; return this; }
        public RevenueReportDTOBuilder totalOrders(long totalOrders) { this.totalOrders = totalOrders; return this; }
        public RevenueReportDTOBuilder dailyData(List<DailyData> dailyData) { this.dailyData = dailyData; return this; }
        public RevenueReportDTOBuilder period(String period) { this.period = period; return this; }
        public RevenueReportDTOBuilder dateRange(Map<String, String> dateRange) { this.dateRange = dateRange; return this; }

        public RevenueReportDTO build() {
            return new RevenueReportDTO(totalRevenue, totalOrders, dailyData, period, dateRange);
        }
    }

    public static class DailyData {
        private String date;
        private double revenue;
        private long orderCount;

        public DailyData() {}

        public DailyData(String date, double revenue, long orderCount) {
            this.date = date;
            this.revenue = revenue;
            this.orderCount = orderCount;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public double getRevenue() { return revenue; }
        public void setRevenue(double revenue) { this.revenue = revenue; }

        public long getOrderCount() { return orderCount; }
        public void setOrderCount(long orderCount) { this.orderCount = orderCount; }

        public static DailyDataBuilder builder() {
            return new DailyDataBuilder();
        }

        public static class DailyDataBuilder {
            private String date;
            private double revenue;
            private long orderCount;

            public DailyDataBuilder date(String date) { this.date = date; return this; }
            public DailyDataBuilder revenue(double revenue) { this.revenue = revenue; return this; }
            public DailyDataBuilder orderCount(long orderCount) { this.orderCount = orderCount; return this; }

            public DailyData build() {
                return new DailyData(date, revenue, orderCount);
            }
        }
    }
}