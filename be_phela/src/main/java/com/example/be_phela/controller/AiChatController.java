package com.example.be_phela.controller;

import dev.langchain4j.data.message.AudioContent;
import dev.langchain4j.data.message.Content;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import com.example.be_phela.service.AiAssistant;
import com.example.be_phela.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AiChatController.class);
    private final AiAssistant aiAssistant;

    public AiChatController(AiAssistant aiAssistant) {
        this.aiAssistant = aiAssistant;
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<String>> chat(
            @RequestParam("message") String message,
            @RequestParam(value = "customerId", required = false) String customerId,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "audio", required = false) MultipartFile audio) {

        String sessionId = (customerId != null && !customerId.isEmpty())
                ? customerId
                : "anonymous-" + UUID.randomUUID();

        log.info("Received AI chat request from {}: {}", sessionId, message);

        try {
            // 1. Tạo danh sách các Content (Khối nội dung đa phương thức)
            List<Content> contents = new ArrayList<>();
            
            // Thêm Text
            contents.add(TextContent.from(message));

            // Thêm Image (đúng chuẩn LangChain4j)
            if (image != null && !image.isEmpty()) {
                String base64Image = Base64.getEncoder().encodeToString(image.getBytes());
                contents.add(ImageContent.from(base64Image, image.getContentType()));
                log.info("Appended image content to prompt (MIME: {})", image.getContentType());
            }

            // Thêm Audio (đúng chuẩn LangChain4j)
            if (audio != null && !audio.isEmpty()) {
                String base64Audio = Base64.getEncoder().encodeToString(audio.getBytes());
                contents.add(AudioContent.from(base64Audio, audio.getContentType()));
                log.info("Appended audio content to prompt (MIME: {})", audio.getContentType());
            }

            // 2. Đóng gói toàn bộ List<Content> vào một đối tượng UserMessage
            UserMessage userMessage = UserMessage.from(contents);

            // 3. Truyền UserMessage vào AiAssistant (Với cơ chế Retry cho lỗi 503/High Demand)
            String responseText = "";
            int maxRetries = 3;
            int retryCount = 0;
            while (retryCount < maxRetries) {
                try {
                    responseText = aiAssistant.chat(sessionId, userMessage);
                    break;
                } catch (Exception e) {
                    retryCount++;
                    String errorMsg = e.getMessage() != null ? e.getMessage() : "";
                    if (retryCount >= maxRetries || (!errorMsg.contains("503") && !errorMsg.contains("UNAVAILABLE") && !errorMsg.contains("demand"))) {
                        throw e;
                    }
                    log.warn("AI Gemini đang bận (503/High Demand), đang thử lại lần {}... (Lỗi: {})", retryCount, errorMsg);
                    try {
                        Thread.sleep(1500L * retryCount); // Backoff: 1.5s, 3s
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Retry interrupted", ie);
                    }
                }
            }
            return ResponseEntity.ok(ApiResponse.success(responseText));

        } catch (Exception e) {
            log.error("AI Chat Error for session {}", sessionId, e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("AI đang bận một chút, bạn chờ mình giây lát nhé!"));
        }
    }
}