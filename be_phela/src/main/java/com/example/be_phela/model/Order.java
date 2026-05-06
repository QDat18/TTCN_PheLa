package com.example.be_phela.model;

import com.example.be_phela.model.enums.OrderStatus;
import com.example.be_phela.model.enums.PaymentMethod;
import com.example.be_phela.model.enums.PaymentStatus;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "orders")
public class Order {
    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "order_code", nullable = false, unique = true)
    private String orderCode;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    @Column(name = "final_amount", nullable = false)
    private Double finalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus;

    @Column(name = "note")
    private String note;

    @Column(name = "address_text")
    private String addressText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_code")
    private Branch branch;

    @Column(name = "shipping_fee")
    private Double shippingFee = 0.0;

    @Column(name = "phone")
    private String phone;

    @Column(name = "receiver_name")
    private String receiverName;

    @Column(name = "voucher_code")
    private String voucherCode;

    @Column(name = "discount_amount")
    private Double discountAmount = 0.0;

    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Column(name = "notes_used")
    private Integer notesUsed = 0;

    @Column(name = "notes_earned")
    private Integer notesEarned = 0;

    @Column(name = "delivery_date")
    private LocalDateTime deliveryDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @JsonManagedReference
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 20)
    private List<OrderItem> orderItems = new ArrayList<>();

    public Order() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getOrderId() { return id; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public Double getFinalAmount() { return finalAmount; }
    public void setFinalAmount(Double finalAmount) { this.finalAmount = finalAmount; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getAddressText() { return addressText; }
    public void setAddressText(String addressText) { this.addressText = addressText; }

    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }

    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public Double getShippingFee() { return shippingFee; }
    public void setShippingFee(Double shippingFee) { this.shippingFee = shippingFee; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }

    public String getVoucherCode() { return voucherCode; }
    public void setVoucherCode(String voucherCode) { this.voucherCode = voucherCode; }

    public Double getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(Double discountAmount) { this.discountAmount = discountAmount; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }

    public LocalDateTime getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDateTime deliveryDate) { this.deliveryDate = deliveryDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Integer getNotesUsed() { return notesUsed; }
    public void setNotesUsed(Integer notesUsed) { this.notesUsed = notesUsed; }

    public Integer getNotesEarned() { return notesEarned; }
    public void setNotesEarned(Integer notesEarned) { this.notesEarned = notesEarned; }

    public List<OrderItem> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; }

    // Manual Builder
    public static OrderBuilder builder() {
        return new OrderBuilder();
    }

    public static class OrderBuilder {
        private String id;
        private String orderCode;
        private Customer customer;
        private Double totalAmount;
        private Double finalAmount;
        private OrderStatus status;
        private PaymentMethod paymentMethod;
        private PaymentStatus paymentStatus;
        private String note;
        private String addressText;
        private Address address;
        private Branch branch;
        private Double shippingFee = 0.0;
        private String phone;
        private String receiverName;
        private String voucherCode;
        private Double discountAmount = 0.0;
        private LocalDateTime orderDate;
        private LocalDateTime deliveryDate;
        private Integer notesUsed = 0;
        private Integer notesEarned = 0;
        private List<OrderItem> orderItems = new ArrayList<>();

        public OrderBuilder id(String id) { this.id = id; return this; }
        public OrderBuilder orderCode(String orderCode) { this.orderCode = orderCode; return this; }
        public OrderBuilder customer(Customer customer) { this.customer = customer; return this; }
        public OrderBuilder totalAmount(Double totalAmount) { this.totalAmount = totalAmount; return this; }
        public OrderBuilder finalAmount(Double finalAmount) { this.finalAmount = finalAmount; return this; }
        public OrderBuilder status(OrderStatus status) { this.status = status; return this; }
        public OrderBuilder paymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; return this; }
        public OrderBuilder paymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; return this; }
        public OrderBuilder note(String note) { this.note = note; return this; }
        public OrderBuilder addressText(String addressText) { this.addressText = addressText; return this; }
        public OrderBuilder address(Address address) { this.address = address; return this; }
        public OrderBuilder branch(Branch branch) { this.branch = branch; return this; }
        public OrderBuilder shippingFee(Double shippingFee) { this.shippingFee = shippingFee; return this; }
        public OrderBuilder phone(String phone) { this.phone = phone; return this; }
        public OrderBuilder receiverName(String receiverName) { this.receiverName = receiverName; return this; }
        public OrderBuilder voucherCode(String voucherCode) { this.voucherCode = voucherCode; return this; }
        public OrderBuilder discountAmount(Double discountAmount) { this.discountAmount = discountAmount; return this; }
        public OrderBuilder orderDate(LocalDateTime orderDate) { this.orderDate = orderDate; return this; }
        public OrderBuilder deliveryDate(LocalDateTime deliveryDate) { this.deliveryDate = deliveryDate; return this; }
        public OrderBuilder notesUsed(Integer notesUsed) { this.notesUsed = notesUsed; return this; }
        public OrderBuilder notesEarned(Integer notesEarned) { this.notesEarned = notesEarned; return this; }
        public OrderBuilder orderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; return this; }

        public Order build() {
            Order o = new Order();
            o.setId(this.id);
            o.setOrderCode(this.orderCode);
            o.setCustomer(this.customer);
            o.setTotalAmount(this.totalAmount);
            o.setFinalAmount(this.finalAmount);
            o.setStatus(this.status);
            o.setPaymentMethod(this.paymentMethod);
            o.setPaymentStatus(this.paymentStatus);
            o.setNote(this.note);
            o.setAddressText(this.addressText);
            o.setAddress(this.address);
            o.setBranch(this.branch);
            o.setShippingFee(this.shippingFee);
            o.setPhone(this.phone);
            o.setReceiverName(this.receiverName);
            o.setVoucherCode(this.voucherCode);
            o.setDiscountAmount(this.discountAmount);
            o.setOrderDate(this.orderDate);
            o.setDeliveryDate(this.deliveryDate);
            o.setNotesUsed(this.notesUsed);
            o.setNotesEarned(this.notesEarned);
            o.setOrderItems(this.orderItems);
            return o;
        }
    }
}
