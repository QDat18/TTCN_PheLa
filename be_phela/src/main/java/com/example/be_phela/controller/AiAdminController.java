package com.example.be_phela.controller;

import com.example.be_phela.service.AiKnowledgeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/ai")
public class AiAdminController {

    private final AiKnowledgeService aiKnowledgeService;

    public AiAdminController(AiKnowledgeService aiKnowledgeService) {
        this.aiKnowledgeService = aiKnowledgeService;
    }

    @PostMapping("/sync-knowledge")
    public ResponseEntity<String> syncKnowledge() {
        try {
            aiKnowledgeService.syncKnowledgeBase();
            return ResponseEntity.ok("Đồng bộ dữ liệu AI Knowledge Base lên Supabase thành công.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi đồng bộ: " + e.getMessage());
        }
    }
}
