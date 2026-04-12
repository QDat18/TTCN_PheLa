package com.example.be_phela.exception;

public class JwtSignatureException extends JwtException {
    public JwtSignatureException(String message) {
        super(message);
    }

    public JwtSignatureException(String message, Throwable cause) {
        super(message, cause);
    }
}