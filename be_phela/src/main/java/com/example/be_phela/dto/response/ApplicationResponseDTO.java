package com.example.be_phela.dto.response;

import com.example.be_phela.model.enums.ApplicationStatus;
import java.time.LocalDateTime;

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
    private Integer aiScore;
    private String aiEvaluation;

    public ApplicationResponseDTO() {}

    public ApplicationResponseDTO(String applicationId, String fullName, String email, String phone, 
                                  String cvUrl, String jobPostingId, String jobTitle, 
                                  ApplicationStatus status, LocalDateTime applicationDate,
                                  LocalDateTime updatedAt,
                                  Integer aiScore, String aiEvaluation) {
        this.applicationId = applicationId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.cvUrl = cvUrl;
        this.jobPostingId = jobPostingId;
        this.jobTitle = jobTitle;
        this.status = status;
        this.applicationDate = applicationDate;
        this.updatedAt = updatedAt;
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
    public String getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }
    public LocalDateTime getApplicationDate() { return applicationDate; }
    public void setApplicationDate(LocalDateTime applicationDate) { this.applicationDate = applicationDate; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Integer getAiScore() { return aiScore; }
    public void setAiScore(Integer aiScore) { this.aiScore = aiScore; }
    public String getAiEvaluation() { return aiEvaluation; }
    public void setAiEvaluation(String aiEvaluation) { this.aiEvaluation = aiEvaluation; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
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
        private Integer aiScore;
        private String aiEvaluation;

        public Builder applicationId(String applicationId) { this.applicationId = applicationId; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }
        public Builder cvUrl(String cvUrl) { this.cvUrl = cvUrl; return this; }
        public Builder jobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; return this; }
        public Builder jobTitle(String jobTitle) { this.jobTitle = jobTitle; return this; }
        public Builder status(ApplicationStatus status) { this.status = status; return this; }
        public Builder applicationDate(LocalDateTime applicationDate) { this.applicationDate = applicationDate; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder aiScore(Integer aiScore) { this.aiScore = aiScore; return this; }
        public Builder aiEvaluation(String aiEvaluation) { this.aiEvaluation = aiEvaluation; return this; }

        public ApplicationResponseDTO build() {
            return new ApplicationResponseDTO(applicationId, fullName, email, phone, cvUrl, 
                                              jobPostingId, jobTitle, status, applicationDate,
                                              updatedAt, aiScore, aiEvaluation);
        }
    }
}
