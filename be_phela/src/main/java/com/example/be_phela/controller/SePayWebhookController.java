package com.example.be_phela.controller;

import com.example.be_phela.model.Order;
import com.example.be_phela.service.OrderService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/webhooks")
public class SePayWebhookController {
    private static final Logger log = LoggerFactory.getLogger(SePayWebhookController.class);

    private final OrderService orderService;

    @Value("${sepay.api-key:default_secret}")
    private String sepayApiKey;

    // Viết Constructor tay để đảm bảo Spring nạp Bean thành công
    public SePayWebhookController(OrderService orderService) {
        this.orderService = orderService;
        log.info("✅ SePayWebhookController đã được khởi tạo thành công!");
    }

    @Transactional
    @PostMapping("/sepay")
    public ResponseEntity<?> handleSePayWebhook(
            HttpServletRequest request,
            @RequestBody JsonNode payload
    ) {
        if (orderService == null) {
            log.error("❌ CRITICAL: orderService is NULL. Bean injection failed!");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "System Configuration Error: OrderService is null"));
        }

        try {
            boolean isTestMode = payload.path("order").path("custom_data").path("webhook_test").asBoolean(false)
                              || payload.path("order").path("order_id").asText("").startsWith("TEST_");

            if (isTestMode) {
                log.info("[TEST MODE] Received test ping from SePay.");
                return ResponseEntity.ok(Map.of("success", true, "message", "Test Webhook received successfully"));
            }

            String authHeader = request.getHeader("Authorization");
            String xApiKey = request.getHeader("x-api-key");
            
            String safeApiKey = (sepayApiKey != null) ? sepayApiKey.trim() : "";
            boolean isAuthenticated = (authHeader != null && authHeader.contains(safeApiKey)) 
                                   || (xApiKey != null && xApiKey.trim().equals(safeApiKey));

            if (!isAuthenticated && !safeApiKey.isEmpty()) {
                log.warn("Authentication Failed for SePay Webhook! Expected: {}", sepayApiKey);
            }

            String orderCode = null;
            double amountIn = 0.0;

            // 3. TRÍCH XUẤT MÃ ĐƠN HÀNG VÀ SỐ TIỀN
            if (payload.has("notification_type") && "PAYMENT_SUCCESS".equals(payload.get("notification_type").asText())) {
                JsonNode orderNode = payload.path("order");
                JsonNode txnNode = payload.path("transaction");
                
                String orderIdStr = orderNode.path("order_id").asText("");
                String orderDesc = orderNode.path("order_description").asText("");
                amountIn = txnNode.path("transaction_amount").asDouble(0.0);

                Matcher m = Pattern.compile("(?i)PL\\d+").matcher(orderIdStr + " " + orderDesc);
                if (m.find()) {
                    orderCode = m.group().toUpperCase();
                }
            } 
            else {
                String content = payload.has("transactionContent") 
                        ? payload.get("transactionContent").asText() 
                        : payload.path("content").asText("");
                
                amountIn = payload.has("transferAmount") 
                        ? payload.get("transferAmount").asDouble(0.0) 
                        : payload.path("amount_in").asDouble(0.0);

                Matcher m = Pattern.compile("(?i)PL\\d+").matcher(content);
                if (m.find()) {
                    orderCode = m.group().toUpperCase();
                }
            }

            if (orderCode == null) {
                log.warn("⚠️ Không tìm thấy mã ORD trong nội dung chuyển khoản (Amount: {})", amountIn);
                return ResponseEntity.ok(Map.of("success", false, "message", "Order code not found in content"));
            }

            log.info("🔍 Đang xử lý thanh toán cho đơn hàng {} với số tiền {}", orderCode, amountIn);

            // 4. TÌM ĐƠN HÀNG VÀ CHỐT ĐƠN
            Optional<Order> orderOpt = orderService.getOrderByCode(orderCode);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                
                orderService.confirmBankTransferPayment(order.getOrderId());
                log.info("🎉 ĐƠN HÀNG {} ĐÃ ĐƯỢC CHỐT THÀNH CÔNG VÀO DATABASE!", orderCode);
                
                return ResponseEntity.ok(Map.of("success", true, "message", "Order confirmed successfully"));
            } else {
                log.warn("⚠️ Không tìm thấy đơn hàng {} trong hệ thống (Tiền nhận được: {})", orderCode, amountIn);
                return ResponseEntity.ok(Map.of("success", false, "message", "Order not found"));
            }

        } catch (Exception e) {
            log.error("❌ Lỗi hệ thống khi xử lý Webhook SePay: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", false, "message", "Internal Server Error handled: " + e.getMessage()));
        }
    }
}
