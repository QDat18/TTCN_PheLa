package com.example.be_phela.model;

import com.example.be_phela.model.enums.NotificationType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Entity(name = "notification")
public class Notification {
    @Id
    @UuidGenerator
    @Column(name = "notification_id", nullable = false, unique = true)
    private String notificationId;

    @Column(name = "sender_id")
    private String senderId;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "recipient_id")
    private String recipientId;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private NotificationType type;

    @Column(name = "is_read")
    private boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Notification() {}

    public Notification(String notificationId, String senderId, String senderName, String recipientId, String message, NotificationType type, boolean isRead, LocalDateTime createdAt) {
        this.notificationId = notificationId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.recipientId = recipientId;
        this.message = message;
        this.type = type;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public String getNotificationId() { return notificationId; }
    public void setNotificationId(String notificationId) { this.notificationId = notificationId; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean isRead) { this.isRead = isRead; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static NotificationBuilder builder() {
        return new NotificationBuilder();
    }

    public static class NotificationBuilder {
        private String notificationId;
        private String senderId;
        private String senderName;
        private String recipientId;
        private String message;
        private NotificationType type;
        private boolean isRead = false;
        private LocalDateTime createdAt;

        public NotificationBuilder notificationId(String notificationId) { this.notificationId = notificationId; return this; }
        public NotificationBuilder senderId(String senderId) { this.senderId = senderId; return this; }
        public NotificationBuilder senderName(String senderName) { this.senderName = senderName; return this; }
        public NotificationBuilder recipientId(String recipientId) { this.recipientId = recipientId; return this; }
        public NotificationBuilder message(String message) { this.message = message; return this; }
        public NotificationBuilder type(NotificationType type) { this.type = type; return this; }
        public NotificationBuilder isRead(boolean isRead) { this.isRead = isRead; return this; }
        public NotificationBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Notification build() {
            return new Notification(notificationId, senderId, senderName, recipientId, message, type, isRead, createdAt);
        }
    }
}
