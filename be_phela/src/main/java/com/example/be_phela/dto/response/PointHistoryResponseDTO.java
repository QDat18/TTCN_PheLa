package com.example.be_phela.dto.response;

import com.example.be_phela.model.PointHistory;
import java.time.LocalDateTime;

public class PointHistoryResponseDTO {
    private String id;
    private int amount;
    private String type; // EARN, REDEEM, REFUND
    private String description;
    private LocalDateTime transactionDate;
    private String orderCode;

    public PointHistoryResponseDTO() {}

    public PointHistoryResponseDTO(PointHistory history) {
        this.id = history.getId();
        this.amount = history.getNoteAmount() != null ? history.getNoteAmount() : 0;
        this.type = history.getType() != null ? history.getType().name() : null;
        this.description = history.getDescription();
        this.transactionDate = history.getCreatedAt();
        this.orderCode = history.getOrder() != null ? history.getOrder().getOrderCode() : null;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDateTime transactionDate) { this.transactionDate = transactionDate; }
    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }
}
