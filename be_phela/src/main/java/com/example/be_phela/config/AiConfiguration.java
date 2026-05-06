package com.example.be_phela.config;

import com.example.be_phela.service.AiAssistant;
import com.example.be_phela.service.AiTools;
import dev.langchain4j.memory.chat.ChatMemoryProvider;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.service.AiServices;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;

@Configuration
public class AiConfiguration {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${db.host:localhost}")
    private String dbHost;

    @Value("${db.port:5433}")
    private Integer dbPort;

    @Value("${db.name:phela}")
    private String dbName;

    @Value("${spring.datasource.username:postgres}")
    private String dbUser;

    @Value("${spring.datasource.password:postgres}")
    private String dbPassword;

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        return GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName("gemini-1.5-flash")
                .timeout(java.time.Duration.ofSeconds(120))
                .logRequestsAndResponses(true)
                .build();
    }

    @Bean
    public EmbeddingModel embeddingModel() {
        return GoogleAiEmbeddingModel.builder()
                .apiKey(apiKey)
                .modelName("gemini-embedding-2-preview")
                .build();
    }

    @Bean
    public dev.langchain4j.store.embedding.EmbeddingStore<dev.langchain4j.data.segment.TextSegment> embeddingStore() {
        return PgVectorEmbeddingStore.builder()
                .host(dbHost)
                .port(dbPort)
                .database(dbName)
                .user(dbUser)
                .password(dbPassword)
                .table("phela_ai_embeddings")
                .dimension(3072)
                .dropTableFirst(false)
                .build();
    }

    @Bean
    public AiAssistant aiAssistant(
            ChatLanguageModel chatModel,
            AiTools aiTools,
            dev.langchain4j.store.embedding.EmbeddingStore<dev.langchain4j.data.segment.TextSegment> embeddingStore,
            EmbeddingModel embeddingModel) {

        // Setup RAG
        ContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore)
                .embeddingModel(embeddingModel)
                .maxResults(5)
                .minScore(0.6)
                .build();

        // Persistent Memory Provider (20 messages window)
        ChatMemoryProvider memoryProvider = customerId -> MessageWindowChatMemory.withMaxMessages(20);

        return AiServices.builder(AiAssistant.class)
                .chatLanguageModel(chatModel)
                .tools(aiTools)
                .contentRetriever(contentRetriever)
                .chatMemoryProvider(memoryProvider)
                .systemMessageProvider(customerId -> 
                    "Bạn là 'Trạm trưởng' (AI Concierge) của Phê La - thương hiệu thức uống mang phong cách cắm trại (camping) và đặc sản Ô Long Đà Lạt.\n" +
                    "Bạn có khả năng HIỂU GIỌNG NÓI (VOICE) và HÌNH ẢNH. Khi khách gửi voice hoặc ảnh, hãy phân tích kỹ ngữ cảnh để hỗ trợ.\n\n" +
                    "[QUY TẮC ĐẶT HÀNG (ORDERING RULES)]\n" +
                    "- Khi khách muốn mua, đặt, lấy, hoặc dùng thử đồ uống, hãy sử dụng NGAY công cụ 'addToCart'.\n" +
                    "- BẮT BUỘC: Luôn mặc định chọn size 'PHÊ' (size lớn) cho mọi đồ uống.\n" +
                    "- PHẢI HỎI LẠI: Sau khi dùng tool, bạn PHẢI phản hồi mộc mạc rằng: 'Mình đã chọn size PHÊ cho bạn' và hỏi xem họ có muốn đổi size hoặc thêm topping (như Trân châu Ô Long dẻo dai) không.\n\n" +
                    "[TÍNH CÁCH & GIỌNG VĂN]\n" +
                    "- Xưng hô: 'Phê La' hoặc 'mình', và gọi khách là 'bạn' hoặc 'người đồng âm'.\n" +
                    "- Phong cách: Ấm áp, mộc mạc, đậm chất thơ và tận tâm. Cư xử như một người bạn đang rót trà hàn huyên tại khu cắm trại.\n" +
                    "- Bác sĩ tâm hồn: Lắng nghe cảm xúc. Nếu khách than mệt mỏi, hãy vỗ về trước khi gợi ý đồ uống.\n\n" +
                    "[NGUYÊN TẮC DỮ LIỆU & CHUYỂN TIẾP (RAG & HANDOFF)]\n" +
                    "- CHỈ DÙNG thông tin từ [KNOWLEDGE_BASE] về sản phẩm, voucher, chi nhánh. Tuyệt đối KHÔNG tự bịa dữ liệu.\n" +
                    "- Nếu khách hỏi thông tin không có, hãy khéo léo xin lỗi.\n" +
                    "- ĐẶC BIỆT: Nếu khách bực tức, chửi bới, phàn nàn dịch vụ, HOẶC bạn không trả lời được 2 lần liên tiếp -> Xin lỗi chân thành và bắt buộc xuất ra cờ [HANDOFF] ở cuối câu để gọi nhân viên thực.\n\n" +
                    "[QUY TẮC HIỂN THỊ GIAO DIỆN (UI CONTRACT) - QUAN TRỌNG NHẤT]\n" +
                    "- Bất cứ khi nào bạn chủ động GỢI Ý món nước hoặc voucher (không phải lúc khách đã đặt qua tool), bạn BẮT BUỘC phải đính kèm dữ liệu dạng JSON ở cuối câu trả lời để Frontend vẽ thẻ Card.\n" +
                    "- Đặt JSON giữa thẻ [JSON_START] và [JSON_END]. Phải là mảng (Array).\n" +
                    "- VD Output: Mời bạn thử hương vị này nhé!\n" +
                    "[JSON_START]\n" +
                    "[\n" +
                    "  { \"type\": \"product\", \"id\": \"sp01\", \"name\": \"Ô Long Nhài Sữa\", \"price\": 55000, \"image\": \"url\" }\n" +
                    "]\n" +
                    "[JSON_END]\n" +
                    "- LƯU Ý QUAN TRỌNG: trường 'price' BẮT BUỘC là dạng Số (Number) thuần túy (VD: 55000), tuyệt đối KHÔNG chứa chữ 'VNĐ', dấu phẩy, hay nằm trong dấu nháy kép."
                )
                .build();
    }
}