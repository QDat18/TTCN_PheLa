package com.example.be_phela.mapper;

import com.example.be_phela.dto.request.CategoryCreateDTO;
import com.example.be_phela.dto.response.CategoryResponseDTO;
import com.example.be_phela.model.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CategoryMapper {
    @Mapping(target = "categoryCode", ignore = true)
    Category toCategory(CategoryCreateDTO dto);
    @Mapping(source = "categoryCode", target = "categoryCode")
    CategoryResponseDTO toCategoryResponseDTO(Category category);
}
