package com.example.be_phela.dto.request;

import com.example.be_phela.dto.response.ProductResponseDTO;
import java.util.List;

public class OrderItemDTO {
    private String orderItemId;
    private String productId;
    private String productName;
    private String productSizeId;
    private String productSizeName;
    private Integer quantity;
    private Double price;
    private Double amount;
    private String note;
    private List<ProductResponseDTO> selectedToppings;

    public OrderItemDTO() {}

    // Getters and Setters
    public String getOrderItemId() { return orderItemId; }
    public void setOrderItemId(String orderItemId) { this.orderItemId = orderItemId; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductSizeId() { return productSizeId; }
    public void setProductSizeId(String productSizeId) { this.productSizeId = productSizeId; }

    public String getProductSizeName() { return productSizeName; }
    public void setProductSizeName(String productSizeName) { this.productSizeName = productSizeName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public List<ProductResponseDTO> getSelectedToppings() { return selectedToppings; }
    public void setSelectedToppings(List<ProductResponseDTO> selectedToppings) { this.selectedToppings = selectedToppings; }

    // Manual Builder
    public static OrderItemDTOBuilder builder() {
        return new OrderItemDTOBuilder();
    }

    public static class OrderItemDTOBuilder {
        private String orderItemId;
        private String productId;
        private String productName;
        private String productSizeId;
        private String productSizeName;
        private Integer quantity;
        private Double price;
        private Double amount;
        private String note;
        private List<ProductResponseDTO> selectedToppings;

        public OrderItemDTOBuilder orderItemId(String orderItemId) { this.orderItemId = orderItemId; return this; }
        public OrderItemDTOBuilder productId(String productId) { this.productId = productId; return this; }
        public OrderItemDTOBuilder productName(String productName) { this.productName = productName; return this; }
        public OrderItemDTOBuilder productSizeId(String productSizeId) { this.productSizeId = productSizeId; return this; }
        public OrderItemDTOBuilder productSizeName(String productSizeName) { this.productSizeName = productSizeName; return this; }
        public OrderItemDTOBuilder quantity(Integer quantity) { this.quantity = quantity; return this; }
        public OrderItemDTOBuilder price(Double price) { this.price = price; return this; }
        public OrderItemDTOBuilder amount(Double amount) { this.amount = amount; return this; }
        public OrderItemDTOBuilder note(String note) { this.note = note; return this; }
        public OrderItemDTOBuilder selectedToppings(List<ProductResponseDTO> selectedToppings) { this.selectedToppings = selectedToppings; return this; }

        public OrderItemDTO build() {
            OrderItemDTO dto = new OrderItemDTO();
            dto.setOrderItemId(orderItemId);
            dto.setProductId(productId);
            dto.setProductName(productName);
            dto.setProductSizeId(productSizeId);
            dto.setProductSizeName(productSizeName);
            dto.setQuantity(quantity);
            dto.setPrice(price);
            dto.setAmount(amount);
            dto.setNote(note);
            dto.setSelectedToppings(selectedToppings);
            return dto;
        }
    }
}
