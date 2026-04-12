package com.example.be_phela.service;

import com.example.be_phela.dto.response.VoucherResponseDTO;
import com.example.be_phela.model.Voucher;

import java.util.List;

public interface VoucherService {
    List<VoucherResponseDTO> getAllVouchers();
    VoucherResponseDTO getVoucherById(String id);
    VoucherResponseDTO getVoucherByCode(String code);
    List<VoucherResponseDTO> getActiveVouchers();
    VoucherResponseDTO createVoucher(Voucher voucher);
    VoucherResponseDTO updateVoucher(String id, Voucher voucher);
    void deleteVoucher(String id);
}
