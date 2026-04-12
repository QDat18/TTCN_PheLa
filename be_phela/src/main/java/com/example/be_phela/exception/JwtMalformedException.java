package com.example.be_phela.exception;

public class JwtMalformedException extends JwtException {
    public JwtMalformedException(String message) {
        super(message);
    }

    public JwtMalformedException(String message, Throwable cause) {
        super(message, cause);
    }
}