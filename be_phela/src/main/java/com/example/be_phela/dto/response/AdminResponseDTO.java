package com.example.be_phela.dto.response;

import com.example.be_phela.model.enums.Roles;
import com.example.be_phela.model.enums.Status;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminResponseDTO {
    String adminId;
    String employCode;
    String fullname;
    String username;
    String gender;
    LocalDate dob;
    String email;
    String phone;
    Roles role;
    Status status;
    String branch;
}
