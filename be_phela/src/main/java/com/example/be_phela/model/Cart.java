package com.example.be_phela.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "cart")
public class Cart {
    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnore
    private Customer customer;

    @JsonManagedReference
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 20)
    private List<CartItem> cartItems = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_code")
    private Branch branch;

    @Column(name = "total_amount")
    private Double totalAmount = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Cart() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getCartId() { return id; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public List<CartItem> getCartItems() { return cartItems; }
    public void setCartItems(List<CartItem> cartItems) { this.cartItems = cartItems; }

    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }

    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Manual Builder
    public static CartBuilder builder() {
        return new CartBuilder();
    }

    public static class CartBuilder {
        private String id;
        private Customer customer;
        private List<CartItem> cartItems = new ArrayList<>();
        private Address address;
        private Branch branch;
        private Double totalAmount = 0.0;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public CartBuilder id(String id) { this.id = id; return this; }
        public CartBuilder customer(Customer customer) { this.customer = customer; return this; }
        public CartBuilder cartItems(List<CartItem> cartItems) { this.cartItems = cartItems; return this; }
        public CartBuilder address(Address address) { this.address = address; return this; }
        public CartBuilder branch(Branch branch) { this.branch = branch; return this; }
        public CartBuilder totalAmount(Double totalAmount) { this.totalAmount = totalAmount; return this; }
        public CartBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public CartBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Cart build() {
            Cart c = new Cart();
            c.setId(this.id);
            c.setCustomer(this.customer);
            c.setCartItems(this.cartItems);
            c.setAddress(this.address);
            c.setBranch(this.branch);
            c.setTotalAmount(this.totalAmount);
            c.setCreatedAt(this.createdAt);
            c.setUpdatedAt(this.updatedAt);
            return c;
        }
    }
}