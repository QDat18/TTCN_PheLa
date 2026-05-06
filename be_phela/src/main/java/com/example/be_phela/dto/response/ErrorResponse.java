package com.example.be_phela.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

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

    public ErrorResponse() {}

    public ErrorResponse(boolean success, int status, String error, String message, String path, String errorCode, String suggestion, List<ValidationError> validationErrors, LocalDateTime timestamp) {
        this.success = success;
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
        this.errorCode = errorCode;
        this.suggestion = suggestion;
        this.validationErrors = validationErrors;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getSuggestion() { return suggestion; }
    public void setSuggestion(String suggestion) { this.suggestion = suggestion; }

    public List<ValidationError> getValidationErrors() { return validationErrors; }
    public void setValidationErrors(List<ValidationError> validationErrors) { this.validationErrors = validationErrors; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public static class ValidationError {
        private String field;
        private String rejectedValue;
        private String message;

        public ValidationError() {}

        public ValidationError(String field, String rejectedValue, String message) {
            this.field = field;
            this.rejectedValue = rejectedValue;
            this.message = message;
        }

        public String getField() { return field; }
        public void setField(String field) { this.field = field; }

        public String getRejectedValue() { return rejectedValue; }
        public void setRejectedValue(String rejectedValue) { this.rejectedValue = rejectedValue; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public static ValidationErrorBuilder builder() {
            return new ValidationErrorBuilder();
        }

        public static class ValidationErrorBuilder {
            private String field;
            private String rejectedValue;
            private String message;

            public ValidationErrorBuilder field(String field) { this.field = field; return this; }
            public ValidationErrorBuilder rejectedValue(String rejectedValue) { this.rejectedValue = rejectedValue; return this; }
            public ValidationErrorBuilder message(String message) { this.message = message; return this; }

            public ValidationError build() {
                return new ValidationError(field, rejectedValue, message);
            }
        }
    }

    public static ErrorResponseBuilder builder() {
        return new ErrorResponseBuilder();
    }

    public static class ErrorResponseBuilder {
        private boolean success;
        private int status;
        private String error;
        private String message;
        private String path;
        private String errorCode;
        private String suggestion;
        private List<ValidationError> validationErrors;
        private LocalDateTime timestamp;

        public ErrorResponseBuilder success(boolean success) { this.success = success; return this; }
        public ErrorResponseBuilder status(int status) { this.status = status; return this; }
        public ErrorResponseBuilder error(String error) { this.error = error; return this; }
        public ErrorResponseBuilder message(String message) { this.message = message; return this; }
        public ErrorResponseBuilder path(String path) { this.path = path; return this; }
        public ErrorResponseBuilder errorCode(String errorCode) { this.errorCode = errorCode; return this; }
        public ErrorResponseBuilder suggestion(String suggestion) { this.suggestion = suggestion; return this; }
        public ErrorResponseBuilder validationErrors(List<ValidationError> validationErrors) { this.validationErrors = validationErrors; return this; }
        public ErrorResponseBuilder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }

        public ErrorResponse build() {
            return new ErrorResponse(success, status, error, message, path, errorCode, suggestion, validationErrors, timestamp);
        }
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