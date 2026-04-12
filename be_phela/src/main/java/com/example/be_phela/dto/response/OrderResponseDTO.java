package com.example.be_phela.dto.response;

import com.example.be_phela.dto.request.OrderItemDTO;
import com.example.be_phela.model.enums.OrderStatus;
import com.example.be_phela.model.enums.PaymentMethod;
import com.example.be_phela.model.enums.PaymentStatus;

import java.time.LocalDateTime;
import java.util.List;

public class OrderResponseDTO {
    private String orderId;
    private String orderCode;
    private Double totalAmount;
    private String customerId;
    private CustomerResponseDTO customer;
    private String addressId;
    private AddressDTO address;
    private String branchCode;
    private BranchResponseDTO branch;
    private OrderStatus status;
    private LocalDateTime orderDate;
    private LocalDateTime updatedAt;
    private LocalDateTime deliveryDate;
    private Double shippingFee;
    private Double finalAmount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String note;
    private String addressText;
    private String voucherCode;
    private Double discountAmount;
    private Integer notesUsed;
    private Integer notesEarned;
    private List<OrderItemDTO> orderItems;

    public OrderResponseDTO() {}

    // Getters and Setters
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    
    public CustomerResponseDTO getCustomer() { return customer; }
    public void setCustomer(CustomerResponseDTO customer) { this.customer = customer; }

    public String getAddressId() { return addressId; }
    public void setAddressId(String addressId) { this.addressId = addressId; }

    public AddressDTO getAddress() { return address; }
    public void setAddress(AddressDTO address) { this.address = address; }

    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }

    public BranchResponseDTO getBranch() { return branch; }
    public void setBranch(BranchResponseDTO branch) { this.branch = branch; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDateTime deliveryDate) { this.deliveryDate = deliveryDate; }

    public Double getShippingFee() { return shippingFee; }
    public void setShippingFee(Double shippingFee) { this.shippingFee = shippingFee; }

    public Double getFinalAmount() { return finalAmount; }
    public void setFinalAmount(Double finalAmount) { this.finalAmount = finalAmount; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getAddressText() { return addressText; }
    public void setAddressText(String addressText) { this.addressText = addressText; }

    public String getVoucherCode() { return voucherCode; }
    public void setVoucherCode(String voucherCode) { this.voucherCode = voucherCode; }

    public Double getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(Double discountAmount) { this.discountAmount = discountAmount; }

    public Integer getNotesUsed() { return notesUsed; }
    public void setNotesUsed(Integer notesUsed) { this.notesUsed = notesUsed; }

    public Integer getNotesEarned() { return notesEarned; }
    public void setNotesEarned(Integer notesEarned) { this.notesEarned = notesEarned; }

    public List<OrderItemDTO> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItemDTO> orderItems) { this.orderItems = orderItems; }

    // Manual Builder
    public static OrderResponseDTOBuilder builder() {
        return new OrderResponseDTOBuilder();
    }

    public static class OrderResponseDTOBuilder {
        private String orderId;
        private String orderCode;
        private Double totalAmount;
        private String customerId;
        private CustomerResponseDTO customer;
        private String addressId;
        private AddressDTO address;
        private String branchCode;
        private BranchResponseDTO branch;
        private OrderStatus status;
        private LocalDateTime orderDate;
        private LocalDateTime updatedAt;
        private LocalDateTime deliveryDate;
        private Double shippingFee;
        private Double finalAmount;
        private PaymentMethod paymentMethod;
        private PaymentStatus paymentStatus;
        private String note;
        private String addressText;
        private String voucherCode;
        private Double discountAmount;
        private Integer notesUsed;
        private Integer notesEarned;
        private List<OrderItemDTO> orderItems;

        public OrderResponseDTOBuilder orderId(String orderId) { this.orderId = orderId; return this; }
        public OrderResponseDTOBuilder orderCode(String orderCode) { this.orderCode = orderCode; return this; }
        public OrderResponseDTOBuilder totalAmount(Double totalAmount) { this.totalAmount = totalAmount; return this; }
        public OrderResponseDTOBuilder customerId(String customerId) { this.customerId = customerId; return this; }
        public OrderResponseDTOBuilder customer(CustomerResponseDTO customer) { this.customer = customer; return this; }
        public OrderResponseDTOBuilder addressId(String addressId) { this.addressId = addressId; return this; }
        public OrderResponseDTOBuilder address(AddressDTO address) { this.address = address; return this; }
        public OrderResponseDTOBuilder branchCode(String branchCode) { this.branchCode = branchCode; return this; }
        public OrderResponseDTOBuilder branch(BranchResponseDTO branch) { this.branch = branch; return this; }
        public OrderResponseDTOBuilder status(OrderStatus status) { this.status = status; return this; }
        public OrderResponseDTOBuilder orderDate(LocalDateTime orderDate) { this.orderDate = orderDate; return this; }
        public OrderResponseDTOBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public OrderResponseDTOBuilder deliveryDate(LocalDateTime deliveryDate) { this.deliveryDate = deliveryDate; return this; }
        public OrderResponseDTOBuilder shippingFee(Double shippingFee) { this.shippingFee = shippingFee; return this; }
        public OrderResponseDTOBuilder finalAmount(Double finalAmount) { this.finalAmount = finalAmount; return this; }
        public OrderResponseDTOBuilder paymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; return this; }
        public OrderResponseDTOBuilder paymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; return this; }
        public OrderResponseDTOBuilder note(String note) { this.note = note; return this; }
        public OrderResponseDTOBuilder addressText(String addressText) { this.addressText = addressText; return this; }
        public OrderResponseDTOBuilder voucherCode(String voucherCode) { this.voucherCode = voucherCode; return this; }
        public OrderResponseDTOBuilder discountAmount(Double discountAmount) { this.discountAmount = discountAmount; return this; }
        public OrderResponseDTOBuilder notesUsed(Integer notesUsed) { this.notesUsed = notesUsed; return this; }
        public OrderResponseDTOBuilder notesEarned(Integer notesEarned) { this.notesEarned = notesEarned; return this; }
        public OrderResponseDTOBuilder orderItems(List<OrderItemDTO> orderItems) { this.orderItems = orderItems; return this; }

        public OrderResponseDTO build() {
            OrderResponseDTO dto = new OrderResponseDTO();
            dto.setOrderId(orderId);
            dto.setOrderCode(orderCode);
            dto.setTotalAmount(totalAmount);
            dto.setCustomerId(customerId);
            dto.setCustomer(customer);
            dto.setAddressId(addressId);
            dto.setAddress(address);
            dto.setBranchCode(branchCode);
            dto.setBranch(branch);
            dto.setStatus(status);
            dto.setOrderDate(orderDate);
            dto.setUpdatedAt(updatedAt);
            dto.setDeliveryDate(deliveryDate);
            dto.setShippingFee(shippingFee);
            dto.setFinalAmount(finalAmount);
            dto.setPaymentMethod(paymentMethod);
            dto.setPaymentStatus(paymentStatus);
            dto.setNote(note);
            dto.setAddressText(addressText);
            dto.setVoucherCode(voucherCode);
            dto.setDiscountAmount(discountAmount);
            dto.setNotesUsed(notesUsed);
            dto.setNotesEarned(notesEarned);
            dto.setOrderItems(orderItems);
            return dto;
        }
    }
}
