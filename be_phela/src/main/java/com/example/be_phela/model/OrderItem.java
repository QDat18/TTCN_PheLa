package com.example.be_phela.model;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.UuidGenerator;

import java.util.ArrayList;
import java.util.List;

@Entity(name = "order_items")
public class OrderItem {
    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false)
    private String orderItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_size_id")
    private ProductSize productSize;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "note")
    private String note;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "order_item_toppings",
            joinColumns = @JoinColumn(name = "order_item_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    @BatchSize(size = 20)
    private List<Product> toppings = new ArrayList<>();

    public OrderItem() {}

    // Getters and Setters
    public String getOrderItemId() { return orderItemId; }
    public void setOrderItemId(String orderItemId) { this.orderItemId = orderItemId; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public ProductSize getProductSize() { return productSize; }
    public void setProductSize(ProductSize productSize) { this.productSize = productSize; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public List<Product> getToppings() { return toppings; }
    public void setToppings(List<Product> toppings) { this.toppings = toppings; }

    // Manual Builder
    public static OrderItemBuilder builder() {
        return new OrderItemBuilder();
    }

    public static class OrderItemBuilder {
        private String orderItemId;
        private Order order;
        private Product product;
        private ProductSize productSize;
        private Integer quantity;
        private Double amount;
        private String note;
        private List<Product> toppings = new ArrayList<>();

        public OrderItemBuilder orderItemId(String orderItemId) { this.orderItemId = orderItemId; return this; }
        public OrderItemBuilder order(Order order) { this.order = order; return this; }
        public OrderItemBuilder product(Product product) { this.product = product; return this; }
        public OrderItemBuilder productSize(ProductSize productSize) { this.productSize = productSize; return this; }
        public OrderItemBuilder quantity(Integer quantity) { this.quantity = quantity; return this; }
        public OrderItemBuilder amount(Double amount) { this.amount = amount; return this; }
        public OrderItemBuilder note(String note) { this.note = note; return this; }
        public OrderItemBuilder toppings(List<Product> toppings) { this.toppings = toppings; return this; }

        public OrderItem build() {
            OrderItem item = new OrderItem();
            item.setOrderItemId(this.orderItemId);
            item.setOrder(this.order);
            item.setProduct(this.product);
            item.setProductSize(this.productSize);
            item.setQuantity(this.quantity);
            item.setAmount(this.amount);
            item.setNote(this.note);
            item.setToppings(this.toppings);
            return item;
        }
    }
}
