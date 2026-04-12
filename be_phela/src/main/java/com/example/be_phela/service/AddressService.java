package com.example.be_phela.service;

import com.example.be_phela.dto.request.AddressCreateDTO;
import com.example.be_phela.dto.response.AddressDTO;
import com.example.be_phela.interService.IAddressService;
import com.example.be_phela.model.Address;
import com.example.be_phela.model.Customer;
import com.example.be_phela.repository.AddressRepository;
import com.example.be_phela.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AddressService implements IAddressService {

    private final AddressRepository addressRepository;
    private final CustomerRepository customerRepository;

    @Override
    public List<AddressDTO> getAddressesByCustomerId(String customerId) {
        log.info("Fetching addresses for customer: {}", customerId);
        return addressRepository.findByCustomer_CustomerId(customerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AddressDTO createAddress(String customerId, AddressCreateDTO addressCreateDTO) {
        log.info("Creating new address for customer: {}", customerId);

        // Kiểm tra customerId tồn tại
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));

        // Tạo Address mới
        Address address = Address.builder()
                .customer(customer)
                .city(addressCreateDTO.getCity())
                .district(addressCreateDTO.getDistrict())
                .ward(addressCreateDTO.getWard())
                .recipientName(addressCreateDTO.getRecipientName())
                .phone(addressCreateDTO.getPhone())
                .detailedAddress(addressCreateDTO.getDetailedAddress())
                .latitude(addressCreateDTO.getLatitude())
                .longitude(addressCreateDTO.getLongitude())
                .isDefault(addressCreateDTO.getIsDefault() != null && addressCreateDTO.getIsDefault())
                .build();

        // Nếu địa chỉ mới được đặt là mặc định, cập nhật các địa chỉ khác
        if (address.getIsDefault()) {
            unsetOtherDefaultAddresses(customerId, address.getAddressId());
        }

        // Lưu vào database (UUID sẽ tự động tạo bởi @UuidGenerator)
        address = addressRepository.save(address);
        log.info("Address created successfully: {}", address.getAddressId());
        return convertToDTO(address);
    }

    @Override
    @Transactional
    public AddressDTO updateAddress(String addressId, AddressCreateDTO addressCreateDTO) {
        log.info("Updating address: {}", addressId);

        // Tìm địa chỉ theo addressId
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        // Cập nhật thông tin địa chỉ
        address.setCity(addressCreateDTO.getCity());
        address.setDistrict(addressCreateDTO.getDistrict());
        address.setWard(addressCreateDTO.getWard());
        address.setRecipientName(addressCreateDTO.getRecipientName());
        address.setPhone(addressCreateDTO.getPhone());
        address.setDetailedAddress(addressCreateDTO.getDetailedAddress());
        address.setLatitude(addressCreateDTO.getLatitude());
        address.setLongitude(addressCreateDTO.getLongitude());
        address.setIsDefault(addressCreateDTO.getIsDefault() != null && addressCreateDTO.getIsDefault());

        // Nếu địa chỉ này được đặt là mặc định, cập nhật các địa chỉ khác
        if (address.getIsDefault()) {
            unsetOtherDefaultAddresses(address.getCustomer().getCustomerId(), addressId);
        }

        // Lưu lại
        address = addressRepository.save(address);
        log.info("Address updated successfully: {}", addressId);
        return convertToDTO(address);
    }

    @Override
    public void deleteAddress(String addressId) {
        log.info("Deleting address: {}", addressId);
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));
        addressRepository.delete(address);
        log.info("Address deleted successfully: {}", addressId);
    }

    @Override
    @Transactional
    public AddressDTO setDefaultAddress(String customerId, String addressId) {
        log.info("Setting default address: {} for customer: {}", addressId, customerId);

        // Tìm địa chỉ theo addressId
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        // Kiểm tra xem địa chỉ có thuộc customer không
        if (!address.getCustomer().getCustomerId().equals(customerId)) {
            throw new RuntimeException("Address does not belong to customer: " + customerId);
        }

        // Đặt tất cả địa chỉ khác của customer thành không mặc định
        unsetOtherDefaultAddresses(customerId, addressId);

        // Đặt địa chỉ này là mặc định
        address.setIsDefault(true);
        address = addressRepository.save(address);
        log.info("Set default address successfully: {}", addressId);
        return convertToDTO(address);
    }

    private void unsetOtherDefaultAddresses(String customerId, String excludeAddressId) {
        addressRepository.findByCustomer_CustomerId(customerId).stream()
                .filter(a -> !a.getAddressId().equals(excludeAddressId))
                .filter(Address::getIsDefault)
                .forEach(a -> {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                });
    }

    private AddressDTO convertToDTO(Address address) {
        return AddressDTO.builder()
                .addressId(address.getAddressId())
                .city(address.getCity())
                .district(address.getDistrict())
                .ward(address.getWard())
                .recipientName(address.getRecipientName())
                .phone(address.getPhone())
                .detailedAddress(address.getDetailedAddress())
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .isDefault(address.getIsDefault())
                .build();
    }
}