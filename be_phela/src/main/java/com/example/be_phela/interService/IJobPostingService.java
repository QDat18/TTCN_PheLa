package com.example.be_phela.interService;

import com.example.be_phela.dto.request.JobPostingCreateDTO;
import com.example.be_phela.dto.request.JobPostingUpdateDTO;
import com.example.be_phela.dto.response.JobPostingDTO;
import com.example.be_phela.model.Application;
import com.example.be_phela.model.JobPosting;
import com.example.be_phela.model.enums.ApplicationStatus;
import com.example.be_phela.model.enums.JobStatus;

import java.util.List;

public interface IJobPostingService {
    // Application related methods
    void approveApplication(String jobPostingId, String applicationId);
    Application getApplicationDetails(String jobPostingId, String applicationId);
    void updateApplicationStatus(String jobPostingId, String applicationId, ApplicationStatus status);
    long countApplications(String jobPostingId);

    // JobPosting CRUD methods - DTO versions
    JobPostingDTO createJobPosting(JobPostingCreateDTO createDTO);
    JobPostingDTO updateJobPosting(String jobPostingId, JobPostingUpdateDTO updateDTO);
    void deleteJobPosting(String jobPostingId);
    void updateJobStatus(String jobPostingId, JobStatus status);

    // JobPosting retrieval methods - Entity versions (for internal use)
    JobPosting getJobPostingById(String jobPostingId);

    // JobPosting retrieval methods - DTO versions (for API responses)
    JobPostingDTO getJobPostingDTOById(String jobPostingId);
    List<JobPostingDTO> getAllJobPostings();
    List<JobPostingDTO> getActiveJobPostings();
}
