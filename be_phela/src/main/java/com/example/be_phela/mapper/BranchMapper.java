package com.example.be_phela.mapper;

import com.example.be_phela.dto.request.BranchCreateDTO;
import com.example.be_phela.dto.response.BranchResponseDTO;
import com.example.be_phela.model.Branch;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BranchMapper {
    @Mapping(target = "branchCode", ignore = true) // branchCode sẽ được tạo trong service
    @Mapping(source = "address", target = "address")
    Branch toBranch(BranchCreateDTO dto);

    @Mapping(source = "branchCode", target = "branchCode")
    @Mapping(source = "address", target = "address")
    BranchResponseDTO toBranchRepositoryDTO(Branch branch);

    @Named("mapStringToBranch")
    default Branch mapStringToBranch(String branchCode) {
        if (branchCode == null || branchCode.isEmpty()) {
            return null;
        }
        Branch branch = new Branch();
        branch.setBranchCode(branchCode);
        return branch;
    }

    @Named("mapBranchToString")
    default String mapBranchToString(Branch branch) {
        if (branch == null) {
            return null;
        }
        return branch.getBranchCode();
    }
}
