package com.example.be_phela.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SePayWebhookDTO {
    private Long id;
    private String gateway;
    
    @JsonProperty("transaction_date")
    private String transactionDate;
    
    @JsonProperty("account_number")
    private String accountNumber;
    
    @JsonProperty("sub_account")
    private String subAccount;
    
    @JsonProperty("amount_in")
    private Double amountIn;
    
    @JsonProperty("amount_out")
    private Double amountOut;
    
    private Double accumulated;
    private String code;
    
    @JsonProperty("transaction_content")
    private String transactionContent;
    
    @JsonProperty("reference_number")
    private String referenceNumber;
    
    private String body;

    // Additional fields for SePay Gateway/IPN Wizard format
    @JsonProperty("notification_type")
    private String notificationType;

    @JsonProperty("order")
    private OrderData order;

    @JsonProperty("transaction")
    private TransactionData transaction;

    @Data
    public static class OrderData {
        @JsonProperty("order_id")
        private String orderId;

        @JsonProperty("order_amount")
        private Double orderAmount;
    }

    @Data
    public static class TransactionData {
        @JsonProperty("transaction_amount")
        private Double transactionAmount;

        @JsonProperty("transaction_id")
        private String transactionId;
    }
}
