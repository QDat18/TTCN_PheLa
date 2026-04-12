package com.example.be_phela.dto.request;

import com.example.be_phela.model.enums.ExperienceLevel;
import com.example.be_phela.model.enums.JobStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Future;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JobPostingCreateDTO {
    @NotBlank(message = "Job title is required")
    String title;

    String description;

    String requirements;

    String salaryRange;

    @NotNull(message = "Experience level is required")
    ExperienceLevel experienceLevel;

    @NotBlank(message = "Branch code is required")
    String branchCode;

    @NotNull(message = "Deadline is required")
    @Future(message = "Deadline must be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate deadline;

    JobStatus status;
}