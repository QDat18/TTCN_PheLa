package com.example.be_phela.service;

import com.example.be_phela.dto.request.CartItemDTO;
import com.example.be_phela.model.Cart;
import com.example.be_phela.repository.CartRepository;
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.service.MemoryId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class AiTools {

    private final CartService cartService;
    private final CartRepository cartRepository;

    @Tool("Thêm sản phẩm vào giỏ hàng cho khách hàng. Luôn mặc định size PHÊ trừ khi khách yêu cầu khác.")
    public String addToCart(
            @MemoryId String customerId, // <--- BẮT BUỘC: Giúp LangChain4j tự động tiêm Session ID vào đây
            @P("Mã ID của sản phẩm (ví dụ: sp01, sp02). Bạn PHẢI tìm mã này trong KNOWLEDGE_BASE.") String productId,
            @P("Số lượng ly/cốc mà khách muốn đặt. Mặc định là 1 nếu khách không nói rõ.") int quantity,
            @P("Ghi chú thêm của khách hàng (ví dụ: ít đá, nhiều đường). Để trống nếu không có.") String note) {
            
        log.info("AI Tool triggered: Adding product {} to cart for customer {}", productId, customerId);
        
        try {
            // 1. Lấy giỏ hàng hiện tại hoặc tạo mới nếu chưa có
            Cart cart = cartRepository.findByCustomer_CustomerId(customerId)
                    .orElseGet(() -> cartService.createCartForCustomer(customerId));
            
            // 2. Đóng gói dữ liệu sản phẩm
            CartItemDTO dto = CartItemDTO.builder()
                    .productId(productId)
                    .quantity(quantity > 0 ? quantity : 1)
                    .note(note)
                    .productSizeName("PHÊ") // Ép cứng mặc định là size PHÊ
                    .build();

            // 3. Thêm vào giỏ
            cartService.addOrUpdateCartItem(cart.getCartId(), dto);
            
            return "Mình đã thêm món này vào túi hàng cho bạn với size PHÊ (mặc định) rồi nhé. Bạn có muốn đổi sang size khác hay thêm chút nhắn nhủ gì cho ly trà này không?";
            
        } catch (Exception e) {
            log.error("AI Tool Error: Failed to add to cart", e);
            return "Thật tiếc, mình gặp chút lỗi khi thêm vào túi hàng. Bạn vui lòng thử lại sau hoặc chọn trực tiếp trên thực đơn nhé!";
        }
    }
}