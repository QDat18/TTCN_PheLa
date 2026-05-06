package com.example.be_phela.service;

import com.example.be_phela.dto.request.CustomerCreateDTO;
import com.example.be_phela.dto.request.CustomerLocationUpdateDTO;
import com.example.be_phela.dto.request.CustomerPasswordUpdateDTO;
import com.example.be_phela.dto.request.CustomerUpdateDTO;
import com.example.be_phela.dto.response.CustomerCancelledCountProjection;
import com.example.be_phela.dto.response.CustomerResponseDTO;
import com.example.be_phela.dto.response.PointHistoryResponseDTO;
import com.example.be_phela.exception.DuplicateResourceException;
import com.example.be_phela.exception.ResourceNotFoundException;
import com.example.be_phela.interService.ICustomerService;
import com.example.be_phela.mapper.CustomerMapper;
import com.example.be_phela.model.Customer;
import com.example.be_phela.model.PointHistory;
import com.example.be_phela.model.enums.OrderStatus;
import com.example.be_phela.model.enums.Roles;
import com.example.be_phela.model.enums.Status;
import com.example.be_phela.repository.CustomerRepository;
import com.example.be_phela.repository.OrderRepository;
import com.example.be_phela.repository.PointHistoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CustomerService implements ICustomerService {
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final CustomerMapper customerMapper;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final CartService cartService;

    public CustomerService(CustomerRepository customerRepository,
                           OrderRepository orderRepository,
                           PointHistoryRepository pointHistoryRepository,
                           CustomerMapper customerMapper,
                           org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                           CartService cartService) {
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.pointHistoryRepository = pointHistoryRepository;
        this.customerMapper = customerMapper;
        this.passwordEncoder = passwordEncoder;
        this.cartService = cartService;
    }

    @Override
    public String generateCustomerCode() {
        long count = customerRepository.count();
        return String.format("KH%06d", count + 1);
    }

    @Override
    public Customer buildCustomer(@Valid CustomerCreateDTO customerCreateDTO) {
        if (customerRepository.existsByUsername(customerCreateDTO.getUsername())) {
            throw new DuplicateResourceException("Tên người dùng đã tồn tại");
        }
        if (customerRepository.existsByEmail(customerCreateDTO.getEmail())) {
            throw new DuplicateResourceException("Email đã tồn tại");
        }
        Customer customer = customerMapper.toCustomer(customerCreateDTO);
        customer.setCustomerCode(generateCustomerCode());
        customer.setPassword(passwordEncoder.encode(customer.getPassword()));
        customer.setStatus(Status.PENDING);
        customer.setRole(Roles.CUSTOMER);
        return customer;
    }

    @Transactional
    public Customer saveCustomer(Customer customer) {
        try {
            Customer savedCustomer = customerRepository.save(customer);
            cartService.createCartForCustomer(savedCustomer.getCustomerId());
            return savedCustomer;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create customer and cart: " + e.getMessage(), e);
        }
    }

    @Override
    public Page<CustomerResponseDTO> getAllCustomers(Pageable pageable) {
        Pageable safePageable = pageable != null ? pageable : Pageable.unpaged();
        Page<Customer> customersPage = customerRepository.findAll(safePageable);
        List<String> customerIds = customersPage.getContent().stream()
                .map(Customer::getCustomerId)
                .collect(Collectors.toList());

        // Batch fetch cancelled counts for the current page only
        Map<String, Long> cancelledCountsMap = customerRepository.findCancelledCountsForCustomerIds(customerIds)
                .stream()
                .collect(Collectors.toMap(
                        CustomerCancelledCountProjection::getCustomerId,
                        CustomerCancelledCountProjection::getCancelledCount
                ));

        return customersPage.map(customer -> {
            CustomerResponseDTO dto = customerMapper.toCustomerResponseDTO(customer);
            dto.setOrderCancelCount(cancelledCountsMap.getOrDefault(customer.getCustomerId(), 0L).intValue());
            return dto;
        });
    }

    @Override
    public CustomerResponseDTO findCustomerByUsername(String username) {
        Customer customer = customerRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with username: " + username));
        return mapCustomerToDtoWithCancelCount(customer);
    }

    @Transactional
    @Override
    public CustomerResponseDTO updateCustomerInfo(String username, CustomerUpdateDTO customerUpdateDTO) {
        Customer customer = customerRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with username: " + username));

        if (!customer.getEmail().equals(customerUpdateDTO.getEmail()) &&
                customerRepository.existsByEmail(customerUpdateDTO.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }

        customer.setEmail(customerUpdateDTO.getEmail());
        customer.setGender(customerUpdateDTO.getGender());
        customer.setFullname(customerUpdateDTO.getFullname());
        customer.setPhone(customerUpdateDTO.getPhone());
        Customer updatedCustomer = customerRepository.save(customer);
        return customerMapper.toCustomerResponseDTO(updatedCustomer);
    }

    @Transactional
    public CustomerResponseDTO updateLocation(String username, CustomerLocationUpdateDTO locationUpdateDTO) {
        Customer customer = customerRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with username: " + username));

        customer.setLatitude(locationUpdateDTO.getLatitude());
        customer.setLongitude(locationUpdateDTO.getLongitude());
        Customer updatedCustomer = customerRepository.save(customer);
        return customerMapper.toCustomerResponseDTO(updatedCustomer);
    }

    @Transactional
    public CustomerResponseDTO updatePassword(String username, CustomerPasswordUpdateDTO passwordUpdateDTO) {
        Customer customer = customerRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with username: " + username));

        customer.setPassword(passwordEncoder.encode(passwordUpdateDTO.getPassword()));
        Customer updatedCustomer = customerRepository.save(customer);
        return customerMapper.toCustomerResponseDTO(updatedCustomer);
    }

    private CustomerResponseDTO mapCustomerToDtoWithCancelCount(Customer customer) {
        CustomerResponseDTO dto = customerMapper.toCustomerResponseDTO(customer);
        long cancelCount = orderRepository.countByCustomer_CustomerIdAndStatus(customer.getCustomerId(), OrderStatus.CANCELLED);
        dto.setOrderCancelCount(cancelCount);
        return dto;
    }

    @Override
    public Optional<Customer> findByEmail(String email) {
        return customerRepository.findByEmail(email);
    }

    @Override
    public CustomerResponseDTO findCustomerById(String customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        return mapCustomerToDtoWithCancelCount(customer);
    }

    @Override
    public List<PointHistoryResponseDTO> getPointHistory(String customerId) {
        List<PointHistory> histories = pointHistoryRepository.findByCustomer_CustomerIdOrderByCreatedAtDesc(customerId);
        return histories.stream()
                .map(PointHistoryResponseDTO::new)
                .collect(Collectors.toList());
    }
}
