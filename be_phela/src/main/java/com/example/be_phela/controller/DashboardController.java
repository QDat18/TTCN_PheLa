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
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(dashboardService.getCustomRevenueReport(startDate, endDate));
        }
        return ResponseEntity.ok(dashboardService.getRevenueAndOrderReport(period != null ? period : "day"));
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
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(dashboardService.getCustomBranchRevenueReport(startDate, endDate));
        }
        return ResponseEntity.ok(dashboardService.getBranchRevenueReport(period != null ? period : "day"));
    }

    @GetMapping("/export-branch-revenue")
    public ResponseEntity<byte[]> exportBranchRevenue(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) throws IOException {
        byte[] excelContent;
        String filenamePeriod;
        if (startDate != null && endDate != null) {
            excelContent = dashboardService.exportCustomBranchRevenueExcel(startDate, endDate);
            filenamePeriod = startDate + "_" + endDate;
        } else {
            excelContent = dashboardService.exportBranchRevenueExcel(period != null ? period : "day");
            filenamePeriod = period != null ? period : "day";
        }
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "ThongKeChiNhanh_" + filenamePeriod + ".xlsx");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(excelContent);
    }
}