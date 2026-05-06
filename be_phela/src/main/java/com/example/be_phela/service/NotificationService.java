package com.example.be_phela.service;

import com.example.be_phela.model.Notification;
import com.example.be_phela.model.enums.NotificationType;
import com.example.be_phela.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository, SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public Notification createNotification(String senderId, String senderName, String recipientId, String message, NotificationType type) {
        Notification notification = Notification.builder()
                .senderId(senderId)
                .senderName(senderName)
                .recipientId(recipientId)
                .message(message)
                .type(type)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Broadcast to specific recipient or general admin topic
        String topic = (recipientId != null) ? "/topic/notifications/" + recipientId : "/topic/admin/notifications";
        messagingTemplate.convertAndSend(topic, saved);

        return saved;
    }

    public List<Notification> getUnreadNotifications(String recipientId) {
        if (recipientId == null) {
            return notificationRepository.findByRecipientIdIsNullAndIsReadOrderByCreatedAtDesc(false);
        }
        return notificationRepository.findByRecipientIdAndIsReadOrderByCreatedAtDesc(recipientId, false);
    }

    public List<Notification> getAllNotifications(String recipientId) {
        if (recipientId == null) {
            return notificationRepository.findByRecipientIdIsNullOrderByCreatedAtDesc();
        }
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
    }

    @Transactional
    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(String recipientId) {
        List<Notification> unread = getUnreadNotifications(recipientId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}
