package com.example.be_phela.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

@Entity(name = "order_item_topping")
public class OrderItemTopping {
    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    @JsonIgnore
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topping_id", nullable = false)
    private Product topping;

    @Column(name = "topping_name")
    private String toppingName;

    @Column(name = "price", nullable = false)
    private Double price;

    @Column(name = "quantity")
    private Integer quantity = 1;

    public OrderItemTopping() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public OrderItem getOrderItem() { return orderItem; }
    public void setOrderItem(OrderItem orderItem) { this.orderItem = orderItem; }

    public Product getTopping() { return topping; }
    public void setTopping(Product topping) { this.topping = topping; }

    public String getToppingName() { return toppingName; }
    public void setToppingName(String toppingName) { this.toppingName = toppingName; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    
    // Compatibility helper for OrderService
    public String getProductId() {
        return topping != null ? topping.getProductId() : null;
    }

    // Manual Builder
    public static OrderItemToppingBuilder builder() {
        return new OrderItemToppingBuilder();
    }

    public static class OrderItemToppingBuilder {
        private String id;
        private OrderItem orderItem;
        private Product topping;
        private String toppingName;
        private Double price;
        private Integer quantity = 1;

        public OrderItemToppingBuilder id(String id) { this.id = id; return this; }
        public OrderItemToppingBuilder orderItem(OrderItem orderItem) { this.orderItem = orderItem; return this; }
        public OrderItemToppingBuilder topping(Product topping) { this.topping = topping; return this; }
        public OrderItemToppingBuilder toppingName(String toppingName) { this.toppingName = toppingName; return this; }
        public OrderItemToppingBuilder price(Double price) { this.price = price; return this; }
        public OrderItemToppingBuilder quantity(Integer quantity) { this.quantity = quantity; return this; }

        public OrderItemTopping build() {
            OrderItemTopping oit = new OrderItemTopping();
            oit.setId(this.id);
            oit.setOrderItem(this.orderItem);
            oit.setTopping(this.topping);
            oit.setToppingName(this.toppingName);
            oit.setPrice(this.price);
            oit.setQuantity(this.quantity);
            return oit;
        }
    }
}
