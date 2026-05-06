package com.example.be_phela.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class ApiResponse<T> {
    private boolean success;
    private String status;
    private String message;
    private T data;
    private String errorCode;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    public ApiResponse() {}

    public ApiResponse(boolean success, String status, String message, T data, String errorCode, LocalDateTime timestamp) {
        this.success = success;
        this.status = status;
        this.message = message;
        this.data = data;
        this.errorCode = errorCode;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public T getData() { return data; }
    public void setData(T data) { this.data = data; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    // Static Builder class to maintain compatibility
    public static <T> ApiResponseBuilder<T> builder() {
        return new ApiResponseBuilder<>();
    }

    public static class ApiResponseBuilder<T> {
        private boolean success;
        private String status;
        private String message;
        private T data;
        private String errorCode;
        private LocalDateTime timestamp;

        public ApiResponseBuilder<T> success(boolean success) { this.success = success; return this; }
        public ApiResponseBuilder<T> status(String status) { this.status = status; return this; }
        public ApiResponseBuilder<T> message(String message) { this.message = message; return this; }
        public ApiResponseBuilder<T> data(T data) { this.data = data; return this; }
        public ApiResponseBuilder<T> errorCode(String errorCode) { this.errorCode = errorCode; return this; }
        public ApiResponseBuilder<T> timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }

        public ApiResponse<T> build() {
            return new ApiResponse<>(success, status, message, data, errorCode, timestamp);
        }
    }

    // Success response factory methods
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .status("success")
                .message("Operation completed successfully")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .status("success")
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Error response factory methods
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .status("error")
                .message(message)
                .data(null)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .status("error")
                .message(message)
                .errorCode(errorCode)
                .data(null)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Backward compatibility - deprecated
    @Deprecated
    public static <T> ApiResponse<T> of(String status, String message, T data) {
        return ApiResponse.<T>builder()
                .success("success".equals(status))
                .status(status)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
