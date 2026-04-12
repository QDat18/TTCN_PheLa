package com.example.be_phela.dto.request;

import com.example.be_phela.model.enums.DiscountType;
import com.example.be_phela.model.enums.PromotionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PromotionCreateDTO {
    @NotBlank(message = "Promotion name is required")
    String name;

    String description;

    @NotNull(message = "Discount type is required")
    DiscountType discountType;

    @NotNull(message = "Discount value is required")
    Double discountValue;

    Double minimumOrderAmount;

    Double maxDiscountAmount;

    @NotNull(message = "Start date is required")
    LocalDateTime startDate;

    @NotNull(message = "End date is required")
    LocalDateTime endDate;

    @NotNull(message = "Status is required")
    PromotionStatus status;
}
