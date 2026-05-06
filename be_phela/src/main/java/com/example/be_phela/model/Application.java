package com.example.be_phela.model;

import com.example.be_phela.model.enums.ApplicationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Entity(name = "application")
public class Application {
    @Id
    @UuidGenerator
    @Column(name = "application_id", nullable = false, unique = true)
    private String applicationId;

    @NotBlank(message = "Full name is required")
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Column(name = "email", nullable = false)
    private String email;

    @NotBlank(message = "Phone is required")
    @Column(name = "phone", nullable = false)
    private String phone;

    @Column(name = "cv_url")
    private String cvUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    @CreationTimestamp
    @Column(name = "application_date", nullable = false, updatable = false)
    private LocalDateTime applicationDate;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ApplicationStatus status;

    @Column(name = "ai_score")
    private Integer aiScore;

    @Column(name = "ai_evaluation", columnDefinition = "TEXT")
    private String aiEvaluation;

    public Application() {}

    public Application(String applicationId, String fullName, String email, String phone, String cvUrl, JobPosting jobPosting, LocalDateTime applicationDate, LocalDateTime updatedAt, ApplicationStatus status, Integer aiScore, String aiEvaluation) {
        this.applicationId = applicationId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.cvUrl = cvUrl;
        this.jobPosting = jobPosting;
        this.applicationDate = applicationDate;
        this.updatedAt = updatedAt;
        this.status = status;
        this.aiScore = aiScore;
        this.aiEvaluation = aiEvaluation;
    }

    // Getters and Setters
    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCvUrl() { return cvUrl; }
    public void setCvUrl(String cvUrl) { this.cvUrl = cvUrl; }
    public JobPosting getJobPosting() { return jobPosting; }
    public void setJobPosting(JobPosting jobPosting) { this.jobPosting = jobPosting; }
    public LocalDateTime getApplicationDate() { return applicationDate; }
    public void setApplicationDate(LocalDateTime applicationDate) { this.applicationDate = applicationDate; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }
    public Integer getAiScore() { return aiScore; }
    public void setAiScore(Integer aiScore) { this.aiScore = aiScore; }
    public String getAiEvaluation() { return aiEvaluation; }
    public void setAiEvaluation(String aiEvaluation) { this.aiEvaluation = aiEvaluation; }

    public static ApplicationBuilder builder() {
        return new ApplicationBuilder();
    }

    public static class ApplicationBuilder {
        private String applicationId;
        private String fullName;
        private String email;
        private String phone;
        private String cvUrl;
        private JobPosting jobPosting;
        private LocalDateTime applicationDate;
        private LocalDateTime updatedAt;
        private ApplicationStatus status;
        private Integer aiScore;
        private String aiEvaluation;

        public ApplicationBuilder applicationId(String applicationId) { this.applicationId = applicationId; return this; }
        public ApplicationBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public ApplicationBuilder email(String email) { this.email = email; return this; }
        public ApplicationBuilder phone(String phone) { this.phone = phone; return this; }
        public ApplicationBuilder cvUrl(String cvUrl) { this.cvUrl = cvUrl; return this; }
        public ApplicationBuilder jobPosting(JobPosting jobPosting) { this.jobPosting = jobPosting; return this; }
        public ApplicationBuilder applicationDate(LocalDateTime applicationDate) { this.applicationDate = applicationDate; return this; }
        public ApplicationBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public ApplicationBuilder status(ApplicationStatus status) { this.status = status; return this; }
        public ApplicationBuilder aiScore(Integer aiScore) { this.aiScore = aiScore; return this; }
        public ApplicationBuilder aiEvaluation(String aiEvaluation) { this.aiEvaluation = aiEvaluation; return this; }

        public Application build() {
            return new Application(applicationId, fullName, email, phone, cvUrl, jobPosting, applicationDate, updatedAt, status, aiScore, aiEvaluation);
        }
    }
}
