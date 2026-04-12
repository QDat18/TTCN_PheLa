package com.example.be_phela.interService;

import com.example.be_phela.dto.request.AddressCreateDTO;
import com.example.be_phela.dto.response.AddressDTO;

import java.util.List;

public interface IAddressService {

    List<AddressDTO> getAddressesByCustomerId(String customerId);

    AddressDTO createAddress(String customerId, AddressCreateDTO addressCreateDTO);

    AddressDTO updateAddress(String addressId, AddressCreateDTO addressCreateDTO);

    void deleteAddress(String addressId);

    // Đặt địa chỉ làm mặc định
    AddressDTO setDefaultAddress(String customerId, String addressId);
}