package com.example.be_phela.dto.request;

import com.example.be_phela.model.enums.PaymentMethod;
import java.util.List;

public class OrderCreateDTO {
    private String customerId;
    private String cartId;
    private String addressId;
    private String branchCode;
    private String note;
    private String addressText;
    private String phone;
    private String receiverName;
    private String voucherCode;
    private Double totalAmount;
    private Double shippingFee;
    private Double finalAmount;
    private PaymentMethod paymentMethod;
    private Integer notesUsed;
    private List<OrderItemDTO> items;

    public OrderCreateDTO() {}

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getCartId() { return cartId; }
    public void setCartId(String cartId) { this.cartId = cartId; }

    public String getAddressId() { return addressId; }
    public void setAddressId(String addressId) { this.addressId = addressId; }

    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getAddressText() { return addressText; }
    public void setAddressText(String addressText) { this.addressText = addressText; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }

    public String getVoucherCode() { return voucherCode; }
    public void setVoucherCode(String voucherCode) { this.voucherCode = voucherCode; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public Double getShippingFee() { return shippingFee; }
    public void setShippingFee(Double shippingFee) { this.shippingFee = shippingFee; }

    public Double getFinalAmount() { return finalAmount; }
    public void setFinalAmount(Double finalAmount) { this.finalAmount = finalAmount; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public List<OrderItemDTO> getItems() { return items; }
    public void setItems(List<OrderItemDTO> items) { this.items = items; }

    public Integer getNotesUsed() { return notesUsed; }
    public void setNotesUsed(Integer notesUsed) { this.notesUsed = notesUsed; }
}
