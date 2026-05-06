package com.example.be_phela.dto.response;

import java.time.LocalDateTime;

public class ConversationDTO {
    private String customerId;
    private String customerName;
    private String lastMessage;
    private LocalDateTime lastMessageTimestamp;

    public ConversationDTO() {}

    public ConversationDTO(String customerId, String customerName, String lastMessage, LocalDateTime lastMessageTimestamp) {
        this.customerId = customerId;
        this.customerName = customerName;
        this.lastMessage = lastMessage;
        this.lastMessageTimestamp = lastMessageTimestamp;
    }

    // Getters and Setters
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }
    public LocalDateTime getLastMessageTimestamp() { return lastMessageTimestamp; }
    public void setLastMessageTimestamp(LocalDateTime lastMessageTimestamp) { this.lastMessageTimestamp = lastMessageTimestamp; }
}