package com.example.be_phela.controller;

import com.example.be_phela.dto.request.ApplicationRequestDTO;
import com.example.be_phela.dto.request.ApplicationStatusRequest;
import com.example.be_phela.dto.response.ApplicationResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import com.example.be_phela.service.ApplicationService;
import com.example.be_phela.service.AiScreeningService;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final AiScreeningService aiScreeningService;

    public ApplicationController(ApplicationService applicationService, 
                                 AiScreeningService aiScreeningService) {
        this.applicationService = applicationService;
        this.aiScreeningService = aiScreeningService;
    }

    @PatchMapping("/{applicationId}/status")
    public ResponseEntity<Void> updateApplicationStatus(
            @PathVariable String applicationId,
            @RequestBody ApplicationStatusRequest request) {
        applicationService.updateApplicationStatus(applicationId, request.getStatus());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{applicationId}/ai-screen")
    public ResponseEntity<?> screenApplication(@PathVariable String applicationId) {
        try {
            aiScreeningService.screenApplication(applicationId);
            return ResponseEntity.ok().body(java.util.Map.of(
                "message", "AI Screening started in background",
                "applicationId", applicationId,
                "status", "PROCESSING"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

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