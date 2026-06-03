package com.example.be_phela.service;

import com.example.be_phela.model.Conversation;
import com.example.be_phela.model.ConversationMessage;
import com.example.be_phela.model.enums.ConversationStatus;
import com.example.be_phela.model.enums.SenderType;
import com.example.be_phela.model.enums.MessageType;
import dev.langchain4j.data.message.UserMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class AiOrchestratorService {

    private static final Logger log = LoggerFactory.getLogger(AiOrchestratorService.class);

    private final SystemSettingService systemSettingService;
    private final ConversationService conversationService;
    private final AiAssistant aiAssistant;
    private final SimpMessagingTemplate messagingTemplate;

    // Quota tracking: customerId -> (Date -> Count)
    private final ConcurrentHashMap<String, ConcurrentHashMap<LocalDate, Integer>> customerDailyQuota = new ConcurrentHashMap<>();
    
    // Circuit breaker state
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private final AtomicReference<LocalDateTime> cooldownUntil = new AtomicReference<>(null);

    public AiOrchestratorService(SystemSettingService systemSettingService,
                                 ConversationService conversationService,
                                 AiAssistant aiAssistant,
                                 SimpMessagingTemplate messagingTemplate) {
        this.systemSettingService = systemSettingService;
        this.conversationService = conversationService;
        this.aiAssistant = aiAssistant;
        this.messagingTemplate = messagingTemplate;
    }

    public void processAiResponse(String conversationId, String customerId, String customerMessageContent) {
        // 1. Kiểm tra cấu hình AI bật/tắt
        boolean aiEnabled = systemSettingService.getBoolean("ai.enabled", true);
        if (!aiEnabled) {
            log.info("AI is disabled by setting. Triggering human handoff for conversation: {}", conversationId);
            triggerHandoff(conversationId, "Hệ thống AI hiện đang tắt. Tin nhắn của bạn đã được chuyển tới nhân viên hỗ trợ.");
            return;
        }

        // 2. Kiểm tra Circuit Breaker (Lỗi liên tiếp)
        LocalDateTime cooldownTime = cooldownUntil.get();
        if (cooldownTime != null) {
            if (LocalDateTime.now().isBefore(cooldownTime)) {
                log.warn("AI in cooldown until {}. Triggering handoff for conversation: {}", cooldownTime, conversationId);
                triggerHandoff(conversationId, "Hệ thống AI hiện đang bảo trì tạm thời. Đang chuyển kết nối tới nhân viên hỗ trợ...");
                return;
            } else {
                // Cooldown expired, reset
                cooldownUntil.set(null);
                consecutiveFailures.set(0);
            }
        }

        // 3. Kiểm tra Quota trong ngày
        LocalDate today = LocalDate.now();
        int maxRequestsPerDay = systemSettingService.getInt("ai.max_requests_per_day", 100);
        customerDailyQuota.putIfAbsent(customerId, new ConcurrentHashMap<>());
        ConcurrentHashMap<LocalDate, Integer> dailyMap = customerDailyQuota.get(customerId);
        int currentCount = dailyMap.getOrDefault(today, 0);

        if (currentCount >= maxRequestsPerDay) {
            log.warn("Customer {} exceeded AI daily quota ({} requests). Triggering handoff.", customerId, maxRequestsPerDay);
            triggerHandoff(conversationId, "Bạn đã dùng hết lượt câu hỏi AI hôm nay. Đang chuyển kết nối tới nhân viên hỗ trợ...");
            return;
        }

        // 4. Phân loại Intent (Keywords liên quan tới thanh toán / khiếu nại)
        boolean handoffOnPayment = systemSettingService.getBoolean("ai.handoff_on_payment", true);
        boolean handoffOnComplaint = systemSettingService.getBoolean("ai.handoff_on_complaint", true);
        
        String lowerMsg = customerMessageContent.toLowerCase();
        boolean isPaymentRelated = lowerMsg.contains("thanh toán") || lowerMsg.contains("chuyển khoản") || 
                                   lowerMsg.contains("banking") || lowerMsg.contains("payos") || 
                                   lowerMsg.contains("sepay") || lowerMsg.contains("tpbank") || 
                                   lowerMsg.contains("hoàn tiền") || lowerMsg.contains("refund") || 
                                   lowerMsg.contains("hủy đơn");

        boolean isComplaintRelated = lowerMsg.contains("khiếu nại") || lowerMsg.contains("phàn nàn") || 
                                     lowerMsg.contains("đơn lỗi") || lowerMsg.contains("thiếu đồ") || 
                                     lowerMsg.contains("hỏng") || lowerMsg.contains("dở") || 
                                     lowerMsg.contains("thái độ");

        if ((handoffOnPayment && isPaymentRelated) || (handoffOnComplaint && isComplaintRelated)) {
            log.info("Message matched payment/complaint handoff triggers. Triggering handoff.");
            triggerHandoff(conversationId, "Câu hỏi liên quan đến thanh toán hoặc khiếu nại dịch vụ. Tin nhắn của bạn đã được chuyển tới nhân viên hỗ trợ chăm sóc khách hàng.");
            return;
        }

        // Tăng số lượng requests đã dùng
        dailyMap.put(today, currentCount + 1);

        // 5. Gọi AI Assistant với Timeout bảo vệ
        int timeoutSeconds = systemSettingService.getInt("ai.timeout_seconds", 8);
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Future<String> future = executor.submit(() -> {
            UserMessage userMsg = UserMessage.from(customerMessageContent);
            return aiAssistant.chat(customerId, userMsg);
        });

        try {
            String aiResponseText = future.get(timeoutSeconds, TimeUnit.SECONDS);
            
            // Cuộc gọi thành công -> reset consecutive failures
            consecutiveFailures.set(0);

            // 6. Kiểm tra xem AI phản hồi có chứa [HANDOFF] không
            if (aiResponseText.contains("[HANDOFF]")) {
                log.info("AI response contained [HANDOFF] flag. Handoff triggered.");
                String cleanedResponse = aiResponseText.replace("[HANDOFF]", "").trim();
                if (cleanedResponse.isEmpty()) {
                    cleanedResponse = "Đang kết nối tới nhân viên hỗ trợ...";
                }
                triggerHandoff(conversationId, cleanedResponse);
                return;
            }

            // Ghi nhận phản hồi AI vào DB và gửi qua WebSocket
            ConversationMessage savedMsg = conversationService.saveMessage(
                    conversationId,
                    "AI",
                    "Trạm Trưởng Phê La",
                    SenderType.AI,
                    aiResponseText,
                    MessageType.TEXT,
                    null,
                    null
            );

            broadcastMessage(conversationId, savedMsg);

        } catch (TimeoutException e) {
            log.error("AI response timed out after {} seconds.", timeoutSeconds);
            future.cancel(true);
            handleFailure(conversationId, "Đã quá thời gian chờ phản hồi từ AI. Đang chuyển kết nối tới nhân viên hỗ trợ...");
        } catch (Exception e) {
            log.error("AI invocation failed: {}", e.getMessage());
            handleFailure(conversationId, "Hệ thống AI gặp sự cố. Đang chuyển kết nối tới nhân viên hỗ trợ...");
        } finally {
            executor.shutdown();
        }
    }

    private void handleFailure(String conversationId, String fallbackMessage) {
        int failureCount = consecutiveFailures.incrementAndGet();
        int threshold = systemSettingService.getInt("ai.failure_threshold", 3);
        if (failureCount >= threshold) {
            int cooldownMin = systemSettingService.getInt("ai.cooldown_minutes", 10);
            cooldownUntil.set(LocalDateTime.now().plusMinutes(cooldownMin));
            log.error("Consecutive AI failures ({}) reached threshold ({}). AI cooldown activated for {} minutes.",
                    failureCount, threshold, cooldownMin);
        }
        triggerHandoff(conversationId, fallbackMessage);
    }

    private void triggerHandoff(String conversationId, String systemNotice) {
        conversationService.requestHandoff(conversationId);
        
        // Tạo tin nhắn hệ thống thông báo chuyển nhân viên
        ConversationMessage savedMsg = conversationService.saveMessage(
                conversationId,
                "SYSTEM",
                "Hệ Thống",
                SenderType.SYSTEM,
                systemNotice,
                MessageType.SYSTEM,
                null,
                null
        );

        broadcastMessage(conversationId, savedMsg);
    }

    private void broadcastMessage(String conversationId, ConversationMessage message) {
        String topic = "/topic/conversations/" + conversationId;
        messagingTemplate.convertAndSend(topic, message);
    }
}
