package com.example.be_phela.controller;

import com.example.be_phela.dto.response.ApiResponse;
import com.example.be_phela.dto.response.VoucherResponseDTO;
import com.example.be_phela.model.enums.PromotionStatus;
import com.example.be_phela.service.VoucherService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/vouchers")
@CrossOrigin(origins = "*")
public class PublicVoucherController {

    private final VoucherService voucherService;

    public PublicVoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    @GetMapping("/active")
    public ApiResponse<java.util.List<VoucherResponseDTO>> getActiveVouchers() {
        log.info("Fetching active vouchers for customer...");
        try {
            return ApiResponse.success(voucherService.getActiveVouchers());
        } catch (Exception e) {
            log.error("Error fetching active vouchers: {}", e.getMessage(), e);
            return ApiResponse.error("Could not load promotions. Please try again later.");
        }
    }

    @GetMapping("/check/{code}")
    public ApiResponse<VoucherResponseDTO> checkVoucher(@PathVariable String code) {
        try {
            VoucherResponseDTO voucher = voucherService.getVoucherByCode(code);
            
            // Basic validation for public check
            LocalDateTime now = LocalDateTime.now();
            
            if (voucher.getStatus() != PromotionStatus.ACTIVE) {
                return ApiResponse.error("Voucher is not active", null);
            }
            
            if (voucher.getStartDate() != null && voucher.getStartDate().isAfter(now)) {
                return ApiResponse.error("Voucher has not started yet", null);
            }
            
            if (voucher.getEndDate() != null && voucher.getEndDate().isBefore(now)) {
                return ApiResponse.error("Voucher has expired", null);
            }
            
            if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
                return ApiResponse.error("Voucher usage limit reached", null);
            }
            
            return ApiResponse.success(voucher);
        } catch (Exception e) {
            return ApiResponse.error("Voucher code not found", null);
        }
    }
}
