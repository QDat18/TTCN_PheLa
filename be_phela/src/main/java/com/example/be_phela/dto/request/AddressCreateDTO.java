package com.example.be_phela.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressCreateDTO {
    String city;
    String district;
    String ward;
    String recipientName;
    String phone;
    String detailedAddress;
    Double latitude;
    Double longitude;
    Boolean isDefault;
}