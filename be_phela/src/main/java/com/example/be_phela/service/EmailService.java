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

    @Value("${frontend.customer-url:http://localhost:3001}")
    private String frontendCustomerUrl;

    /**
     * Gửi email xác thực khi đăng ký (Dùng Template chuyên nghiệp)
     */
    @Async
    public void sendVerificationEmail(String to, String token) {
        String verificationLink = baseUrl + "/verify?token=" + token;
        String loginLink = frontendCustomerUrl + "/login-register";
        
        String content = "<p>Chào bạn,</p>"
                + "<p>Chào mừng bạn đến với <strong>Phê La - Nốt Hương Đặc Sản</strong>. Chúng tôi rất vui khi được đồng hành cùng bạn trên hành trình khám phá những hương vị cà phê nguyên bản.</p>"
                + "<p>Để hoàn tất đăng ký và bắt đầu trải nghiệm, vui lòng xác nhận tài khoản của bạn:</p>"
                + "<div style='text-align: center; margin: 45px 0;'>"
                + "<a href='" + verificationLink + "' style='background-color: #1f120b; color: #e5b03c; padding: 20px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 15px; letter-spacing: 1.5px; box-shadow: 0 8px 25px rgba(31,18,11,0.25); display: inline-block; transition: all 0.3s ease;'>XÁC THỰC TÀI KHOẢN</a>"
                + "</div>"
                + "<p style='text-align: center; color: #666; font-size: 14px;'>"
                + "Hoặc bạn có thể truy cập nhanh vào trang đăng nhập: <br/>"
                + "<a href='" + loginLink + "' style='color: #8b5e3c; font-weight: 600; text-decoration: underline;'>Đi tới trang Đăng nhập</a>"
                + "</p>"
                + "<p style='margin-top: 35px; border-top: 1px solid #eee; padding-top: 20px; font-style: italic; color: #777; font-size: 13px;'>"
                + "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Liên kết xác thực này sẽ hết hạn trong vòng 24 giờ."
                + "</p>";

        sendEmail(to, "Chào mừng bạn đến với Phê La - Xác nhận tài khoản", getBaseTemplate("Xác nhận Email", content));
    }

    /**
     * Gửi OTP quên mật khẩu (Dùng Template chuyên nghiệp)
     */
    @Async
    public void sendOtpEmail(String to, String otp) {
        String content = "<p>Chào bạn,</p>"
                + "<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Phê La. Vui lòng sử dụng mã xác thực dưới đây:</p>"
                + "<div style='text-align: center; margin: 40px 0;'>"
                + "  <div style='display: inline-block; letter-spacing: 8px; font-size: 42px; font-weight: 900; color: #1f120b; background: #fdf8f1; padding: 25px 50px; border-radius: 15px; border: 2px solid #e5b03c;'>"
                + otp
                + "  </div>"
                + "</div>"
                + "<p style='color: #555; background: #fff8ee; padding: 15px; border-radius: 8px; border-left: 4px solid #e5b03c; font-size: 14px;'>"
                + "<strong>Lưu ý:</strong> Mã này có hiệu lực trong <strong>10 phút</strong>. Vì lý do bảo mật, tuyệt đối không chia sẻ mã này với bất kỳ ai."
                + "</p>";

        sendEmail(to, "Mã xác thực đặt lại mật khẩu - Phê La", getBaseTemplate("Đặt lại mật khẩu", content));
    }

    /**
     * Thông báo cho Admin khi có khách hàng liên hệ (Dùng Template chuyên nghiệp)
     */
    @Async
    public void sendContactNotification(String customerName, String customerEmail, String content) {
        String contentHtml = "<p>Bạn vừa nhận được một lời nhắn mới từ hệ thống website:</p>"
                + "<div style='background: #f9f9f9; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #eee;'>"
                + "  <p style='margin: 0 0 10px 0;'><strong>Khách hàng:</strong> <span style='color: #1f120b;'>" + customerName + "</span></p>"
                + "  <p style='margin: 0 0 15px 0;'><strong>Email:</strong> <a href='mailto:" + customerEmail + "' style='color: #8b5e3c;'>" + customerEmail + "</a></p>"
                + "  <div style='height: 1px; background: #eee; margin-bottom: 15px;'></div>"
                + "  <p style='margin: 0; line-height: 1.6; white-space: pre-wrap; color: #444;'>\"" + content + "\"</p>"
                + "</div>"
                + "<p style='font-size: 13px; color: #888;'>Vui lòng phản hồi khách hàng sớm nhất có thể.</p>";

        sendEmail(fromEmail, "Liên hệ mới từ " + customerName, getBaseTemplate("Lời nhắn mới", contentHtml));
    }

    /**
     * Gửi email cảm ơn cho khách hàng (Dùng Template chuyên nghiệp)
     */
    @Async
    public void sendAcknowledgmentEmail(String customerName, String customerEmail) {
        String content = "<p>Chào <span style='color: #1f120b; font-weight: bold;'>" + customerName + "</span>,</p>"
                + "<p>Chúng tôi đã nhận được lời nhắn của bạn và rất trân trọng sự quan tâm bạn dành cho Phê La.</p>"
                + "<p>Đội ngũ của chúng tôi sẽ xem xét thông tin và phản hồi bạn trong thời gian sớm nhất (thường là trong vòng 24 giờ làm việc).</p>"
                + "<p>Trong lúc chờ đợi, mời bạn ghé thăm website để cập nhật những câu chuyện mới nhất về hành trình \"Nốt Hương Đặc Sản\" của chúng tôi.</p>"
                + "<p style='margin-top: 30px;'>Thân mến,<br/><strong>Đội ngũ Phê La</strong></p>";

        sendEmail(customerEmail, "Cảm ơn bạn đã liên hệ với Phê La", getBaseTemplate("Hẹn sớm gặp bạn", content));
    }

    private void sendEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail, "Phê La - Nốt Hương Đặc Sản");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Successfully sent email to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to: {} - Error: {}", to, e.getMessage());
        }
    }

    private String getBaseTemplate(String title, String contentHtml) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "<meta charset='UTF-8'>"
                + "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                + "<style>"
                + "  body { margin: 0; padding: 0; background-color: #f5f2f0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }"
                + "  .wrapper { background-color: #f5f2f0; padding: 40px 10px; }"
                + "  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.05); }"
                + "  .header { background-color: #1f120b; padding: 50px 40px; text-align: center; position: relative; }"
                + "  .header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(to right, #e5b03c, #b48a2e); }"
                + "  .logo { width: 100px; margin-bottom: 20px; filter: brightness(0) invert(1); }"
                + "  .brand-name { color: #e5b03c; font-size: 20px; font-weight: 800; letter-spacing: 6px; margin: 0; text-transform: uppercase; }"
                + "  .content { padding: 50px 45px; color: #3d2b1f; line-height: 1.8; font-size: 16px; }"
                + "  .title { font-size: 20px; font-weight: 800; color: #1f120b; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; display: block; border-left: 4px solid #e5b03c; padding-left: 15px; }"
                + "  .footer { background-color: #faf8f6; padding: 40px; text-align: center; border-top: 1px solid #f0edea; }"
                + "  .footer-text { color: #8c8179; font-size: 13px; margin: 8px 0; font-weight: 500; }"
                + "  .social-links { margin-top: 20px; }"
                + "  .social-link { color: #1f120b; text-decoration: none; margin: 0 10px; font-weight: 700; font-size: 12px; }"
                + "  .highlight { color: #b48a2e; font-weight: 700; }"
                + "  p { margin-bottom: 20px; }"
                + "  a { color: #e5b03c; text-decoration: none; }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "<div class='wrapper'>"
                + "  <div class='container'>"
                + "    <div class='header'>"
                + "      <img src='https://phela.vn/wp-content/uploads/2021/08/logo-phe-la.png' class='logo' alt='Phe La Logo'>"
                + "      <h1 class='brand-name'>Phê La</h1>"
                + "    </div>"
                + "    <div class='content'>"
                + "      <span class='title'>" + title + "</span>"
                + "      " + contentHtml
                + "    </div>"
                + "    <div class='footer'>"
                + "      <p class='footer-text'><strong>Phê La - Nốt Hương Đặc Sản</strong></p>"
                + "      <p class='footer-text'>📍 289 Đinh Bộ Lĩnh, P.26, Q.Bình Thạnh, TP. HCM</p>"
                + "      <p class='footer-text'>📞 Hotline: <span class='highlight'>1900 3013</span></p>"
                + "      <div class='social-links'>"
                + "        <a href='https://phela.vn' class='social-link'>WEBSITE</a>"
                + "        <a href='#' class='social-link'>FACEBOOK</a>"
                + "        <a href='#' class='social-link'>INSTAGRAM</a>"
                + "      </div>"
                + "      <p style='font-size: 11px; color: #b0a8a2; margin-top: 25px; font-weight: 400;'>© 2024 Phê La Coffee. All rights reserved.</p>"
                + "    </div>"
                + "  </div>"
                + "</div>"
                + "</body>"
                + "</html>";
    }
}