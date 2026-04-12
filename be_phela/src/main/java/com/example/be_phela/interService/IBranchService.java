package com.example.be_phela.interService;

import com.example.be_phela.dto.request.BranchCreateDTO;
import com.example.be_phela.model.Address;
import com.example.be_phela.model.Branch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface IBranchService {
    String generateBranchCode();
    Branch createBranch(BranchCreateDTO branchDTO);
    public List<Branch> getAllBranches();
    Branch getBranchByCode(String branchCode);
    Branch updateBranch(String branchCode, BranchCreateDTO updatedBranchDTO);
    List<Branch> findBranchesByCity(String city);
    List<Branch> findBranchesByDistrict(String district);
    Branch toggleBranchStatus(String branchCode);
    Optional<Branch> findNearestBranch(Address address, List<Branch> branches);
}
