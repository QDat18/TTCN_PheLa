package com.example.be_phela.validation;

import com.example.be_phela.exception.RequestException;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class ValidationService {

    // Security validation patterns
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
            "(?i)(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern XSS_PATTERN = Pattern.compile(
            "(?i)(<script|</script|javascript:|vbscript:|onload|onerror|onclick|onmouseover)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern FILE_PATH_TRAVERSAL = Pattern.compile(
            "(\\.\\./|\\.\\.\\\\|%2e%2e%2f|%2e%2e%5c)",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * Validates input against SQL injection patterns
     */
    public void validateSqlInjection(String input, String fieldName) {
        if (input != null && SQL_INJECTION_PATTERN.matcher(input).find()) {
            throw new RequestException("Invalid characters detected in " + fieldName);
        }
    }

    /**
     * Validates input against XSS patterns
     */
    public void validateXss(String input, String fieldName) {
        if (input != null && XSS_PATTERN.matcher(input).find()) {
            throw new RequestException("Invalid characters detected in " + fieldName);
        }
    }

    /**
     * Validates input against path traversal attacks
     */
    public void validatePathTraversal(String input, String fieldName) {
        if (input != null && FILE_PATH_TRAVERSAL.matcher(input).find()) {
            throw new RequestException("Invalid path characters detected in " + fieldName);
        }
    }

    /**
     * Comprehensive security validation for text inputs
     */
    public void validateTextInput(String input, String fieldName) {
        if (input == null) return;

        validateSqlInjection(input, fieldName);
        validateXss(input, fieldName);
        validatePathTraversal(input, fieldName);
    }

    /**
     * Validates file upload security
     */
    public void validateFileUpload(String filename, long fileSize, String contentType) {
        // Check file extension
        if (filename != null) {
            String lowercaseFilename = filename.toLowerCase();
            if (lowercaseFilename.matches(".*\\.(exe|bat|cmd|com|pif|scr|vbs|js|php|jsp|asp)$")) {
                throw new RequestException("File type not allowed");
            }
        }

        // Check file size (10MB limit)
        if (fileSize > 10 * 1024 * 1024) {
            throw new RequestException("File size exceeds maximum limit");
        }

        // Check content type for images
        if (contentType != null && !contentType.startsWith("image/")) {
            String[] allowedTypes = {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"};
            boolean isAllowed = false;
            for (String allowedType : allowedTypes) {
                if (contentType.equals(allowedType)) {
                    isAllowed = true;
                    break;
                }
            }
            if (!isAllowed) {
                throw new RequestException("Invalid file type. Only images are allowed");
            }
        }
    }

    /**
     * Validates business rules for products
     */
    public void validateProductData(String productName, Double price, String description) {
        validateTextInput(productName, "product name");
        validateTextInput(description, "description");

        if (price != null && price < 0) {
            throw new RequestException("Price cannot be negative");
        }

        if (price != null && price > 999999.99) {
            throw new RequestException("Price exceeds maximum allowed value");
        }
    }

    /**
     * Validates user input data
     */
    public void validateUserData(String username, String email, String fullname) {
        validateTextInput(username, "username");
        validateTextInput(email, "email");
        validateTextInput(fullname, "full name");

        // Additional username validation
        if (username != null) {
            if (username.length() < 3) {
                throw new RequestException("Username too short");
            }
            if (!username.matches("^[a-zA-Z0-9_]+$")) {
                throw new RequestException("Username contains invalid characters");
            }
        }
    }
}