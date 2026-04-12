package com.example.be_phela.interService;

import com.example.be_phela.dto.request.ApplicationRequestDTO;
import com.example.be_phela.dto.response.ApplicationResponseDTO;
import com.example.be_phela.model.Application;
import org.springframework.web.multipart.MultipartFile;

public interface IApplicationService {
    ApplicationResponseDTO applyForJob(String jobPostingId, ApplicationRequestDTO requestDTO, MultipartFile cvFile);
}
