package com.example.be_phela.service;

import com.example.be_phela.dto.request.AdminCreateDTO;
import com.example.be_phela.dto.request.AdminPasswordUpdateDTO;
import com.example.be_phela.dto.request.AdminUpdateDTO;
import com.example.be_phela.dto.response.AdminResponseDTO;
import com.example.be_phela.exception.DuplicateResourceException;
import com.example.be_phela.exception.ResourceNotFoundException;
import com.example.be_phela.interService.IAdminService;
import com.example.be_phela.mapper.AdminMapper;
import com.example.be_phela.model.Admin;
import com.example.be_phela.model.Branch;
import com.example.be_phela.model.enums.Roles;
import com.example.be_phela.model.enums.Status;
import com.example.be_phela.repository.AdminRepository;
import com.example.be_phela.repository.BranchRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminService implements IAdminService {

    AdminRepository adminRepository;
    BranchRepository branchRepository;
    BCryptPasswordEncoder passwordEncoder;
    AdminMapper adminMapper;

    @Override
    public String generateEmployCode() {
        long count = adminRepository.count(); // Đếm số lượng Admin hiện có
        return String.format("PLB%05d", count + 1); // Ví dụ: ADM00001, ADM00002
    }

    @Override
    public Admin buildAdmin(@Valid AdminCreateDTO adminCreateDTO, String ip) {

        if (adminRepository.existsByUsername(adminCreateDTO.getUsername())) {
            throw new DuplicateResourceException("Admin username already exists");
        }
        if (adminRepository.existsByEmail(adminCreateDTO.getEmail())) {
            throw new DuplicateResourceException("Admin email already exists");
        }
        Admin admin = adminMapper.toAdmin(adminCreateDTO);
        admin.setEmployCode(generateEmployCode());
        admin.setPassword(passwordEncoder.encode(admin.getPassword())); // Mã hóa mật khẩu
        admin.setRole(Roles.STAFF); // Vai trò mặc định
        admin.setStatus(Status.PENDING); // Trạng thái mặc định
        admin.setLastLoginIp(ip);
        admin.setBranch(null);

        return admin;
    }

    @Transactional
    public void saveAdmin(Admin admin) {
        adminRepository.save(admin);
    }

    @Override
    public Page<AdminResponseDTO> getAllAdmins(Pageable pageable) {
        return adminRepository.findAll(pageable)
                .map(adminMapper::toAdminResponseDTO);
    }

    @Override
    public AdminResponseDTO findAdminByUsername(String username) {
        return adminRepository.findByUsername(username)
                .map(adminMapper::toAdminResponseDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with username: " + username));
    }

    @Override
    public Optional<Admin> findByEmail(String email) {
        return adminRepository.findByEmail(email);
    }

    @Override
    @Transactional
    public AdminResponseDTO updateAdminInfo(String username, AdminUpdateDTO adminDTO) {
        log.info("Updating admin info with username: {}", username);
        Admin adminToUpdate = adminRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with username: " + username));

//        // Kiểm tra quyền: người dùng có thể tự cập nhật thông tin của chính họ
//        // Nếu không phải chính họ, chỉ Super Admin mới được phép cập nhật
//        if (!currentUsername.equals(username)) {
//            Admin currentAdmin = adminRepository.findByUsername(currentUsername)
//                    .orElseThrow(() -> new ResourceNotFoundException("Current admin not found with username: " + currentUsername));
//            if (!currentAdmin.getRole().equals(Roles.SUPER_ADMIN)) {
//                throw new SecurityException("You can only update your own information unless you are a Super Admin");
//            }
//        }

        // Kiểm tra email trùng lặp
        if (!adminToUpdate.getEmail().equals(adminDTO.getEmail()) && adminRepository.existsByEmail(adminDTO.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }

        // Cập nhật thông tin
        adminToUpdate.setFullname(adminDTO.getFullname());
        adminToUpdate.setDob(adminDTO.getDob());
        adminToUpdate.setGender(adminDTO.getGender());
        adminToUpdate.setEmail(adminDTO.getEmail());
        adminToUpdate.setPhone(adminDTO.getPhone());

        Admin updatedAdmin = adminRepository.save(adminToUpdate);
        log.info("Admin info updated successfully for username: {}", username);
        return adminMapper.toAdminResponseDTO(updatedAdmin);
    }


    @Override
    public List<AdminResponseDTO> searchAdmins(String username, String fullname, Roles role) {
        log.info("Searching admins with username: {}, fullname: {}, role: {}", username, fullname, role);
        List<Admin> admins = adminRepository.findAll().stream()
                .filter(admin -> {
                    boolean matchesUsername = username == null || username.isEmpty() ||
                            admin.getUsername().toLowerCase().contains(username.toLowerCase());
                    boolean matchesFullname = fullname == null || fullname.isEmpty() ||
                            admin.getFullname().toLowerCase().contains(fullname.toLowerCase());
                    boolean matchesRole = role == null || admin.getRole() == role;
                    return matchesUsername && matchesFullname && matchesRole;
                })
                .collect(Collectors.toList());
        return admins.stream()
                .map(adminMapper::toAdminResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminResponseDTO updateAdminRole(String username, Roles newRole, String currentUsername) {
        log.info("Updating role for admin with username: {}", username);
        Admin currentAdmin = adminRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Current admin not found with username: " + currentUsername));
        if (!currentAdmin.getRole().equals(Roles.SUPER_ADMIN)) {
            throw new SecurityException("Only Super Admin can update admin role");
        }

        Admin adminToUpdate = adminRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with username: " + username));
        if (adminToUpdate.getRole().equals(Roles.SUPER_ADMIN) && !currentAdmin.getUsername().equals(username)) {
            throw new SecurityException("Cannot update role of another Super Admin");
        }

        adminToUpdate.setRole(newRole);
        Admin updatedAdmin = adminRepository.save(adminToUpdate);
        log.info("Admin role updated to {} for username: {}", newRole, username);
        return adminMapper.toAdminResponseDTO(updatedAdmin);
    }

    @Override
    @Transactional
    public AdminResponseDTO updateAdminStatus(String username, Status newStatus, String currentUsername) {
        log.info("Updating status for admin with username: {}", username);
        Admin currentAdmin = adminRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Current admin not found with username: " + currentUsername));
        if (!currentAdmin.getRole().equals(Roles.SUPER_ADMIN)) {
            throw new SecurityException("Only Super Admin can update admin status");
        }

        Admin adminToUpdate = adminRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with username: " + username));
        adminToUpdate.setStatus(newStatus);
        Admin updatedAdmin = adminRepository.save(adminToUpdate);
        log.info("Admin status updated to {} for username: {}", newStatus, username);
        return adminMapper.toAdminResponseDTO(updatedAdmin);
    }

    @Transactional
    public AdminResponseDTO assignBranchToAdmin(String username, String branchCode, String currentUsername) {
        log.info("Assigning branch to admin with username: {} and branchCode: {}", username, branchCode);
        Admin currentAdmin = adminRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Current admin not found with username: " + currentUsername));
        if (!currentAdmin.getRole().equals(Roles.SUPER_ADMIN) && !currentAdmin.getRole().equals(Roles.ADMIN)) {
            throw new SecurityException("Only Super Admin or Admin can assign branch to admin");
        }

        Admin adminToUpdate = adminRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with username: " + username));
        Branch branch = branchRepository.findByBranchCode(branchCode)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with branchCode: " + branchCode));
        adminToUpdate.setBranch(branch);
        Admin updatedAdmin = adminRepository.save(adminToUpdate);
        log.info("Admin assigned to branch {} with username: {}", branchCode, username);
        return adminMapper.toAdminResponseDTO(updatedAdmin);
    }

    @Override
    @Transactional
    public AdminResponseDTO updateAdminPassword(String username, AdminPasswordUpdateDTO passwordDTO) {
        log.info("Updating password for admin with username: {}", username);

        Admin adminToUpdate = adminRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with username: " + username));
        adminToUpdate.setPassword(passwordEncoder.encode(passwordDTO.getPassword()));
        Admin updatedAdmin = adminRepository.save(adminToUpdate);
        log.info("Admin password updated successfully for username: {}", username);
        return adminMapper.toAdminResponseDTO(updatedAdmin);
    }
}
