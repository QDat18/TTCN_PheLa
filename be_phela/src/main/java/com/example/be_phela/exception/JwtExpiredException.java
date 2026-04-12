package com.example.be_phela.exception;

public class JwtExpiredException extends JwtException {
    public JwtExpiredException(String message) {
        super(message);
    }

    public JwtExpiredException(String message, Throwable cause) {
        super(message, cause);
    }
}