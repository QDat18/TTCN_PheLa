package com.example.be_phela.model;

import com.example.be_phela.model.enums.MembershipTier;
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

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity(name = "customer")
public class Customer implements UserDetails {
    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false)
    private String customerId;

    @Column(name = "customer_code", unique = true)
    private String customerCode;

    @Column(name = "fullname", nullable = true, length = 100)
    private String fullname;

    @Column(name = "username", nullable = false, length = 100, unique = true)
    private String username;

    @Column(name = "password", nullable = true)
    private String password;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "phone", nullable = true, length = 11, unique = true)
    private String phone;

    @Column(name = "gender", nullable = true)
    private String gender;

    @Column(name = "role", nullable = false)
    @NotNull
    @Enumerated(EnumType.STRING)
    private Roles role;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "current_notes")
    private Integer currentNotes = 0;

    @Column(name = "total_accumulated_notes")
    private Integer totalAccumulatedNotes = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "membership_tier")
    private MembershipTier membershipTier = MembershipTier.MEMBER;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = true)
    private LocalDateTime updatedAt;

    public Customer() {}

    // Getters and Setters
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getCustomerCode() { return customerCode; }
    public void setCustomerCode(String customerCode) { this.customerCode = customerCode; }

    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    @Override
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    @Override
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Roles getRole() { return role; }
    public void setRole(Roles role) { this.role = role; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Integer getCurrentNotes() { return currentNotes; }
    public void setCurrentNotes(Integer currentNotes) { this.currentNotes = currentNotes; }

    public Integer getTotalAccumulatedNotes() { return totalAccumulatedNotes; }
    public void setTotalAccumulatedNotes(Integer totalAccumulatedNotes) { this.totalAccumulatedNotes = totalAccumulatedNotes; }

    public MembershipTier getMembershipTier() { return membershipTier; }
    public void setMembershipTier(MembershipTier membershipTier) { this.membershipTier = membershipTier; }

    // UserDetails Implementation
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
    public static CustomerBuilder builder() {
        return new CustomerBuilder();
    }

    public static class CustomerBuilder {
        private String customerId;
        private String customerCode;
        private String fullname;
        private String username;
        private String password;
        private String email;
        private String phone;
        private String gender;
        private Roles role;
        private Status status;
        private Double latitude;
        private Double longitude;
        private Integer currentNotes = 0;
        private Integer totalAccumulatedNotes = 0;
        private MembershipTier membershipTier = MembershipTier.MEMBER;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public CustomerBuilder customerId(String customerId) { this.customerId = customerId; return this; }
        public CustomerBuilder customerCode(String customerCode) { this.customerCode = customerCode; return this; }
        public CustomerBuilder fullname(String fullname) { this.fullname = fullname; return this; }
        public CustomerBuilder username(String username) { this.username = username; return this; }
        public CustomerBuilder password(String password) { this.password = password; return this; }
        public CustomerBuilder email(String email) { this.email = email; return this; }
        public CustomerBuilder phone(String phone) { this.phone = phone; return this; }
        public CustomerBuilder gender(String gender) { this.gender = gender; return this; }
        public CustomerBuilder role(Roles role) { this.role = role; return this; }
        public CustomerBuilder status(Status status) { this.status = status; return this; }
        public CustomerBuilder latitude(Double latitude) { this.latitude = latitude; return this; }
        public CustomerBuilder longitude(Double longitude) { this.longitude = longitude; return this; }
        public CustomerBuilder currentNotes(Integer currentNotes) { this.currentNotes = currentNotes; return this; }
        public CustomerBuilder totalAccumulatedNotes(Integer totalAccumulatedNotes) { this.totalAccumulatedNotes = totalAccumulatedNotes; return this; }
        public CustomerBuilder membershipTier(MembershipTier membershipTier) { this.membershipTier = membershipTier; return this; }
        public CustomerBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public CustomerBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Customer build() {
            Customer c = new Customer();
            c.setCustomerId(this.customerId);
            c.setCustomerCode(this.customerCode);
            c.setFullname(this.fullname);
            c.setUsername(this.username);
            c.setPassword(this.password);
            c.setEmail(this.email);
            c.setPhone(this.phone);
            c.setGender(this.gender);
            c.setRole(this.role);
            c.setStatus(this.status);
            c.setLatitude(this.latitude);
            c.setLongitude(this.longitude);
            c.setCurrentNotes(this.currentNotes);
            c.setTotalAccumulatedNotes(this.totalAccumulatedNotes);
            c.setMembershipTier(this.membershipTier);
            c.setCreatedAt(this.createdAt);
            c.setUpdatedAt(this.updatedAt);
            return c;
        }
    }
}
