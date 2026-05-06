package com.example.be_phela.service;

import com.example.be_phela.model.Admin;
import com.example.be_phela.repository.AdminRepository;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AdminUserDetailsService implements UserDetailsService {
    private final AdminRepository adminRepository;

    public AdminUserDetailsService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Admin admin = adminRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tên người dùng : " + username));

        switch (admin.getStatus()) {
            case BLOCKED -> throw new LockedException("Tài khoản đã bị khóa!");
            case PENDING -> throw new DisabledException("Bạn cần xác thực tài khoản qua email!");
            case INACTIVE -> throw new DisabledException("Tài khoản đã bị vô hiệu hóa!");
            case ACTIVE -> {
                // Account is active, continue with authentication
            }
        }

        return admin;
    }
}