package com.example.be_phela.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class AuthenticationRequest {
    @NotBlank(message = "Tên không được để trống")
    @JsonProperty("username")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @JsonProperty("password")
    private String password;

    public AuthenticationRequest() {}

    public AuthenticationRequest(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Override
    public String toString() {
        return "AuthenticationRequest{" +
                "username='" + username + '\'' +
                ", password='[PROTECTED]'" +
                '}';
    }
}
