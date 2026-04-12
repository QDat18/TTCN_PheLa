package com.example.be_phela.dto.request;

import com.example.be_phela.dto.response.ProductResponseDTO;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartItemDTO {
    String cartItemId;
    String productId;
    String productSizeId;
    String productSizeName;
    Integer quantity;
    Double amount;
    String note;
    List<String> toppingIds;
    List<ProductResponseDTO> selectedToppings;

    // Manual Getters
    public String getCartItemId() { return cartItemId; }
    public String getProductId() { return productId; }
    public String getProductSizeId() { return productSizeId; }
    public String getProductSizeName() { return productSizeName; }
    public Integer getQuantity() { return quantity; }
    public Double getAmount() { return amount; }
    public String getNote() { return note; }
    public List<String> getToppingIds() { return toppingIds; }
    public List<ProductResponseDTO> getSelectedToppings() { return selectedToppings; }

    // Manual Builder
    public static CartItemDTOBuilder builder() {
        return new CartItemDTOBuilder();
    }

    public static class CartItemDTOBuilder {
        private String cartItemId;
        private String productId;
        private String productSizeId;
        private String productSizeName;
        private Integer quantity;
        private Double amount;
        private String note;
        private List<String> toppingIds;
        private List<ProductResponseDTO> selectedToppings;

        public CartItemDTOBuilder cartItemId(String cartItemId) { this.cartItemId = cartItemId; return this; }
        public CartItemDTOBuilder productId(String productId) { this.productId = productId; return this; }
        public CartItemDTOBuilder productSizeId(String productSizeId) { this.productSizeId = productSizeId; return this; }
        public CartItemDTOBuilder productSizeName(String productSizeName) { this.productSizeName = productSizeName; return this; }
        public CartItemDTOBuilder quantity(Integer quantity) { this.quantity = quantity; return this; }
        public CartItemDTOBuilder amount(Double amount) { this.amount = amount; return this; }
        public CartItemDTOBuilder note(String note) { this.note = note; return this; }
        public CartItemDTOBuilder toppingIds(List<String> toppingIds) { this.toppingIds = toppingIds; return this; }
        public CartItemDTOBuilder selectedToppings(List<ProductResponseDTO> selectedToppings) { this.selectedToppings = selectedToppings; return this; }

        public CartItemDTO build() {
            return new CartItemDTO(cartItemId, productId, productSizeId, productSizeName, quantity, amount, note, toppingIds, selectedToppings);
        }
    }
}
