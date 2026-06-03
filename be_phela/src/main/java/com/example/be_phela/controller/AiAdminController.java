package com.example.be_phela.controller;

import com.example.be_phela.service.AiKnowledgeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/ai")
public class AiAdminController {

    private final AiKnowledgeService aiKnowledgeService;

    public AiAdminController(AiKnowledgeService aiKnowledgeService) {
        this.aiKnowledgeService = aiKnowledgeService;
    }

    @GetMapping("/knowledge-status")
    public ResponseEntity<Map<String, Object>> getKnowledgeStatus() {
        boolean dirty = aiKnowledgeService.isKnowledgeDirty();
        Map<String, Object> status = new HashMap<>();
        status.put("dirty", dirty);
        return ResponseEntity.ok(status);
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
