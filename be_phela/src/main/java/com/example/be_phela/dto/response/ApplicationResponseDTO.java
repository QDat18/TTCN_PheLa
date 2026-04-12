package com.example.be_phela.dto.response;

import com.example.be_phela.model.enums.ApplicationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ApplicationResponseDTO {
    private String applicationId;
    private String fullName;
    private String email;
    private String phone;
    private String cvUrl;
    private String jobPostingId;
    private String jobTitle;
    private ApplicationStatus status;
    private LocalDateTime applicationDate;
    private LocalDateTime updatedAt;
}
