package com.example.be_phela.mapper;

import com.example.be_phela.dto.request.AdminCreateDTO;
import com.example.be_phela.dto.response.AdminResponseDTO;
import com.example.be_phela.model.Admin;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = BranchMapper.class)
public interface AdminMapper {
    @Mapping(source = "fullname", target = "fullname")
    @Mapping(source = "branch", target = "branch", qualifiedByName = "mapStringToBranch")
    Admin toAdmin(AdminCreateDTO admin);

    @Mapping(source = "id", target = "adminId")
    @Mapping(source = "fullname", target = "fullname")
    @Mapping(source = "branch", target = "branch", qualifiedByName = "mapBranchToString")
    AdminResponseDTO toAdminResponseDTO(Admin admin);
}
