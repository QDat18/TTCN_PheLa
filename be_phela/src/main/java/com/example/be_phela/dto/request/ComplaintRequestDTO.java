package com.example.be_phela.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintRequestDTO {
    private String orderId;
    private String reason;
    private List<String> evidenceImages;
}
