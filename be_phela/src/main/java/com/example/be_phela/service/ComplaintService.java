package com.example.be_phela.service;

import com.example.be_phela.dto.request.ComplaintRequestDTO;
import com.example.be_phela.dto.request.ComplaintResolveRequestDTO;
import com.example.be_phela.dto.response.ComplaintResponseDTO;
import com.example.be_phela.model.Complaint;
import com.example.be_phela.model.Customer;
import com.example.be_phela.model.Order;
import com.example.be_phela.model.enums.ComplaintStatus;
import com.example.be_phela.model.enums.NotificationType;
import com.example.be_phela.model.enums.OrderStatus;
import com.example.be_phela.model.enums.PaymentStatus;
import com.example.be_phela.repository.ComplaintRepository;
import com.example.be_phela.repository.CustomerRepository;
import com.example.be_phela.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintService {
    private final ComplaintRepository complaintRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final NotificationService notificationService;
    private final com.example.be_phela.repository.PointHistoryRepository pointHistoryRepository;

    public ComplaintService(ComplaintRepository complaintRepository, OrderRepository orderRepository,
                            CustomerRepository customerRepository, NotificationService notificationService,
                            com.example.be_phela.repository.PointHistoryRepository pointHistoryRepository) {
        this.complaintRepository = complaintRepository;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.notificationService = notificationService;
        this.pointHistoryRepository = pointHistoryRepository;
    }

    @Transactional
    public ComplaintResponseDTO createComplaint(String customerId, ComplaintRequestDTO requestDTO) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Order order = orderRepository.findById(requestDTO.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getCustomer().getCustomerId().equals(customerId)) {
            throw new RuntimeException("You do not own this order");
        }

        if (complaintRepository.findByOrder_Id(order.getId()).isPresent()) {
            throw new RuntimeException("Complaint for this order already exists");
        }

        String evidenceStr = "";
        if (requestDTO.getEvidenceImages() != null && !requestDTO.getEvidenceImages().isEmpty()) {
            evidenceStr = String.join(",", requestDTO.getEvidenceImages());
        }

        Complaint complaint = Complaint.builder()
                .customer(customer)
                .order(order)
                .reason(requestDTO.getReason())
                .evidenceImages(evidenceStr)
                .status(ComplaintStatus.PENDING)
                .build();

        Complaint saved = complaintRepository.save(complaint);

        // Notify Admin
        notificationService.createNotification(
                "SYSTEM", "Hệ thống", "ADMIN",
                "Có khiếu nại mới từ khách hàng " + customer.getFullname() + " cho đơn hàng " + order.getOrderCode(),
                NotificationType.SYSTEM
        );

        return mapToDTO(saved);
    }

    public List<ComplaintResponseDTO> getComplaintsByCustomer(String customerId) {
        return complaintRepository.findByCustomer_CustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<ComplaintResponseDTO> getAllComplaints() {
        return complaintRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDTO).collect(Collectors.toList());
    }

    public ComplaintResponseDTO getComplaintById(String id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        return mapToDTO(complaint);
    }

    @Transactional
    public ComplaintResponseDTO resolveComplaint(String id, ComplaintResolveRequestDTO resolveDTO) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setResolutionType(resolveDTO.getResolutionType());
        complaint.setResolutionNotes(resolveDTO.getResolutionNotes());
        complaint.setAdminNotes(resolveDTO.getAdminNotes());

        if (resolveDTO.getResolutionType() == com.example.be_phela.model.enums.ResolutionType.REJECTED) {
            complaint.setStatus(ComplaintStatus.REJECTED);
            
            notificationService.createNotification(
                    "ADMIN", "Quản trị viên", complaint.getCustomer().getCustomerId(),
                    "Khiếu nại cho đơn hàng " + complaint.getOrder().getOrderCode() + " đã bị từ chối: " + resolveDTO.getResolutionNotes(),
                    NotificationType.SYSTEM
            );
        } else {
            complaint.setStatus(ComplaintStatus.RESOLVED);
            
            Order order = complaint.getOrder();
            if (resolveDTO.getResolutionType() == com.example.be_phela.model.enums.ResolutionType.REFUND) {
                order.setPaymentStatus(PaymentStatus.REFUNDED);
                order.setStatus(OrderStatus.RETURNED);
                orderRepository.save(order);
            } else if (resolveDTO.getResolutionType() == com.example.be_phela.model.enums.ResolutionType.COMPENSATION) {
                // Đền bù bằng điểm tích lũy (vd: 500 nốt nhạc)
                Customer cust = complaint.getCustomer();
                int compensationNotes = 500;
                int currentNotes = cust.getCurrentNotes() != null ? cust.getCurrentNotes() : 0;
                int totalNotes = cust.getTotalAccumulatedNotes() != null ? cust.getTotalAccumulatedNotes() : 0;
                
                cust.setCurrentNotes(currentNotes + compensationNotes);
                cust.setTotalAccumulatedNotes(totalNotes + compensationNotes);
                customerRepository.save(cust);

                com.example.be_phela.model.PointHistory compensationHistory = com.example.be_phela.model.PointHistory.builder()
                        .customer(cust)
                        .order(order)
                        .noteAmount(compensationNotes)
                        .type(com.example.be_phela.model.enums.PointType.EARN)
                        .description("Đền bù từ khiếu nại đơn hàng " + order.getOrderCode())
                        .build();
                pointHistoryRepository.save(compensationHistory);
            }

            notificationService.createNotification(
                    "ADMIN", "Quản trị viên", complaint.getCustomer().getCustomerId(),
                    "Khiếu nại cho đơn hàng " + complaint.getOrder().getOrderCode() + " đã được xử lý: " + resolveDTO.getResolutionNotes(),
                    NotificationType.SYSTEM
            );
        }

        Complaint saved = complaintRepository.save(complaint);
        return mapToDTO(saved);
    }

    private ComplaintResponseDTO mapToDTO(Complaint complaint) {
        List<String> images = null;
        if (complaint.getEvidenceImages() != null && !complaint.getEvidenceImages().isEmpty()) {
            images = Arrays.asList(complaint.getEvidenceImages().split(","));
        }

        return ComplaintResponseDTO.builder()
                .id(complaint.getId())
                .orderId(complaint.getOrder().getId())
                .orderCode(complaint.getOrder().getOrderCode())
                .customerId(complaint.getCustomer().getCustomerId())
                .customerName(complaint.getCustomer().getFullname())
                .reason(complaint.getReason())
                .evidenceImages(images)
                .status(complaint.getStatus())
                .resolutionType(complaint.getResolutionType())
                .resolutionNotes(complaint.getResolutionNotes())
                .adminNotes(complaint.getAdminNotes())
                .createdAt(complaint.getCreatedAt())
                .updatedAt(complaint.getUpdatedAt())
                .build();
    }
}
