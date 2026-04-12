package com.example.be_phela.controller;

import com.example.be_phela.dto.request.BranchCreateDTO;
import com.example.be_phela.dto.response.BranchResponseDTO;
import com.example.be_phela.exception.DuplicateResourceException;
import com.example.be_phela.exception.ResourceNotFoundException;
import com.example.be_phela.mapper.BranchMapper;
import com.example.be_phela.model.Branch;
import com.example.be_phela.service.BranchService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BranchController {
    BranchService branchService;
    BranchMapper branchMapper;

    @PostMapping("/api/admin/branch/create")
    public ResponseEntity<BranchResponseDTO> createBranch(@RequestBody BranchCreateDTO branchDTO) {
        try {
            Branch branch = branchService.createBranch(branchDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(branchMapper.toBranchRepositoryDTO(branch));
        } catch (DuplicateResourceException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
        }
    }

    @GetMapping("/api/branch")
    public ResponseEntity<List<BranchResponseDTO>> getAllBranches() {
        List<Branch> branches = branchService.getAllBranches();
        List<BranchResponseDTO> branchDTOs = branches.stream()
                .map(branchMapper::toBranchRepositoryDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(branchDTOs);
    }


    @GetMapping("/api/branch/{branchCode}")
    public ResponseEntity<BranchResponseDTO> getBranchById(@PathVariable String branchCode) {
        try {
            Branch branch = branchService.getBranchByCode(branchCode);
            return ResponseEntity.ok(branchMapper.toBranchRepositoryDTO(branch));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @PutMapping("/api/admin/branch/{branchCode}")
    public ResponseEntity<BranchResponseDTO> updateBranch(@PathVariable String branchCode, @RequestBody BranchCreateDTO branchDTO) {
        try {
            Branch updatedBranch = branchService.updateBranch(branchCode, branchDTO);
            return ResponseEntity.ok(branchMapper.toBranchRepositoryDTO(updatedBranch));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (DuplicateResourceException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
        }
    }

    @GetMapping("/api/branch/by-city")
    public ResponseEntity<List<BranchResponseDTO>> findBranchesByCity(@RequestParam String city) {
        List<Branch> branches = branchService.findBranchesByCity(city);
        List<BranchResponseDTO> branchDTOs = branches.stream()
                .map(branchMapper::toBranchRepositoryDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(branchDTOs);
    }

    @GetMapping("/api/branch/by-district")
    public ResponseEntity<List<BranchResponseDTO>> findBranchesByDistrict(@RequestParam String district) {
        List<Branch> branches = branchService.findBranchesByDistrict(district);
        List<BranchResponseDTO> branchDTOs = branches.stream()
                .map(branchMapper::toBranchRepositoryDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(branchDTOs);
    }

    @PatchMapping("/api/admin/branch/{branchCode}/toggle-status")
    public ResponseEntity<BranchResponseDTO> toggleBranchStatus(@PathVariable String branchCode) {
        try {
            Branch updatedBranch = branchService.toggleBranchStatus(branchCode);
            return ResponseEntity.ok(branchMapper.toBranchRepositoryDTO(updatedBranch));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }
}
