package com.example.be_phela.repository;

import com.example.be_phela.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);
    List<Notification> findByRecipientIdAndIsReadOrderByCreatedAtDesc(String recipientId, boolean isRead);
    
    // For admin notifications where recipientId might be null (broadcast) or "ADMIN"
    List<Notification> findByRecipientIdIsNullOrderByCreatedAtDesc();
    List<Notification> findByRecipientIdIsNullAndIsReadOrderByCreatedAtDesc(boolean isRead);
}
