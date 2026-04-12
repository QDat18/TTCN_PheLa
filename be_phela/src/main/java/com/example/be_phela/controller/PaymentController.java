package com.example.be_phela.controller;

import com.example.be_phela.dto.request.PayOSPaymentRequest;
import com.example.be_phela.dto.request.PaymentRequestDTO;
import com.example.be_phela.dto.response.PayOSPaymentResponse;
import com.example.be_phela.model.Address;
import com.example.be_phela.model.Customer;
import com.example.be_phela.model.Order;
import com.example.be_phela.service.OrderService;
import com.example.be_phela.service.PayOSService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;

@Slf4j
@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final OrderService orderService;
    private final PayOSService payOSService;
    @Value("${frontend.customer-url:http://localhost:3000}")
    private String frontendCustomerUrl;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private String buildFrontendRedirect(String pathAndQuery) {
        if (frontendCustomerUrl == null || frontendCustomerUrl.isBlank()) {
            return pathAndQuery;
        }

        String base = frontendCustomerUrl.trim();
        String path = pathAndQuery.trim();

        boolean baseEndsWithSlash = base.endsWith("/");
        boolean pathStartsWithSlash = path.startsWith("/");

        if (baseEndsWithSlash && pathStartsWithSlash) {
            return base + path.substring(1);
        }

        if (!baseEndsWithSlash && !pathStartsWithSlash) {
            return base + '/' + path;
        }

        return base + path;
    }

    @Transactional
    @PostMapping("/create-payment")
    public ResponseEntity<?> createPayment(@RequestBody PaymentRequestDTO paymentDTO) {
        Order order = null;
        try {
            // Validate input
            if (paymentDTO.getAmount() <= 0) {
                throw new IllegalArgumentException("Amount must be greater than 0");
            }
            if (paymentDTO.getOrderInfo() == null || paymentDTO.getOrderInfo().trim().isEmpty()) {
                throw new IllegalArgumentException("Order info is required");
            }

            // Lấy thông tin order với pessimistic lock để tránh double payment
            order = orderService.getOrderByCodeWithLock(paymentDTO.getOrderInfo())
                    .orElseThrow(() -> new RuntimeException("Order not found with code: " + paymentDTO.getOrderInfo()));

            Address address = order.getAddress();
            Customer customer = order.getCustomer();
            if (address == null) {
                throw new IllegalStateException("Order is missing shipping address information");
            }
            if (customer == null) {
                throw new IllegalStateException("Order is missing customer information");
            }

            String numericOrderCode = order.getOrderCode().replaceAll("[^0-9]", "");
            if (numericOrderCode.isEmpty()) {
                throw new IllegalStateException("Order code is missing numeric characters required by PayOS");
            }
            if (numericOrderCode.length() > 9) {
                log.error("Order code {} exceeds PayOS 9-digit limit", order.getOrderCode());
                throw new IllegalStateException("Order code exceeds PayOS 9-digit limit: " + numericOrderCode);
            }

            long amountInVnd = convertToVndAmount(order.getFinalAmount());
            if (amountInVnd < 1000) {
                throw new IllegalStateException("Payment amount must be at least 1000 VND, got: " + amountInVnd);
            }
            
            String description = buildPayOSDescription(numericOrderCode);
            String itemName = buildPayOSItemName(numericOrderCode);

            // Gom toàn bộ giá trị vào một dòng để tránh sai lệch giữa tổng tiền và danh sách sản phẩm
            List<PayOSPaymentRequest.PayOSItem> items = List.of(
                PayOSPaymentRequest.PayOSItem.builder()
                        .name(itemName)
                        .quantity(1)
                        .price(amountInVnd)
                        .build()
            );

            // Validate buyer information
            String buyerName = address.getRecipientName();
            String buyerEmail = customer.getEmail();
            String buyerPhone = address.getPhone();
            String buyerAddress = buildFullAddress(address);
            
            if (buyerName == null || buyerName.isBlank()) {
                throw new IllegalStateException("Buyer name is required for PayOS");
            }
            if (buyerEmail == null || buyerEmail.isBlank()) {
                throw new IllegalStateException("Buyer email is required for PayOS");
            }
            if (buyerPhone == null || buyerPhone.isBlank()) {
                throw new IllegalStateException("Buyer phone is required for PayOS");
            }
            if (buyerAddress == null || buyerAddress.isBlank()) {
                throw new IllegalStateException("Buyer address is required for PayOS");
            }
            
            // Tạo request cho PayOS
            PayOSPaymentRequest payOSRequest = PayOSPaymentRequest.builder()
                    .orderCode(Long.parseLong(numericOrderCode))
                    .amount(amountInVnd)
                    .description(description)
                    .items(items)
                    .buyerName(buyerName)
                    .buyerEmail(buyerEmail)
                    .buyerPhone(buyerPhone)
                    .buyerAddress(buyerAddress)
                    .build();

            // Gọi PayOS API
            PayOSPaymentResponse response = payOSService.createPaymentLink(payOSRequest);

                if (!"00".equals(response.getCode())) {
                String desc = response.getDesc() != null ? response.getDesc() : "PayOS trả về lỗi không xác định";
                log.error("PayOS rejected order {} with code {}: {}", order.getOrderCode(), response.getCode(), desc);
                safelyRollbackOrder(order);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                        "status", "Error",
                        "code", response.getCode(),
                        "message", desc
                    ));
                }

                if (response.getData() == null || response.getData().getCheckoutUrl() == null) {
                log.error("PayOS response missing data for order {}: {}", order.getOrderCode(), response);
                throw new RuntimeException("Failed to create payment link");
            }

            // Trả về URL thanh toán và QR code
            return ResponseEntity.ok(Map.of(
                    "status", "Ok",
                    "message", "Successfully",
                    "url", response.getData().getCheckoutUrl(),
                    "qrCode", response.getData().getQrCode(),
                    "paymentLinkId", response.getData().getPaymentLinkId()
            ));

        } catch (IllegalArgumentException | IllegalStateException e) {
            if (order != null) {
                safelyRollbackOrder(order);
            }
            log.error("Invalid payment request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "Error", "message", e.getMessage()));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().startsWith("PayOS Error")) {
                if (order != null) {
                    safelyRollbackOrder(order);
                }
            log.error("PayOS rejected payment creation: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("status", "Error", "message", e.getMessage()));
            }
            if (order != null) {
                safelyRollbackOrder(order);
            }
            log.error("Unexpected runtime error while creating payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("status", "Error", "message", e.getMessage()));
        } catch (Exception e) {
            if (order != null) {
                safelyRollbackOrder(order);
            }
            log.error("Error creating payment: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "Error", "message", e.getMessage()));
        }
    }

    private void safelyRollbackOrder(Order order) {
        try {
            orderService.rollbackOrderDueToPaymentFailure(order.getOrderId());
        } catch (Exception rollbackException) {
            log.error("Failed to rollback order {} after payment error", order.getOrderCode(), rollbackException);
        }
    }

    private String buildFullAddress(Address address) {
        List<String> addressParts = new ArrayList<>();
        
        // Chỉ lấy detailedAddress và ward/district/city ngắn gọn
        if (address.getDetailedAddress() != null && !address.getDetailedAddress().isBlank()) {
            String detail = address.getDetailedAddress().trim();
            // Nếu detailedAddress đã chứa city/district, chỉ lấy phần đầu
            if (detail.length() > 100) {
                detail = detail.substring(0, 100);
            }
            addressParts.add(detail);
        }
        
        // Thêm ward/district/city ngắn gọn (bỏ prefix "Phường", "Quận", "Thành phố")
        if (address.getWard() != null && !address.getWard().isBlank()) {
            String ward = address.getWard().trim()
                    .replaceFirst("^(Phường|Xã)\\s+", "");
            addressParts.add(ward);
        }
        if (address.getDistrict() != null && !address.getDistrict().isBlank()) {
            String district = address.getDistrict().trim()
                    .replaceFirst("^(Quận|Huyện|Thị xã|Thành phố)\\s+", "");
            addressParts.add(district);
        }
        if (address.getCity() != null && !address.getCity().isBlank()) {
            String city = address.getCity().trim()
                    .replaceFirst("^(Thành phố|Tỉnh)\\s+", "");
            addressParts.add(city);
        }
        
        String fullAddress = String.join(", ", addressParts);
        
        // PayOS limit: 255 chars
        if (fullAddress.length() > 255) {
            fullAddress = fullAddress.substring(0, 252) + "...";
        }
        
        return fullAddress;
    }

    private long convertToVndAmount(Double amount) {
        double rawAmount = amount != null ? amount : 0.0d;
        return BigDecimal.valueOf(rawAmount)
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
    }

    private String buildPayOSDescription(String numericOrderCode) {
        String suffix = numericOrderCode.length() > 4
                ? numericOrderCode.substring(numericOrderCode.length() - 4)
                : numericOrderCode;
        String description = ("PAY" + suffix).toUpperCase();
        // PayOS limit: 32 chars
        return description.length() > 32 ? description.substring(0, 32) : description;
    }

    private String buildPayOSItemName(String numericOrderCode) {
        String suffix = numericOrderCode.length() > 4
                ? numericOrderCode.substring(numericOrderCode.length() - 4)
                : numericOrderCode;
        String itemName = ("PAYORD" + suffix).toUpperCase();
        // PayOS limit: 32 chars
        return itemName.length() > 32 ? itemName.substring(0, 32) : itemName;
    }

    private Optional<Order> resolveOrderByPayOSCode(String rawOrderCode) {
        if (rawOrderCode == null || rawOrderCode.isBlank()) {
            return Optional.empty();
        }

        String digitsOnly = rawOrderCode.replaceAll("[^0-9]", "");
        if (!digitsOnly.isEmpty()) {
            Optional<Order> directMatch = orderService.getOrderByCode("ORD" + digitsOnly);
            if (directMatch.isPresent()) {
                return directMatch;
            }

            try {
                String paddedDigits = String.format("%09d", Long.parseLong(digitsOnly));
                if (!paddedDigits.equals(digitsOnly)) {
                    Optional<Order> paddedMatch = orderService.getOrderByCode("ORD" + paddedDigits);
                    if (paddedMatch.isPresent()) {
                        return paddedMatch;
                    }
                }
            } catch (NumberFormatException ex) {
                log.warn("Invalid numeric PayOS order code: {}", rawOrderCode, ex);
            }
        }

        String prefixed = rawOrderCode.startsWith("ORD") ? rawOrderCode : "ORD" + rawOrderCode;
        return orderService.getOrderByCode(prefixed);
    }

    @GetMapping("/payment-return")
    public RedirectView paymentReturn(@RequestParam Map<String, String> allParams) {
        try {
            // PayOS trả về với các params: code, id, cancel, status, orderCode
            String code = allParams.get("code");
            String orderCode = allParams.get("orderCode");
            String status = allParams.get("status");

            log.info("Payment return params: {}", allParams);

            if (orderCode == null || orderCode.isEmpty()) {
                return new RedirectView(buildFrontendRedirect("/payment-return?status=failed&message=Invalid%20order%20code"));
            }

            Order order = resolveOrderByPayOSCode(orderCode)
                    .orElseThrow(() -> new RuntimeException("Order not found with PayOS code: " + orderCode));

            // Kiểm tra trạng thái thanh toán
            if ("00".equals(code) && "PAID".equalsIgnoreCase(status)) {
                // Thanh toán thành công
                orderService.confirmBankTransferPayment(order.getOrderId());
                return new RedirectView(buildFrontendRedirect("/payment-return?status=success&orderId=" + order.getOrderId()));
            } else {
                // Thanh toán thất bại hoặc bị hủy
                orderService.rollbackOrderDueToPaymentFailure(order.getOrderId());
                return new RedirectView(buildFrontendRedirect("/payment-return?status=failed&orderId=" + order.getOrderId()));
            }

        } catch (Exception e) {
            log.error("Error processing payment return: ", e);
            String message = e.getMessage() != null
                    ? URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8)
                    : "Unexpected%20error";
            return new RedirectView(buildFrontendRedirect("/payment-return?status=error&message=" + message));
        }
    }

    /**
     * Xử lý cancel từ PayOS
     */
    @GetMapping("/payment-cancel")
    public RedirectView paymentCancel(@RequestParam Map<String, String> allParams) {
        try {
            String orderCode = allParams.get("orderCode");
            log.info("Payment cancel params: {}", allParams);

            if (orderCode != null && !orderCode.isEmpty()) {
                resolveOrderByPayOSCode(orderCode).ifPresent(order -> {
                    try {
                        orderService.rollbackOrderDueToPaymentFailure(order.getOrderId());
                        log.info("Order {} rolled back due to payment cancellation", order.getOrderCode());
                    } catch (Exception e) {
                        log.error("Failed to rollback order {} after cancellation", order.getOrderCode(), e);
                    }
                });
            }

            return new RedirectView(buildFrontendRedirect("/payment-cancel"));
        } catch (Exception e) {
            log.error("Error processing payment cancel: ", e);
            return new RedirectView(buildFrontendRedirect("/payment-cancel"));
        }
    }

    /**
     * Webhook từ PayOS khi có thay đổi trạng thái thanh toán
     */
    @PostMapping("/payos-webhook")
    public ResponseEntity<?> payosWebhook(
            @RequestHeader("x-signature") String signature,
            @RequestBody String payload
    ) {
        try {
            log.info("PayOS Webhook received: {}", payload);
            
            // Verify signature
            if (!payOSService.verifyWebhookSignature(signature, payload)) {
                log.error("Invalid webhook signature");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
            }

            JsonNode rootNode = OBJECT_MAPPER.readTree(payload);
            JsonNode dataNode = rootNode.path("data");

            if (dataNode.isMissingNode()) {
                log.error("Webhook payload missing data node");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing data");
            }

            String rawOrderCode = dataNode.path("orderCode").asText(null);
            String paymentStatus = dataNode.path("status").asText(null);

            if (rawOrderCode == null || paymentStatus == null) {
                log.error("Webhook payload missing orderCode or status: {}", dataNode);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing orderCode or status");
            }

            resolveOrderByPayOSCode(rawOrderCode).ifPresentOrElse(order -> {
                switch (paymentStatus.toUpperCase()) {
                    case "PAID" -> {
                        orderService.confirmBankTransferPayment(order.getOrderId());
                        log.info("Order {} marked as PAID via webhook", order.getOrderCode());
                    }
                    case "CANCELLED", "FAILED", "EXPIRED" -> {
                        orderService.rollbackOrderDueToPaymentFailure(order.getOrderId());
                        log.info("Order {} rolled back due to webhook status {}", order.getOrderCode(), paymentStatus);
                    }
                    default -> log.info("Webhook status {} for order {} ignored", paymentStatus, order.getOrderCode());
                }
            }, () -> log.error("Order with code {} not found for webhook", rawOrderCode));

            return ResponseEntity.ok("Webhook processed");
        } catch (Exception e) {
            log.error("Error processing webhook: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing webhook");
        }
    }

    /**
     * Lấy thông tin thanh toán
     */
    @GetMapping("/payment-info/{orderCode}")
    public ResponseEntity<?> getPaymentInfo(@PathVariable String orderCode) {
        try {
            Long payOSOrderCode = Long.parseLong(orderCode.replaceAll("[^0-9]", ""));
            PayOSPaymentResponse response = payOSService.getPaymentInfo(payOSOrderCode);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting payment info: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "Error", "message", e.getMessage()));
        }
    }

    /**
     * Hủy link thanh toán
     */
    @PostMapping("/cancel-payment/{orderCode}")
    public ResponseEntity<?> cancelPayment(
            @PathVariable String orderCode,
            @RequestParam(required = false) String reason
    ) {
        try {
            Long payOSOrderCode = Long.parseLong(orderCode.replaceAll("[^0-9]", ""));
            payOSService.cancelPaymentLink(payOSOrderCode, reason);
            return ResponseEntity.ok(Map.of("status", "Ok", "message", "Payment cancelled successfully"));
        } catch (Exception e) {
            log.error("Error cancelling payment: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "Error", "message", e.getMessage()));
        }
    }

    /**
     * Lấy thông tin hóa đơn
     */
    @GetMapping("/invoice/{orderCode}")
    public ResponseEntity<?> getInvoice(@PathVariable String orderCode) {
        try {
            Long payOSOrderCode = Long.parseLong(orderCode.replaceAll("[^0-9]", ""));
            String invoice = payOSService.getInvoiceInfo(payOSOrderCode);
            return ResponseEntity.ok(invoice);
        } catch (Exception e) {
            log.error("Error getting invoice: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "Error", "message", e.getMessage()));
        }
    }
}