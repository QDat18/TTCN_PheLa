package com.example.be_phela.controller;

import com.example.be_phela.dto.response.ApiResponse;
import com.example.be_phela.dto.response.VoucherResponseDTO;
import com.example.be_phela.model.Voucher;
import com.example.be_phela.service.VoucherService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/vouchers")
public class VoucherController {

    private final VoucherService voucherService;

    public VoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    @GetMapping
    public ApiResponse<List<VoucherResponseDTO>> getAllVouchers() {
        return ApiResponse.success(voucherService.getAllVouchers());
    }

    @GetMapping("/{id}")
    public ApiResponse<VoucherResponseDTO> getVoucherById(@PathVariable String id) {
        return ApiResponse.success(voucherService.getVoucherById(id));
    }

    @PostMapping
    public ApiResponse<VoucherResponseDTO> createVoucher(@RequestBody Voucher voucher) {
        return ApiResponse.success(voucherService.createVoucher(voucher));
    }

    @PutMapping("/{id}")
    public ApiResponse<VoucherResponseDTO> updateVoucher(@PathVariable String id, @RequestBody Voucher voucher) {
        return ApiResponse.success(voucherService.updateVoucher(id, voucher));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteVoucher(@PathVariable String id) {
        voucherService.deleteVoucher(id);
        return ApiResponse.success("Voucher deleted successfully", null);
    }
}
