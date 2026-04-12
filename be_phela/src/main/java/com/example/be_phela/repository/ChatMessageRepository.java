package com.example.be_phela.repository;

import com.example.be_phela.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository

public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
    // Lấy lịch sử chat của một khách hàng
    @Query("SELECT m FROM chat_message m WHERE (m.senderId = :customerId AND m.recipientId = 'ADMIN') OR (m.senderId = 'ADMIN' AND m.recipientId = :customerId) ORDER BY m.timestamp ASC")
    List<ChatMessage> findConversationWithCustomer(@Param("customerId") String customerId);

    @Query("SELECT m.senderId FROM chat_message m WHERE m.recipientId = 'ADMIN' GROUP BY m.senderId")
    List<String> findDistinctCustomerIds();

    ChatMessage findTopBySenderIdOrRecipientIdOrderByTimestampDesc(String senderId, String recipientId);
}
