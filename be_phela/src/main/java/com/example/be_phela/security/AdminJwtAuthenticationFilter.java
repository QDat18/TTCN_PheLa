package com.example.be_phela.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.text.ParseException;
import java.util.Date;
import java.util.List;

/**
 * Filter xác thực JWT nội bộ dành riêng cho Admin.
 * Chỉ hoạt động với các request đến /api/admin/**.
 * Token được tạo ra bởi AuthenticationService.generateToken() khi Admin đăng nhập thành công.
 */
@Component
public class AdminJwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AdminJwtAuthenticationFilter.class);

    @Value("${jwt.signer-key}")
    private String signerKey;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        // Chỉ xử lý các request API
        return !path.startsWith("/api/") && !path.startsWith("/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String bearerToken = request.getHeader("Authorization");

        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = bearerToken.substring(7);

        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            // Kiểm tra Issuer để phân biệt Admin JWT nội bộ ("/") với Supabase JWT (URL)
            String issuer = signedJWT.getJWTClaimsSet().getIssuer();
            if (!"/".equals(issuer)) {
                // Không phải token của Admin, bỏ qua filter này để filter khác xử lý (như Supabase)
                filterChain.doFilter(request, response);
                return;
            }

            // Xác minh chữ ký bằng signerKey của hệ thống
            JWSVerifier verifier = new MACVerifier(signerKey.getBytes());
            if (!signedJWT.verify(verifier)) {
                log.warn("Admin JWT signature verification failed for path: {}", request.getServletPath());
                filterChain.doFilter(request, response);
                return;
            }

            // Kiểm tra hạn dùng
            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (expirationTime != null && expirationTime.before(new Date())) {
                log.warn("Admin JWT token expired for path: {}", request.getServletPath());
                filterChain.doFilter(request, response);
                return;
            }

            // Lấy thông tin từ token
            String username = signedJWT.getJWTClaimsSet().getSubject();
            String role = (String) signedJWT.getJWTClaimsSet().getClaim("role");

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String authority = (role != null) ? "ROLE_" + role : "ROLE_ADMIN";
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        List.of(new SimpleGrantedAuthority(authority))
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.debug("Admin JWT authenticated: username={}, role={}", username, role);
            }

        } catch (ParseException e) {
            log.warn("Admin JWT parse error: {}", e.getMessage());
        } catch (JOSEException e) {
            log.warn("Admin JWT verification error: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
