package com.example.be_phela.interService;

import com.example.be_phela.dto.request.AdminCreateDTO;
import com.example.be_phela.dto.request.CustomerCreateDTO;
import com.example.be_phela.dto.request.CustomerUpdateDTO;
import com.example.be_phela.dto.response.AdminResponseDTO;
import com.example.be_phela.dto.response.CustomerResponseDTO;
import com.example.be_phela.dto.response.PointHistoryResponseDTO;
import com.example.be_phela.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;
import java.util.Optional;

public interface ICustomerService {
    public String generateCustomerCode();

    Customer buildCustomer(CustomerCreateDTO customerCreateDTO);

    Page<CustomerResponseDTO> getAllCustomers(Pageable pageable);

    CustomerResponseDTO findCustomerByUsername(String username);

    CustomerResponseDTO updateCustomerInfo(String username, CustomerUpdateDTO customerUpdateDTO);
    Optional<Customer> findByEmail(String email);
    List<PointHistoryResponseDTO> getPointHistory(String customerId);
    CustomerResponseDTO findCustomerById(String customerId);
}
