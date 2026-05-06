package com.example.be_phela.service;

import com.example.be_phela.model.Application;
import com.example.be_phela.model.JobPosting;
import com.example.be_phela.repository.ApplicationRepository;
import dev.langchain4j.data.message.UserMessage;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class AiScreeningService {

    private static final Logger log = LoggerFactory.getLogger(AiScreeningService.class);

    private final AiAssistant aiAssistant;
    private final ApplicationRepository applicationRepository;

    @Value("${app.cv.upload-dir:uploads/cv}")
    private String cvUploadDir;

    public AiScreeningService(AiAssistant aiAssistant, ApplicationRepository applicationRepository) {
        this.aiAssistant = aiAssistant;
        this.applicationRepository = applicationRepository;
    }

    @Async("aiScreeningExecutor")
    @Transactional
    public void screenApplication(String applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        JobPosting jobPosting = application.getJobPosting();
        
        String cvText = extractTextFromCV(application.getCvUrl());
        
        String prompt = String.format(
            "Bạn là một chuyên gia tuyển dụng AI cấp cao. Hãy đánh giá CV của ứng viên cho vị trí: %s\n\n" +
            "Mô tả công việc (JD):\n%s\n\n" +
            "Yêu cầu công việc:\n%s\n\n" +
            "Nội dung CV của ứng viên:\n%s\n\n" +
            "Hãy đánh giá dựa trên 3 tiêu chí:\n" +
            "1. Mức độ khớp kỹ năng (Skill Match): Các từ khóa kỹ năng yêu cầu.\n" +
            "2. Kinh nghiệm (Experience): Số năm và sự phù hợp của kinh nghiệm.\n" +
            "3. Thái độ/Văn hóa (Attitude/Culture): Trình bày, ngôn ngữ, sự chuyên nghiệp.\n\n" +
            "YÊU CẦU QUAN TRỌNG: Chỉ trả về kết quả dưới định dạng JSON duy nhất, không thêm văn bản khác. JSON phải có cấu trúc:\n" +
            "{\n" +
            "  \"score\": (số nguyên từ 0-100),\n" +
            "  \"strengths\": [\"điểm mạnh 1\", \"điểm mạnh 2\"],\n" +
            "  \"weaknesses\": [\"điểm yếu 1\", \"điểm yếu 2\"],\n" +
            "  \"recommendation\": \"(NÊN PHỎNG VẤN / CÂN NHẮC / KHÔNG PHÙ HỢP)\",\n" +
            "  \"detailed_feedback\": \"(tóm tắt đánh giá)\"\n" +
            "}",
            jobPosting.getTitle(),
            jobPosting.getDescription(),
            jobPosting.getRequirements(),
            cvText
        );

        UserMessage userMessage = UserMessage.from(prompt);
        String aiResponse = "";
        try {
            aiResponse = aiAssistant.chat("screening-" + applicationId, userMessage);
            // Clean AI response if it contains markdown code blocks
            aiResponse = aiResponse.replaceAll("```json", "").replaceAll("```", "").trim();
            
            // Extract score from JSON string (simple regex for basic safety)
            // Ideally use Jackson here, but for now we store the whole JSON
            application.setAiEvaluation(aiResponse);
            
            // Extract score using regex for better robustness
            try {
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"score\"\\s*:\\s*(\\d+)");
                java.util.regex.Matcher matcher = pattern.matcher(aiResponse);
                if (matcher.find()) {
                    application.setAiScore(Integer.parseInt(matcher.group(1)));
                } else if (aiResponse.contains("\"score\":")) {
                    // Fallback to old method just in case
                    String scorePart = aiResponse.split("\"score\":")[1].split("[,}]")[0].trim();
                    application.setAiScore(Integer.parseInt(scorePart.replaceAll("[^0-9]", "")));
                }
            } catch (Exception e) {
                log.warn("Could not parse score from AI response: {}", aiResponse);
            }
            
            applicationRepository.save(application);
            log.info("AI Screening completed successfully for application {}", applicationId);
        } catch (Exception e) {
            log.error("AI Screening error for application {}", applicationId, e);
        }
    }

    private String extractTextFromCV(String cvUrl) {
        if (cvUrl == null || cvUrl.isEmpty()) {
            log.warn("CV URL is null or empty");
            return "File CV không tồn tại.";
        }
        
        boolean isUrl = cvUrl.startsWith("http");

        if (cvUrl.toLowerCase().endsWith(".pdf")) {
            try {
                if (isUrl) {
                    // Load from URL (Cloudinary)
                    java.net.URL url = java.net.URI.create(cvUrl).toURL();
                    try (java.io.InputStream is = url.openStream();
                         PDDocument document = Loader.loadPDF(is.readAllBytes())) {
                        PDFTextStripper stripper = new PDFTextStripper();
                        return stripper.getText(document);
                    }
                } else {
                    // Load from local file
                    String fileName = cvUrl.substring(cvUrl.lastIndexOf("/") + 1);
                    Path path = Paths.get(cvUploadDir).toAbsolutePath().resolve(fileName);
                    File file = path.toFile();

                    if (!file.exists()) {
                        log.error("CV file not found at path: {}", path);
                        return "File CV không tồn tại trên hệ thống.";
                    }

                    try (PDDocument document = Loader.loadPDF(file)) {
                        PDFTextStripper stripper = new PDFTextStripper();
                        return stripper.getText(document);
                    }
                }
            } catch (IOException e) {
                log.error("Error extracting text from PDF: {}", cvUrl, e);
                return "Không thể đọc nội dung file PDF.";
            }
        } else {
            // Support for DOC/DOCX could be added with Apache POI
            return "Định dạng file không được AI hỗ trợ đọc trực tiếp (chỉ hỗ trợ PDF).";
        }
    }
}
