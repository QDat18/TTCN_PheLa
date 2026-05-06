package com.example.be_phela.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class AdminUpdateDTO {
    @NotNull(message = "Tên nhân viên không được để trống")
    @NotBlank(message = "Tên nhân viên không được chứa toàn khoảng trắng")
    @Size(min = 6, max = 50, message = "Tên nhân viên phải từ 6 đến 50 ký tự")
    private String fullname;

    @NotNull(message = "Ngày sinh không được để trống")
    @PastOrPresent(message = "Ngày sinh không được là ngày trong tương lai")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private LocalDate dob;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 50, message = "Email không được dài quá 50 ký tự")
    private String email;

    @Pattern(regexp = "^\\d{10,11}$", message = "Số điện thoại không hợp lệ")
    @NotNull
    private String phone;

    @NotBlank(message = "Giới tính không được để trống")
    private String gender;

    public AdminUpdateDTO() {}

    public AdminUpdateDTO(String fullname, LocalDate dob, String email, String phone, String gender) {
        this.fullname = fullname;
        this.dob = dob;
        this.email = email;
        this.phone = phone;
        this.gender = gender;
    }

    // Getters and Setters
    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
}