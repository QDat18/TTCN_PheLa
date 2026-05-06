package com.example.be_phela.service;

import com.example.be_phela.model.Customer;
import com.example.be_phela.repository.CustomerRepository;
import org.springframework.context.annotation.Primary;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomerUserDetailsService implements UserDetailsService {

    private final CustomerRepository customerRepository;

    public CustomerUserDetailsService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Customer customer = customerRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tên người dùng : " + username));

        switch (customer.getStatus()) {
            case BLOCKED -> throw new LockedException("Tài khoản đã bị khóa!");
            case PENDING -> throw new DisabledException("Bạn cần xác thực tài khoản qua email!");
            case INACTIVE -> throw new DisabledException("Tài khoản đã bị vô hiệu hóa!");
            case ACTIVE -> {
                // Account is active, continue with authentication
            }
        }

        return customer;
    }}
