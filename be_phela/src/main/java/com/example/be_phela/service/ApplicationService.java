package com.example.be_phela.service;

import com.example.be_phela.dto.request.ApplicationRequestDTO;
import com.example.be_phela.dto.response.ApplicationResponseDTO;
import com.example.be_phela.interService.IApplicationService;
import com.example.be_phela.model.Application;
import com.example.be_phela.model.JobPosting;
import com.example.be_phela.model.enums.ApplicationStatus;
import com.example.be_phela.model.enums.JobStatus;
import com.example.be_phela.repository.ApplicationRepository;
import com.example.be_phela.repository.JobPostingRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationService implements IApplicationService {

    JobPostingRepository jobPostingRepository;
    ApplicationRepository applicationRepository;
    CVStorageService cvStorageService;

    @Override
    @Transactional
    public ApplicationResponseDTO applyForJob(String jobPostingId, ApplicationRequestDTO requestDTO, MultipartFile cvFile) {
        JobPosting jobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy job posting với id: " + jobPostingId));

        if (jobPosting.getStatus() != JobStatus.OPEN) {
            throw new RuntimeException("Job posting này không còn hoạt động");
        }

        boolean alreadyApplied = applicationRepository.existsByEmailAndJobPosting_JobPostingId(
                requestDTO.getEmail(), jobPostingId);

        if (alreadyApplied) {
            throw new RuntimeException("Bạn đã nộp đơn ứng tuyển cho vị trí này rồi");
        }

        String cvUrl;
        try {
            cvUrl = cvStorageService.storeCVFile(cvFile);
        } catch (Exception e) {
            throw new RuntimeException("Không thể lưu file CV: " + e.getMessage(), e);
        }

        Application application = Application.builder()
                .fullName(requestDTO.getFullName())
                .email(requestDTO.getEmail())
                .phone(requestDTO.getPhone())
                .cvUrl(cvUrl)
                .jobPosting(jobPosting)
                .status(ApplicationStatus.PENDING)
                .build();

        Application savedApplication = applicationRepository.save(application);

        return ApplicationResponseDTO.builder()
                .applicationId(savedApplication.getApplicationId())
                .fullName(savedApplication.getFullName())
                .email(savedApplication.getEmail())
                .phone(savedApplication.getPhone())
                .cvUrl(savedApplication.getCvUrl())
                .jobPostingId(jobPostingId)
                .jobTitle(jobPosting.getTitle())
                .status(savedApplication.getStatus())
                .applicationDate(savedApplication.getApplicationDate())
                .updatedAt(savedApplication.getUpdatedAt())
                .build();
    }

    private ApplicationResponseDTO convertToResponseDTO(Application application) {
        return ApplicationResponseDTO.builder()
                .applicationId(application.getApplicationId())
                .fullName(application.getFullName())
                .email(application.getEmail())
                .phone(application.getPhone())
                .cvUrl(application.getCvUrl())
                .jobPostingId(application.getJobPosting().getJobPostingId())
                .jobTitle(application.getJobPosting().getTitle())
                .status(application.getStatus())
                .applicationDate(application.getApplicationDate())
                .updatedAt(application.getUpdatedAt())
                .build();
    }


    @Transactional(readOnly = true)
    public List<ApplicationResponseDTO> getApplicationsByJobPostingId(String jobPostingId) {
        if (!jobPostingRepository.existsById(jobPostingId)) {
            throw new RuntimeException("Không tìm thấy job posting với id: " + jobPostingId);
        }

        List<Application> applications = applicationRepository.findByJobPosting_JobPostingId(jobPostingId);
        return applications.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // Thêm phương thức lấy tất cả ứng viên
    @Transactional(readOnly = true)
    public List<ApplicationResponseDTO> getAllApplications() {
        List<Application> applications = applicationRepository.findAll();
        return applications.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
}