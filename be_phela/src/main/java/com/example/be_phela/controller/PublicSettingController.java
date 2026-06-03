package com.example.be_phela.controller;

import com.example.be_phela.service.SystemSettingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class PublicSettingController {

    private final SystemSettingService settingService;

    public PublicSettingController(SystemSettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping("/loyalty")
    public ResponseEntity<?> getLoyaltySettings() {
        Map<String, Object> config = new HashMap<>();
        config.put("note_value_vnd", settingService.getInt("loyalty.note_value_vnd", 1000));
        config.put("spend_per_note", settingService.getInt("loyalty.spend_per_note", 10000));
        return ResponseEntity.ok(config);
    }
}
