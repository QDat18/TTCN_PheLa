package com.example.be_phela.controller;

import com.example.be_phela.dto.request.OrderCreateDTO;
import com.example.be_phela.dto.response.CustomerResponseDTO;
import com.example.be_phela.dto.response.OrderResponseDTO;
import com.example.be_phela.model.enums.OrderStatus;
import com.example.be_phela.service.OrderService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/order")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/create")
    public ResponseEntity<OrderResponseDTO> createOrder(@RequestBody OrderCreateDTO orderCreateDTO) {
        OrderResponseDTO orderResponse = orderService.createOrderFromCart(orderCreateDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(orderResponse);
    }

    @PostMapping("/{orderId}/confirm-payment")
    public ResponseEntity<Void> confirmBankTransferPayment(@PathVariable String orderId) {
        orderService.confirmBankTransferPayment(orderId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable String orderId) {
        OrderResponseDTO orderResponse = orderService.getOrderById(orderId);
        return ResponseEntity.ok(orderResponse);
    }

    @DeleteMapping("/{orderId}/cancel")
    public ResponseEntity<Void> cancelOrder(@PathVariable String orderId) {
        orderService.cancelOrder(orderId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<Void> updateOrderStatus(@PathVariable String orderId, @RequestParam("status") OrderStatus status, @RequestParam String username) {
        orderService.updateOrderStatus(orderId, status, username);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<Page<OrderResponseDTO>> getOrdersByCustomerId(@PathVariable String customerId, Pageable pageable) {
        Page<OrderResponseDTO> orders = orderService.getOrdersByCustomerId(customerId, pageable);
        return ResponseEntity.ok(orders);
    }

    // Lấy đơn hàng theo trạng thái
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<OrderResponseDTO>> getOrdersByStatus(@PathVariable OrderStatus status, Pageable pageable) {
        Page<OrderResponseDTO> orders = orderService.getOrdersByStatus(status, pageable);
        return ResponseEntity.ok(orders);
    }

    // Lấy thông tin khách hàng từ ID đơn hàng
    @GetMapping("/{orderId}/customer")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'STAFF')")
    public ResponseEntity<CustomerResponseDTO> getCustomerByOrderId(@PathVariable String orderId) {
        CustomerResponseDTO customer = orderService.getCustomerByOrderId(orderId);
        return ResponseEntity.ok(customer);
    }
    @PostMapping("/{orderId}/confirm-receipt")
    public ResponseEntity<OrderResponseDTO> confirmReceipt(@PathVariable String orderId) {
        OrderResponseDTO orderResponse = orderService.confirmReceipt(orderId);
        return ResponseEntity.ok(orderResponse);
    }

    @GetMapping("/search-filter")
    public ResponseEntity<Page<OrderResponseDTO>> searchAndFilterOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String branchCode,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String query,
            Pageable pageable) {
        
        OrderStatus orderStatus = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                orderStatus = OrderStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid status
            }
        }
        
        com.example.be_phela.model.enums.PaymentMethod pm = null;
        if (paymentMethod != null && !paymentMethod.trim().isEmpty() && !paymentMethod.equalsIgnoreCase("ALL")) {
            try {
                pm = com.example.be_phela.model.enums.PaymentMethod.valueOf(paymentMethod.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid payment method
            }
        }
        
        Page<OrderResponseDTO> orders = orderService.searchAndFilterOrders(
                orderStatus, branchCode, pm, startDate, endDate, query, pageable);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/export-excel")
    public ResponseEntity<byte[]> exportOrdersExcel(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String branchCode,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String query) throws java.io.IOException {
        
        OrderStatus orderStatus = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                orderStatus = OrderStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid status
            }
        }
        
        com.example.be_phela.model.enums.PaymentMethod pm = null;
        if (paymentMethod != null && !paymentMethod.trim().isEmpty() && !paymentMethod.equalsIgnoreCase("ALL")) {
            try {
                pm = com.example.be_phela.model.enums.PaymentMethod.valueOf(paymentMethod.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid payment method
            }
        }
        
        byte[] excelBytes = orderService.exportOrdersExcel(
                orderStatus, branchCode, pm, startDate, endDate, query);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
        
        java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
        String filename = "DanhSachDonHang_" + java.time.LocalDateTime.now().format(dtf) + ".xlsx";
        headers.setContentDispositionFormData("attachment", filename);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(excelBytes);
    }
}