package com.example.be_phela.dto.response;

import com.example.be_phela.dto.request.CartItemDTO;
import java.time.LocalDateTime;
import java.util.List;

public class CartResponseDTO {
    private String cartId;
    private String customerId;
    private Double totalAmount;
    private String addressId;
    private AddressDTO address;
    private String branchCode;
    private BranchResponseDTO branch;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CartItemDTO> cartItems;
    private Double distance;
    private Double shippingFee;
    private Double finalAmount;

    public CartResponseDTO() {}

    public CartResponseDTO(String cartId, String customerId, Double totalAmount, String addressId, AddressDTO address, 
                          String branchCode, BranchResponseDTO branch, LocalDateTime createdAt, LocalDateTime updatedAt, 
                          List<CartItemDTO> cartItems, Double distance, Double shippingFee, Double finalAmount) {
        this.cartId = cartId;
        this.customerId = customerId;
        this.totalAmount = totalAmount;
        this.addressId = addressId;
        this.address = address;
        this.branchCode = branchCode;
        this.branch = branch;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.cartItems = cartItems;
        this.distance = distance;
        this.shippingFee = shippingFee;
        this.finalAmount = finalAmount;
    }

    // Getters and Setters
    public String getCartId() { return cartId; }
    public void setCartId(String cartId) { this.cartId = cartId; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public String getAddressId() { return addressId; }
    public void setAddressId(String addressId) { this.addressId = addressId; }

    public AddressDTO getAddress() { return address; }
    public void setAddress(AddressDTO address) { this.address = address; }

    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }

    public BranchResponseDTO getBranch() { return branch; }
    public void setBranch(BranchResponseDTO branch) { this.branch = branch; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<CartItemDTO> getCartItems() { return cartItems; }
    public void setCartItems(List<CartItemDTO> cartItems) { this.cartItems = cartItems; }

    public Double getDistance() { return distance; }
    public void setDistance(Double distance) { this.distance = distance; }

    public Double getShippingFee() { return shippingFee; }
    public void setShippingFee(Double shippingFee) { this.shippingFee = shippingFee; }

    public Double getFinalAmount() { return finalAmount; }
    public void setFinalAmount(Double finalAmount) { this.finalAmount = finalAmount; }

    public static CartResponseDTOBuilder builder() {
        return new CartResponseDTOBuilder();
    }

    public static class CartResponseDTOBuilder {
        private String cartId;
        private String customerId;
        private Double totalAmount;
        private String addressId;
        private AddressDTO address;
        private String branchCode;
        private BranchResponseDTO branch;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<CartItemDTO> cartItems;
        private Double distance;
        private Double shippingFee;
        private Double finalAmount;

        public CartResponseDTOBuilder cartId(String cartId) { this.cartId = cartId; return this; }
        public CartResponseDTOBuilder customerId(String customerId) { this.customerId = customerId; return this; }
        public CartResponseDTOBuilder totalAmount(Double totalAmount) { this.totalAmount = totalAmount; return this; }
        public CartResponseDTOBuilder addressId(String addressId) { this.addressId = addressId; return this; }
        public CartResponseDTOBuilder address(AddressDTO address) { this.address = address; return this; }
        public CartResponseDTOBuilder branchCode(String branchCode) { this.branchCode = branchCode; return this; }
        public CartResponseDTOBuilder branch(BranchResponseDTO branch) { this.branch = branch; return this; }
        public CartResponseDTOBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public CartResponseDTOBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public CartResponseDTOBuilder cartItems(List<CartItemDTO> cartItems) { this.cartItems = cartItems; return this; }
        public CartResponseDTOBuilder distance(Double distance) { this.distance = distance; return this; }
        public CartResponseDTOBuilder distance(double distance) { this.distance = distance; return this; }
        public CartResponseDTOBuilder shippingFee(Double shippingFee) { this.shippingFee = shippingFee; return this; }
        public CartResponseDTOBuilder finalAmount(Double finalAmount) { this.finalAmount = finalAmount; return this; }

        public CartResponseDTO build() {
            return new CartResponseDTO(cartId, customerId, totalAmount, addressId, address, branchCode, branch, createdAt, updatedAt, cartItems, distance, shippingFee, finalAmount);
        }
    }
}
