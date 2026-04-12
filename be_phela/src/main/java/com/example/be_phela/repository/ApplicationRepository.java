package com.example.be_phela.repository;

import com.example.be_phela.model.Application;
import com.example.be_phela.model.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, String> {

    boolean existsByEmailAndJobPosting_JobPostingId(String email, String jobPostingId);
    List<Application> findByJobPosting_JobPostingId(String jobPostingId);

}
