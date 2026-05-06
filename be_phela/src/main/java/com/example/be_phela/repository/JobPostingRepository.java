package com.example.be_phela.repository;

import com.example.be_phela.model.JobPosting;
import com.example.be_phela.model.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface JobPostingRepository extends JpaRepository<JobPosting, String> {
    List<JobPosting> findByStatusAndDeadlineGreaterThanEqual(JobStatus status, LocalDate deadline);
    List<JobPosting> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String description);
}

