package com.example.be_phela.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}
