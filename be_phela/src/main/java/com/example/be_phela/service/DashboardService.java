package com.example.be_phela.service;

import com.example.be_phela.dto.response.DashboardStatsDTO;
import com.example.be_phela.dto.response.RevenueReportDTO;
import com.example.be_phela.model.enums.OrderStatus;
import com.example.be_phela.repository.OrderItemRepository;
import com.example.be_phela.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

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