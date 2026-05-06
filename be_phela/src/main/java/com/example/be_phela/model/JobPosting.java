package com.example.be_phela.model;

import com.example.be_phela.model.enums.ExperienceLevel;
import com.example.be_phela.model.enums.JobStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
    
    @JsonIgnore
    @OneToMany(mappedBy = "jobPosting", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Application> applications;

    public JobPosting() {}

    public JobPosting(String jobPostingId, String jobCode, String title, String description, String requirements, String salaryRange, ExperienceLevel experienceLevel, Branch branch, LocalDateTime postingDate, LocalDate deadline, LocalDateTime updatedAt, JobStatus status, List<Application> applications) {
        this.jobPostingId = jobPostingId;
        this.jobCode = jobCode;
        this.title = title;
        this.description = description;
        this.requirements = requirements;
        this.salaryRange = salaryRange;
        this.experienceLevel = experienceLevel;
        this.branch = branch;
        this.postingDate = postingDate;
        this.deadline = deadline;
        this.updatedAt = updatedAt;
        this.status = status;
        this.applications = applications;
    }

    // Getters and Setters
    public String getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }
    public String getJobCode() { return jobCode; }
    public void setJobCode(String jobCode) { this.jobCode = jobCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
    public String getSalaryRange() { return salaryRange; }
    public void setSalaryRange(String salaryRange) { this.salaryRange = salaryRange; }
    public ExperienceLevel getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(ExperienceLevel experienceLevel) { this.experienceLevel = experienceLevel; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public LocalDateTime getPostingDate() { return postingDate; }
    public void setPostingDate(LocalDateTime postingDate) { this.postingDate = postingDate; }
    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public JobStatus getStatus() { return status; }
    public void setStatus(JobStatus status) { this.status = status; }
    public List<Application> getApplications() { return applications; }
    public void setApplications(List<Application> applications) { this.applications = applications; }

    public static JobPostingBuilder builder() {
        return new JobPostingBuilder();
    }

    public static class JobPostingBuilder {
        private String jobPostingId;
        private String jobCode;
        private String title;
        private String description;
        private String requirements;
        private String salaryRange;
        private ExperienceLevel experienceLevel;
        private Branch branch;
        private LocalDateTime postingDate;
        private LocalDate deadline;
        private LocalDateTime updatedAt;
        private JobStatus status;
        private List<Application> applications;

        public JobPostingBuilder jobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; return this; }
        public JobPostingBuilder jobCode(String jobCode) { this.jobCode = jobCode; return this; }
        public JobPostingBuilder title(String title) { this.title = title; return this; }
        public JobPostingBuilder description(String description) { this.description = description; return this; }
        public JobPostingBuilder requirements(String requirements) { this.requirements = requirements; return this; }
        public JobPostingBuilder salaryRange(String salaryRange) { this.salaryRange = salaryRange; return this; }
        public JobPostingBuilder experienceLevel(ExperienceLevel experienceLevel) { this.experienceLevel = experienceLevel; return this; }
        public JobPostingBuilder branch(Branch branch) { this.branch = branch; return this; }
        public JobPostingBuilder postingDate(LocalDateTime postingDate) { this.postingDate = postingDate; return this; }
        public JobPostingBuilder deadline(LocalDate deadline) { this.deadline = deadline; return this; }
        public JobPostingBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public JobPostingBuilder status(JobStatus status) { this.status = status; return this; }
        public JobPostingBuilder applications(List<Application> applications) { this.applications = applications; return this; }

        public JobPosting build() {
            return new JobPosting(jobPostingId, jobCode, title, description, requirements, salaryRange, experienceLevel, branch, postingDate, deadline, updatedAt, status, applications);
        }
    }
}
