package com.example.be_phela.controller;

import com.example.be_phela.service.SystemSettingService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
public class SystemSettingController {

    private final SystemSettingService settingService;

    @Value("${payos.client-id:}")
    private String payosClientId;

    @Value("${payos.api-key:}")
    private String payosApiKey;

    @Value("${payos.checksum-key:}")
    private String payosChecksumKey;

    @Value("${payos.return-url:}")
    private String payosReturnUrl;

    @Value("${payos.cancel-url:}")
    private String payosCancelUrl;

    @Value("${sepay.api-key:}")
    private String sepayApiKey;

    @Value("${bank.id:}")
    private String bankId;

    @Value("${bank.account-no:}")
    private String bankAccountNo;

    @Value("${bank.account-name:}")
    private String bankAccountName;

    public SystemSettingController(SystemSettingService settingService) {
        this.settingService = settingService;
    }

    /**
     * GET /api/admin/settings
     * Trả về toàn bộ cài đặt hệ thống dưới dạng Map<key, value>
     * Yêu cầu role ADMIN hoặc SUPER_ADMIN
     */
    @GetMapping
    public ResponseEntity<?> getAllSettings() {
        try {
            return ResponseEntity.ok(settingService.getAllSettings());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch settings: " + e.getMessage()));
        }
    }

    /**
     * GET /api/admin/settings/payment-env
     * Trả về thông tin payment từ ENV (PayOS keys masked) + DB bank info
     * Dùng để hiển thị trạng thái cấu hình trên Admin UI
     */
    @GetMapping("/payment-env")
    public ResponseEntity<?> getPaymentEnvConfig() {
        try {
            Map<String, Object> config = new LinkedHashMap<>();

            // PayOS - mask sensitive values, chỉ hiện trạng thái đã cấu hình chưa
            config.put("payos.client_id_configured",   payosClientId != null && !payosClientId.isBlank());
            config.put("payos.api_key_configured",      payosApiKey != null && !payosApiKey.isBlank());
            config.put("payos.checksum_configured",     payosChecksumKey != null && !payosChecksumKey.isBlank());
            config.put("payos.return_url",              payosReturnUrl != null ? payosReturnUrl : "");
            config.put("payos.cancel_url",              payosCancelUrl != null ? payosCancelUrl : "");

            // SePay - từ ENV (tham chiếu, không override DB settings)
            config.put("env.sepay_api_key_configured",  sepayApiKey != null && !sepayApiKey.isBlank());
            config.put("env.bank_id",                   bankId != null ? bankId : "");
            config.put("env.account_no",                bankAccountNo != null ? bankAccountNo : "");
            config.put("env.account_name",              bankAccountName != null ? bankAccountName : "");

            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch payment env config: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/admin/settings
     * Cập nhật một hoặc nhiều cài đặt cùng lúc
     * Body: { "key1": "value1", "key2": "value2" }
     * Yêu cầu role SUPER_ADMIN
     */
    @PutMapping
    public ResponseEntity<Map<String, String>> updateSettings(@RequestBody Map<String, String> updates) {
        Map<String, String> updated = settingService.updateSettings(updates);
        return ResponseEntity.ok(updated);
    }
}
