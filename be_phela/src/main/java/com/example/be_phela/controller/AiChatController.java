package com.example.be_phela.controller;

import dev.langchain4j.data.message.Content;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.audio.AudioTranscriptionModel;
import com.example.be_phela.service.AiAssistant;
import com.example.be_phela.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AiChatController.class);
    private final AiAssistant aiAssistant;
    private final AudioTranscriptionModel transcriptionModel;
    
    private final java.util.Map<String, List<Long>> requestHistory = new java.util.concurrent.ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final long ONE_MINUTE_MS = 60000L;

    public AiChatController(AiAssistant aiAssistant, AudioTranscriptionModel transcriptionModel) {
        this.aiAssistant = aiAssistant;
        this.transcriptionModel = transcriptionModel;
    }

    private boolean isRateLimited(String userId) {
        long now = System.currentTimeMillis();
        List<Long> timestamps = requestHistory.computeIfAbsent(userId, k -> new java.util.concurrent.CopyOnWriteArrayList<>());
        timestamps.removeIf(time -> now - time > ONE_MINUTE_MS);
        if (timestamps.size() >= MAX_REQUESTS_PER_MINUTE) {
            return true;
        }
        timestamps.add(now);
        return false;
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<String>> chat(
            @RequestParam("message") String message,
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "audio", required = false) MultipartFile audio) {

        if (jwt == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Bạn cần đăng nhập để chat với AI nhé!"));
        }

        String sessionId = jwt.getSubject();

        if (isRateLimited(sessionId)) {
            return ResponseEntity.status(429).body(ApiResponse.error("Bạn đang thao tác quá nhanh. Vui lòng thử lại sau ít phút!"));
        }

        if (image != null && !image.isEmpty() && image.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.status(400).body(ApiResponse.error("Kích thước ảnh tối đa là 5MB!"));
        }

        if (audio != null && !audio.isEmpty() && audio.getSize() > 10 * 1024 * 1024) {
            return ResponseEntity.status(400).body(ApiResponse.error("Kích thước audio tối đa là 10MB!"));
        }

        log.info("Received AI chat request from authenticated customer {}: {}", sessionId, message);

        try {
            List<Content> contents = new ArrayList<>();
            
            // Xử lý Text
            contents.add(TextContent.from(message));

            // Xử lý Image (Groq Llama 3.2 Vision hỗ trợ tốt)
            if (image != null && !image.isEmpty()) {
                String base64Image = Base64.getEncoder().encodeToString(image.getBytes());
                contents.add(ImageContent.from(base64Image, image.getContentType()));
                log.info("Appended image content to prompt (MIME: {})", image.getContentType());
            }

            // Xử lý Audio (Chuyển đổi Audio sang Text bằng Groq Whisper)
// Xử lý Audio (Chuyển đổi Audio sang Text bằng Groq Whisper)
            if (audio != null && !audio.isEmpty()) {
                log.info("Transcribing audio content using Groq Whisper...");
                java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("ai-audio-", audio.getOriginalFilename());
                try {
                    audio.transferTo(tempFile);
                    
                    // --- BẮT ĐẦU PHẦN SỬA ---
                    // 1. Tạo đối tượng Audio của LangChain4j từ file tạm
                    dev.langchain4j.data.audio.Audio audioData = dev.langchain4j.data.audio.Audio.builder()
                            .url(tempFile.toUri())
                            .build();

                    // 2. Truyền đối tượng Audio vào Request
                    dev.langchain4j.model.audio.AudioTranscriptionRequest transcriptionRequest = dev.langchain4j.model.audio.AudioTranscriptionRequest.builder()
                            .audio(audioData)
                            .build();
                            
                    String transcript = transcriptionModel.transcribe(transcriptionRequest).text();
                    // --- KẾT THÚC PHẦN SỬA ---

                    contents.add(TextContent.from("[Người dùng nói qua audio: " + transcript + "]"));
                    log.info("Audio transcribed successfully: {}", transcript);
                } finally {
                    java.nio.file.Files.deleteIfExists(tempFile);
                }
            }
            // Đóng gói vào UserMessage
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
                    log.warn("AI Groq đang bận (503/High Demand), đang thử lại lần {}... (Lỗi: {})", retryCount, errorMsg);
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