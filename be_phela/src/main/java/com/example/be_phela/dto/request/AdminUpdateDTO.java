package com.example.be_phela.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
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
}