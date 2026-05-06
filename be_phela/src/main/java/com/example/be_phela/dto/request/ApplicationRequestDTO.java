package com.example.be_phela.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
public class ApplicationRequestDTO {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[0-9+\\-\\s()]{8,15}$", message = "Phone number format is invalid")
    private String phone;

    private String cvUrl;

    public ApplicationRequestDTO() {}

    public ApplicationRequestDTO(String fullName, String email, String phone, String cvUrl) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.cvUrl = cvUrl;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getCvUrl() { return cvUrl; }
    public void setCvUrl(String cvUrl) { this.cvUrl = cvUrl; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String fullName;
        private String email;
        private String phone;
        private String cvUrl;

        public Builder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder cvUrl(String cvUrl) {
            this.cvUrl = cvUrl;
            return this;
        }

        public ApplicationRequestDTO build() {
            return new ApplicationRequestDTO(fullName, email, phone, cvUrl);
        }
    }
}
