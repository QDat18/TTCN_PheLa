package com.example.be_phela.service;

import com.example.be_phela.dto.request.OrderCreateDTO;
import com.example.be_phela.dto.request.OrderItemDTO;
import com.example.be_phela.dto.response.*;
import com.example.be_phela.interService.IOrderService;
import com.example.be_phela.model.*;
import com.example.be_phela.model.enums.OrderStatus;
import com.example.be_phela.model.enums.PaymentMethod;
import com.example.be_phela.model.enums.PaymentStatus;
import com.example.be_phela.model.enums.MembershipTier;
import com.example.be_phela.model.enums.PointType;
import com.example.be_phela.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class OrderService implements IOrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;
    private final AddressRepository addressRepository;
    private final VoucherRepository voucherRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final com.example.be_phela.mapper.ProductMapper productMapper;

    public OrderService(OrderRepository orderRepository,
                        CartRepository cartRepository,
                        OrderItemRepository orderItemRepository,
                        CustomerRepository customerRepository,
                        AddressRepository addressRepository,
                        VoucherRepository voucherRepository,
                        PointHistoryRepository pointHistoryRepository,
                        com.example.be_phela.mapper.ProductMapper productMapper) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.orderItemRepository = orderItemRepository;
        this.customerRepository = customerRepository;
        this.addressRepository = addressRepository;
        this.voucherRepository = voucherRepository;
        this.pointHistoryRepository = pointHistoryRepository;
        this.productMapper = productMapper;
    }

    @Override
    @Transactional
    public OrderResponseDTO createOrderFromCart(OrderCreateDTO orderCreateDTO) {
        log.info("Creating order for customer: {}", orderCreateDTO.getCustomerId());
        
        Cart cart = cartRepository.findByCustomer_CustomerId(orderCreateDTO.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Cart not found for customer: " + orderCreateDTO.getCustomerId()));

        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        Customer customer = cart.getCustomer();
        
        // Voucher Logic
        String voucherCode = orderCreateDTO.getVoucherCode();
        Double discountAmount = 0.0;
        if (voucherCode != null && !voucherCode.isEmpty()) {
            Voucher voucher = voucherRepository.findByCode(voucherCode)
                    .orElseThrow(() -> new RuntimeException("Voucher not found"));
            
            // Validate Voucher
            LocalDateTime now = LocalDateTime.now();
            if (voucher.getStatus() != com.example.be_phela.model.enums.PromotionStatus.ACTIVE) {
                throw new RuntimeException("Voucher is not active");
            }
            if (voucher.getStartDate() != null && voucher.getStartDate().isAfter(now)) {
                throw new RuntimeException("Voucher has not started yet");
            }
            if (voucher.getEndDate() != null && voucher.getEndDate().isBefore(now)) {
                throw new RuntimeException("Voucher has expired");
            }
            if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
                throw new RuntimeException("Voucher usage limit reached");
            }
            if (orderCreateDTO.getTotalAmount() < voucher.getMinOrderAmount()) {
                throw new RuntimeException("Minimum order amount not met for this voucher");
            }

            // Calculate Discount
            if (voucher.getType() == com.example.be_phela.model.enums.DiscountType.PERCENTAGE) {
                discountAmount = orderCreateDTO.getTotalAmount() * (voucher.getValue() / 100.0);
                if (voucher.getMaxDiscountAmount() != null && discountAmount > voucher.getMaxDiscountAmount()) {
                    discountAmount = voucher.getMaxDiscountAmount();
                }
            } else if (voucher.getType() == com.example.be_phela.model.enums.DiscountType.FIXED_AMOUNT) {
                discountAmount = voucher.getValue();
            } else if (voucher.getType() == com.example.be_phela.model.enums.DiscountType.SHIPPING) {
                discountAmount = Math.min(orderCreateDTO.getShippingFee(), voucher.getValue());
            }
            
            // Update used count
            voucher.setUsedCount(voucher.getUsedCount() + 1);
            voucherRepository.save(voucher);
        }

        // Point Redemption Logic
        Integer notesUsed = orderCreateDTO.getNotesUsed() != null ? orderCreateDTO.getNotesUsed() : 0;
        if (notesUsed > 0) {
            if (customer.getCurrentNotes() < notesUsed) {
                throw new RuntimeException("Insufficient notes balance");
            }
            customer.setCurrentNotes(customer.getCurrentNotes() - notesUsed);
            customerRepository.save(customer);

            // Record REDEEM history
            PointHistory redemptionHistory = PointHistory.builder()
                    .customer(customer)
                    .noteAmount(-notesUsed)
                    .type(PointType.REDEEM)
                    .description("Sử dụng nốt nhạc cho đơn hàng")
                    .build();
            pointHistoryRepository.save(redemptionHistory);
        }

        Double pointsDiscount = notesUsed * 1000.0; // 1 Note = 1,000 VND

        Order order = Order.builder()
                .orderCode("PL" + System.currentTimeMillis() + new Random().nextInt(1000))
                .customer(customer)
                .address(cart.getAddress())
                .branch(cart.getBranch())
                .addressText(orderCreateDTO.getAddressText() != null ? orderCreateDTO.getAddressText() : 
                            (cart.getAddress() != null ? cart.getAddress().getDetailedAddress() : null))
                .phone(orderCreateDTO.getPhone() != null ? orderCreateDTO.getPhone() : customer.getPhone())
                .receiverName(orderCreateDTO.getReceiverName() != null ? orderCreateDTO.getReceiverName() : customer.getFullname())
                .totalAmount(orderCreateDTO.getTotalAmount())
                .shippingFee(orderCreateDTO.getShippingFee())
                .discountAmount(discountAmount + pointsDiscount)
                .voucherCode(voucherCode)
                .notesUsed(notesUsed)
                .finalAmount(orderCreateDTO.getTotalAmount() + orderCreateDTO.getShippingFee() - discountAmount - pointsDiscount)
                .status(OrderStatus.PENDING)
                .paymentMethod(orderCreateDTO.getPaymentMethod())
                .paymentStatus(PaymentStatus.PENDING)
                .note(orderCreateDTO.getNote())
                .orderDate(LocalDateTime.now())
                .build();

        Order savedOrder = orderRepository.save(order);

        List<OrderItem> orderItems = cart.getCartItems().stream().map(cartItem -> {
            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .product(cartItem.getProduct())
                    .productSize(cartItem.getProductSize())
                    .quantity(cartItem.getQuantity())
                    .amount(cartItem.getAmount())
                    .note(cartItem.getNote())
                    .toppings(new ArrayList<>(cartItem.getToppings()))
                    .build();
            return orderItem;
        }).collect(Collectors.toList());

        orderItemRepository.saveAll(orderItems);
        savedOrder.setOrderItems(orderItems);

        // Clear cart after order creation
        cart.getCartItems().clear();
        cart.setTotalAmount(0.0);
        cartRepository.save(cart);

        log.info("Order created successfully: {}", savedOrder.getOrderCode());
        return mapToResponseDTO(savedOrder);
    }

    @Override
    public OrderResponseDTO getOrderById(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        return mapToResponseDTO(order);
    }

    @Override
    public List<OrderResponseDTO> getOrdersByCustomerId(String customerId) {
        return orderRepository.findAll().stream()
                .filter(o -> o.getCustomer().getCustomerId().equals(customerId))
                .sorted((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()))
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void confirmBankTransferPayment(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setPaymentStatus(PaymentStatus.COMPLETED);
        if (order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.CONFIRMED);
        }
        orderRepository.save(order);
        log.info("Bank transfer payment confirmed for order: {}", orderId);
    }

    @Override
    @Transactional
    public void rollbackOrderDueToPaymentFailure(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setPaymentStatus(PaymentStatus.FAILED);
        order.setStatus(OrderStatus.CANCELLED);
        
        // Point Refund Logic
        if (order.getNotesUsed() != null && order.getNotesUsed() > 0) {
            Customer customer = order.getCustomer();
            customer.setCurrentNotes(customer.getCurrentNotes() + order.getNotesUsed());
            customerRepository.save(customer);

            PointHistory refundHistory = PointHistory.builder()
                    .customer(customer)
                    .order(order)
                    .noteAmount(order.getNotesUsed())
                    .type(PointType.REFUND)
                    .description("Hoàn lại nốt nhạc do lỗi thanh toán: " + order.getOrderCode())
                    .build();
            pointHistoryRepository.save(refundHistory);
        }

        orderRepository.save(order);
        log.info("Order rolled back due to payment failure: {}", orderId);
    }

    @Override
    public Optional<Order> getOrderByCode(String orderCode) {
        return orderRepository.findAll().stream()
                .filter(o -> o.getOrderCode().equals(orderCode))
                .findFirst();
    }

    @Override
    public Optional<Order> getOrderByCodeWithLock(String orderCode) {
        return getOrderByCode(orderCode); 
    }

    @Override
    @Transactional
    public void cancelOrder(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(OrderStatus.CANCELLED);
        
        // Point Refund Logic
        if (order.getNotesUsed() != null && order.getNotesUsed() > 0) {
            Customer customer = order.getCustomer();
            customer.setCurrentNotes(customer.getCurrentNotes() + order.getNotesUsed());
            customerRepository.save(customer);

            PointHistory refundHistory = PointHistory.builder()
                    .customer(customer)
                    .order(order)
                    .noteAmount(order.getNotesUsed())
                    .type(PointType.REFUND)
                    .description("Hoàn lại nốt nhạc do hủy đơn: " + order.getOrderCode())
                    .build();
            pointHistoryRepository.save(refundHistory);
        }

        orderRepository.save(order);
    }

    @Override
    @Transactional
    public void updateOrderStatus(String orderId, OrderStatus status, String username) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        
        if (status == OrderStatus.DELIVERED) {
            if (order.getDeliveryDate() == null) {
                order.setDeliveryDate(LocalDateTime.now());
            }
            // Tự động tích điểm khi Admin đổi trạng thái thành DELIVERED
            awardNotesToCustomer(order);
        } else if (status == OrderStatus.CANCELLED) {
            if (order.getNotesUsed() != null && order.getNotesUsed() > 0) {
                Customer customer = order.getCustomer();
                customer.setCurrentNotes(customer.getCurrentNotes() + order.getNotesUsed());
                customerRepository.save(customer);

                PointHistory refundHistory = PointHistory.builder()
                        .customer(customer)
                        .order(order)
                        .noteAmount(order.getNotesUsed())
                        .type(PointType.REFUND)
                        .description("Hoàn lại nốt nhạc do đơn bị hủy: " + order.getOrderCode())
                        .build();
                pointHistoryRepository.save(refundHistory);
            }
        }
        
        orderRepository.save(order);
        log.info("Order {} status updated to {} by {}", orderId, status, username);
    }

    private void awardNotesToCustomer(Order order) {
        // Chỉ tích điểm nếu chưa có nốt nhạc nào được tích cho đơn này
        if (order.getNotesEarned() == null || order.getNotesEarned() == 0) {
            int earnedPoints = (int) (order.getFinalAmount() / 10000); // 1 Nốt nhạc cho mỗi 10,000 VND
            if (earnedPoints > 0) {
                Customer customer = order.getCustomer();
                customer.setCurrentNotes(customer.getCurrentNotes() + earnedPoints);
                customer.setTotalAccumulatedNotes(customer.getTotalAccumulatedNotes() + earnedPoints);
                
                // Cập nhật hạng thành viên
                updateMembershipTier(customer);
                
                customerRepository.save(customer);

                order.setNotesEarned(earnedPoints);

                PointHistory earnHistory = PointHistory.builder()
                        .customer(customer)
                        .order(order)
                        .noteAmount(earnedPoints)
                        .type(PointType.EARN)
                        .description("Tích lũy từ đơn hàng " + order.getOrderCode())
                        .build();
                pointHistoryRepository.save(earnHistory);
            }
        }
    }

    @Override
    @Transactional
    public OrderResponseDTO confirmReceipt(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        if (order.getStatus() != OrderStatus.DELIVERING) {
            log.warn("Attempted to confirm receipt for order {} in status {}", orderId, order.getStatus());
        }
        
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveryDate(LocalDateTime.now());

        // Tích điểm cho khách hàng
        awardNotesToCustomer(order);

        orderRepository.save(order);
        
        log.info("Order {} confirmed received by customer", orderId);
        return mapToResponseDTO(order);
    }

    @Override
    public List<OrderResponseDTO> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == status)
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CustomerResponseDTO getCustomerByOrderId(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        Customer customer = order.getCustomer();
        return CustomerResponseDTO.builder()
                .customerId(customer.getCustomerId())
                .customerCode(customer.getCustomerCode())
                .fullname(customer.getFullname())
                .username(customer.getUsername())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .gender(customer.getGender())
                .status(customer.getStatus())
                .currentNotes(customer.getCurrentNotes())
                .totalAccumulatedNotes(customer.getTotalAccumulatedNotes())
                .membershipTier(customer.getMembershipTier())
                .build();
    }

    private OrderResponseDTO mapToResponseDTO(Order order) {
        CustomerResponseDTO customerDTO = CustomerResponseDTO.builder()
                .customerId(order.getCustomer().getCustomerId())
                .customerCode(order.getCustomer().getCustomerCode())
                .fullname(order.getCustomer().getFullname())
                .username(order.getCustomer().getUsername())
                .email(order.getCustomer().getEmail())
                .phone(order.getCustomer().getPhone())
                .gender(order.getCustomer().getGender())
                .status(order.getCustomer().getStatus())
                .currentNotes(order.getCustomer().getCurrentNotes())
                .totalAccumulatedNotes(order.getCustomer().getTotalAccumulatedNotes())
                .membershipTier(order.getCustomer().getMembershipTier())
                .build();

        BranchResponseDTO branchDTO = order.getBranch() != null ? BranchResponseDTO.builder()
                .branchCode(order.getBranch().getBranchCode())
                .branchName(order.getBranch().getBranchName())
                .city(order.getBranch().getCity())
                .district(order.getBranch().getDistrict())
                .address(order.getBranch().getAddress())
                .build() : null;

        AddressDTO addressDTO = order.getAddress() != null ? AddressDTO.builder()
                .addressId(order.getAddress().getAddressId())
                .customerId(order.getCustomer().getCustomerId())
                .city(order.getAddress().getCity())
                .district(order.getAddress().getDistrict())
                .ward(order.getAddress().getWard())
                .detailedAddress(order.getAddress().getDetailedAddress())
                .recipientName(order.getAddress().getRecipientName())
                .phone(order.getAddress().getPhone())
                .latitude(order.getAddress().getLatitude())
                .longitude(order.getAddress().getLongitude())
                .isDefault(order.getAddress().getIsDefault())
                .build() : null;

        List<OrderItemDTO> itemDTOs = order.getOrderItems().stream().map(item -> OrderItemDTO.builder()
                .orderItemId(item.getOrderItemId())
                .productId(item.getProduct().getProductId())
                .productName(item.getProduct().getProductName())
                .productSizeId(item.getProductSize() != null ? item.getProductSize().getProductSizeId() : null)
                .productSizeName(item.getProductSize() != null ? item.getProductSize().getSizeName() : "PHÊ")
                .quantity(item.getQuantity())
                .amount(item.getAmount())
                .note(item.getNote())
                .selectedToppings(item.getToppings() != null ? 
                        item.getToppings().stream().map(productMapper::toProductResponseDTO).collect(Collectors.toList()) : 
                        new ArrayList<>())
                .build()).collect(Collectors.toList());

        return OrderResponseDTO.builder()
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .customer(customerDTO)
                .branch(branchDTO)
                .address(addressDTO)
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .finalAmount(order.getFinalAmount())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .note(order.getNote())
                .addressText(order.getAddressText())
                .voucherCode(order.getVoucherCode())
                .discountAmount(order.getDiscountAmount())
                .orderDate(order.getOrderDate())
                .deliveryDate(order.getDeliveryDate())
                .notesUsed(order.getNotesUsed())
                .notesEarned(order.getNotesEarned())
                .orderItems(itemDTOs)
                .build();
    }

    private void updateMembershipTier(Customer customer) {
        int total = customer.getTotalAccumulatedNotes();
        if (total >= 5000) {
            customer.setMembershipTier(MembershipTier.DIAMOND);
        } else if (total >= 2000) {
            customer.setMembershipTier(MembershipTier.GOLD);
        } else if (total >= 500) {
            customer.setMembershipTier(MembershipTier.SILVER);
        } else {
            customer.setMembershipTier(MembershipTier.MEMBER);
        }
    }
}