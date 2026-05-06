package com.example.be_phela.service;

import com.example.be_phela.model.Branch;
import com.example.be_phela.model.Product;
import com.example.be_phela.model.Voucher;
import com.example.be_phela.repository.BranchRepository;
import com.example.be_phela.repository.ProductRepository;
import com.example.be_phela.repository.VoucherRepository;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiKnowledgeService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AiKnowledgeService.class);

    private final ProductRepository productRepository;
    private final VoucherRepository voucherRepository;
    private final BranchRepository branchRepository;
    private final EmbeddingModel embeddingModel;

    private final EmbeddingStore<TextSegment> embeddingStore;

    private final JdbcTemplate jdbcTemplate;

    public AiKnowledgeService(
            ProductRepository productRepository,
            VoucherRepository voucherRepository,
            BranchRepository branchRepository,
            EmbeddingModel embeddingModel,
            EmbeddingStore<TextSegment> embeddingStore,
            JdbcTemplate jdbcTemplate) {
        this.productRepository = productRepository;
        this.voucherRepository = voucherRepository;
        this.branchRepository = branchRepository;
        this.embeddingModel = embeddingModel;
        this.embeddingStore = embeddingStore;
        this.jdbcTemplate = jdbcTemplate;
    }

    public void syncKnowledgeBase() {
        log.info("Starting manual synchronization of AI Knowledge Base to Supabase/PostgreSQL...");
        try {
            log.info("Clearing old embeddings...");
            jdbcTemplate.execute("TRUNCATE TABLE phela_ai_embeddings");

            log.info("Indexing Products...");
            indexProducts();

            log.info("Indexing Vouchers...");
            indexVouchers();

            log.info("Indexing Branches...");
            indexBranches();

            log.info("AI Knowledge Base synchronized successfully!");
        } catch (Exception e) {
            log.error("Failed to synchronize AI Knowledge Base", e);
            throw new RuntimeException("Lỗi khi đồng bộ Knowledge Base: " + e.getMessage());
        }
    }

    private void indexProducts() {
        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            String content = String.format("ID Sản phẩm: %s. Sản phẩm: %s. Mô tả: %s. Giá: %s VNĐ.",
                    product.getProductId(), product.getProductName(), product.getDescription(), product.getDiscountPrice());
            
            Metadata metadata = new Metadata();
            metadata.put("type", "product");
            metadata.put("id", product.getProductId());
            
            TextSegment segment = TextSegment.from(content, metadata);
            embeddingStore.add(embeddingModel.embed(segment).content(), segment);
        }
    }

    private void indexVouchers() {
        List<Voucher> vouchers = voucherRepository.findAll();
        for (Voucher voucher : vouchers) {
            String content = String.format("ID Voucher: %s. Voucher Khuyến mãi: %s (Mã giao dịch: %s). Nội dung: %s. Giá trị: %s. Điều kiện: Đơn hàng từ %s VNĐ.",
                    voucher.getId(), voucher.getName(), voucher.getCode(), voucher.getDescription(), voucher.getValue(), voucher.getMinOrderAmount());

            Metadata metadata = new Metadata();
            metadata.put("type", "voucher");
            metadata.put("id", voucher.getId());

            TextSegment segment = TextSegment.from(content, metadata);
            embeddingStore.add(embeddingModel.embed(segment).content(), segment);
        }
    }

    private void indexBranches() {
        List<Branch> branches = branchRepository.findAll();
        for (Branch branch : branches) {
            String content = String.format("Mã Chi nhánh: %s. Chi nhánh Phê La: %s. Địa chỉ: %s.",
                    branch.getBranchCode(), branch.getBranchName(), branch.getAddress());

            Metadata metadata = new Metadata();
            metadata.put("type", "branch");
            metadata.put("id", branch.getBranchCode());

            TextSegment segment = TextSegment.from(content, metadata);
            embeddingStore.add(embeddingModel.embed(segment).content(), segment);
        }
    }

    public List<TextSegment> findRelevantKnowledge(String query, int maxResults) {
        EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                .queryEmbedding(embeddingModel.embed(query).content())
                .maxResults(maxResults)
                .build();

        return embeddingStore.search(request).matches().stream()
                .map(EmbeddingMatch::embedded)
                .collect(Collectors.toList());
    }

    public EmbeddingStore<TextSegment> getEmbeddingStore() {
        return embeddingStore;
    }

    public EmbeddingModel getEmbeddingModel() {
        return embeddingModel;
    }
}
