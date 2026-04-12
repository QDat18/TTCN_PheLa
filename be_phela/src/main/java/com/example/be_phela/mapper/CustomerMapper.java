package com.example.be_phela.mapper;

import com.example.be_phela.dto.request.CustomerCreateDTO;
import com.example.be_phela.dto.response.CustomerResponseDTO;
import com.example.be_phela.model.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CustomerMapper {
    Customer toCustomer(CustomerCreateDTO customerCreateDTO);

    @Mapping(source = "customerId", target = "customerId")
    CustomerResponseDTO toCustomerResponseDTO(Customer customer);

}
