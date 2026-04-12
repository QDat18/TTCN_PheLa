package com.example.be_phela.interService;

import com.example.be_phela.dto.request.OrderCreateDTO;
import com.example.be_phela.dto.response.CustomerResponseDTO;
import com.example.be_phela.dto.response.OrderResponseDTO;
import com.example.be_phela.model.Order;
import com.example.be_phela.model.enums.OrderStatus;

import java.util.List;
import java.util.Optional;

public interface IOrderService {
    OrderResponseDTO createOrderFromCart(OrderCreateDTO orderCreateDTO);
    void confirmBankTransferPayment(String orderId);
    void rollbackOrderDueToPaymentFailure(String orderId);
    OrderResponseDTO getOrderById(String orderId);
    void cancelOrder(String orderId);
    void updateOrderStatus(String orderId, OrderStatus status, String username);
    List<OrderResponseDTO> getOrdersByCustomerId(String customerId);
    Optional<Order> getOrderByCode(String orderCode);
    Optional<Order> getOrderByCodeWithLock(String orderCode);
    List<OrderResponseDTO> getOrdersByStatus(OrderStatus status);
    CustomerResponseDTO getCustomerByOrderId(String orderId);
    OrderResponseDTO confirmReceipt(String orderId);
}