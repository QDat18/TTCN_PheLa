package com.example.be_phela.controller;

import com.example.be_phela.dto.response.DashboardStatsDTO;
import com.example.be_phela.dto.response.RevenueReportDTO;
import com.example.be_phela.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')") // Chỉ ADMIN và SUPER_ADMIN mới được truy cập
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/revenue-report")
    public ResponseEntity<RevenueReportDTO> getRevenueReport(
            @RequestParam(defaultValue = "day") String period) {
        return ResponseEntity.ok(dashboardService.getRevenueAndOrderReport(period));
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStatistics());
    }
}