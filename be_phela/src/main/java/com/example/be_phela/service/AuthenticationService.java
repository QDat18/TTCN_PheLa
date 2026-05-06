package com.example.be_phela.service;

import com.example.be_phela.dto.request.AuthenticationRequest;
import com.example.be_phela.dto.request.AdminCreateDTO;
import com.example.be_phela.dto.request.CustomerCreateDTO;
import com.example.be_phela.dto.response.AuthenticationResponse;
import com.example.be_phela.exception.ResourceNotFoundException;
import com.example.be_phela.model.Admin;
import com.example.be_phela.model.Customer;
import com.example.be_phela.model.PasswordResetToken;
import com.example.be_phela.model.VerificationToken;
import com.example.be_phela.repository.PasswordResetTokenRepository;
import com.example.be_phela.repository.VerificationTokenRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Random;
import java.util.UUID;

@Service
public class AuthenticationService {
    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

    private final AdminService adminService;
    private final CustomerService customerService;
    private final AuthenticationManager authenticationManager;
    private final VerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.signer-key}")
    private String signerKey;

    @Value("${jwt.expiration-hours:18}")
    private long jwtExpirationHours;

    public AuthenticationService(
            AdminService adminService,
            CustomerService customerService,
            AuthenticationManager authenticationManager,
            VerificationTokenRepository verificationTokenRepository,
            EmailService emailService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder) {
        this.adminService = adminService;
        this.customerService = customerService;
        this.authenticationManager = authenticationManager;
        this.verificationTokenRepository = verificationTokenRepository;
        this.emailService = emailService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }
    // Đăng ký admin
    @Transactional(rollbackFor = Exception.class)
    public AuthenticationResponse registerAdmin(AdminCreateDTO request, String clientIp){
        // Tạo Admin
        Admin admin = adminService.buildAdmin(request, clientIp);

        // Tạo và lưu token xác thực
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = new VerificationToken();
        verificationToken.setToken(token);
        verificationToken.setAdmin(admin);
        verificationToken.setCustomer(null);
        verificationToken.setExpiryDate(LocalDateTime.now().plusHours(24));

        emailService.sendVerificationEmail(admin.getEmail(), verificationToken.getToken());

        // Nếu gửi email thành công, lưu admin và token vào database
        adminService.saveAdmin(admin);
        verificationTokenRepository.save(verificationToken);

        return buildRegistrationResponse(admin.getUsername(), admin.getRole().name());
    }

    // Đăng ký customer
    @Transactional(rollbackFor = Exception.class)
    public AuthenticationResponse registerCustomer(CustomerCreateDTO request){
        // Tạo Customer (lưu vào database)
        Customer customer = customerService.buildCustomer(request);

        // Tạo và lưu token xác thực
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = new VerificationToken();
        verificationToken.setToken(token);
        verificationToken.setAdmin(null);
        verificationToken.setCustomer(customer);
        verificationToken.setExpiryDate(LocalDateTime.now().plusHours(24));

        emailService.sendVerificationEmail(customer.getEmail(), verificationToken.getToken());

        customerService.saveCustomer(customer);
        verificationTokenRepository.save(verificationToken);

        return buildRegistrationResponse(customer.getUsername(), customer.getRole().name());
    }

    // Đăng nhập Admin
    public AuthenticationResponse loginAdmin(AuthenticationRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // Kiểm tra role: Chỉ cho phép ADMIN và SUPER_ADMIN đăng nhập portal quản trị
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isAdmin) {
            log.warn("Login attempt for unauthorized role on admin portal: {} with role {}", 
                    request.getUsername(), userDetails.getAuthorities());
            throw new org.springframework.security.authentication.BadCredentialsException("Tài khoản này không có quyền truy cập trang quản trị");
        }

        return createResponseFromUserDetails(userDetails);
    }

    // Đăng nhập Customer
    public AuthenticationResponse loginCustomer(AuthenticationRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // Kiểm tra role: Chỉ cho phép ROLE_CUSTOMER đăng nhập portal khách hàng
        boolean isCustomer = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));

        if (!isCustomer) {
            log.warn("Login attempt for non-customer user on customer portal: {}", request.getUsername());
            throw new org.springframework.security.authentication.BadCredentialsException("Tài khoản này không phải là tài khoản khách hàng");
        }

        return createResponseFromUserDetails(userDetails);
    }

    // Tạo response từ UserDetails (dùng cho mục đích xác thực chung)
    public AuthenticationResponse createResponseFromUserDetails(UserDetails userDetails) {
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(jwtExpirationHours);
        String jwtToken = generateToken(userDetails.getUsername(), extractRole(userDetails));
        String username = userDetails.getUsername();

        if (userDetails instanceof Customer customer) {
            String role = extractRoleFromEntity(customer, extractRole(userDetails));
            return new AuthenticationResponse(
                jwtToken,
                username,
                customer.getFullname(),
                role,
                expiresAt,
                customer.getCustomerId(),
                customer.getEmail(),
                customer.getCustomerId(),
                null,
                0.0
            );
        } else if (userDetails instanceof Admin admin) {
            String role = extractRoleFromEntity(admin, extractRole(userDetails));
            return new AuthenticationResponse(
                jwtToken,
                username,
                admin.getFullname(),
                role,
                expiresAt,
                admin.getId(),
                admin.getEmail(),
                null,
                admin.getId(),
                null
            );
        }

        throw new RuntimeException("UserDetails không hợp lệ để tạo AuthenticationResponse.");
    }

    private AuthenticationResponse buildRegistrationResponse(String username, String role) {
        log.info("Tạo tài khoản mới: username={}, role={} (chờ xác thực email)", username, role);
        return new AuthenticationResponse(
            null,
            username,
            null, // Registration response doesn't need fullname yet
            role,
            null,
            null,
            null,
            null,
            null,
            0.0
        );
    }

    // Sinh JWT token
    private String generateToken(String username, String role) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        Instant expiryInstant = Instant.now().plus(jwtExpirationHours, ChronoUnit.HOURS);
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(username)
                .issuer("/")
                .issueTime(new Date())
                .expirationTime(Date.from(expiryInstant))
                .claim("role", role)
                .build();

        JWSObject jwsObject = new JWSObject(header, new Payload(jwtClaimsSet.toJSONObject()));

        try {
            jwsObject.sign(new MACSigner(signerKey.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Không thể tạo token", e);
            throw new RuntimeException("Không thể tạo token", e);
        }
    }

    private String extractRole(UserDetails userDetails) {
        return userDetails.getAuthorities().stream()
                .findFirst()
                .map(grantedAuthority -> grantedAuthority.getAuthority().replace("ROLE_", ""))
                .orElse("UNKNOWN");
    }

    private String extractRoleFromEntity(Customer customer, String fallback) {
        return customer.getRole() != null ? customer.getRole().name() : fallback;
    }

    private String extractRoleFromEntity(Admin admin, String fallback) {
        return admin.getRole() != null ? admin.getRole().name() : fallback;
    }

    @Transactional
    public void sendPasswordResetOtp(String email){
        customerService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email: " + email));

        String otp = generateOtp();
        log.info("Generated OTP for {}: {}", email, otp);

        passwordResetTokenRepository.deleteByEmail(email);

        PasswordResetToken token = new PasswordResetToken(null, otp, email, LocalDateTime.now().plusMinutes(10));
        passwordResetTokenRepository.save(token);

        emailService.sendOtpEmail(email, otp);
    }

    @Transactional
    public void verifyOtpAndResetPassword(String email, String otp, String newPassword) {
        PasswordResetToken token = passwordResetTokenRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Mã OTP không hợp lệ hoặc đã hết hạn."));

        if (!token.getToken().equals(otp)) {
            throw new RuntimeException("Mã OTP không đúng.");
        }
        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(token);
            throw new RuntimeException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        Customer customer = customerService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email: " + email));

        customer.setPassword(passwordEncoder.encode(newPassword));
        customerService.saveCustomer(customer);

        passwordResetTokenRepository.delete(token);
    }

    @Transactional
    public void sendPasswordResetOtpAdmin(String email){
        adminService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản quản trị viên với email: " + email));

        String otp = generateOtp();
        log.info("Generated OTP for admin {}: {}", email, otp);

        passwordResetTokenRepository.deleteByEmail(email);
        PasswordResetToken token = new PasswordResetToken(null, otp, email, LocalDateTime.now().plusMinutes(10));
        passwordResetTokenRepository.save(token);

        emailService.sendOtpEmail(email, otp);
    }

    @Transactional
    public void verifyOtpAndResetPasswordAdmin(String email, String otp, String newPassword) {
        PasswordResetToken token = passwordResetTokenRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Mã OTP không hợp lệ hoặc đã hết hạn."));

        if (!token.getToken().equals(otp)) {
            throw new RuntimeException("Mã OTP không đúng.");
        }
        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(token);
            throw new RuntimeException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        Admin admin = adminService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản quản trị viên với email: " + email));

        admin.setPassword(passwordEncoder.encode(newPassword));
        adminService.saveAdmin(admin);

        passwordResetTokenRepository.delete(token);
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}