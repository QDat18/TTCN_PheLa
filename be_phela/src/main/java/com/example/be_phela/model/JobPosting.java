package com.example.be_phela.model;

import com.example.be_phela.model.enums.ExperienceLevel;
import com.example.be_phela.model.enums.JobStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity(name = "job_posting")
public class JobPosting {
    @Id
    @UuidGenerator
    @Column(name = "job_posting_id", nullable = false, unique = true)
    private String jobPostingId;

    @NotBlank(message = "Job code is required")
    @Column(name = "job_code", nullable = false, unique = true)
    private String jobCode;

    @NotBlank(message = "Job title is required")
    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "requirements")
    private String requirements;

    @Column(name = "salary_range")
    private String salaryRange;

    @NotNull(message = "Experience level is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "experience_level", nullable = false)
    private ExperienceLevel experienceLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_code", nullable = false)
    private Branch branch;

    @CreationTimestamp
    @Column(name = "posting_date", nullable = false, updatable = false)
    private LocalDateTime postingDate;


    @NotNull(message = "Deadline is required")
    @Column(name = "deadline", nullable = false)
    private LocalDate deadline;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private JobStatus status;

    @OneToMany(mappedBy = "jobPosting", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Application> applications;
}
