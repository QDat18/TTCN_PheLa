package com.example.be_phela.dto.response;

public class BranchRevenueDTO {
    private String branchCode;
    private String branchName;
    private Double totalRevenue;
    private Long orderCount;

    public BranchRevenueDTO() {}

    public BranchRevenueDTO(String branchCode, String branchName, Double totalRevenue, Long orderCount) {
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.totalRevenue = totalRevenue;
        this.orderCount = orderCount;
    }

    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public Double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(Double totalRevenue) { this.totalRevenue = totalRevenue; }

    public Long getOrderCount() { return orderCount; }
    public void setOrderCount(Long orderCount) { this.orderCount = orderCount; }

    public static BranchRevenueDTOBuilder builder() {
        return new BranchRevenueDTOBuilder();
    }

    public static class BranchRevenueDTOBuilder {
        private String branchCode;
        private String branchName;
        private Double totalRevenue;
        private Long orderCount;

        public BranchRevenueDTOBuilder branchCode(String branchCode) { this.branchCode = branchCode; return this; }
        public BranchRevenueDTOBuilder branchName(String branchName) { this.branchName = branchName; return this; }
        public BranchRevenueDTOBuilder totalRevenue(Double totalRevenue) { this.totalRevenue = totalRevenue; return this; }
        public BranchRevenueDTOBuilder orderCount(Long orderCount) { this.orderCount = orderCount; return this; }

        public BranchRevenueDTO build() {
            return new BranchRevenueDTO(branchCode, branchName, totalRevenue, orderCount);
        }
    }
}
