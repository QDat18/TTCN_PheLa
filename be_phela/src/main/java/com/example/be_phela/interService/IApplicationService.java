package com.example.be_phela.interService;

import com.example.be_phela.dto.request.ApplicationRequestDTO;
import com.example.be_phela.dto.response.ApplicationResponseDTO;
import com.example.be_phela.model.enums.ApplicationStatus;
import org.springframework.web.multipart.MultipartFile;

public interface IApplicationService {
    ApplicationResponseDTO applyForJob(String jobPostingId, ApplicationRequestDTO requestDTO, MultipartFile cvFile);
    ApplicationResponseDTO getApplicationById(String applicationId);
    void updateApplicationStatus(String applicationId, ApplicationStatus status);
}
