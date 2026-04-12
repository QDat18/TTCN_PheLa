package com.example.be_phela.controller;

import com.example.be_phela.dto.response.ApiResponse;
import com.example.be_phela.model.Admin;
import com.example.be_phela.model.Customer;
import com.example.be_phela.model.VerificationToken;
import com.example.be_phela.model.enums.Status;
import com.example.be_phela.repository.AdminRepository;
import com.example.be_phela.repository.CustomerRepository;
import com.example.be_phela.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
@Slf4j
@RestController
@RequiredArgsConstructor
//@RequestMapping("/verify")
public class VerificationController {
    private final VerificationTokenRepository verificationTokenRepository;
    private final AdminRepository adminRepository;
    private final CustomerRepository customerRepository;

    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<String>> verifyUser(@RequestParam("token") String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token);
        if (verificationToken == null) {
            return buildResponse(HttpStatus.BAD_REQUEST, "error", "Token không hợp lệ!", null);
        }

        // Kiểm tra token có hết hạn không
        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            verificationTokenRepository.delete(verificationToken);
            return buildResponse(HttpStatus.BAD_REQUEST, "error", "Token đã hết hạn!", null);
        }

        // Cập nhật trạng thái người dùng
        if (verificationToken.getAdmin() != null) {
            Admin admin = verificationToken.getAdmin();
            if (admin.getStatus() == Status.ACTIVE) {
                log.warn("Admin {} already verified", admin.getUsername());
                return buildResponse(HttpStatus.BAD_REQUEST, "error", "Tài khoản đã được kích hoạt!", null);
            }
            admin.setStatus(Status.ACTIVE);
            adminRepository.save(admin);
        } else if (verificationToken.getCustomer() != null) {
            Customer customer = verificationToken.getCustomer();
            if (customer.getStatus() == Status.ACTIVE) {
                log.warn("Customer {} already verified", customer.getUsername());
                return buildResponse(HttpStatus.BAD_REQUEST, "error", "Tài khoản đã được kích hoạt!", null);
            }
            customer.setStatus(Status.ACTIVE);
            customerRepository.save(customer);
        } else {
            return buildResponse(HttpStatus.BAD_REQUEST, "error", "Token không liên kết với người dùng nào!", null);
        }

        // Xóa token sau khi xác thực thành công
        verificationTokenRepository.delete(verificationToken);

        return buildResponse(HttpStatus.OK, "success", "Xác thực thành công! Tài khoản của bạn đã được kích hoạt.", null);
    }

    private <T> ResponseEntity<ApiResponse<T>> buildResponse(
            HttpStatus status, String statusText, String message, T data) {
        ApiResponse<T> apiResponse = ApiResponse.<T>builder()
                .success("success".equals(statusText))
                .status(statusText)
                .message(message)
                .data(data)
                .timestamp(java.time.LocalDateTime.now())
                .build();
        return new ResponseEntity<>(apiResponse, status);
    }
}
