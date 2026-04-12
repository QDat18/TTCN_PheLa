package com.example.be_phela.controller;

import com.example.be_phela.repository.ApplicationRepository;
import com.example.be_phela.service.CVStorageService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/cv")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CVDownloadController {

    CVStorageService cvStorageService;
    ApplicationRepository applicationRepository;

    /**
     * Download CV file by application ID
     */
    @GetMapping("/download/{applicationId}")
    public ResponseEntity<Resource> downloadCV(@PathVariable String applicationId) {
        try {
            // Tìm application
            var application = applicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Application not found"));

            String cvUrl = application.getCvUrl();
            if (cvUrl == null || !cvUrl.startsWith("/uploads/cv/")) {
                return ResponseEntity.notFound().build();
            }

            // Lấy tên file từ URL
            String fileName = cvUrl.substring("/uploads/cv/".length());
            Path filePath = Paths.get("uploads/cv").resolve(fileName).normalize();

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // Xác định content type
            String contentType = getContentType(fileName);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"CV_" + application.getFullName() + "_" + fileName + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * View CV file in browser (if supported)
     */
    @GetMapping("/view/{applicationId}")
    public ResponseEntity<Resource> viewCV(@PathVariable String applicationId) {
        try {
            var application = applicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Application not found"));

            String cvUrl = application.getCvUrl();
            if (cvUrl == null || !cvUrl.startsWith("/uploads/cv/")) {
                return ResponseEntity.notFound().build();
            }

            String fileName = cvUrl.substring("/uploads/cv/".length());
            Path filePath = Paths.get("uploads/cv").resolve(fileName).normalize();

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = getContentType(fileName);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get CV file info
     */
    @GetMapping("/info/{applicationId}")
    public ResponseEntity<CVFileInfo> getCVInfo(@PathVariable String applicationId) {
        try {
            var application = applicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Application not found"));

            String cvUrl = application.getCvUrl();
            if (cvUrl == null) {
                return ResponseEntity.notFound().build();
            }

            boolean exists = cvStorageService.fileExists(cvUrl);
            long size = cvStorageService.getFileSize(cvUrl);

            CVFileInfo info = CVFileInfo.builder()
                    .fileName(cvUrl.substring(cvUrl.lastIndexOf("/") + 1))
                    .fileSize(size)
                    .exists(exists)
                    .applicantName(application.getFullName())
                    .uploadDate(application.getApplicationDate())
                    .build();

            return ResponseEntity.ok(info);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Xác định content type từ extension
     */
    private String getContentType(String fileName) {
        String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            default -> "application/octet-stream";
        };
    }

    /**
     * DTO for CV file information
     */
    @lombok.Data
    @lombok.Builder
    static class CVFileInfo {
        private String fileName;
        private long fileSize;
        private boolean exists;
        private String applicantName;
        private java.time.LocalDateTime uploadDate;
    }
}