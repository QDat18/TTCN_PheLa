package com.example.be_phela.controller;

import com.example.be_phela.dto.response.ConversationResponseDTO;
import com.example.be_phela.model.Admin;
import com.example.be_phela.model.Conversation;
import com.example.be_phela.model.ConversationMessage;
import com.example.be_phela.model.Customer;
import com.example.be_phela.model.enums.ConversationStatus;
import com.example.be_phela.model.enums.ConversationSource;
import com.example.be_phela.model.enums.SenderType;
import com.example.be_phela.model.enums.MessageType;
import com.example.be_phela.repository.AdminRepository;
import com.example.be_phela.repository.CustomerRepository;
import com.example.be_phela.service.ConversationService;
import com.example.be_phela.service.AiOrchestratorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@RestController
public class ConversationController {

    private static final Logger log = LoggerFactory.getLogger(ConversationController.class);

    private final ConversationService conversationService;
    private final AiOrchestratorService aiOrchestratorService;
    private final CustomerRepository customerRepository;
    private final AdminRepository adminRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ConversationController(ConversationService conversationService,
                                  AiOrchestratorService aiOrchestratorService,
                                  CustomerRepository customerRepository,
                                  AdminRepository adminRepository,
                                  SimpMessagingTemplate messagingTemplate) {
        this.conversationService = conversationService;
        this.aiOrchestratorService = aiOrchestratorService;
        this.customerRepository = customerRepository;
        this.adminRepository = adminRepository;
        this.messagingTemplate = messagingTemplate;
    }

    private ConversationResponseDTO mapToDTO(Conversation conv) {
        ConversationResponseDTO dto = new ConversationResponseDTO();
        dto.setId(conv.getId());
        dto.setCustomerId(conv.getCustomerId());
        dto.setStatus(conv.getStatus());
        dto.setSource(conv.getSource());
        dto.setAssignedAdminId(conv.getAssignedAdminId());
        dto.setCreatedAt(conv.getCreatedAt());
        dto.setUpdatedAt(conv.getUpdatedAt());

        customerRepository.findById(conv.getCustomerId()).ifPresent(c -> {
            dto.setCustomerName(c.getFullname() != null ? c.getFullname() : c.getUsername());
            dto.setCustomerEmail(c.getEmail());
            dto.setCustomerPhone(c.getPhone());
        });

        if (conv.getAssignedAdminId() != null) {
            adminRepository.findById(conv.getAssignedAdminId()).ifPresent(a -> {
                dto.setAssignedAdminName(a.getFullname());
            });
        }

        // Get last message info
        List<ConversationMessage> msgs = conversationService.getMessages(conv.getId());
        if (!msgs.isEmpty()) {
            ConversationMessage lastMsg = msgs.get(msgs.size() - 1);
            dto.setLastMessage(lastMsg.getContent() != null ? lastMsg.getContent() : "[Hình ảnh]");
            dto.setLastMessageTimestamp(lastMsg.getCreatedAt());
        }

        return dto;
    }

    // Customer API: Get my current active conversation
    @GetMapping("/api/conversations/my")
    public ResponseEntity<?> getMyConversation(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        String customerId = authentication.getName();
        Conversation conv = conversationService.getOrCreateActiveConversation(customerId);
        return ResponseEntity.ok(mapToDTO(conv));
    }

    // Customer API: Create/Get active conversation
    @PostMapping("/api/conversations")
    public ResponseEntity<?> createConversation(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        String customerId = authentication.getName();
        Conversation conv = conversationService.getOrCreateActiveConversation(customerId);
        return ResponseEntity.ok(mapToDTO(conv));
    }

    // Get historical messages
    @GetMapping("/api/conversations/{id}/messages")
    public ResponseEntity<?> getMessages(@PathVariable String id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        
        Optional<Conversation> convOpt = conversationService.getConversationById(id);
        if (convOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Conversation not found");
        }
        Conversation conv = convOpt.get();

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
                               a.getAuthority().equals("ROLE_STAFF"));

        if (!isAdmin && !conv.getCustomerId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        List<ConversationMessage> messages = conversationService.getMessages(id);
        return ResponseEntity.ok(messages);
    }

    // Customer API: Trigger manual human handoff
    @PostMapping("/api/conversations/{id}/handoff")
    public ResponseEntity<?> triggerHandoff(@PathVariable String id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        Optional<Conversation> convOpt = conversationService.getConversationById(id);
        if (convOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Conversation not found");
        }
        Conversation conv = convOpt.get();

        if (!conv.getCustomerId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        Conversation updated = conversationService.requestHandoff(id);

        // System message notify
        ConversationMessage systemMsg = conversationService.saveMessage(
                id,
                "SYSTEM",
                "Hệ Thống",
                SenderType.SYSTEM,
                "Yêu cầu hỗ trợ trực tiếp từ nhân viên đã được gửi đi. Vui lòng đợi trong giây lát...",
                MessageType.SYSTEM,
                null,
                null
        );

        messagingTemplate.convertAndSend("/topic/conversations/" + id, systemMsg);
        
        // Notify admin global topic if needed
        messagingTemplate.convertAndSend("/topic/admin/conversations/update", mapToDTO(updated));

        return ResponseEntity.ok(mapToDTO(updated));
    }

    // Admin API: List conversations
    @GetMapping("/api/admin/conversations")
    public ResponseEntity<?> getAdminConversations(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
                               a.getAuthority().equals("ROLE_STAFF"));

        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        List<ConversationResponseDTO> list = conversationService.getAdminConversations().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(list);
    }

    // Admin API: Assign conversation to me
    @PostMapping("/api/admin/conversations/{id}/assign")
    public ResponseEntity<?> assignConversation(@PathVariable String id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
                               a.getAuthority().equals("ROLE_STAFF"));

        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        String username = authentication.getName();
        Admin admin = adminRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found: " + username));

        Conversation updated = conversationService.assignAdmin(id, admin.getId());

        // System message notify
        ConversationMessage systemMsg = conversationService.saveMessage(
                id,
                "SYSTEM",
                "Hệ Thống",
                SenderType.SYSTEM,
                "Nhân viên " + admin.getFullname() + " đã nhận cuộc trò chuyện này.",
                MessageType.SYSTEM,
                null,
                null
        );

        messagingTemplate.convertAndSend("/topic/conversations/" + id, systemMsg);
        messagingTemplate.convertAndSend("/topic/admin/conversations/update", mapToDTO(updated));

        return ResponseEntity.ok(mapToDTO(updated));
    }

    // Admin API: Resolve conversation
    @PostMapping("/api/admin/conversations/{id}/resolve")
    public ResponseEntity<?> resolveConversation(@PathVariable String id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
                               a.getAuthority().equals("ROLE_STAFF"));

        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        Conversation updated = conversationService.resolveConversation(id);

        // System message notify
        ConversationMessage systemMsg = conversationService.saveMessage(
                id,
                "SYSTEM",
                "Hệ Thống",
                SenderType.SYSTEM,
                "Cuộc hội thoại đã kết thúc. Cảm ơn bạn đã trò chuyện cùng Phê La!",
                MessageType.SYSTEM,
                null,
                null
        );

        messagingTemplate.convertAndSend("/topic/conversations/" + id, systemMsg);
        messagingTemplate.convertAndSend("/topic/admin/conversations/update", mapToDTO(updated));

        return ResponseEntity.ok(mapToDTO(updated));
    }

    // WebSocket: receive client message and process (Customer or Admin)
    @MessageMapping("/conversations/{conversationId}/send")
    public void receiveMessage(@DestinationVariable String conversationId,
                               @Payload ConversationMessage messagePayload,
                               Principal principal) {
        if (principal == null) {
            throw new org.springframework.security.authentication.BadCredentialsException("Unauthenticated");
        }

        Authentication auth = (Authentication) principal;
        
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
                               a.getAuthority().equals("ROLE_STAFF"));

        Optional<Conversation> convOpt = conversationService.getConversationById(conversationId);
        if (convOpt.isEmpty()) {
            log.error("WebSocket message sent to non-existent conversation: {}", conversationId);
            return;
        }
        Conversation conv = convOpt.get();

        String senderId;
        String senderName;
        SenderType senderType;

        if (isAdmin) {
            String username = auth.getName();
            Admin admin = adminRepository.findByUsername(username)
                    .orElseThrow(() -> new IllegalArgumentException("Admin not found: " + username));
            senderId = admin.getId();
            senderName = admin.getFullname();
            senderType = SenderType.ADMIN;
        } else {
            String customerId = auth.getName();
            // Validate client-tenant security check
            if (!conv.getCustomerId().equals(customerId)) {
                log.warn("Customer {} tried to send message to conversation of {}", customerId, conv.getCustomerId());
                return;
            }
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));
            senderId = customer.getCustomerId();
            senderName = customer.getFullname() != null ? customer.getFullname() : customer.getUsername();
            senderType = SenderType.CUSTOMER;
        }

        // Save customer or admin message
        ConversationMessage savedMsg = conversationService.saveMessage(
                conversationId,
                senderId,
                senderName,
                senderType,
                messagePayload.getContent(),
                messagePayload.getMessageType() != null ? messagePayload.getMessageType() : MessageType.TEXT,
                messagePayload.getImageUrl(),
                messagePayload.getMetadataJson()
        );

        // Map tempId back to allow client-side de-duplication
        savedMsg.setTempId(messagePayload.getTempId());

        // Broadcast to clients listening to this conversation
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, savedMsg);
        
        // Broadcast updates to Admin lists
        messagingTemplate.convertAndSend("/topic/admin/conversations/update", mapToDTO(conv));

        // If message is from customer and status is AI_ACTIVE, trigger AI pipeline in background thread
        if (senderType == SenderType.CUSTOMER && conv.getStatus() == ConversationStatus.AI_ACTIVE) {
            // Trigger AI service asynchronously to not block the WebSocket handler
            CompletableFuture.runAsync(() -> {
                try {
                    aiOrchestratorService.processAiResponse(conversationId, conv.getCustomerId(), savedMsg.getContent());
                } catch (Exception e) {
                    log.error("Error processing AI response: ", e);
                }
            });
        }
    }
}
