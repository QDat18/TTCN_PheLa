package com.example.be_phela.controller;

import com.example.be_phela.dto.request.*;
import com.example.be_phela.dto.response.ApiResponse;
import com.example.be_phela.dto.response.AuthenticationResponse;
import com.example.be_phela.service.AuthenticationService;
// import jakarta.mail.MessagingException; // Dòng này không còn cần thiết nữa
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.function.Supplier;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {

    final AuthenticationService authenticationService;

    @PostMapping("/customer/register")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> registerCustomer(
            @Valid @RequestBody CustomerCreateDTO request) {
        // SỬA LỖI: Bỏ try-catch MessagingException không cần thiết
        Supplier<AuthenticationResponse> registerSupplier = () -> authenticationService.registerCustomer(request);

        return handleRegistration(registerSupplier,
                "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.");
    }

    @PostMapping("/admin/register")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> registerAdmin(
            @Valid @RequestBody AdminCreateDTO request,
            HttpServletRequest httpRequest) {
        // SỬA LỖI: Bỏ try-catch MessagingException không cần thiết
        Supplier<AuthenticationResponse> registerSupplier = () -> {
            String clientIp = getClientIp(httpRequest);
            return authenticationService.registerAdmin(request, clientIp);
        };
        return handleRegistration(registerSupplier,
                "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.");
    }

    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> loginAdmin(
            @Valid @RequestBody AuthenticationRequest request) {
        try {
            log.info("Admin login attempt for username: {}", request.getUsername());
            AuthenticationResponse response = authenticationService.loginAdmin(request);
            return buildResponse(HttpStatus.OK, "success", "Admin logged in successfully", response);
        } catch (UsernameNotFoundException e) {
            log.error("Admin login failed: {}", e.getMessage());
            return buildResponse(HttpStatus.NOT_FOUND, "error", "Tài khoản không tồn tại", null);
        } catch (BadCredentialsException e) {
            log.error("Admin login failed: {}", e.getMessage());
            return buildResponse(HttpStatus.UNAUTHORIZED, "error", "Sai mật khẩu", null);
        } catch (IllegalStateException e) {
            log.error("Admin login failed: {}", e.getMessage());
            return buildResponse(HttpStatus.FORBIDDEN, "error", e.getMessage(), null);
        } catch (org.springframework.security.authentication.DisabledException e) {
            log.error("Admin login failed - account disabled: {}", e.getMessage());
            return buildResponse(HttpStatus.FORBIDDEN, "error", e.getMessage(), null);
        } catch (org.springframework.security.authentication.LockedException e) {
            log.error("Admin login failed - account locked: {}", e.getMessage());
            return buildResponse(HttpStatus.FORBIDDEN, "error", e.getMessage(), null);
        } catch (Exception e) {
            log.error("Admin login failed for username: {}", request.getUsername(), e);
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "error", "Lỗi hệ thống", null);
        }
    }

    @PostMapping("/customer/login")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> loginCustomer(
            @Valid @RequestBody AuthenticationRequest request) {
        try {
            log.info("Customer login attempt for username: {}", request.getUsername());
            AuthenticationResponse response = authenticationService.loginCustomer(request);
            return buildResponse(HttpStatus.OK, "success", "Customer logged in successfully", response);
        } catch (UsernameNotFoundException e) {
            log.error("Customer login failed: {}", e.getMessage());
            return buildResponse(HttpStatus.NOT_FOUND, "error", "Tài khoản không tồn tại", null);
        } catch (BadCredentialsException e) {
            log.error("Customer login failed: {}", e.getMessage());
            return buildResponse(HttpStatus.UNAUTHORIZED, "error", "Sai mật khẩu", null);
        } catch (IllegalStateException e) {
            log.error("Customer login failed: {}", e.getMessage());
            return buildResponse(HttpStatus.FORBIDDEN, "error", e.getMessage(), null);
        } catch (org.springframework.security.authentication.DisabledException e) {
            log.error("Customer login failed - account disabled: {}", e.getMessage());
            return buildResponse(HttpStatus.FORBIDDEN, "error", e.getMessage(), null);
        } catch (org.springframework.security.authentication.LockedException e) {
            log.error("Customer login failed - account locked: {}", e.getMessage());
            return buildResponse(HttpStatus.FORBIDDEN, "error", e.getMessage(), null);
        } catch (Exception e) {
            log.error("Customer login failed for username: {}", request.getUsername(), e);
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "error", "Lỗi hệ thống", null);
        }
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> sendOtpForPasswordReset(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authenticationService.sendPasswordResetOtp(request.getEmail());
            return buildResponse(HttpStatus.OK, "success", "Mã OTP đã được gửi đến email của bạn.", null);
        } catch (RuntimeException e) { // SỬA LỖI: Bỏ MessagingException
            log.error("Failed to send OTP for password reset to {}: {}", request.getEmail(), e.getMessage());
            return buildResponse(HttpStatus.BAD_REQUEST, "error", e.getMessage(), null);
        } catch (Exception e) {
            log.error("An unexpected error occurred while sending OTP for password reset to {}", request.getEmail(), e);
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "error", "Lỗi hệ thống khi gửi OTP.", null);
        }
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> verifyOtpAndResetPassword(@Valid @RequestBody VerifyOtpAndResetPasswordRequest request) {
        try {
            authenticationService.verifyOtpAndResetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
            return buildResponse(HttpStatus.OK, "success", "Mật khẩu đã được đặt lại thành công.", null);
        } catch (RuntimeException e) {
            log.error("Failed to reset password: {}", e.getMessage());
            return buildResponse(HttpStatus.BAD_REQUEST, "error", e.getMessage(), null);
        } catch (Exception e) {
            log.error("An unexpected error occurred while resetting password for {}", request.getEmail(), e);
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "error", "Lỗi hệ thống khi đặt lại mật khẩu.", null);
        }
    }

    @PostMapping("/admin/forgot-password/send-otp")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> sendOtpForAdminPasswordReset(@RequestBody ForgotPasswordRequest request) {
        try {
            authenticationService.sendPasswordResetOtpAdmin(request.getEmail());
            return buildResponse(HttpStatus.OK, "success", "Mã OTP đã được gửi đến email quản trị viên của bạn.", null);
        } catch (RuntimeException e) { // SỬA LỖI: Bỏ MessagingException
            log.error("Failed to send OTP for admin password reset to {}: {}", request.getEmail(), e.getMessage());
            return buildResponse(HttpStatus.BAD_REQUEST, "error", e.getMessage(), null);
        } catch (Exception e) {
            log.error("An unexpected error occurred while sending OTP for admin password reset to {}", request.getEmail(), e);
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "error", "Lỗi hệ thống khi gửi OTP.", null);
        }
    }

    @PostMapping("/admin/forgot-password/reset")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> verifyOtpAndResetAdminPassword(@RequestBody VerifyOtpAndResetPasswordRequest request) {
        try {
            authenticationService.verifyOtpAndResetPasswordAdmin(request.getEmail(), request.getOtp(), request.getNewPassword());
            return buildResponse(HttpStatus.OK, "success", "Mật khẩu quản trị viên đã được đặt lại thành công.", null);
        } catch (RuntimeException e) {
            log.error("Failed to reset admin password: {}", e.getMessage());
            return buildResponse(HttpStatus.BAD_REQUEST, "error", e.getMessage(), null);
        } catch (Exception e) {
            log.error("An unexpected error occurred while resetting admin password for {}", request.getEmail(), e);
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "error", "Lỗi hệ thống khi đặt lại mật khẩu.", null);
        }
    }

    // ==== PRIVATE HELPER METHODS ====

    private ResponseEntity<ApiResponse<AuthenticationResponse>> handleRegistration(
            Supplier<AuthenticationResponse> registerFunction, String successMessage) {
        try {
            AuthenticationResponse response = registerFunction.get();
            return buildResponse(HttpStatus.CREATED, "success", successMessage, response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("Registration failed: {}", e.getMessage());
            return buildResponse(HttpStatus.BAD_REQUEST, "error", e.getMessage(), null);
        } catch (Exception e) {
            log.error("Registration failed: {}", e.getMessage(), e);
            // RuntimeException từ EmailService sẽ được bắt ở đây
            String errorMessage = "Registration failed: " + e.getMessage();
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "error", errorMessage, null);
        }
    }

    private ResponseEntity<ApiResponse<AuthenticationResponse>> buildResponse(
            HttpStatus status, String statusText, String message, AuthenticationResponse data) {
        ApiResponse<AuthenticationResponse> apiResponse = ApiResponse.<AuthenticationResponse>builder()
                .success("success".equals(statusText))
                .status(statusText)
                .message(message)
                .data(data)
                .timestamp(java.time.LocalDateTime.now())
                .build();
        return new ResponseEntity<>(apiResponse, status);
    }

    private String getClientIp(HttpServletRequest request) {
        String[] headers = {
                "X-Forwarded-For",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP"
        };
        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }
}