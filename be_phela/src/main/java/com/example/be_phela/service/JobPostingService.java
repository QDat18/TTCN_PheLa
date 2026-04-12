package com.example.be_phela.service;

import com.example.be_phela.dto.request.JobPostingCreateDTO;
import com.example.be_phela.dto.request.JobPostingUpdateDTO;
import com.example.be_phela.dto.response.JobPostingDTO;
import com.example.be_phela.interService.IJobPostingService;
import com.example.be_phela.model.Application;
import com.example.be_phela.model.Branch;
import com.example.be_phela.model.JobPosting;
import com.example.be_phela.model.enums.ApplicationStatus;
import com.example.be_phela.model.enums.JobStatus;
import com.example.be_phela.repository.ApplicationRepository;
import com.example.be_phela.repository.BranchRepository;
import com.example.be_phela.repository.JobPostingRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class JobPostingService implements IJobPostingService {

    JobPostingRepository jobPostingRepository;
    BranchRepository branchRepository;
    ApplicationRepository applicationRepository; // THÊM ApplicationRepository

    private String generateJobCode() {
        long count = jobPostingRepository.count();
        return String.format("JB%04d", count + 1);
    }

    private JobPostingDTO convertToDTO(JobPosting jobPosting) {
        return JobPostingDTO.builder()
                .jobPostingId(jobPosting.getJobPostingId())
                .jobCode(jobPosting.getJobCode())
                .title(jobPosting.getTitle())
                .description(jobPosting.getDescription())
                .requirements(jobPosting.getRequirements())
                .salaryRange(jobPosting.getSalaryRange())
                .experienceLevel(jobPosting.getExperienceLevel())
                .branchCode(jobPosting.getBranch() != null ? jobPosting.getBranch().getBranchCode() : null)
                .branchName(jobPosting.getBranch() != null ? jobPosting.getBranch().getBranchName() : null)
                .postingDate(jobPosting.getPostingDate())
                .deadline(jobPosting.getDeadline())
                .updatedAt(jobPosting.getUpdatedAt())
                .status(jobPosting.getStatus())
                .applicationCount(jobPosting.getApplications() != null ? jobPosting.getApplications().size() : 0)
                .build();
    }

    private JobPosting convertCreateDTOToEntity(JobPostingCreateDTO createDTO) {
        Branch branch = branchRepository.findById(createDTO.getBranchCode())
                .orElseThrow(() -> new RuntimeException("Branch not found with code: " + createDTO.getBranchCode()));

        return JobPosting.builder()
                .jobCode(generateJobCode())
                .title(createDTO.getTitle())
                .description(createDTO.getDescription())
                .requirements(createDTO.getRequirements())
                .salaryRange(createDTO.getSalaryRange())
                .experienceLevel(createDTO.getExperienceLevel())
                .branch(branch)
                .deadline(createDTO.getDeadline())
                .status(createDTO.getStatus() != null ? createDTO.getStatus() : JobStatus.OPEN)
                .build();
    }

    private void updateEntityFromDTO(JobPosting existing, JobPostingUpdateDTO updateDTO) {
        Branch branch = branchRepository.findById(updateDTO.getBranchCode())
                .orElseThrow(() -> new RuntimeException("Branch not found with code: " + updateDTO.getBranchCode()));



        existing.setTitle(updateDTO.getTitle());
        existing.setDescription(updateDTO.getDescription());
        existing.setRequirements(updateDTO.getRequirements());
        existing.setSalaryRange(updateDTO.getSalaryRange());
        existing.setExperienceLevel(updateDTO.getExperienceLevel());
        existing.setBranch(branch);
        existing.setDeadline(updateDTO.getDeadline());
        if (updateDTO.getStatus() != null) {
            existing.setStatus(updateDTO.getStatus());
        }
    }

    @Override
    @Transactional
    public JobPostingDTO createJobPosting(JobPostingCreateDTO createDTO) {
        LocalDateTime deadline;
        try {
            LocalDate date = LocalDate.parse(createDTO.getDeadline().toString(), DateTimeFormatter.ISO_LOCAL_DATE);
            deadline = date.atStartOfDay();
        } catch (Exception e) {
            throw new RuntimeException("Invalid deadline format: " + createDTO.getDeadline(), e);
        }

        if (deadline.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Deadline must be in the future");
        }

        JobPosting jobPosting = convertCreateDTOToEntity(createDTO);
        JobPosting savedJobPosting = jobPostingRepository.save(jobPosting);
        return convertToDTO(savedJobPosting);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobPostingDTO> getAllJobPostings() {
        return jobPostingRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobPostingDTO> getActiveJobPostings() {
        return jobPostingRepository.findByStatusAndDeadlineAfter(JobStatus.OPEN, LocalDate.now())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public JobPostingDTO getJobPostingDTOById(String jobPostingId) {
        JobPosting jobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new RuntimeException("Job posting not found with id: " + jobPostingId));
        return convertToDTO(jobPosting);
    }

    @Override
    @Transactional
    public JobPostingDTO updateJobPosting(String jobPostingId, JobPostingUpdateDTO updateDTO) {
        JobPosting existing = getJobPostingById(jobPostingId);
        updateEntityFromDTO(existing, updateDTO);
        JobPosting updatedJobPosting = jobPostingRepository.save(existing);
        return convertToDTO(updatedJobPosting);
    }

    @Override
    @Transactional
    public void approveApplication(String jobPostingId, String applicationId) {
        // Tìm Application trực tiếp thay vì qua JobPosting
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found with id: " + applicationId));

        // Kiểm tra Application có thuộc JobPosting này không
        if (!application.getJobPosting().getJobPostingId().equals(jobPostingId)) {
            throw new RuntimeException("Application does not belong to the specified job posting");
        }

        if (application.getStatus() == ApplicationStatus.ACCEPTED) {
            throw new RuntimeException("Application is already approved");
        }

        application.setStatus(ApplicationStatus.ACCEPTED);
        application.setUpdatedAt(LocalDateTime.now());

        // SỬ DỤNG ApplicationRepository để save
        applicationRepository.save(application);
    }

    @Override
    @Transactional(readOnly = true)
    public Application getApplicationDetails(String jobPostingId, String applicationId) {
        // Tìm Application trực tiếp
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found with id: " + applicationId));

        // Kiểm tra Application có thuộc JobPosting này không
        if (!application.getJobPosting().getJobPostingId().equals(jobPostingId)) {
            throw new RuntimeException("Application does not belong to the specified job posting");
        }

        return application;
    }

    @Override
    @Transactional
    public void updateApplicationStatus(String jobPostingId, String applicationId, ApplicationStatus status) {
        if (status == null) {
            throw new RuntimeException("Status cannot be null");
        }

        // Tìm Application trực tiếp thay vì qua JobPosting
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found with id: " + applicationId));

        // Kiểm tra Application có thuộc JobPosting này không
        if (!application.getJobPosting().getJobPostingId().equals(jobPostingId)) {
            throw new RuntimeException("Application does not belong to the specified job posting");
        }

        if (application.getStatus() == status) {
            throw new RuntimeException("Application is already in status: " + status);
        }

        if (application.getStatus() == ApplicationStatus.ACCEPTED && status != ApplicationStatus.ACCEPTED) {
            throw new RuntimeException("Cannot change status of an accepted application");
        }

        application.setStatus(status);
        application.setUpdatedAt(LocalDateTime.now());

        applicationRepository.save(application);
    }

    @Override
    @Transactional(readOnly = true)
    public JobPosting getJobPostingById(String jobPostingId) {
        return jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new RuntimeException("Job posting not found with id: " + jobPostingId));
    }

    @Override
    @Transactional
    public void deleteJobPosting(String jobPostingId) {
        JobPosting jobPosting = getJobPostingById(jobPostingId);
        jobPostingRepository.delete(jobPosting);
    }

    @Override
    @Transactional
    public void updateJobStatus(String jobPostingId, JobStatus status) {
        JobPosting jobPosting = getJobPostingById(jobPostingId);
        if (status == null) {
            throw new RuntimeException("Status cannot be null");
        }
        jobPosting.setStatus(status);
        jobPostingRepository.save(jobPosting);
    }

    @Override
    @Transactional(readOnly = true)
    public long countApplications(String jobPostingId) {
        JobPosting jobPosting = getJobPostingById(jobPostingId);
        return jobPosting.getApplications().stream().count();
    }
}