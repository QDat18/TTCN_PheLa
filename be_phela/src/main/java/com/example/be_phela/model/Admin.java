package com.example.be_phela.model;

import com.example.be_phela.model.enums.Roles;
import com.example.be_phela.model.enums.Status;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity(name = "admin")
public class Admin implements UserDetails {
    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "employ_code",nullable = false,unique = true)
    private String employCode;

    @Column(name = "fullname",nullable = false,length = 100, unique = true)
    private String fullname;

    @Column(name = "username",nullable = false,length = 100, unique = true)
    private String username;

    @Column(name = "dob", nullable = true)
    private LocalDate dob;

    @Column(name = "gender",nullable = false)
    private String gender;

    @Column(name = "password",nullable = false)
    private String password;

    @Column(name = "email",nullable = false)
    private String email;

    @Column(name = "phone",nullable = false, length = 11)
    private String phone;

    @Column(name = "role",nullable = false)
    @NotNull
    @Enumerated(EnumType.STRING)
    private Roles role;

    @Column(name = "last_login_ip",nullable = true,length = 45)
    private String lastLoginIp;

    @CreationTimestamp
    @Column(name = "created_at",nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false, updatable = true)
    private LocalDateTime updatedAt;

    @Column(name = "status",nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts = 0;

    @ManyToOne
    @JoinColumn(name = "branch_code", referencedColumnName = "branch_code")
    private Branch branch;

    public Admin() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployCode() { return employCode; }
    public void setEmployCode(String employCode) { this.employCode = employCode; }

    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Roles getRole() { return role; }
    public void setRole(Roles role) { this.role = role; }

    public String getLastLoginIp() { return lastLoginIp; }
    public void setLastLoginIp(String lastLoginIp) { this.lastLoginIp = lastLoginIp; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }

    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    // UserDetails implemented methods
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (this.role == null) return List.of();
        return List.of(new SimpleGrantedAuthority("ROLE_" + this.role.name()));
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return this.status != Status.BLOCKED; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return this.status == Status.ACTIVE; }

    // Manual Builder
    public static AdminBuilder builder() {
        return new AdminBuilder();
    }

    public static class AdminBuilder {
        private String id;
        private String employCode;
        private String fullname;
        private String username;
        private LocalDate dob;
        private String gender;
        private String password;
        private String email;
        private String phone;
        private Roles role;
        private String lastLoginIp;
        private Status status;
        private int failedLoginAttempts = 0;
        private Branch branch;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public AdminBuilder id(String id) { this.id = id; return this; }
        public AdminBuilder employCode(String employCode) { this.employCode = employCode; return this; }
        public AdminBuilder fullname(String fullname) { this.fullname = fullname; return this; }
        public AdminBuilder username(String username) { this.username = username; return this; }
        public AdminBuilder dob(LocalDate dob) { this.dob = dob; return this; }
        public AdminBuilder gender(String gender) { this.gender = gender; return this; }
        public AdminBuilder password(String password) { this.password = password; return this; }
        public AdminBuilder email(String email) { this.email = email; return this; }
        public AdminBuilder phone(String phone) { this.phone = phone; return this; }
        public AdminBuilder role(Roles role) { this.role = role; return this; }
        public AdminBuilder lastLoginIp(String lastLoginIp) { this.lastLoginIp = lastLoginIp; return this; }
        public AdminBuilder status(Status status) { this.status = status; return this; }
        public AdminBuilder failedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; return this; }
        public AdminBuilder branch(Branch branch) { this.branch = branch; return this; }
        public AdminBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public AdminBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Admin build() {
            Admin a = new Admin();
            a.setId(this.id);
            a.setEmployCode(this.employCode);
            a.setFullname(this.fullname);
            a.setUsername(this.username);
            a.setDob(this.dob);
            a.setGender(this.gender);
            a.setPassword(this.password);
            a.setEmail(this.email);
            a.setPhone(this.phone);
            a.setRole(this.role);
            a.setLastLoginIp(this.lastLoginIp);
            a.setStatus(this.status);
            a.setFailedLoginAttempts(this.failedLoginAttempts);
            a.setBranch(this.branch);
            a.setCreatedAt(this.createdAt);
            a.setUpdatedAt(this.updatedAt);
            return a;
        }
    }
}