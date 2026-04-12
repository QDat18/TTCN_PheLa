package com.example.be_phela.dto.request;

import lombok.Data;

@Data
public class VerifyOtpAndResetPasswordRequest {
    private String email;
    private String otp;
    private String newPassword;
}
