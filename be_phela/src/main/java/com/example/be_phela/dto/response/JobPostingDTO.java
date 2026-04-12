package com.example.be_phela.dto.response;

import com.example.be_phela.model.enums.ExperienceLevel;
import com.example.be_phela.model.enums.JobStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JobPostingDTO {
    String jobPostingId;
    String jobCode;
    String title;
    String description;
    String requirements;
    String salaryRange;
    ExperienceLevel experienceLevel;
    String branchCode;
    String branchName;
    LocalDateTime postingDate;
    LocalDate deadline;
    LocalDateTime updatedAt;
    JobStatus status;
    long applicationCount;
}
