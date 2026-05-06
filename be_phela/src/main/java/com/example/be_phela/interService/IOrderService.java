package com.example.be_phela.interService;

import com.example.be_phela.dto.request.OrderCreateDTO;
import com.example.be_phela.dto.response.CustomerResponseDTO;
import com.example.be_phela.dto.response.OrderResponseDTO;
import com.example.be_phela.model.Order;
import com.example.be_phela.model.enums.OrderStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface IOrderService {
    OrderResponseDTO createOrderFromCart(OrderCreateDTO orderCreateDTO);
    void confirmBankTransferPayment(String orderId);
    void rollbackOrderDueToPaymentFailure(String orderId);
    OrderResponseDTO getOrderById(String orderId);
    void cancelOrder(String orderId);
    void updateOrderStatus(String orderId, OrderStatus status, String username);
    Page<OrderResponseDTO> getOrdersByCustomerId(String customerId, Pageable pageable);
    Optional<Order> getOrderByCode(String orderCode);
    Optional<Order> getOrderByCodeWithLock(String orderCode);
    Page<OrderResponseDTO> getOrdersByStatus(OrderStatus status, Pageable pageable);
    CustomerResponseDTO getCustomerByOrderId(String orderId);
    OrderResponseDTO confirmReceipt(String orderId);
}