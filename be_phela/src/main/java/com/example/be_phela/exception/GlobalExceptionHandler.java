package com.example.be_phela.exception;

import com.example.be_phela.dto.response.ApiResponse;
import com.example.be_phela.dto.response.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex, WebRequest request) {
        List<ErrorResponse.ValidationError> validationErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> ErrorResponse.ValidationError.builder()
                        .field(error.getField())
                        .rejectedValue(error.getRejectedValue() != null ? error.getRejectedValue().toString() : "null")
                        .message(error.getDefaultMessage())
                        .build())
                .collect(Collectors.toList());

        String path = request.getDescription(false).replace("uri=", "");
        ErrorResponse errorResponse = ErrorResponse.validationError(
                HttpStatus.BAD_REQUEST.value(),
                "Validation failed for one or more fields",
                validationErrors
        );
        errorResponse.setPath(path);

        log.warn("Validation failed for request {}: {}", path, 
            validationErrors.stream()
                .map(e -> e.getField() + ": " + e.getMessage())
                .collect(Collectors.joining(", ")));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex, WebRequest request) {
        String path = request.getDescription(false).replace("uri=", "");
        log.error("JSON Parse Error on path {}: {}", path, ex.getMessage());
        
        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                "Malformed JSON request or parameter type mismatch: " + ex.getMostSpecificCause().getMessage(),
                path,
                "JSON_PARSE_ERROR"
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleHttpRequestMethodNotSupportedException(HttpRequestMethodNotSupportedException ex, WebRequest request) {
        String path = request.getDescription(false).replace("uri=", "");
        log.warn("Method not supported error on path {}: {}. Expected: {}", 
            path, ex.getMethod(), ex.getSupportedHttpMethods());
        
        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                "Method Not Allowed",
                "Request method '" + ex.getMethod() + "' is not supported for this URL. Please use " + ex.getSupportedHttpMethods(),
                path,
                "METHOD_NOT_ALLOWED"
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<ErrorResponse> handleJwtException(JwtException ex, WebRequest request) {
        log.warn("JWT Exception: {}", ex.getMessage());

        String path = request.getDescription(false).replace("uri=", "");
        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                ex.getMessage(),
                path,
                "JWT_ERROR",
                "Please check your authentication token"
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(JwtExpiredException.class)
    public ResponseEntity<ErrorResponse> handleJwtExpiredException(JwtExpiredException ex, WebRequest request) {
        log.warn("JWT Expired: {}", ex.getMessage());

        String path = request.getDescription(false).replace("uri=", "");
        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                "Your session has expired",
                path,
                "TOKEN_EXPIRED",
                "Please login again to get a new token"
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(JwtMalformedException.class)
    public ResponseEntity<ErrorResponse> handleJwtMalformedException(JwtMalformedException ex, WebRequest request) {
        log.warn("Malformed JWT: {}", ex.getMessage());

        String path = request.getDescription(false).replace("uri=", "");
        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                "Invalid token format",
                path,
                "MALFORMED_TOKEN",
                "Please provide a valid authentication token"
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(JwtSignatureException.class)
    public ResponseEntity<ErrorResponse> handleJwtSignatureException(JwtSignatureException ex, WebRequest request) {
        log.warn("JWT Signature Invalid: {}", ex.getMessage());

        String path = request.getDescription(false).replace("uri=", "");
        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                "Token signature verification failed",
                path,
                "INVALID_SIGNATURE",
                "Token may have been tampered with. Please login again"
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException ex, WebRequest request) {
        log.warn("Authentication failed: {}", ex.getMessage());

        String path = request.getDescription(false).replace("uri=", "");
        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                "Authentication failed: " + ex.getMessage(),
                path,
                "AUTHENTICATION_FAILED",
                "Please check your credentials and try again"
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(BadCredentialsException ex, WebRequest request) {
        log.warn("Bad credentials: {}", ex.getMessage());

        String path = request.getDescription(false).replace("uri=", "");
        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                "Invalid username or password",
                path,
                "BAD_CREDENTIALS",
                "Please check your username and password"
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex, WebRequest request) {
        log.warn("Access denied: {}", ex.getMessage());

        String path = request.getDescription(false).replace("uri=", "");
        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                "Forbidden",
                "Access denied - insufficient privileges",
                path,
                "ACCESS_DENIED",
                "You don't have permission to access this resource"
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex, WebRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());

        String path = request.getDescription(false).replace("uri=", "");
        ErrorResponse errorResponse = ErrorResponse.notFound(ex.getMessage(), path);

        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResourceException(DuplicateResourceException ex, WebRequest request) {
        log.warn("Duplicate resource: {}", ex.getMessage());

        String path = request.getDescription(false).replace("uri=", "");
        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.CONFLICT.value(),
                "Conflict",
                ex.getMessage(),
                path,
                "DUPLICATE_RESOURCE"
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        log.warn("Illegal argument: {}", ex.getMessage());

        String path = request.getDescription(false).replace("uri=", "");
        ErrorResponse errorResponse = ErrorResponse.badRequest(ex.getMessage(), path);

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, WebRequest request) {
        log.error("Unexpected error occurred on path {}: {}", 
            request.getDescription(false), ex.getMessage(), ex);

        String path = request.getDescription(false).replace("uri=", "");
        ErrorResponse errorResponse = ErrorResponse.internalServerError(
                "An unexpected error occurred: " + ex.getMessage(),
                path
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
