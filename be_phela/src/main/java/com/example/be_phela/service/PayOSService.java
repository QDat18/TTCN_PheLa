package com.example.be_phela.service;

import com.example.be_phela.config.PayOSConfig;
import com.example.be_phela.dto.request.PayOSPaymentRequest;
import com.example.be_phela.dto.response.PayOSPaymentResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayOSService {

    private final PayOSConfig payOSConfig;
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(30);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(60);
    private static final Duration WRITE_TIMEOUT = Duration.ofSeconds(60);
    private static final Duration CALL_TIMEOUT = Duration.ofSeconds(90);

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(CONNECT_TIMEOUT)
            .readTimeout(READ_TIMEOUT)
            .writeTimeout(WRITE_TIMEOUT)
            .callTimeout(CALL_TIMEOUT)
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Tạo request thanh toán PayOS
     */
    public PayOSPaymentResponse createPaymentLink(PayOSPaymentRequest request) throws Exception {
        String url = PayOSConfig.PAYOS_BASE_URL + "/v2/payment-requests";

        request.setCancelUrl(payOSConfig.getCancelUrl());
        request.setReturnUrl(payOSConfig.getReturnUrl());

        if (request.getCancelUrl() == null || request.getCancelUrl().isBlank()) {
            throw new IllegalStateException("PayOS cancel URL is not configured");
        }
        if (request.getReturnUrl() == null || request.getReturnUrl().isBlank()) {
            throw new IllegalStateException("PayOS return URL is not configured");
        }

        // Tạo signature và set vào request body
        String signature = generateSignature(request);
        request.setSignature(signature);
        
        // Tạo final JSON body (đã có signature)
        String jsonBody = objectMapper.writeValueAsString(request);
        log.info("PayOS Request Body: {}", jsonBody);

        RequestBody body = RequestBody.create(
                jsonBody,
                MediaType.parse("application/json"));

        Request httpRequest = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("x-client-id", payOSConfig.getClientId())
                .addHeader("x-api-key", payOSConfig.getApiKey())
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = httpClient.newCall(httpRequest).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";

            if (!response.isSuccessful()) {
                log.error("PayOS Error Response: {}", responseBody);
                throw new RuntimeException("PayOS Error: " + response.code() + " - " + responseBody);
            }

            return objectMapper.readValue(responseBody, PayOSPaymentResponse.class);
        }
    }

    /**
     * Lấy thông tin thanh toán
     */
    public PayOSPaymentResponse getPaymentInfo(Long orderCode) throws Exception {
        String url = PayOSConfig.PAYOS_BASE_URL + "/v2/payment-requests/" + orderCode;

        Request httpRequest = new Request.Builder()
                .url(url)
                .get()
                .addHeader("x-client-id", payOSConfig.getClientId())
                .addHeader("x-api-key", payOSConfig.getApiKey())
                .build();

        try (Response response = httpClient.newCall(httpRequest).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";

            if (!response.isSuccessful()) {
                throw new RuntimeException("PayOS Error: " + response.code() + " - " + responseBody);
            }

            return objectMapper.readValue(responseBody, PayOSPaymentResponse.class);
        }
    }

    /**
     * Hủy link thanh toán
     */
    public void cancelPaymentLink(Long orderCode, String reason) throws Exception {
        String url = PayOSConfig.PAYOS_BASE_URL + "/v2/payment-requests/" + orderCode + "/cancel";

        Map<String, String> cancelBody = new LinkedHashMap<>();
        cancelBody.put("cancellationReason", reason != null ? reason : "Người dùng hủy");

        RequestBody body = RequestBody.create(
                objectMapper.writeValueAsString(cancelBody),
                MediaType.parse("application/json"));

        Request httpRequest = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("x-client-id", payOSConfig.getClientId())
                .addHeader("x-api-key", payOSConfig.getApiKey())
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = httpClient.newCall(httpRequest).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";

            if (!response.isSuccessful()) {
                throw new RuntimeException("PayOS Cancel Error: " + response.code() + " - " + responseBody);
            }
        }
    }

    /**
     * Lấy thông tin hóa đơn
     */
    public String getInvoiceInfo(Long orderCode) throws Exception {
        String url = PayOSConfig.PAYOS_BASE_URL + "/v2/payment-requests/" + orderCode + "/invoices";

        Request httpRequest = new Request.Builder()
                .url(url)
                .get()
                .addHeader("x-client-id", payOSConfig.getClientId())
                .addHeader("x-api-key", payOSConfig.getApiKey())
                .build();

        try (Response response = httpClient.newCall(httpRequest).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";

            if (!response.isSuccessful()) {
                throw new RuntimeException("PayOS Error: " + response.code() + " - " + responseBody);
            }

            return responseBody;
        }
    }

    /**
     * Tạo chữ ký xác thực (signature) cho PayOS request
     * PayOS V2 expects: HMAC-SHA256 of raw string concatenation in alphabetical order
     * Format: amount=X&cancelUrl=Y&description=Z&orderCode=N&returnUrl=R
     */
    private String generateSignature(PayOSPaymentRequest request) throws Exception {

    String amount = String.valueOf(request.getAmount());
    String cancelUrl = request.getCancelUrl();
    String description = request.getDescription();
    String orderCode = String.valueOf(request.getOrderCode());
    String returnUrl = request.getReturnUrl();

    String dataStr = "amount=" + amount +
                     "&cancelUrl=" + cancelUrl +
                     "&description=" + description +
                     "&orderCode=" + orderCode +
                     "&returnUrl=" + returnUrl;

    log.info("Signature String: {}", dataStr);

    // Tạo HMAC-SHA256
    Mac hmacSha256 = Mac.getInstance("HmacSHA256");
    SecretKeySpec keySpec = new SecretKeySpec(
            payOSConfig.getChecksumKey().getBytes(StandardCharsets.UTF_8),
            "HmacSHA256");
    hmacSha256.init(keySpec);

    byte[] hash = hmacSha256.doFinal(dataStr.getBytes(StandardCharsets.UTF_8));
    StringBuilder hex = new StringBuilder();
    for (byte b : hash) hex.append(String.format("%02x", b));

    return hex.toString();
}


    /**
     * Verify webhook signature from PayOS
     */
    public boolean verifyWebhookSignature(String signature, String data) throws Exception {
        Mac hmacSha256 = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(
                payOSConfig.getChecksumKey().getBytes(StandardCharsets.UTF_8),
                "HmacSHA256");
        hmacSha256.init(secretKey);
        byte[] hash = hmacSha256.doFinal(data.getBytes(StandardCharsets.UTF_8));

        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            hexString.append(String.format("%02X", b));
        }

        String computedSignature = hexString.toString();
        return computedSignature.equalsIgnoreCase(signature != null ? signature.trim() : "");
    }
}
