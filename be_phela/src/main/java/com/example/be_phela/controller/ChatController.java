package com.example.be_phela.controller;

import com.example.be_phela.dto.response.ConversationDTO;
import com.example.be_phela.model.Admin;
import com.example.be_phela.model.ChatMessage;
import com.example.be_phela.model.Customer;
import com.example.be_phela.repository.AdminRepository;
import com.example.be_phela.repository.ChatMessageRepository;
import com.example.be_phela.repository.CustomerRepository;
import com.example.be_phela.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final CustomerRepository customerRepository;
    private final AdminRepository adminRepository;
    private final FileStorageService fileStorageService;

    @PostMapping("/api/chat/uploadImage")
    public ResponseEntity<String> uploadChatImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = fileStorageService.storeChatImage(file);
            if (imageUrl != null) {
                return ResponseEntity.ok(imageUrl);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Failed to upload image.");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error uploading image: " + e.getMessage());
        }
    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage, Principal principal) {
        // Lấy thông tin người dùng đang gửi tin nhắn từ context bảo mật
        UserDetails user = (UserDetails) principal;

        // Điền thông tin người gửi một cách an toàn từ server
        if (user instanceof Customer) {
            Customer customer = (Customer) user;
            chatMessage.setSenderId(customer.getCustomerId());
            chatMessage.setSenderName(customer.getUsername());
        } else if (user instanceof Admin) {
            Admin admin = (Admin) user;
            chatMessage.setSenderId("ADMIN"); // Dùng một ID chung cho admin hoặc admin.getId()
            chatMessage.setSenderName(admin.getFullname());
        }

        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessageRepository.save(chatMessage);

        // 1. Xác định ID của khách hàng trong cuộc hội thoại này
        String customerIdInConversation;
        if (user instanceof Customer) {
            // Nếu người gửi là khách hàng, ID chính là của họ
            customerIdInConversation = chatMessage.getSenderId();
        } else {
            // Nếu người gửi là admin, ID là của người nhận (chính là khách hàng)
            customerIdInConversation = chatMessage.getRecipientId();
        }

        // 2. Tạo ra "phòng chat" (topic) riêng cho cuộc hội thoại này
        String conversationTopic = "/topic/chat/" + customerIdInConversation;

        // 3. Gửi tin nhắn vào phòng chat đó
        // Cả khách hàng và admin đang lắng nghe topic này sẽ nhận được tin nhắn
        messagingTemplate.convertAndSend(conversationTopic, chatMessage);
    }

    /**
     * Tạo một REST endpoint để tải lịch sử chat.
     */
    @GetMapping("/api/chat/history/{customerId}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable String customerId) {
        List<ChatMessage> history = chatMessageRepository.findConversationWithCustomer(customerId);
        return ResponseEntity.ok(history);
    }

    /**
     * Lấy danh sách các cuộc hội thoại cho admin.
     */
    @GetMapping("/api/chat/conversations")
    public ResponseEntity<List<ConversationDTO>> getConversations() {
        List<String> customerIds = chatMessageRepository.findDistinctCustomerIds();
        List<ConversationDTO> conversations = new ArrayList<>();

        for (String customerId : customerIds) {
            customerRepository.findById(customerId).ifPresent(customer -> {
                ChatMessage lastMessage = chatMessageRepository.findTopBySenderIdOrRecipientIdOrderByTimestampDesc(customerId, customerId);
                conversations.add(new ConversationDTO(
                        customer.getCustomerId(),
                        customer.getUsername(),
                        lastMessage != null ? lastMessage.getContent() : "No messages yet",
                        lastMessage != null ? lastMessage.getTimestamp() : null
                ));
            });
        }
        return ResponseEntity.ok(conversations);
    }
}