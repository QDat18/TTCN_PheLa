package com.example.be_phela.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PaymentRequestDTO {
    @Min(value = 1000, message = "Amount must be at least 1000 VND")
    private long amount;

    @NotBlank(message = "Order info is required")
    @Size(max = 255, message = "Order info must not exceed 255 characters")
    private String orderInfo;
}
