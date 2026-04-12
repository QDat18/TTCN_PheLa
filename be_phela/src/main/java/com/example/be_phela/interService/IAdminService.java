package com.example.be_phela.interService;

import com.example.be_phela.dto.request.AdminCreateDTO;
import com.example.be_phela.dto.request.AdminPasswordUpdateDTO;
import com.example.be_phela.dto.request.AdminUpdateDTO;
import com.example.be_phela.dto.request.CustomerCreateDTO;
import com.example.be_phela.dto.response.AdminResponseDTO;
import com.example.be_phela.model.Admin;
import com.example.be_phela.model.Customer;
import com.example.be_phela.model.enums.Roles;
import com.example.be_phela.model.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;
import java.util.Optional;

public interface IAdminService {
    String generateEmployCode();
    Admin buildAdmin(AdminCreateDTO adminCreateDTO, String ip);
    Page<AdminResponseDTO> getAllAdmins(Pageable pageable);
    AdminResponseDTO findAdminByUsername(String username);
    Optional<Admin> findByEmail(String email);
    AdminResponseDTO updateAdminInfo(String username, AdminUpdateDTO adminDTO);
    List<AdminResponseDTO> searchAdmins(String username, String fullname, Roles role);
    AdminResponseDTO updateAdminRole(String username, Roles newRole, String currentUsername);
    AdminResponseDTO updateAdminStatus(String username, Status newStatus, String currentUsername);
    AdminResponseDTO assignBranchToAdmin(String username, String branchCode, String currentUsername);
    AdminResponseDTO updateAdminPassword(String username, AdminPasswordUpdateDTO passwordDTO);
}
