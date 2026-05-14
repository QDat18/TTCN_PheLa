package com.example.be_phela.controller;

import com.example.be_phela.dto.request.*;
import com.example.be_phela.dto.response.ApiResponse;
import com.example.be_phela.dto.response.AuthenticationResponse;
import com.example.be_phela.service.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.function.Supplier;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {
    private static final Logger log = LoggerFactory.getLogger(AuthenticationController.class);

    private final AuthenticationService authenticationService;

    public AuthenticationController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/admin/register")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> registerAdmin(
            @Valid @RequestBody AdminCreateDTO request,
            HttpServletRequest httpRequest) {
        log.info("Received Admin registration request for: {}", request.getUsername());
        Supplier<AuthenticationResponse> registerSupplier = () -> {
            String clientIp = getClientIp(httpRequest);
            return authenticationService.registerAdmin(request, clientIp);
        };
        return handleRegistration(registerSupplier, "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.");
    }

    @GetMapping("/admin/register")
    public ResponseEntity<ApiResponse<String>> diagRegisterAdmin(HttpServletRequest request) {
        log.warn("WARNING: Received GET request on /auth/admin/register. Expected POST. Request URL: {}", request.getRequestURL());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.<String>builder()
                        .status(String.valueOf(HttpStatus.METHOD_NOT_ALLOWED.value()))
                        .message("Endpoint này chỉ hỗ trợ phương thức POST. Vui lòng kiểm tra lại Frontend.")
                        .data("Đã nhận yêu cầu GET thay vì POST")
                        .build());
    }

    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> loginAdmin(
            @Valid @RequestBody AuthenticationRequest request) {
        log.info("Admin login request received for username: {}", request.getUsername());
        log.info("Starting login process for Admin: {}", request.getUsername());
        try {
            log.info("Admin login attempt for username: {}", request.getUsername());
            AuthenticationResponse response = authenticationService.loginAdmin(request);
            return buildResponse(HttpStatus.OK, "success", "Admin logged in successfully", response);
        } catch (UsernameNotFoundException e) {
            log.warn("Login failed: Username not found {}", request.getUsername());
            return buildResponse(HttpStatus.NOT_FOUND, "error", "Tài khoản không tồn tại", null);
        } catch (BadCredentialsException e) {
            log.warn("Login failed: Bad credentials for username {}", request.getUsername());
            return buildResponse(HttpStatus.UNAUTHORIZED, "error", "Sai mật khẩu", null);
        } catch (Exception e) {
            log.error("Admin login failed for username: {}", request.getUsername(), e);
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "error", "Lỗi hệ thống", null);
        }
    }

    @GetMapping("/admin/login")
    public ResponseEntity<ApiResponse<String>> diagLoginAdmin(HttpServletRequest request) {
        log.warn("WARNING: Received GET request on /auth/admin/login. Expected POST. Request URL: {}", request.getRequestURL());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.<String>builder()
                        .status(String.valueOf(HttpStatus.METHOD_NOT_ALLOWED.value()))
                        .message("Endpoint này chỉ hỗ trợ phương thức POST. Vui lòng kiểm tra lại Frontend (Axios).")
                        .data("Đã nhận yêu cầu GET thay vì POST")
                        .build());
    }

    @PostMapping("/customer/register")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> registerCustomer(
            @Valid @RequestBody CustomerCreateDTO request) {
        log.info("Received Customer registration request for: {}", request.getUsername());
        Supplier<AuthenticationResponse> registerSupplier = () -> authenticationService.registerCustomer(request);
        return handleRegistration(registerSupplier, "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.");
    }

    @PostMapping("/customer/login")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> loginCustomer(
            @Valid @RequestBody AuthenticationRequest request) {
        log.info("Customer login request received for username: {}", request.getUsername());
        try {
            AuthenticationResponse response = authenticationService.loginCustomer(request);
            return buildResponse(HttpStatus.OK, "success", "Customer logged in successfully", response);
        } catch (UsernameNotFoundException e) {
            log.warn("Login failed: Username not found {}", request.getUsername());
            return buildResponse(HttpStatus.NOT_FOUND, "error", "Tài khoản không tồn tại", null);
        } catch (BadCredentialsException e) {
            log.warn("Login failed: Bad credentials for username {}", request.getUsername());
            return buildResponse(HttpStatus.UNAUTHORIZED, "error", "Sai thông tin đăng nhập", null);
        } catch (Exception e) {
            log.error("Customer login failed for username: {}", request.getUsername(), e);
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "error", "Lỗi hệ thống", null);
        }
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<ApiResponse<String>> sendPasswordResetOtp(@RequestBody java.util.Map<String, String> request) {
        try {
            String email = request.get("email");
            log.info("Sending OTP for password reset to email: {}", email);
            authenticationService.sendPasswordResetOtp(email);
            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .success(true).status("success").message("Mã OTP đã được gửi đến email của bạn")
                    .build());
        } catch (Exception e) {
            log.error("Failed to send OTP", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<String>builder()
                            .success(false).status("error").message(e.getMessage())
                            .build());
        }
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<String>> resetPassword(@RequestBody java.util.Map<String, String> request) {
        try {
            String email = request.get("email");
            String otp = request.get("otp");
            String newPassword = request.get("newPassword");
            authenticationService.verifyOtpAndResetPassword(email, otp, newPassword);
            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .success(true).status("success").message("Đổi mật khẩu thành công")
                    .build());
        } catch (Exception e) {
            log.error("Failed to reset password", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<String>builder()
                            .success(false).status("error").message(e.getMessage())
                            .build());
        }
    }

    private ResponseEntity<ApiResponse<AuthenticationResponse>> handleRegistration(
            Supplier<AuthenticationResponse> registerFunction, String successMessage) {
        try {
            AuthenticationResponse response = registerFunction.get();
            return buildResponse(HttpStatus.CREATED, "success", successMessage, response);
        } catch (Exception e) {
            log.error("Registration failed: {}", e.getMessage(), e);
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "error", e.getMessage(), null);
        }
    }

    private ResponseEntity<ApiResponse<AuthenticationResponse>> buildResponse(
            HttpStatus status, String statusText, String message, AuthenticationResponse data) {
        ApiResponse<AuthenticationResponse> apiResponse = new ApiResponse<>();
        apiResponse.setSuccess("success".equals(statusText));
        apiResponse.setStatus(statusText);
        apiResponse.setMessage(message);
        apiResponse.setData(data);
        apiResponse.setTimestamp(java.time.LocalDateTime.now());
        return new ResponseEntity<>(apiResponse, status);
    }

    private String getClientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}