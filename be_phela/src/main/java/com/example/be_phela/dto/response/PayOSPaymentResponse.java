package com.example.be_phela.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PayOSPaymentResponse {
    private String code;
    private String desc;
    private PayOSData data;
    private String signature;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PayOSData {
        private String bin;
        private String accountNumber;
        private String accountName;
        private Long amount;
        private String description;
        private Long orderCode;
        private String currency;
        private String paymentLinkId;
        private String status;
        private String checkoutUrl;
        private String qrCode;
        private Long expiredAt;
    }
}
