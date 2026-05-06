package com.example.be_phela.dto.response;

import com.example.be_phela.model.enums.Roles;
import com.example.be_phela.model.enums.Status;
import java.time.LocalDate;

public class AdminResponseDTO {
    private String adminId;
    private String employCode;
    private String fullname;
    private String username;
    private String gender;
    private LocalDate dob;
    private String email;
    private String phone;
    private Roles role;
    private Status status;
    private String branch;

    public AdminResponseDTO() {}

    public AdminResponseDTO(String adminId, String employCode, String fullname, String username, String gender, LocalDate dob, String email, String phone, Roles role, Status status, String branch) {
        this.adminId = adminId;
        this.employCode = employCode;
        this.fullname = fullname;
        this.username = username;
        this.gender = gender;
        this.dob = dob;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.status = status;
        this.branch = branch;
    }

    // Getters and Setters
    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }

    public String getEmployCode() { return employCode; }
    public void setEmployCode(String employCode) { this.employCode = employCode; }

    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Roles getRole() { return role; }
    public void setRole(Roles role) { this.role = role; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
}
