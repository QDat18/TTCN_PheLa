package com.example.be_phela.service;

import com.example.be_phela.dto.response.DashboardStatsDTO;
import com.example.be_phela.dto.response.RevenueReportDTO;
import com.example.be_phela.model.enums.OrderStatus;
import com.example.be_phela.dto.response.DashboardSummaryDTO;
import com.example.be_phela.repository.AdminRepository;
import com.example.be_phela.repository.OrderItemRepository;
import com.example.be_phela.repository.OrderRepository;
import com.example.be_phela.repository.ProductRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.sql.Date;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.example.be_phela.dto.response.BranchRevenueDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.*;

@Service
public class DashboardService {
    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final AdminRepository adminRepository;

    public DashboardService(OrderRepository orderRepository, 
                            OrderItemRepository orderItemRepository,
                            ProductRepository productRepository,
                            AdminRepository adminRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.adminRepository = adminRepository;
    }

    // Constants
    private static final int TOP_PRODUCTS_LIMIT = 5;
    private static final List<String> VALID_PERIODS = List.of("day", "week", "month", "quarter", "year");

    public RevenueReportDTO getRevenueAndOrderReport(String period) {
        validatePeriod(period);

        try {
            LocalDateTime[] dateRange = getDateRangeForPeriod(period);
            List<Object[]> results = orderRepository.findRevenueAndOrderCountByDateRange(
                    dateRange[0], dateRange[1], OrderStatus.DELIVERED);

            List<RevenueReportDTO.DailyData> dailyData = results.stream()
                    .map(this::mapToDailyData)
                    .collect(Collectors.toList());

            // Fill missing dates for week and month views
            if (period.equalsIgnoreCase("week") || period.equalsIgnoreCase("month")) {
                dailyData = fillMissingDates(dailyData, dateRange[0], dateRange[1]);
            }

            double totalRevenue = dailyData.stream()
                    .mapToDouble(RevenueReportDTO.DailyData::getRevenue)
                    .sum();
            long totalOrders = dailyData.stream()
                    .mapToLong(RevenueReportDTO.DailyData::getOrderCount)
                    .sum();

            return RevenueReportDTO.builder()
                    .totalRevenue(totalRevenue)
                    .totalOrders(totalOrders)
                    .dailyData(dailyData)
                    .build();

        } catch (Exception e) {
            log.error("Error generating revenue report for period: {}", period, e);
            throw new RuntimeException("Failed to generate revenue report", e);
        }
    }

    public DashboardSummaryDTO getDashboardSummary() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startOfDay = now.with(LocalTime.MIN);
            LocalDateTime startOfMonth = now.with(TemporalAdjusters.firstDayOfMonth()).with(LocalTime.MIN);
            LocalDateTime sevenDaysAgo = now.minusDays(6).with(LocalTime.MIN);

            // 1. Core Counts
            long totalProducts = productRepository.count();
            long totalStaff = adminRepository.count();

            // 2. Revenue & Orders
            RevenueReportDTO dayReport = getRevenueAndOrderReport("day");
            RevenueReportDTO monthReport = getRevenueAndOrderReport("month");
            RevenueReportDTO weekReport = getRevenueAndOrderReport("week");

            // 3. Status Map
            Map<String, Long> orderCountByStatus = getOrderCountByStatus();

            // 4. Top Products
            List<DashboardStatsDTO.ProductStat> topSellingProducts = getTopSellingProducts();

            return DashboardSummaryDTO.builder()
                    .totalProducts(totalProducts)
                    .totalStaff(totalStaff)
                    .totalRevenueMonth(monthReport.getTotalRevenue())
                    .totalOrdersDay(dayReport.getTotalOrders())
                    .weeklyRevenueData(weekReport.getDailyData())
                    .orderCountByStatus(orderCountByStatus)
                    .topSellingProducts(topSellingProducts)
                    .generatedAt(now)
                    .build();

        } catch (Exception e) {
            log.error("Error generating dashboard summary", e);
            throw new RuntimeException("Failed to generate dashboard summary", e);
        }
    }

    private List<RevenueReportDTO.DailyData> fillMissingDates(List<RevenueReportDTO.DailyData> data, LocalDateTime start, LocalDateTime end) {
        Map<String, RevenueReportDTO.DailyData> dataMap = data.stream()
                .collect(Collectors.toMap(RevenueReportDTO.DailyData::getDate, d -> d));

        List<RevenueReportDTO.DailyData> filledList = new ArrayList<>();
        LocalDateTime current = start;
        while (!current.isAfter(end)) {
            String dateStr = current.toLocalDate().toString();
            filledList.add(dataMap.getOrDefault(dateStr, RevenueReportDTO.DailyData.builder()
                    .date(dateStr)
                    .revenue(0.0)
                    .orderCount(0L)
                    .build()));
            current = current.plusDays(1);
        }
        return filledList;
    }

    public List<BranchRevenueDTO> getBranchRevenueReport(String period) {
        validatePeriod(period);
        LocalDateTime[] dateRange = getDateRangeForPeriod(period);
        
        List<Object[]> results = orderRepository.findRevenueByBranchInDateRange(dateRange[0], dateRange[1], OrderStatus.DELIVERED);
        
        return results.stream()
                .map(r -> BranchRevenueDTO.builder()
                        .branchCode(r[0] != null ? (String) r[0] : "N/A")
                        .branchName(r[1] != null ? (String) r[1] : "Chưa xác định")
                        .totalRevenue(r[2] != null ? ((Number) r[2]).doubleValue() : 0.0)
                        .orderCount(r[3] != null ? ((Number) r[3]).longValue() : 0L)
                        .build())
                .collect(Collectors.toList());
    }

    public byte[] exportBranchRevenueExcel(String period) throws IOException {
        List<BranchRevenueDTO> data = getBranchRevenueReport(period);
        
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Doanh thu chi nhánh");
            
            // Create Header
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Mã chi nhánh", "Tên chi nhánh", "Doanh thu", "Số đơn hàng"};
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Populate Data
            int rowNum = 1;
            for (BranchRevenueDTO dto : data) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(dto.getBranchCode());
                row.createCell(1).setCellValue(dto.getBranchName());
                row.createCell(2).setCellValue(dto.getTotalRevenue());
                row.createCell(3).setCellValue(dto.getOrderCount());
            }
            
            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    public DashboardStatsDTO getDashboardStatistics() {
        try {
            // 1. Order status statistics
            Map<String, Long> orderCountByStatus = getOrderCountByStatus();

            // 2. Cancellation rate (last 30 days)
            double cancellationRate = calculateCancellationRate();

            // 3. Top selling products
            List<DashboardStatsDTO.ProductStat> topSellingProducts = getTopSellingProducts();

            // 4. Products sold by category
            List<DashboardStatsDTO.CategoryStat> productsSoldByCategory = getProductsSoldByCategory();

            return DashboardStatsDTO.builder()
                    .orderCountByStatus(orderCountByStatus)
                    .cancellationRate(cancellationRate)
                    .topSellingProducts(topSellingProducts)
                    .productsSoldByCategory(productsSoldByCategory)
                    .build();

        } catch (Exception e) {
            log.error("Error generating dashboard statistics", e);
            throw new RuntimeException("Failed to generate dashboard statistics", e);
        }
    }

    private void validatePeriod(String period) {
        if (period == null || !VALID_PERIODS.contains(period.toLowerCase())) {
            throw new IllegalArgumentException("Invalid period. Must be one of: " + VALID_PERIODS);
        }
    }

    private RevenueReportDTO.DailyData mapToDailyData(Object[] result) {
        return RevenueReportDTO.DailyData.builder()
                .date(((Date) result[0]).toLocalDate().toString())
                .revenue(result[1] != null ? ((Double) result[1]).doubleValue() : 0.0)
                .orderCount(result[2] != null ? (Long) result[2] : 0L)
                .build();
    }

    private Map<String, Long> getOrderCountByStatus() {
        return orderRepository.countOrdersByStatus().stream()
                .collect(Collectors.toMap(
                        r -> ((OrderStatus) r[0]).name(),
                        r -> (Long) r[1]
                ));
    }

    private double calculateCancellationRate() {
        LocalDateTime last30Days = LocalDateTime.now().minusDays(30);
        List<Object[]> results = orderRepository.countTotalAndCancelledOrdersByDateRange(
                last30Days, LocalDateTime.now());

        if (results.isEmpty()) {
            return 0.0;
        }

        Object[] data = results.get(0);
        long totalOrders = data[0] != null ? (Long) data[0] : 0L;
        long cancelledOrders = data[1] != null ? (Long) data[1] : 0L;

        return totalOrders == 0 ? 0.0 : ((double) cancelledOrders / totalOrders) * 100;
    }

    private List<DashboardStatsDTO.ProductStat> getTopSellingProducts() {
        return orderItemRepository.findTopSellingProducts(
                        OrderStatus.DELIVERED,
                        PageRequest.of(0, TOP_PRODUCTS_LIMIT))
                .stream()
                .map(r -> DashboardStatsDTO.ProductStat.builder()
                        .productId((String) r[0])
                        .productName((String) r[1])
                        .totalQuantity((Long) r[2])
                        .build())
                .collect(Collectors.toList());
    }

    private List<DashboardStatsDTO.CategoryStat> getProductsSoldByCategory() {
        return orderItemRepository.countProductsSoldByCategory()
                .stream()
                .map(r -> DashboardStatsDTO.CategoryStat.builder()
                        .categoryName((String) r[0])
                        .totalQuantity((Long) r[1])
                        .build())
                .collect(Collectors.toList());
    }

    private LocalDateTime[] getDateRangeForPeriod(String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate;

        switch (period.toLowerCase()) {
            case "week":
                startDate = now.with(DayOfWeek.MONDAY).with(LocalTime.MIN);
                break;
            case "month":
                startDate = now.with(TemporalAdjusters.firstDayOfMonth()).with(LocalTime.MIN);
                break;
            case "quarter":
                int firstMonthOfQuarter = ((now.getMonthValue() - 1) / 3) * 3 + 1;
                startDate = LocalDateTime.of(now.getYear(), firstMonthOfQuarter, 1, 0, 0);
                break;
            case "year":
                startDate = now.with(TemporalAdjusters.firstDayOfYear()).with(LocalTime.MIN);
                break;
            case "day":
            default:
                startDate = now.with(LocalTime.MIN);
                break;
        }
        return new LocalDateTime[]{startDate, now};
    }
}