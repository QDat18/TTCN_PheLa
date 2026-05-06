package com.example.be_phela.dto.request;

import jakarta.validation.constraints.*;

public class CustomerCreateDTO {
    @NotNull(message = "Tên khách hàng không được để trống")
    @NotBlank(message = "Tên khách hàng không được chứa toàn khoảng trắng")
    @Size(min = 6, max = 50, message = "Tên người dùng phải từ 6 đến 50 ký tự")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 128, message = "Mật khẩu phải có ít nhất 8 ký tự")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d\\s]).{8,128}$",
            message = "Mật khẩu phải chứa ít nhất một chữ hoa, chữ thường, số và một ký tự đặc biệt")
    private String password;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Giới tính không được để trống")
    private String gender;

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullname;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    private Double latitude;
    private Double longitude;

    public CustomerCreateDTO() {
    }

    public CustomerCreateDTO(String username, String password, String email, String gender, String fullname, String phone, Double latitude, Double longitude) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.gender = gender;
        this.fullname = fullname;
        this.phone = phone;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
