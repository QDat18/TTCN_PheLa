package com.example.be_phela.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDTO {
    private String customerId;
    private String customerName;
    private String lastMessage;
    private LocalDateTime lastMessageTimestamp;
}