package com.example.be_phela.service;

import com.example.be_phela.dto.request.OrderCreateDTO;
import com.example.be_phela.dto.request.OrderItemDTO;
import com.example.be_phela.dto.response.*;
import com.example.be_phela.interService.IOrderService;
import com.example.be_phela.model.*;
import com.example.be_phela.model.enums.OrderStatus;
import com.example.be_phela.model.enums.PaymentStatus;
import com.example.be_phela.model.enums.MembershipTier;
import com.example.be_phela.model.enums.PointType;
import com.example.be_phela.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.io.ByteArrayOutputStream;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class OrderService implements IOrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private static final int MAX_PAGE_SIZE = 50;

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;
    private final AddressRepository addressRepository;
    private final VoucherRepository voucherRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final com.example.be_phela.mapper.ProductMapper productMapper;
    private final SystemSettingService settingService;

    public OrderService(OrderRepository orderRepository,
                        CartRepository cartRepository,
                        OrderItemRepository orderItemRepository,
                        CustomerRepository customerRepository,
                        AddressRepository addressRepository,
                        VoucherRepository voucherRepository,
                        PointHistoryRepository pointHistoryRepository,
                        com.example.be_phela.mapper.ProductMapper productMapper,
                        SystemSettingService settingService) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.orderItemRepository = orderItemRepository;
        this.customerRepository = customerRepository;
        this.addressRepository = addressRepository;
        this.voucherRepository = voucherRepository;
        this.pointHistoryRepository = pointHistoryRepository;
        this.productMapper = productMapper;
        this.settingService = settingService;
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

        // SERVER-SIDE: Tính totalAmount từ cart items, KHÔNG tin frontend
        double serverTotalAmount = cart.getCartItems().stream()
                .mapToDouble(item -> {
                    double itemAmount = item.getAmount() != null ? item.getAmount() : 0.0;
                    int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                    return itemAmount * qty;
                })
                .sum();
        // SERVER-SIDE: Sử dụng shippingFee từ frontend nhưng validate không âm
        double serverShippingFee = orderCreateDTO.getShippingFee() != null ? Math.max(0, orderCreateDTO.getShippingFee()) : 0.0;

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
            if (serverTotalAmount < voucher.getMinOrderAmount()) {
                throw new RuntimeException("Minimum order amount not met for this voucher");
            }

            // Calculate Discount using server-calculated amount
            if (voucher.getType() == com.example.be_phela.model.enums.DiscountType.PERCENTAGE) {
                discountAmount = serverTotalAmount * (voucher.getValue() / 100.0);
                if (voucher.getMaxDiscountAmount() != null && discountAmount > voucher.getMaxDiscountAmount()) {
                    discountAmount = voucher.getMaxDiscountAmount();
                }
            } else if (voucher.getType() == com.example.be_phela.model.enums.DiscountType.FIXED_AMOUNT) {
                discountAmount = voucher.getValue();
            } else if (voucher.getType() == com.example.be_phela.model.enums.DiscountType.SHIPPING) {
                discountAmount = Math.min(serverShippingFee, voucher.getValue());
            }
            
            // Update used count
            voucher.setUsedCount(voucher.getUsedCount() + 1);
            voucherRepository.save(voucher);
        }

        // Point Redemption Logic
        Integer notesUsed = orderCreateDTO.getNotesUsed() != null ? orderCreateDTO.getNotesUsed() : 0;
        if (notesUsed > 0) {
            int currentNotes = customer.getCurrentNotes() != null ? customer.getCurrentNotes() : 0;
            if (currentNotes < notesUsed) {
                throw new RuntimeException("Insufficient notes balance");
            }
            customer.setCurrentNotes(currentNotes - notesUsed);
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

        int noteValueVnd = settingService.getInt("loyalty.note_value_vnd", 1000);
        Double pointsDiscount = notesUsed * (double) noteValueVnd; // 1 Note = noteValueVnd VND (from settings)

        double finalAmount = Math.max(0, serverTotalAmount + serverShippingFee - discountAmount - pointsDiscount);

        Order order = Order.builder()
                .orderCode(generateUniqueOrderCode())
                .customer(customer)
                .address(cart.getAddress())
                .branch(cart.getBranch())
                .addressText(orderCreateDTO.getAddressText() != null ? orderCreateDTO.getAddressText() : 
                            (cart.getAddress() != null ? cart.getAddress().getDetailedAddress() : null))
                .phone(orderCreateDTO.getPhone() != null ? orderCreateDTO.getPhone() : customer.getPhone())
                .receiverName(orderCreateDTO.getReceiverName() != null ? orderCreateDTO.getReceiverName() : customer.getFullname())
                .totalAmount(serverTotalAmount)
                .shippingFee(serverShippingFee)
                .discountAmount(discountAmount + pointsDiscount)
                .voucherCode(voucherCode)
                .notesUsed(notesUsed)
                .finalAmount(finalAmount)
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
    public Page<OrderResponseDTO> getOrdersByCustomerId(String customerId, Pageable pageable) {
        Pageable cappedPageable = capPageable(pageable);
        return orderRepository.findOrdersByCustomerId(customerId, cappedPageable)
                .map(this::mapToResponseDTO);
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
            int currentNotes = customer.getCurrentNotes() != null ? customer.getCurrentNotes() : 0;
            customer.setCurrentNotes(currentNotes + order.getNotesUsed());
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

        // Voucher Rollback: Hoàn lại lượt dùng voucher
        rollbackVoucherUsage(order);

        orderRepository.save(order);
        log.info("Order rolled back due to payment failure: {}", orderId);
    }

    @Override
    public Optional<Order> getOrderByCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode);
    }

    @Override
    public Optional<Order> getOrderByCodeWithLock(String orderCode) {
        return orderRepository.findByOrderCodeWithLock(orderCode);
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
            int currentNotes = customer.getCurrentNotes() != null ? customer.getCurrentNotes() : 0;
            customer.setCurrentNotes(currentNotes + order.getNotesUsed());
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

        // Voucher Rollback: Hoàn lại lượt dùng voucher
        rollbackVoucherUsage(order);

        if (order.getPaymentStatus() == PaymentStatus.PENDING || order.getPaymentStatus() == PaymentStatus.AWAITING_PAYMENT) {
            order.setPaymentStatus(PaymentStatus.FAILED);
        }

        orderRepository.save(order);
        log.info("Order {} cancelled by customer. Payment status set to {}", orderId, order.getPaymentStatus());
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
                int currentNotes = customer.getCurrentNotes() != null ? customer.getCurrentNotes() : 0;
                customer.setCurrentNotes(currentNotes + order.getNotesUsed());
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
            // Voucher Rollback: Hoàn lại lượt dùng voucher
            rollbackVoucherUsage(order);
            if (order.getPaymentStatus() == PaymentStatus.PENDING || order.getPaymentStatus() == PaymentStatus.AWAITING_PAYMENT) {
                order.setPaymentStatus(PaymentStatus.FAILED);
            }
        }
        
        orderRepository.save(order);
        log.info("Order {} status updated to {} by {}", orderId, status, username);
    }

    private void awardNotesToCustomer(Order order) {
        // Chỉ tích điểm nếu chưa có nốt nhạc nào được tích cho đơn này
        if (order.getNotesEarned() == null || order.getNotesEarned() == 0) {
            int spendPerNote = settingService.getInt("loyalty.spend_per_note", 10000);
            int earnedPoints = (int) (order.getFinalAmount() / spendPerNote); // Dynamic: 1 Nốt / spendPerNote VND
            if (earnedPoints > 0) {
                Customer customer = order.getCustomer();
                int currentNotes = customer.getCurrentNotes() != null ? customer.getCurrentNotes() : 0;
                int totalNotes = customer.getTotalAccumulatedNotes() != null ? customer.getTotalAccumulatedNotes() : 0;
                
                customer.setCurrentNotes(currentNotes + earnedPoints);
                customer.setTotalAccumulatedNotes(totalNotes + earnedPoints);
                
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
    public Page<OrderResponseDTO> getOrdersByStatus(OrderStatus status, Pageable pageable) {
        Pageable cappedPageable = capPageable(pageable);
        return orderRepository.findByStatus(status, cappedPageable)
                .map(this::mapToResponseDTO);
    }

    private Pageable capPageable(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            log.warn("Requested page size {} exceeds limit, capping to {}", pageable.getPageSize(), MAX_PAGE_SIZE);
            return PageRequest.of(pageable.getPageNumber(), MAX_PAGE_SIZE, pageable.getSort());
        }
        return pageable;
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
        int total = customer.getTotalAccumulatedNotes() != null ? customer.getTotalAccumulatedNotes() : 0;
        int silverThreshold = settingService.getInt("loyalty.silver_threshold", 500);
        int goldThreshold   = settingService.getInt("loyalty.gold_threshold", 2000);
        int diamondThreshold = settingService.getInt("loyalty.diamond_threshold", 5000);
        if (total >= diamondThreshold) {
            customer.setMembershipTier(MembershipTier.DIAMOND);
        } else if (total >= goldThreshold) {
            customer.setMembershipTier(MembershipTier.GOLD);
        } else if (total >= silverThreshold) {
            customer.setMembershipTier(MembershipTier.SILVER);
        } else {
            customer.setMembershipTier(MembershipTier.MEMBER);
        }
    }

    /**
     * Tạo mã đơn hàng duy nhất với prefix PL + tối đa 9 chữ số (tương thích PayOS).
     */
    private String generateUniqueOrderCode() {
        Random random = new Random();
        String orderCode;
        int attempts = 0;
        do {
            // Tạo mã số 9 chữ số ngẫu nhiên (100000000 - 999999999)
            long code = 100_000_000L + (long) (random.nextDouble() * 900_000_000L);
            orderCode = "ORD" + code;
            attempts++;
            if (attempts > 10) {
                // Fallback: dùng timestamp phần cuối + random
                orderCode = "ORD" + (System.currentTimeMillis() % 1_000_000_000L);
                break;
            }
        } while (orderRepository.findByOrderCode(orderCode).isPresent());
        return orderCode;
    }

    /**
     * Hoàn lại lượt dùng voucher khi đơn hàng bị hủy hoặc thanh toán thất bại.
     */
    private void rollbackVoucherUsage(Order order) {
        if (order.getVoucherCode() != null && !order.getVoucherCode().isEmpty()) {
            voucherRepository.findByCode(order.getVoucherCode()).ifPresent(voucher -> {
                if (voucher.getUsedCount() != null && voucher.getUsedCount() > 0) {
                    voucher.setUsedCount(voucher.getUsedCount() - 1);
                    voucherRepository.save(voucher);
                    log.info("Voucher {} usedCount rolled back for order {}", voucher.getCode(), order.getOrderCode());
                }
            });
        }
    }

    @Override
    public Page<OrderResponseDTO> searchAndFilterOrders(
            OrderStatus status,
            String branchCode,
            com.example.be_phela.model.enums.PaymentMethod paymentMethod,
            String startDateStr,
            String endDateStr,
            String query,
            Pageable pageable) {
        
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;
        
        if (startDateStr != null && !startDateStr.trim().isEmpty()) {
            try {
                startDate = java.time.LocalDate.parse(startDateStr.trim()).atStartOfDay();
            } catch (Exception e) {
                log.warn("Failed to parse startDate: {}", startDateStr, e);
            }
        }
        
        if (endDateStr != null && !endDateStr.trim().isEmpty()) {
            try {
                endDate = java.time.LocalDate.parse(endDateStr.trim()).atTime(23, 59, 59);
            } catch (Exception e) {
                log.warn("Failed to parse endDate: {}", endDateStr, e);
            }
        }
        
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String cleanBranchCode = (branchCode != null && !branchCode.trim().isEmpty()) ? branchCode.trim() : null;
        
        boolean hasStatus = (status != null);
        OrderStatus finalStatus = hasStatus ? status : OrderStatus.PENDING;

        boolean hasBranch = (cleanBranchCode != null);
        String finalBranchCode = hasBranch ? cleanBranchCode : "";

        boolean hasPaymentMethod = (paymentMethod != null);
        com.example.be_phela.model.enums.PaymentMethod finalPaymentMethod = hasPaymentMethod ? paymentMethod : com.example.be_phela.model.enums.PaymentMethod.COD;

        boolean hasStartDate = (startDate != null);
        LocalDateTime finalStartDate = hasStartDate ? startDate : LocalDateTime.now();

        boolean hasEndDate = (endDate != null);
        LocalDateTime finalEndDate = hasEndDate ? endDate : LocalDateTime.now();

        boolean hasQuery = (cleanQuery != null);
        String finalQuery = hasQuery ? cleanQuery : "";

        Pageable cappedPageable = capPageable(pageable);
        return orderRepository.searchAndFilterOrders(
                hasStatus,
                finalStatus,
                hasBranch,
                finalBranchCode,
                hasPaymentMethod,
                finalPaymentMethod,
                hasStartDate,
                finalStartDate,
                hasEndDate,
                finalEndDate,
                hasQuery,
                finalQuery,
                cappedPageable
        ).map(this::mapToResponseDTO);
    }

    @Override
    public byte[] exportOrdersExcel(
            OrderStatus status,
            String branchCode,
            com.example.be_phela.model.enums.PaymentMethod paymentMethod,
            String startDateStr,
            String endDateStr,
            String query) throws java.io.IOException {
        
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;
        
        if (startDateStr != null && !startDateStr.trim().isEmpty()) {
            try {
                startDate = java.time.LocalDate.parse(startDateStr.trim()).atStartOfDay();
            } catch (Exception e) {
                log.warn("Failed to parse startDate: {}", startDateStr, e);
            }
        }
        
        if (endDateStr != null && !endDateStr.trim().isEmpty()) {
            try {
                endDate = java.time.LocalDate.parse(endDateStr.trim()).atTime(23, 59, 59);
            } catch (Exception e) {
                log.warn("Failed to parse endDate: {}", endDateStr, e);
            }
        }
        
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String cleanBranchCode = (branchCode != null && !branchCode.trim().isEmpty()) ? branchCode.trim() : null;
        
        boolean hasStatus = (status != null);
        OrderStatus finalStatus = hasStatus ? status : OrderStatus.PENDING;

        boolean hasBranch = (cleanBranchCode != null);
        String finalBranchCode = hasBranch ? cleanBranchCode : "";

        boolean hasPaymentMethod = (paymentMethod != null);
        com.example.be_phela.model.enums.PaymentMethod finalPaymentMethod = hasPaymentMethod ? paymentMethod : com.example.be_phela.model.enums.PaymentMethod.COD;

        boolean hasStartDate = (startDate != null);
        LocalDateTime finalStartDate = hasStartDate ? startDate : LocalDateTime.now();

        boolean hasEndDate = (endDate != null);
        LocalDateTime finalEndDate = hasEndDate ? endDate : LocalDateTime.now();

        boolean hasQuery = (cleanQuery != null);
        String finalQuery = hasQuery ? cleanQuery : "";

        List<Order> ordersList = orderRepository.searchAndFilterOrdersList(
                hasStatus,
                finalStatus,
                hasBranch,
                finalBranchCode,
                hasPaymentMethod,
                finalPaymentMethod,
                hasStartDate,
                finalStartDate,
                hasEndDate,
                finalEndDate,
                hasQuery,
                finalQuery
        );

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("Đơn hàng");

            // Fonts & Styles
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setColor(IndexedColors.DARK_BLUE.getIndex());

            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);

            Font subFont = workbook.createFont();
            subFont.setBold(true);
            subFont.setFontHeightInPoints((short) 11);

            CellStyle subStyle = workbook.createCellStyle();
            subStyle.setFont(subFont);

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.BROWN.getIndex()); // Matching Phe La brown
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            CellStyle numberStyle = workbook.createCellStyle();
            numberStyle.cloneStyleFrom(dataStyle);
            DataFormat format = workbook.createDataFormat();
            numberStyle.setDataFormat(format.getFormat("#,##0"));

            // Calculate Aggregate Stats
            double totalRevenue = 0.0;
            double totalDiscounts = 0.0;
            for (Order o : ordersList) {
                totalRevenue += o.getFinalAmount() != null ? o.getFinalAmount() : 0.0;
                totalDiscounts += o.getDiscountAmount() != null ? o.getDiscountAmount() : 0.0;
            }

            // Write Title & Stats
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO CHI TIẾT DANH SÁCH ĐƠN HÀNG PHÊ LA");
            titleCell.setCellStyle(titleStyle);

            Row statsRow1 = sheet.createRow(2);
            statsRow1.createCell(0).setCellValue("Tổng số đơn hàng:");
            statsRow1.createCell(1).setCellValue(ordersList.size());
            statsRow1.getCell(0).setCellStyle(subStyle);

            Row statsRow2 = sheet.createRow(3);
            statsRow2.createCell(0).setCellValue("Tổng doanh thu:");
            statsRow2.createCell(1).setCellValue(totalRevenue);
            statsRow2.getCell(1).setCellStyle(numberStyle);
            statsRow2.getCell(0).setCellStyle(subStyle);

            Row statsRow3 = sheet.createRow(4);
            statsRow3.createCell(0).setCellValue("Tổng tiền giảm giá:");
            statsRow3.createCell(1).setCellValue(totalDiscounts);
            statsRow3.getCell(1).setCellStyle(numberStyle);
            statsRow3.getCell(0).setCellStyle(subStyle);

            // Table Header Row at Index 6
            Row headerRow = sheet.createRow(6);
            String[] columns = {
                "STT", "Mã đơn hàng", "Ngày đặt", "Khách hàng", "Số điện thoại", 
                "Chi nhánh", "Địa chỉ giao hàng", "Hình thức thanh toán", 
                "Trạng thái thanh toán", "Trạng thái đơn hàng", 
                "Tổng tiền hàng", "Phí giao hàng", "Tiền giảm giá", "Tổng thanh toán", "Ghi chú"
            };

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Populate Data Row starts at Index 7
            int rowNum = 7;
            int stt = 1;
            for (Order o : ordersList) {
                Row row = sheet.createRow(rowNum++);
                
                row.createCell(0).setCellValue(stt++);
                row.createCell(1).setCellValue(o.getOrderCode());
                row.createCell(2).setCellValue(o.getOrderDate() != null ? o.getOrderDate().toString().replace("T", " ") : "");
                row.createCell(3).setCellValue(o.getCustomer() != null ? o.getCustomer().getFullname() : "");
                row.createCell(4).setCellValue(o.getPhone() != null ? o.getPhone() : (o.getCustomer() != null ? o.getCustomer().getPhone() : ""));
                row.createCell(5).setCellValue(o.getBranch() != null ? o.getBranch().getBranchName() : "Chưa xác định");
                row.createCell(6).setCellValue(o.getAddressText() != null ? o.getAddressText() : "");
                row.createCell(7).setCellValue(o.getPaymentMethod() != null ? o.getPaymentMethod().name() : "");
                row.createCell(8).setCellValue(o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "");
                row.createCell(9).setCellValue(o.getStatus() != null ? o.getStatus().name() : "");
                
                Cell cTotal = row.createCell(10);
                cTotal.setCellValue(o.getTotalAmount() != null ? o.getTotalAmount() : 0.0);
                cTotal.setCellStyle(numberStyle);

                Cell cShip = row.createCell(11);
                cShip.setCellValue(o.getShippingFee() != null ? o.getShippingFee() : 0.0);
                cShip.setCellStyle(numberStyle);

                Cell cDisc = row.createCell(12);
                cDisc.setCellValue(o.getDiscountAmount() != null ? o.getDiscountAmount() : 0.0);
                cDisc.setCellStyle(numberStyle);

                Cell cFinal = row.createCell(13);
                cFinal.setCellValue(o.getFinalAmount() != null ? o.getFinalAmount() : 0.0);
                cFinal.setCellStyle(numberStyle);

                row.createCell(14).setCellValue(o.getNote() != null ? o.getNote() : "");

                // Style standard text cells
                for (int i = 0; i <= 9; i++) {
                    row.getCell(i).setCellStyle(dataStyle);
                }
                row.getCell(14).setCellStyle(dataStyle);
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }
}