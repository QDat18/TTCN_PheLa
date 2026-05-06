package com.example.be_phela.controller;

import com.example.be_phela.model.Notification;
import com.example.be_phela.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnread(@RequestParam(required = false) String recipientId) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(recipientId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Notification>> getAll(@RequestParam(required = false) String recipientId) {
        return ResponseEntity.ok(notificationService.getAllNotifications(recipientId));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestParam(required = false) String recipientId) {
        notificationService.markAllAsRead(recipientId);
        return ResponseEntity.ok().build();
    }
}
