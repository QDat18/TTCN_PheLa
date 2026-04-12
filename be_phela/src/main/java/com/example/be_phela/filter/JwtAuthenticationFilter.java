package com.example.be_phela.filter;

import com.example.be_phela.dto.response.ErrorResponse;
import com.example.be_phela.exception.JwtExpiredException;
import com.example.be_phela.exception.JwtMalformedException;
import com.example.be_phela.exception.JwtSignatureException;
import com.example.be_phela.security.SecurityEventLogger;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.text.ParseException;
import java.util.Collections;
import java.util.Date;

@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${jwt.signer-key}")
    private String signerKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SecurityEventLogger securityEventLogger = new SecurityEventLogger();

    public JwtAuthenticationFilter(String signerKey) {
        this.signerKey = signerKey;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();

        // Skip JWT processing for public endpoints - let SecurityConfig handle authorization
        if (isPublicEndpoint(requestURI)) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7);
            validateAndProcessToken(token, request, response);
        } catch (JwtMalformedException e) {
            log.warn("Malformed JWT token: " + e.getMessage());
            securityEventLogger.logTokenValidationFailure("MALFORMED_TOKEN: " + e.getMessage(), null, request);
            handleJwtError(response, request.getRequestURI(), "MALFORMED_TOKEN",
                          "Invalid JWT token format", "Please provide a valid JWT token");
            return;
        } catch (JwtExpiredException e) {
            log.warn("Expired JWT token: " + e.getMessage());
            securityEventLogger.logTokenValidationFailure("EXPIRED_TOKEN: " + e.getMessage(), null, request);
            handleJwtError(response, request.getRequestURI(), "TOKEN_EXPIRED",
                          "JWT token has expired", "Please login again to get a new token");
            return;
        } catch (JwtSignatureException e) {
            log.warn("JWT signature verification failed: " + e.getMessage());
            securityEventLogger.logTokenValidationFailure("INVALID_SIGNATURE: " + e.getMessage(), null, request);
            handleJwtError(response, request.getRequestURI(), "INVALID_SIGNATURE",
                          "JWT token signature is invalid", "Token may have been tampered with");
            return;
        } catch (Exception e) {
            log.error("Unexpected JWT processing error: " + e.getMessage(), e);
            securityEventLogger.logTokenValidationFailure("PROCESSING_ERROR: " + e.getMessage(), null, request);
            handleJwtError(response, request.getRequestURI(), "TOKEN_PROCESSING_ERROR",
                          "Failed to process JWT token", "Please contact support if this persists");
            return;
        }

        chain.doFilter(request, response);
    }

    private void validateAndProcessToken(String token, HttpServletRequest request, HttpServletResponse response)
            throws JwtMalformedException, JwtExpiredException, JwtSignatureException, ParseException, JOSEException {

        JWSObject jwsObject;
        try {
            jwsObject = JWSObject.parse(token);
        } catch (ParseException e) {
            throw new JwtMalformedException("Failed to parse JWT token", e);
        }

        // Verify signature
        try {
            if (!jwsObject.verify(new MACVerifier(signerKey.getBytes()))) {
                throw new JwtSignatureException("JWT signature verification failed");
            }
        } catch (JOSEException e) {
            throw new JwtSignatureException("Error during signature verification", e);
        }

        // Parse claims
        JWTClaimsSet claims;
        try {
            claims = JWTClaimsSet.parse(jwsObject.getPayload().toJSONObject());
        } catch (ParseException e) {
            throw new JwtMalformedException("Failed to parse JWT claims", e);
        }

        // Check expiration
        Date expirationTime = claims.getExpirationTime();
        if (expirationTime != null && expirationTime.before(new Date())) {
            throw new JwtExpiredException("JWT token has expired at " + expirationTime);
        }

        // Extract user information
        String username = claims.getSubject();
        String role = claims.getStringClaim("role");

        if (username == null || username.trim().isEmpty()) {
            throw new JwtMalformedException("JWT token missing username (subject)");
        }

        if (role == null || role.trim().isEmpty()) {
            throw new JwtMalformedException("JWT token missing role claim");
        }

        // Set authentication if not already set
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            User userDetails = (User) User.builder()
                    .username(username)
                    .password("")
                    .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role)))
                    .build();

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);

            log.debug("Successfully authenticated user: " + username + " with role: " + role);
            securityEventLogger.logAuthenticationSuccess(username, role, request);
        }
    }

    private boolean isPublicEndpoint(String requestURI) {
        return requestURI.startsWith("/auth/") ||
               requestURI.equals("/verify") ||
               requestURI.startsWith("/api/product/") ||
               requestURI.startsWith("/api/categories/") ||
               requestURI.startsWith("/api/banner/") ||
               requestURI.startsWith("/api/banners/") ||
               requestURI.startsWith("/api/contacts/") ||
               requestURI.startsWith("/api/applications/") ||
               requestURI.startsWith("/api/news/") ||
               requestURI.startsWith("/api/job-postings/") ||
               requestURI.startsWith("/api/branch/") ||
               requestURI.startsWith("/api/payment/payment-") ||
               requestURI.startsWith("/api/payment/payos-webhook") ||
               requestURI.startsWith("/api/webhooks/") ||
               requestURI.startsWith("/ws/") ||
               requestURI.startsWith("/login/oauth2/") ||
               requestURI.startsWith("/oauth2/") ||
               requestURI.equals("/error");
    }

    private void handleJwtError(HttpServletResponse response, String path, String errorCode,
                               String message, String suggestion) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpServletResponse.SC_UNAUTHORIZED,
                "Unauthorized",
                message,
                path,
                errorCode,
                suggestion
        );

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }

    @Deprecated
    private void handleInvalidToken(HttpServletResponse response) throws IOException {
        handleJwtError(response, "", "INVALID_TOKEN", "Invalid or expired token", "Please login again");
    }
}