package com.example.be_phela.service;

import com.example.be_phela.dto.response.VoucherResponseDTO;
import com.example.be_phela.model.Voucher;
import com.example.be_phela.repository.VoucherRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import java.time.LocalDateTime;

@Service
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;

    public VoucherServiceImpl(VoucherRepository voucherRepository) {
        this.voucherRepository = voucherRepository;
    }

    @Override
    public List<VoucherResponseDTO> getActiveVouchers() {
        return voucherRepository.findActiveVouchers(com.example.be_phela.model.enums.PromotionStatus.ACTIVE, LocalDateTime.now()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<VoucherResponseDTO> getAllVouchers() {
        return voucherRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public VoucherResponseDTO getVoucherById(String id) {
        return voucherRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
    }

    @Override
    public VoucherResponseDTO getVoucherByCode(String code) {
        return voucherRepository.findByCode(code)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
    }

    @Override
    public VoucherResponseDTO createVoucher(Voucher voucher) {
        if (voucherRepository.findByCode(voucher.getCode()).isPresent()) {
            throw new RuntimeException("Voucher code already exists");
        }
        return mapToDTO(voucherRepository.save(voucher));
    }

    @Override
    public VoucherResponseDTO updateVoucher(String id, Voucher voucherDetails) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        voucher.setCode(voucherDetails.getCode());
        voucher.setName(voucherDetails.getName());
        voucher.setDescription(voucherDetails.getDescription());
        voucher.setType(voucherDetails.getType());
        voucher.setValue(voucherDetails.getValue());
        voucher.setMinOrderAmount(voucherDetails.getMinOrderAmount());
        voucher.setMaxDiscountAmount(voucherDetails.getMaxDiscountAmount());
        voucher.setStartDate(voucherDetails.getStartDate());
        voucher.setEndDate(voucherDetails.getEndDate());
        voucher.setStatus(voucherDetails.getStatus());
        voucher.setUsageLimit(voucherDetails.getUsageLimit());

        return mapToDTO(voucherRepository.save(voucher));
    }

    @Override
    public void deleteVoucher(String id) {
        voucherRepository.deleteById(id);
    }

    private VoucherResponseDTO mapToDTO(Voucher voucher) {
        VoucherResponseDTO dto = new VoucherResponseDTO();
        dto.setId(voucher.getId());
        dto.setCode(voucher.getCode());
        dto.setName(voucher.getName());
        dto.setDescription(voucher.getDescription());
        dto.setType(voucher.getType());
        dto.setValue(voucher.getValue());
        dto.setMinOrderAmount(voucher.getMinOrderAmount());
        dto.setMaxDiscountAmount(voucher.getMaxDiscountAmount());
        dto.setStartDate(voucher.getStartDate());
        dto.setEndDate(voucher.getEndDate());
        dto.setStatus(voucher.getStatus());
        dto.setUsageLimit(voucher.getUsageLimit());
        dto.setUsedCount(voucher.getUsedCount());
        dto.setCreatedAt(voucher.getCreatedAt());
        dto.setUpdatedAt(voucher.getUpdatedAt());
        return dto;
    }
}
