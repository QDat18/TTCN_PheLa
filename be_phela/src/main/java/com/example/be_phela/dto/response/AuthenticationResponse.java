package com.example.be_phela.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class AuthenticationResponse {
    private String token;
    private String username;
    private String fullname;
    private String role;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiresAt;
    
    // Additional fields for frontend AuthContext
    private String id;
    private String email;
    private String customerId;
    private String adminId;
    private Double pointUse;

    public AuthenticationResponse() {
    }

    public AuthenticationResponse(String token, String username, String fullname, String role, LocalDateTime expiresAt, String id, String email, String customerId, String adminId, Double pointUse) {
        this.token = token;
        this.username = username;
        this.fullname = fullname;
        this.role = role;
        this.expiresAt = expiresAt;
        this.id = id;
        this.email = email;
        this.customerId = customerId;
        this.adminId = adminId;
        this.pointUse = pointUse;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }

    public Double getPointUse() { return pointUse; }
    public void setPointUse(Double pointUse) { this.pointUse = pointUse; }
}

