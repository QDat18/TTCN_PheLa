package com.example.be_phela.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AdminPasswordUpdateDTO {
    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 128, message = "Mật khẩu phải có ít nhất 8 ký tự")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d\\s]).{8,128}$",
            message = "Mật khẩu phải chứa ít nhất một chữ hoa, chữ thường, số và một ký tự đặc biệt")
    private String password;

    public AdminPasswordUpdateDTO() {}

    public AdminPasswordUpdateDTO(String password) {
        this.password = password;
    }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}