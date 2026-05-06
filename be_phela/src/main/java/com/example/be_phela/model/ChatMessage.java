package com.example.be_phela.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;

@Entity(name = "chat_message")
public class ChatMessage {
    @Id
    @UuidGenerator
    private String id;
    private String content;
    private String senderId;
    private String recipientId; // adminId hoặc customerId
    private String senderName;
    private LocalDateTime timestamp;
    private String imageUrl;

    public ChatMessage() {}

    public ChatMessage(String id, String content, String senderId, String recipientId, String senderName, LocalDateTime timestamp, String imageUrl) {
        this.id = id;
        this.content = content;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.senderName = senderName;
        this.timestamp = timestamp;
        this.imageUrl = imageUrl;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public static ChatMessageBuilder builder() {
        return new ChatMessageBuilder();
    }

    public static class ChatMessageBuilder {
        private String id;
        private String content;
        private String senderId;
        private String recipientId;
        private String senderName;
        private LocalDateTime timestamp;
        private String imageUrl;

        public ChatMessageBuilder id(String id) { this.id = id; return this; }
        public ChatMessageBuilder content(String content) { this.content = content; return this; }
        public ChatMessageBuilder senderId(String senderId) { this.senderId = senderId; return this; }
        public ChatMessageBuilder recipientId(String recipientId) { this.recipientId = recipientId; return this; }
        public ChatMessageBuilder senderName(String senderName) { this.senderName = senderName; return this; }
        public ChatMessageBuilder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }
        public ChatMessageBuilder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }

        public ChatMessage build() {
            return new ChatMessage(id, content, senderId, recipientId, senderName, timestamp, imageUrl);
        }
    }
}
