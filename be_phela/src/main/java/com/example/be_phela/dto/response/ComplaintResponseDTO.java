package com.example.be_phela.dto.response;

import com.example.be_phela.model.enums.ComplaintStatus;
import com.example.be_phela.model.enums.ResolutionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponseDTO {
    private String id;
    private String orderId;
    private String orderCode;
    private String customerId;
    private String customerName;
    private String reason;
    private List<String> evidenceImages;
    private ComplaintStatus status;
    private ResolutionType resolutionType;
    private String resolutionNotes;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
