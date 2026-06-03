package com.example.be_phela.service;

import com.example.be_phela.model.Conversation;
import com.example.be_phela.model.ConversationMessage;
import com.example.be_phela.model.enums.ConversationStatus;
import com.example.be_phela.model.enums.ConversationSource;
import com.example.be_phela.model.enums.SenderType;
import com.example.be_phela.model.enums.MessageType;
import com.example.be_phela.repository.ConversationRepository;
import com.example.be_phela.repository.ConversationMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationMessageRepository messageRepository;

    public ConversationService(ConversationRepository conversationRepository,
                               ConversationMessageRepository messageRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    @Transactional
    public Conversation getOrCreateActiveConversation(String customerId) {
        return conversationRepository.findByCustomerIdAndStatusNot(customerId, ConversationStatus.RESOLVED)
                .orElseGet(() -> {
                    Conversation conv = new Conversation();
                    conv.setCustomerId(customerId);
                    conv.setStatus(ConversationStatus.AI_ACTIVE);
                    conv.setSource(ConversationSource.AI);
                    conv.setLastMessageAt(LocalDateTime.now());
                    return conversationRepository.save(conv);
                });
    }

    public Optional<Conversation> getConversationById(String conversationId) {
        return conversationRepository.findById(conversationId);
    }

    public List<ConversationMessage> getMessages(String conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    @Transactional
    public ConversationMessage saveMessage(String conversationId, String senderId, String senderName,
                                           SenderType senderType, String content, MessageType messageType,
                                           String imageUrl, String metadataJson) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        ConversationMessage msg = new ConversationMessage();
        msg.setConversationId(conversationId);
        msg.setSenderId(senderId);
        msg.setSenderName(senderName);
        msg.setSenderType(senderType);
        msg.setContent(content);
        msg.setMessageType(messageType);
        msg.setImageUrl(imageUrl);
        msg.setMetadataJson(metadataJson);
        ConversationMessage savedMsg = messageRepository.save(msg);

        conv.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conv);

        return savedMsg;
    }

    @Transactional
    public Conversation requestHandoff(String conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));
        conv.setStatus(ConversationStatus.HANDOFF_REQUESTED);
        if (conv.getSource() == ConversationSource.AI) {
            conv.setSource(ConversationSource.MIXED);
        }
        return conversationRepository.save(conv);
    }

    @Transactional
    public Conversation assignAdmin(String conversationId, String adminId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));
        conv.setAssignedAdminId(adminId);
        conv.setStatus(ConversationStatus.HUMAN_ACTIVE);
        conv.setSource(ConversationSource.MIXED);
        return conversationRepository.save(conv);
    }

    @Transactional
    public Conversation resolveConversation(String conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));
        conv.setStatus(ConversationStatus.RESOLVED);
        return conversationRepository.save(conv);
    }

    public List<Conversation> getAdminConversations() {
        return conversationRepository.findAllByOrderByLastMessageAtDesc();
    }
    
    public List<Conversation> getConversationsByStatus(ConversationStatus status) {
        return conversationRepository.findByStatusOrderByLastMessageAtDesc(status);
    }
}
