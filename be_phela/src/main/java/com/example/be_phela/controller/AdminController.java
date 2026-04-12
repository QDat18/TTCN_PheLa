package com.example.be_phela.controller;

import com.example.be_phela.dto.request.AdminCreateDTO;
import com.example.be_phela.dto.request.AdminPasswordUpdateDTO;
import com.example.be_phela.dto.request.AdminUpdateDTO;
import com.example.be_phela.dto.response.AdminResponseDTO;
import com.example.be_phela.mapper.AdminMapper;
import com.example.be_phela.model.Admin;
import com.example.be_phela.model.enums.Roles;
import com.example.be_phela.model.enums.Status;
import com.example.be_phela.service.AdminService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("api/admin")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminController {
    AdminService adminService;
    AdminMapper adminMapper;

    @GetMapping("/getAll")
    public ResponseEntity<Page<AdminResponseDTO>> getAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "username") String sortBy
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        Page<AdminResponseDTO> adminPage = adminService.getAllAdmins(pageable);
        return ResponseEntity.ok(adminPage);
    }

    @GetMapping("/{username}")
    public ResponseEntity<AdminResponseDTO> getAdminByUsername(@PathVariable String username) {
        AdminResponseDTO responseDTO = adminService.findAdminByUsername(username);
        return ResponseEntity.ok(responseDTO);
    }

    @PutMapping("/updateInfo/{username}")
    public ResponseEntity<AdminResponseDTO> updateAdminInfo(
            @PathVariable String username,
            @RequestBody @Valid AdminUpdateDTO adminDTO) {
        AdminResponseDTO updatedAdmin = adminService.updateAdminInfo(username, adminDTO);
        return ResponseEntity.ok(updatedAdmin);
    }

    @GetMapping("/search")
    public ResponseEntity<List<AdminResponseDTO>> searchAdmins(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String fullname,
            @RequestParam(required = false) Roles role) {
        List<AdminResponseDTO> admins = adminService.searchAdmins(username, fullname, role);
        return ResponseEntity.ok(admins);
    }

    @PatchMapping("/{username}/role")
    public ResponseEntity<AdminResponseDTO> updateAdminRole(
            @PathVariable String username,
            @RequestParam Roles newRole,
            @RequestParam String curentUsername) {
        AdminResponseDTO updatedAdmin = adminService.updateAdminRole(username, newRole, curentUsername);
        return ResponseEntity.ok(updatedAdmin);
    }

    @PatchMapping("/{username}/status")
    public ResponseEntity<AdminResponseDTO> updateAdminStatus(
            @PathVariable String username,
            @RequestParam Status newStatus,
            @RequestParam String curentUsername) {
        AdminResponseDTO updatedAdmin = adminService.updateAdminStatus(username, newStatus, curentUsername);
        return ResponseEntity.ok(updatedAdmin);
    }

    @PatchMapping("/{username}/assign-branch")
    public ResponseEntity<AdminResponseDTO> assignBranchToAdmin(
            @PathVariable String username,
            @RequestParam String branchCode,
            @RequestParam String curentUsername) {
        AdminResponseDTO updatedAdmin = adminService.assignBranchToAdmin(username, branchCode, curentUsername);
        return ResponseEntity.ok(updatedAdmin);
    }

    @PatchMapping("/{username}/password")
    public ResponseEntity<AdminResponseDTO> updateAdminPassword(
            @PathVariable String username,
            @RequestBody AdminPasswordUpdateDTO passwordDTO) {
        AdminResponseDTO updatedAdmin = adminService.updateAdminPassword(username, passwordDTO);
        return ResponseEntity.ok(updatedAdmin);
    }
}
