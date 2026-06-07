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
import com.example.be_phela.repository.VerificationTokenRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AdminService implements IAdminService {
    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final AdminRepository adminRepository;
    private final BranchRepository branchRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AdminMapper adminMapper;
    private final VerificationTokenRepository verificationTokenRepository;

    public AdminService(AdminRepository adminRepository,
                        BranchRepository branchRepository,
                        BCryptPasswordEncoder passwordEncoder,
                        AdminMapper adminMapper,
                        VerificationTokenRepository verificationTokenRepository) {
        this.adminRepository = adminRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminMapper = adminMapper;
        this.verificationTokenRepository = verificationTokenRepository;
    }

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

        // Kiểm tra email trùng lặp
        if (!adminToUpdate.getEmail().equals(adminDTO.getEmail()) && adminRepository.existsByEmail(adminDTO.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }

        // Kiểm tra thay đổi vai trò và trạng thái
        boolean isRoleChanged = false;
        Roles newRole = null;
        if (adminDTO.getRole() != null && !adminDTO.getRole().trim().isEmpty()) {
            try {
                newRole = Roles.valueOf(adminDTO.getRole().toUpperCase());
                if (adminToUpdate.getRole() != newRole) {
                    isRoleChanged = true;
                }
            } catch (IllegalArgumentException ignored) {}
        }

        boolean isStatusChanged = false;
        Status newStatus = null;
        if (adminDTO.getStatus() != null && !adminDTO.getStatus().trim().isEmpty()) {
            try {
                newStatus = Status.valueOf(adminDTO.getStatus().toUpperCase());
                if (adminToUpdate.getStatus() != newStatus) {
                    isStatusChanged = true;
                }
            } catch (IllegalArgumentException ignored) {}
        }

        if (isRoleChanged || isStatusChanged) {
            String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            Admin currentAdmin = adminRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new ResourceNotFoundException("Current admin not found with username: " + currentUsername));
            if (!currentAdmin.getRole().equals(Roles.SUPER_ADMIN)) {
                throw new SecurityException("Chỉ Super Admin mới được quyền thay đổi vai trò hoặc trạng thái nhân viên!");
            }
        }

        // Cập nhật thông tin
        adminToUpdate.setFullname(adminDTO.getFullname());
        adminToUpdate.setDob(adminDTO.getDob());
        adminToUpdate.setGender(adminDTO.getGender());
        adminToUpdate.setEmail(adminDTO.getEmail());
        adminToUpdate.setPhone(adminDTO.getPhone());

        if (newRole != null) {
            adminToUpdate.setRole(newRole);
        }
        if (newStatus != null) {
            adminToUpdate.setStatus(newStatus);
        }

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

    @Override
    @Transactional
    public AdminResponseDTO createAdmin(AdminCreateDTO adminCreateDTO) {
        log.info("Creating admin with username: {}", adminCreateDTO.getUsername());
        if (adminRepository.existsByUsername(adminCreateDTO.getUsername())) {
            throw new DuplicateResourceException("Tên đăng nhập đã tồn tại trong hệ thống!");
        }
        if (adminRepository.existsByEmail(adminCreateDTO.getEmail())) {
            throw new DuplicateResourceException("Email đã tồn tại trong hệ thống!");
        }
        if (adminCreateDTO.getEmployCode() != null && !adminCreateDTO.getEmployCode().trim().isEmpty()
                && adminRepository.existsByEmployCode(adminCreateDTO.getEmployCode())) {
            throw new DuplicateResourceException("Mã nhân viên đã tồn tại trong hệ thống!");
        }
        if (adminRepository.existsByFullname(adminCreateDTO.getFullname())) {
            throw new DuplicateResourceException("Họ tên nhân viên đã tồn tại trong hệ thống!");
        }

        Admin admin = adminMapper.toAdmin(adminCreateDTO);

        // Mã hóa mật khẩu
        admin.setPassword(passwordEncoder.encode(adminCreateDTO.getPassword()));

        // Gán mã nhân viên
        if (adminCreateDTO.getEmployCode() == null || adminCreateDTO.getEmployCode().trim().isEmpty()) {
            admin.setEmployCode(generateEmployCode());
        } else {
            admin.setEmployCode(adminCreateDTO.getEmployCode());
        }

        // Gán vai trò
        if (adminCreateDTO.getRole() != null && !adminCreateDTO.getRole().trim().isEmpty()) {
            try {
                admin.setRole(Roles.valueOf(adminCreateDTO.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                admin.setRole(Roles.STAFF);
            }
        } else {
            admin.setRole(Roles.STAFF);
        }

        // Gán trạng thái
        if (adminCreateDTO.getStatus() != null && !adminCreateDTO.getStatus().trim().isEmpty()) {
            try {
                admin.setStatus(Status.valueOf(adminCreateDTO.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                admin.setStatus(Status.ACTIVE);
            }
        } else {
            admin.setStatus(Status.ACTIVE);
        }

        // Gán chi nhánh
        if (adminCreateDTO.getBranch() != null && !adminCreateDTO.getBranch().trim().isEmpty()) {
            Branch branch = branchRepository.findByBranchCode(adminCreateDTO.getBranch())
                    .orElse(null);
            admin.setBranch(branch);
        }

        admin.setFailedLoginAttempts(0);

        Admin savedAdmin = adminRepository.save(admin);
        log.info("Admin created successfully with username: {}", savedAdmin.getUsername());
        return adminMapper.toAdminResponseDTO(savedAdmin);
    }

    @Override
    @Transactional
    public void deleteAdmin(String username) {
        log.info("Deleting admin with username: {}", username);

        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        Admin currentAdmin = adminRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Current admin not found with username: " + currentUsername));
        if (!currentAdmin.getRole().equals(Roles.SUPER_ADMIN)) {
            throw new SecurityException("Chỉ Super Admin mới có quyền xóa nhân viên!");
        }

        Admin adminToDelete = adminRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with username: " + username));

        if (adminToDelete.getUsername().equals(currentUsername)) {
            throw new IllegalArgumentException("Không thể tự xóa chính mình!");
        }

        // Delete associated verification tokens first to prevent foreign key violations
        verificationTokenRepository.deleteByAdmin(adminToDelete);

        adminRepository.delete(adminToDelete);
        log.info("Admin deleted successfully: {}", username);
    }
}
