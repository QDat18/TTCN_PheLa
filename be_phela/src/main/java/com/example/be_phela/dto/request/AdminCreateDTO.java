package com.example.be_phela.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class AdminCreateDTO {
    @NotNull(message = "Tên nhân viên không được để trống")
    @NotBlank(message = "Tên nhân viên không được chứa toàn khoảng trắng")
    @Size(min = 6, max = 50, message = "Tên nhân viên phải từ 6 đến 50 ký tự")
    private String fullname;

    @NotBlank(message = "Tên người dùng không được để trống")
    @Size(min = 6, max = 50, message = "Tên người dùng phải từ 6 đến 50 ký tự")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 128, message = "Mật khẩu phải có ít nhất 8 ký tự")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d\\s]).{8,128}$",
            message = "Mật khẩu phải chứa ít nhất một chữ hoa, chữ thường, số và một ký tự đặc biệt")
    private String password;

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

    private String branch;

    public AdminCreateDTO() {}

    public AdminCreateDTO(String fullname, String username, String password, LocalDate dob, String email, String phone, String gender, String branch) {
        this.fullname = fullname;
        this.username = username;
        this.password = password;
        this.dob = dob;
        this.email = email;
        this.phone = phone;
        this.gender = gender;
        this.branch = branch;
    }

    // Getters and Setters
    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
}
