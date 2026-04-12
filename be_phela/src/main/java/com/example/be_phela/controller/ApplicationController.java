package com.example.be_phela.controller;

import com.example.be_phela.dto.request.ApplicationRequestDTO;
import com.example.be_phela.dto.response.ApplicationResponseDTO;
import com.example.be_phela.model.Application;
import com.example.be_phela.model.enums.ApplicationStatus;
import com.example.be_phela.service.ApplicationService;
import com.example.be_phela.interService.IJobPostingService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationController {

    ApplicationService applicationService;
    IJobPostingService jobPostingService;

    @PostMapping(value = "/job-postings/{jobPostingId}/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApplicationResponseDTO> applyForJob(
            @PathVariable String jobPostingId,
            @RequestPart("fullName") String fullName,
            @RequestPart("email") String email,
            @RequestPart("phone") String phone,
            @RequestPart("cvFile") MultipartFile cvFile) {

        try {
            ApplicationRequestDTO requestDTO = ApplicationRequestDTO.builder()
                    .fullName(fullName)
                    .email(email)
                    .phone(phone)
                    .build();

            ApplicationResponseDTO responseDTO = applicationService.applyForJob(jobPostingId, requestDTO, cvFile);
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/job-postings/{jobPostingId}")
    public ResponseEntity<List<ApplicationResponseDTO>> getApplicationsByJobPostingId(
            @PathVariable String jobPostingId) {
        try {
            List<ApplicationResponseDTO> applications = applicationService.getApplicationsByJobPostingId(jobPostingId);
            return ResponseEntity.ok(applications);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // Thêm endpoint lấy tất cả ứng viên
    @GetMapping
    public ResponseEntity<List<ApplicationResponseDTO>> getAllApplications() {
        try {
            List<ApplicationResponseDTO> applications = applicationService.getAllApplications();
            return ResponseEntity.ok(applications);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}