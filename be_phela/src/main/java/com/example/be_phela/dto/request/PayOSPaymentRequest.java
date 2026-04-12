package com.example.be_phela.dto.request;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonPropertyOrder({"orderCode", "amount", "description", "items", "cancelUrl", "returnUrl", "buyerName", "buyerEmail", "buyerPhone", "buyerAddress", "signature"})
public class PayOSPaymentRequest {
    private Long orderCode;
    private Long amount;
    private String description;
    private List<PayOSItem> items;
    private String cancelUrl;
    private String returnUrl;
    private String buyerName;
    private String buyerEmail;
    private String buyerPhone;
    private String buyerAddress;
    private String signature;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayOSItem {
        private String name;
        private Integer quantity;
        private Long price;
    }
}
