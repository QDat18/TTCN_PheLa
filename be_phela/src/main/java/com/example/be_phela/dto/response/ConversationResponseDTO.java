package com.example.be_phela.dto.response;

import com.example.be_phela.model.enums.ConversationStatus;
import com.example.be_phela.model.enums.ConversationSource;
import java.time.LocalDateTime;

public class ConversationResponseDTO {
    private String id;
    private String customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private ConversationStatus status;
    private ConversationSource source;
    private String assignedAdminId;
    private String assignedAdminName;
    private String lastMessage;
    private LocalDateTime lastMessageTimestamp;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ConversationResponseDTO() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public ConversationStatus getStatus() { return status; }
    public void setStatus(ConversationStatus status) { this.status = status; }
    public ConversationSource getSource() { return source; }
    public void setSource(ConversationSource source) { this.source = source; }
    public String getAssignedAdminId() { return assignedAdminId; }
    public void setAssignedAdminId(String assignedAdminId) { this.assignedAdminId = assignedAdminId; }
    public String getAssignedAdminName() { return assignedAdminName; }
    public void setAssignedAdminName(String assignedAdminName) { this.assignedAdminName = assignedAdminName; }
    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }
    public LocalDateTime getLastMessageTimestamp() { return lastMessageTimestamp; }
    public void setLastMessageTimestamp(LocalDateTime lastMessageTimestamp) { this.lastMessageTimestamp = lastMessageTimestamp; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
