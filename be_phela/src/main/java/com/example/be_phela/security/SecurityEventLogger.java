package com.example.be_phela.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
public class SecurityEventLogger {

    private static final String SECURITY_LOG_PREFIX = "[SECURITY]";
    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public void logAuthenticationSuccess(String username, String role, HttpServletRequest request) {
        String logMessage = String.format(
                "%s [%s] AUTHENTICATION_SUCCESS - User: %s, Role: %s, IP: %s, UserAgent: %s",
                SECURITY_LOG_PREFIX,
                LocalDateTime.now().format(TIMESTAMP_FORMAT),
                username,
                role,
                getClientIpAddress(request),
                getUserAgent(request)
        );
        log.info(logMessage);
    }

    public void logAuthenticationFailure(String reason, HttpServletRequest request) {
        String logMessage = String.format(
                "%s [%s] AUTHENTICATION_FAILURE - Reason: %s, IP: %s, UserAgent: %s, Path: %s",
                SECURITY_LOG_PREFIX,
                LocalDateTime.now().format(TIMESTAMP_FORMAT),
                reason,
                getClientIpAddress(request),
                getUserAgent(request),
                request.getRequestURI()
        );
        log.warn(logMessage);
    }

    public void logTokenValidationFailure(String tokenError, String username, HttpServletRequest request) {
        String logMessage = String.format(
                "%s [%s] TOKEN_VALIDATION_FAILURE - Error: %s, User: %s, IP: %s, Path: %s",
                SECURITY_LOG_PREFIX,
                LocalDateTime.now().format(TIMESTAMP_FORMAT),
                tokenError,
                username != null ? username : "unknown",
                getClientIpAddress(request),
                request.getRequestURI()
        );
        log.warn(logMessage);
    }

    public void logAccessDenied(String username, String requestedResource, HttpServletRequest request) {
        String logMessage = String.format(
                "%s [%s] ACCESS_DENIED - User: %s, Resource: %s, IP: %s, Method: %s",
                SECURITY_LOG_PREFIX,
                LocalDateTime.now().format(TIMESTAMP_FORMAT),
                username != null ? username : "anonymous",
                requestedResource,
                getClientIpAddress(request),
                request.getMethod()
        );
        log.warn(logMessage);
    }

    public void logSuspiciousActivity(String activity, HttpServletRequest request) {
        String logMessage = String.format(
                "%s [%s] SUSPICIOUS_ACTIVITY - Activity: %s, IP: %s, UserAgent: %s, Path: %s",
                SECURITY_LOG_PREFIX,
                LocalDateTime.now().format(TIMESTAMP_FORMAT),
                activity,
                getClientIpAddress(request),
                getUserAgent(request),
                request.getRequestURI()
        );
        log.error(logMessage);
    }

    public void logSecurityEvent(String eventType, String details, HttpServletRequest request) {
        String logMessage = String.format(
                "%s [%s] %s - Details: %s, IP: %s, Path: %s",
                SECURITY_LOG_PREFIX,
                LocalDateTime.now().format(TIMESTAMP_FORMAT),
                eventType,
                details,
                getClientIpAddress(request),
                request.getRequestURI()
        );
        log.info(logMessage);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    private String getUserAgent(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        return userAgent != null ? userAgent : "unknown";
    }
}