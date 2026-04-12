package com.example.be_phela.dto.response;

import com.example.be_phela.model.enums.BannerStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class BannerResponseDTO {
    private String bannerId;
    private String imageUrl;
    private LocalDateTime createdAt;
    private BannerStatus status;
}
