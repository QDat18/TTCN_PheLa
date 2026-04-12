package com.example.be_phela.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private boolean success;
    private int status;
    private String error;
    private String message;
    private String path;
    private String errorCode;
    private String suggestion;
    private List<ValidationError> validationErrors;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationError {
        private String field;
        private String rejectedValue;
        private String message;
    }

    // Factory methods for different error types
    public static ErrorResponse of(int status, String error, String message) {
        return ErrorResponse.builder()
                .success(false)
                .status(status)
                .error(error)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ErrorResponse of(int status, String error, String message, String path) {
        return ErrorResponse.builder()
                .success(false)
                .status(status)
                .error(error)
                .message(message)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ErrorResponse of(int status, String error, String message, String path, String errorCode) {
        return ErrorResponse.builder()
                .success(false)
                .status(status)
                .error(error)
                .message(message)
                .path(path)
                .errorCode(errorCode)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ErrorResponse of(int status, String error, String message, String path, String errorCode, String suggestion) {
        return ErrorResponse.builder()
                .success(false)
                .status(status)
                .error(error)
                .message(message)
                .path(path)
                .errorCode(errorCode)
                .suggestion(suggestion)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ErrorResponse validationError(int status, String message, List<ValidationError> validationErrors) {
        return ErrorResponse.builder()
                .success(false)
                .status(status)
                .error("Validation Failed")
                .message(message)
                .errorCode("VALIDATION_ERROR")
                .validationErrors(validationErrors)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Security/Authentication specific errors
    public static ErrorResponse unauthorized(String message, String path) {
        return of(401, "Unauthorized", message, path, "UNAUTHORIZED");
    }

    public static ErrorResponse forbidden(String message, String path) {
        return of(403, "Forbidden", message, path, "FORBIDDEN");
    }

    public static ErrorResponse notFound(String message, String path) {
        return of(404, "Not Found", message, path, "NOT_FOUND");
    }

    public static ErrorResponse badRequest(String message, String path) {
        return of(400, "Bad Request", message, path, "BAD_REQUEST");
    }

    public static ErrorResponse internalServerError(String message, String path) {
        return of(500, "Internal Server Error", message, path, "INTERNAL_SERVER_ERROR");
    }
}