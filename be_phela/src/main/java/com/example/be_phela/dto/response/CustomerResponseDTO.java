package com.example.be_phela.dto.response;

import com.example.be_phela.model.enums.MembershipTier;
import com.example.be_phela.model.enums.Roles;
import com.example.be_phela.model.enums.Status;

import java.time.LocalDate;

public class CustomerResponseDTO {
    private String customerId;
    private String customerCode;
    private String username;
    private String gender;
    private String email;
    private Double latitude;
    private Double longitude;
    private Roles role;
    private Status status;
    private Double pointUse;
    private long orderCancelCount;
    private String fullname;
    private String phone;
    private Integer currentNotes;
    private Integer totalAccumulatedNotes;
    private MembershipTier membershipTier;

    public CustomerResponseDTO() {}

    public CustomerResponseDTO(String customerId, String customerCode, String username, String gender, String email, Double latitude, Double longitude, Roles role, Status status, Double pointUse, long orderCancelCount, String fullname, String phone, Integer currentNotes, Integer totalAccumulatedNotes, MembershipTier membershipTier) {
        this.customerId = customerId;
        this.customerCode = customerCode;
        this.username = username;
        this.gender = gender;
        this.email = email;
        this.latitude = latitude;
        this.longitude = longitude;
        this.role = role;
        this.status = status;
        this.pointUse = pointUse;
        this.orderCancelCount = orderCancelCount;
        this.fullname = fullname;
        this.phone = phone;
        this.currentNotes = currentNotes;
        this.totalAccumulatedNotes = totalAccumulatedNotes;
        this.membershipTier = membershipTier;
    }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getCustomerCode() { return customerCode; }
    public void setCustomerCode(String customerCode) { this.customerCode = customerCode; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Roles getRole() { return role; }
    public void setRole(Roles role) { this.role = role; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Double getPointUse() { return pointUse; }
    public void setPointUse(Double pointUse) { this.pointUse = pointUse; }

    public long getOrderCancelCount() { return orderCancelCount; }
    public void setOrderCancelCount(long orderCancelCount) { this.orderCancelCount = orderCancelCount; }

    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Integer getCurrentNotes() { return currentNotes; }
    public void setCurrentNotes(Integer currentNotes) { this.currentNotes = currentNotes; }

    public Integer getTotalAccumulatedNotes() { return totalAccumulatedNotes; }
    public void setTotalAccumulatedNotes(Integer totalAccumulatedNotes) { this.totalAccumulatedNotes = totalAccumulatedNotes; }

    public MembershipTier getMembershipTier() { return membershipTier; }
    public void setMembershipTier(MembershipTier membershipTier) { this.membershipTier = membershipTier; }

    public static CustomerResponseDTOBuilder builder() {
        return new CustomerResponseDTOBuilder();
    }

    public static class CustomerResponseDTOBuilder {
        private String customerId;
        private String customerCode;
        private String username;
        private String gender;
        private String email;
        private Double latitude;
        private Double longitude;
        private Roles role;
        private Status status;
        private Double pointUse;
        private long orderCancelCount;
        private String fullname;
        private String phone;
        private Integer currentNotes;
        private Integer totalAccumulatedNotes;
        private MembershipTier membershipTier;

        public CustomerResponseDTOBuilder customerId(String customerId) { this.customerId = customerId; return this; }
        public CustomerResponseDTOBuilder customerCode(String customerCode) { this.customerCode = customerCode; return this; }
        public CustomerResponseDTOBuilder username(String username) { this.username = username; return this; }
        public CustomerResponseDTOBuilder gender(String gender) { this.gender = gender; return this; }
        public CustomerResponseDTOBuilder email(String email) { this.email = email; return this; }
        public CustomerResponseDTOBuilder latitude(Double latitude) { this.latitude = latitude; return this; }
        public CustomerResponseDTOBuilder longitude(Double longitude) { this.longitude = longitude; return this; }
        public CustomerResponseDTOBuilder role(Roles role) { this.role = role; return this; }
        public CustomerResponseDTOBuilder status(Status status) { this.status = status; return this; }
        public CustomerResponseDTOBuilder pointUse(Double pointUse) { this.pointUse = pointUse; return this; }
        public CustomerResponseDTOBuilder orderCancelCount(long orderCancelCount) { this.orderCancelCount = orderCancelCount; return this; }
        public CustomerResponseDTOBuilder fullname(String fullname) { this.fullname = fullname; return this; }
        public CustomerResponseDTOBuilder phone(String phone) { this.phone = phone; return this; }
        public CustomerResponseDTOBuilder currentNotes(Integer currentNotes) { this.currentNotes = currentNotes; return this; }
        public CustomerResponseDTOBuilder totalAccumulatedNotes(Integer totalAccumulatedNotes) { this.totalAccumulatedNotes = totalAccumulatedNotes; return this; }
        public CustomerResponseDTOBuilder membershipTier(MembershipTier membershipTier) { this.membershipTier = membershipTier; return this; }

        public CustomerResponseDTO build() {
            return new CustomerResponseDTO(customerId, customerCode, username, gender, email, latitude, longitude, role, status, pointUse, orderCancelCount, fullname, phone, currentNotes, totalAccumulatedNotes, membershipTier);
        }
    }
}
