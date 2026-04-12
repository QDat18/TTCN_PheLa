package com.example.be_phela.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.UuidGenerator;

import java.util.List;

@Entity(name = "cart_item")
public class CartItem {
    @Id
    @UuidGenerator
    @Column(name = "cart_item_id", nullable = false, unique = true)
    private String cartItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_size_id")
    private ProductSize productSize;

    @NotNull(message = "Quantity is required")
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "note")
    private String note;

    @Column(name = "size")
    private String size;

    @Column(name = "ice")
    private String ice;

    @Column(name = "sugar")
    private String sugar;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "cart_item_toppings",
            joinColumns = @JoinColumn(name = "cart_item_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private List<Product> toppings;

    public CartItem() {}

    // Getters and Setters
    public String getCartItemId() { return cartItemId; }
    public void setCartItemId(String cartItemId) { this.cartItemId = cartItemId; }

    public Cart getCart() { return cart; }
    public void setCart(Cart cart) { this.cart = cart; }

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

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getIce() { return ice; }
    public void setIce(String ice) { this.ice = ice; }

    public String getSugar() { return sugar; }
    public void setSugar(String sugar) { this.sugar = sugar; }

    public List<Product> getToppings() { return toppings; }
    public void setToppings(List<Product> toppings) { this.toppings = toppings; }

    // Manual Builder
    public static CartItemBuilder builder() {
        return new CartItemBuilder();
    }

    public static class CartItemBuilder {
        private String cartItemId;
        private Cart cart;
        private Product product;
        private ProductSize productSize;
        private Integer quantity;
        private Double amount;
        private String note;
        private String size;
        private String ice;
        private String sugar;
        private List<Product> toppings;

        public CartItemBuilder cartItemId(String cartItemId) { this.cartItemId = cartItemId; return this; }
        public CartItemBuilder cart(Cart cart) { this.cart = cart; return this; }
        public CartItemBuilder product(Product product) { this.product = product; return this; }
        public CartItemBuilder productSize(ProductSize productSize) { this.productSize = productSize; return this; }
        public CartItemBuilder quantity(Integer quantity) { this.quantity = quantity; return this; }
        public CartItemBuilder amount(Double amount) { this.amount = amount; return this; }
        public CartItemBuilder note(String note) { this.note = note; return this; }
        public CartItemBuilder size(String size) { this.size = size; return this; }
        public CartItemBuilder ice(String ice) { this.ice = ice; return this; }
        public CartItemBuilder sugar(String sugar) { this.sugar = sugar; return this; }
        public CartItemBuilder toppings(List<Product> toppings) { this.toppings = toppings; return this; }

        public CartItem build() {
            CartItem ci = new CartItem();
            ci.setCartItemId(this.cartItemId);
            ci.setCart(this.cart);
            ci.setProduct(this.product);
            ci.setProductSize(this.productSize);
            ci.setQuantity(this.quantity);
            ci.setAmount(this.amount);
            ci.setNote(this.note);
            ci.setSize(this.size);
            ci.setIce(this.ice);
            ci.setSugar(this.sugar);
            ci.setToppings(this.toppings);
            return ci;
        }
    }
}
