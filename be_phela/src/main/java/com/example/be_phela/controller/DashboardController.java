package com.example.be_phela.controller;

import com.example.be_phela.dto.response.DashboardStatsDTO;
import com.example.be_phela.dto.response.DashboardSummaryDTO;
import com.example.be_phela.dto.response.RevenueReportDTO;
import com.example.be_phela.service.DashboardService;
import com.example.be_phela.dto.response.BranchRevenueDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.io.IOException;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')") 
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/revenue-report")
    public ResponseEntity<RevenueReportDTO> getRevenueReport(
            @RequestParam(defaultValue = "day") String period) {
        return ResponseEntity.ok(dashboardService.getRevenueAndOrderReport(period));
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStatistics());
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary() {
        return ResponseEntity.ok(dashboardService.getDashboardSummary());
    }

    @GetMapping("/branch-revenue")
    public ResponseEntity<List<BranchRevenueDTO>> getBranchRevenue(
            @RequestParam(defaultValue = "day") String period) {
        return ResponseEntity.ok(dashboardService.getBranchRevenueReport(period));
    }

    @GetMapping("/export-branch-revenue")
    public ResponseEntity<byte[]> exportBranchRevenue(
            @RequestParam(defaultValue = "day") String period) throws IOException {
        byte[] excelContent = dashboardService.exportBranchRevenueExcel(period);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "ThongKeChiNhanh_" + period + ".xlsx");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(excelContent);
    }
}