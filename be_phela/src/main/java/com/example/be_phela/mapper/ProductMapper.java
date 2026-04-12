package com.example.be_phela.mapper;

import com.example.be_phela.dto.request.ProductCreateDTO;
import com.example.be_phela.dto.response.ProductResponseDTO;
import com.example.be_phela.model.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductMapper {
    @Mapping(target = "productId", ignore = true)
    @Mapping(target = "originalPrice", source = "originalPrice")
    Product toProduct(ProductCreateDTO dto);

    @Mapping(target = "productId", source = "productId")
    @Mapping(target = "productCode", source = "productCode")
    @Mapping(target = "categoryCode", source = "category.categoryCode")
    ProductResponseDTO toProductResponseDTO(Product product);
}