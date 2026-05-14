package com.example.be_phela.dto.request;

import com.example.be_phela.model.enums.ResolutionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResolveRequestDTO {
    private ResolutionType resolutionType;
    private String resolutionNotes;
    private String adminNotes;
}
