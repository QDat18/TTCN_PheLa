package com.example.be_phela.dto.request;

import com.example.be_phela.model.enums.ProductStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BranchCreateDTO {

    private String branchName;
    private Double latitude;
    private Double longitude;
    private String city;
    private String district;
    private String address;
    private ProductStatus status;
}
