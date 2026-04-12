package com.example.be_phela.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    /**
     * Gửi email xác thực khi đăng ký (Dùng Template chuyên nghiệp)
     */
    @Async
    public void sendVerificationEmail(String to, String token) {
        String verificationLink = baseUrl + "/verify?token=" + token;
        String content = "<p>Chào bạn,</p>"
                + "<p>Cảm ơn bạn đã đồng hành cùng Phê La. Để bảo vệ tài khoản của mình, vui lòng xác nhận địa chỉ email bằng cách nhấn vào nút bên dưới:</p>"
                + "<div style='text-align: center; margin: 40px 0;'>"
                + "<a href='" + verificationLink + "' style='background-color: #1f120b; color: #e5b03c; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 14px; letter-spacing: 2px; box-shadow: 0 5px 15px rgba(31,18,11,0.3);'>XÁC NHẬN EMAIL NGAY</a>"
                + "</div>"
                + "<p style='font-size: 13px; color: #666;'>Nếu bạn không thực hiện yêu cầu này, xin vui lòng bỏ qua email.</p>";

        sendEmail(to, "Xác nhận đăng ký tài khoản - Phê La", getBaseTemplate("Xác nhận Email", content));
    }

    /**
     * Gửi OTP quên mật khẩu (Dùng Template chuyên nghiệp)
     */
    @Async
    public void sendOtpEmail(String to, String otp) {
        String content = "<p>Chào bạn,</p>"
                + "<p>Bạn đã yêu cầu đặt lại mật khẩu tại Phê La. Mã bảo mật (OTP) của bạn là:</p>"
                + "<div style='text-align: center; margin: 30px 0; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #1f120b; background: #f9f3ea; padding: 30px; border-radius: 15px; border: 1px dashed #e5b03c;'>"
                + otp
                + "</div>"
                + "<p style='color: #666;'>Mã này có hiệu lực trong <span class='highlight'>10 phút</span>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai khác.</p>";

        sendEmail(to, "Mã OTP đặt lại mật khẩu - Phê La", getBaseTemplate("Đặt lại mật khẩu", content));
    }

    /**
     * Thông báo cho Admin khi có khách hàng liên hệ (Dùng Template chuyên nghiệp)
     */
    @Async
    public void sendContactNotification(String customerName, String customerEmail, String content) {
        String contentHtml = "<p>Bạn có một lời nhắn mới từ khách hàng quan tâm đến Phê La:</p>"
                + "<div style='background: #fcfcfc; border-left: 4px solid #e5b03c; padding: 20px; margin: 25px 0;'>"
                + "  <p style='margin: 0;'><strong>Khách hàng:</strong> <span class='highlight'>" + customerName + "</span></p>"
                + "  <p style='margin: 5px 0;'><strong>Email:</strong> " + customerEmail + "</p>"
                + "</div>"
                + "<div style='background: #f9f3ea; padding: 20px; border-radius: 10px;'>"
                + "  <p style='margin: 0; font-style: normal; white-space: pre-wrap;'>" + content + "</p>"
                + "</div>";

        sendEmail(fromEmail, "Thông báo: Liên hệ mới từ " + customerName, getBaseTemplate("Lời nhắn mới", contentHtml));
    }

    /**
     * Gửi email cảm ơn cho khách hàng (Dùng Template chuyên nghiệp)
     */
    @Async
    public void sendAcknowledgmentEmail(String customerName, String customerEmail) {
        String content = "<p>Chào <span class='highlight'>" + customerName + "</span>,</p>"
                + "<p>Chúng tôi đã nhận được lời nhắn của bạn và rất trân trọng sự quan tâm bạn dành cho Phê La.</p>"
                + "<p>Đội ngũ chăm sóc khách hàng của chúng tôi sẽ xem xét và phản hồi bạn trong thời gian sớm nhất (thường trong vòng 24h làm việc).</p>"
                + "<p>Trong lúc chờ đợi, hãy tiếp tục khám phá những nốt hương đặc sản của chúng tôi bạn nhé!</p>";

        sendEmail(customerEmail, "Cảm ơn bạn đã liên hệ với Phê La", getBaseTemplate("Hẹn gặp bạn sớm", content));
    }

    private void sendEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            // Thiết lập tên hiển thị của cửa hàng chuyên nghiệp
            helper.setFrom(fromEmail, "Phê La - Nốt Hương Đặc Sản");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Successfully sent email to: {} with subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to: {} - Error: {}", to, e.getMessage());
        }
    }

    // Helper: Tạo khung template chung cho email (Luxury Brand Look)
    private String getBaseTemplate(String title, String contentHtml) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "<meta charset='UTF-8'>"
                + "<style>"
                + "  body { margin: 0; padding: 0; background-color: #f9f3ea; font-family: 'Segoe UI', Arial, sans-serif; }"
                + "  .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e0e0e0; }"
                + "  .header { background-color: #1f120b; padding: 40px 20px; text-align: center; }"
                + "  .logo { width: 120px; margin-bottom: 20px; filter: brightness(0) invert(1); }"
                + "  .brand-name { color: #e5b03c; font-size: 24px; font-weight: 800; letter-spacing: 5px; margin: 0; text-transform: uppercase; }"
                + "  .content { padding: 40px; color: #1a120b; line-height: 1.8; }"
                + "  .title { font-size: 22px; font-weight: 900; color: #1f120b; margin-bottom: 25px; text-transform: uppercase; border-bottom: 2px solid #e5b03c; display: inline-block; padding-bottom: 10px; }"
                + "  .footer { background-color: #fcfaf7; padding: 30px; text-align: center; border-top: 1px solid #eeeeee; }"
                + "  .footer-text { color: #888888; font-size: 12px; margin: 5px 0; font-weight: 600; }"
                + "  .highlight { color: #e5b03c; font-weight: bold; }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "<div class='container'>"
                + "  <div class='header'>"
                + "    <img src='https://phela.vn/wp-content/uploads/2021/08/logo-phe-la.png' class='logo' alt='Phe La Logo'>"
                + "    <h1 class='brand-name'>Phê La</h1>"
                + "  </div>"
                + "  <div class='content'>"
                + "    <div class='title'>" + title + "</div>"
                + "    " + contentHtml
                + "  </div>"
                + "  <div class='footer'>"
                + "    <p class='footer-text'>Phê La - Nốt Hương Đặc Sản</p>"
                + "    <p class='footer-text'>Địa chỉ: 289 Đinh Bộ Lĩnh, Bình Thạnh, TP. HCM</p>"
                + "    <p class='footer-text'>Hotline: <span class='highlight'>1900 3013</span></p>"
                + "  </div>"
                + "</div>"
                + "</body>"
                + "</html>";
    }
}