package com.example.be_phela.config;

import com.example.be_phela.model.SystemSetting;
import com.example.be_phela.service.SystemSettingService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Khởi tạo các giá trị mặc định cho System Settings khi ứng dụng khởi động.
 * Chỉ insert nếu key chưa tồn tại trong DB (không ghi đè giá trị đã cấu hình).
 */
@Component
public class SystemSettingInitializer implements ApplicationRunner {

    private final SystemSettingService settingService;

    public SystemSettingInitializer(SystemSettingService settingService) {
        this.settingService = settingService;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<SystemSetting> defaults = List.of(
            // === GENERAL ===
            new SystemSetting("site.name",        "Phê La Coffee",                         "general",   "Tên thương hiệu"),
            new SystemSetting("site.description", "Chuỗi cà phê phong cách - Hệ thống quản lý hiện đại", "general", "Mô tả hệ thống"),
            new SystemSetting("site.email",       "contact@phela.vn",                      "general",   "Email liên hệ"),
            new SystemSetting("site.phone",       "1800 6936",                             "general",   "Hotline"),
            new SystemSetting("site.website",     "https://phela.vn",                      "general",   "Website"),

            // === LOYALTY (Nốt nhạc) ===
            new SystemSetting("loyalty.enabled",            "true",  "loyalty", "Bật/tắt tích điểm"),
            new SystemSetting("loyalty.spend_per_note",     "10000", "loyalty", "Chi tiêu bao nhiêu VNĐ để được 1 Nốt nhạc"),
            new SystemSetting("loyalty.note_value_vnd",     "1000",  "loyalty", "1 Nốt nhạc = bao nhiêu VNĐ giảm giá"),
            new SystemSetting("loyalty.expiry_months",      "12",    "loyalty", "Nốt nhạc hết hạn sau bao nhiêu tháng"),
            new SystemSetting("loyalty.silver_threshold",   "300",   "loyalty", "Số nốt để thăng hạng SILVER"),
            new SystemSetting("loyalty.gold_threshold",     "600",   "loyalty", "Số nốt để thăng hạng GOLD"),
            new SystemSetting("loyalty.diamond_threshold",  "1000",  "loyalty", "Số nốt để thăng hạng DIAMOND"),

            // === SHIPPING ===
            new SystemSetting("shipping.base_fee",                  "25000",  "shipping", "Phí giao hàng cơ bản (VNĐ)"),
            new SystemSetting("shipping.free_threshold",            "200000", "shipping", "Ngưỡng miễn phí vận chuyển (VNĐ)"),
            new SystemSetting("shipping.free_enabled",              "true",   "shipping", "Bật tính năng miễn phí vận chuyển"),
            new SystemSetting("shipping.max_distance_km",           "10",     "shipping", "Khoảng cách giao hàng tối đa (km)"),
            new SystemSetting("shipping.extra_fee_per_km",          "5000",   "shipping", "Phí phụ trội mỗi km (VNĐ)"),

            // === PROMOTION ===
            new SystemSetting("promotion.max_voucher_discount_pct", "50",   "promotion", "Giảm tối đa mỗi voucher (%)"),
            new SystemSetting("promotion.max_uses_per_voucher",     "100",  "promotion", "Số lần dùng tối đa / voucher"),
            new SystemSetting("promotion.first_order_discount_pct", "20",   "promotion", "Giảm giá đơn đầu tiên (%)"),
            new SystemSetting("promotion.referral_enabled",         "false", "promotion", "Bật chương trình giới thiệu"),
            new SystemSetting("promotion.referral_bonus_notes",     "50",   "promotion", "Thưởng giới thiệu (Nốt nhạc)"),

            // === PAYMENT ===
            new SystemSetting("payment.bank_id",           "tpbank",             "payment", "Mã ngân hàng (BIN/ID)"),
            new SystemSetting("payment.account_no",        "0827592304",         "payment", "Số tài khoản ngân hàng"),
            new SystemSetting("payment.account_name",      "PHE LA COFFEE",      "payment", "Tên chủ tài khoản"),
            new SystemSetting("payment.transfer_prefix",   "PHELA",              "payment", "Tiền tố nội dung chuyển khoản"),
            new SystemSetting("payment.sepay_api_key",     "",                   "payment", "SePay API Key (dùng để xác thực webhook)"),
            new SystemSetting("payment.cod_enabled",       "true",               "payment", "Bật thanh toán tiền mặt (COD)"),
            new SystemSetting("payment.bank_enabled",      "true",               "payment", "Bật chuyển khoản ngân hàng"),
            new SystemSetting("payment.payos_enabled",     "true",               "payment", "Bật thanh toán qua PayOS"),
            new SystemSetting("payment.min_online_amount", "10000",              "payment", "Số tiền tối thiểu để thanh toán online (VNĐ)")
        );

        settingService.initializeDefaults(defaults);
        System.out.println("[SystemSettings] Initialized default settings successfully.");
    }
}
