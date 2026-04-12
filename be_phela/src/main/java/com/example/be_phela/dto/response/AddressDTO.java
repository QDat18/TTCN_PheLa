package com.example.be_phela.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressDTO {
    String addressId;
    String customerId;
    String city;
    String district;
    String ward;
    String detailedAddress;
    String recipientName;
    String phone;
    Double latitude;
    Double longitude;
    Boolean isDefault;

    // Manual Getters
    public String getAddressId() { return addressId; }
    public String getCustomerId() { return customerId; }
    public String getCity() { return city; }
    public String getDistrict() { return district; }
    public String getWard() { return ward; }
    public String getDetailedAddress() { return detailedAddress; }
    public String getRecipientName() { return recipientName; }
    public String getPhone() { return phone; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public Boolean getIsDefault() { return isDefault; }

    // Manual Builder
    public static AddressDTOBuilder builder() {
        return new AddressDTOBuilder();
    }

    public static class AddressDTOBuilder {
        private String addressId;
        private String customerId;
        private String city;
        private String district;
        private String ward;
        private String detailedAddress;
        private String recipientName;
        private String phone;
        private Double latitude;
        private Double longitude;
        private Boolean isDefault;

        public AddressDTOBuilder addressId(String addressId) { this.addressId = addressId; return this; }
        public AddressDTOBuilder customerId(String customerId) { this.customerId = customerId; return this; }
        public AddressDTOBuilder city(String city) { this.city = city; return this; }
        public AddressDTOBuilder district(String district) { this.district = district; return this; }
        public AddressDTOBuilder ward(String ward) { this.ward = ward; return this; }
        public AddressDTOBuilder detailedAddress(String detailedAddress) { this.detailedAddress = detailedAddress; return this; }
        public AddressDTOBuilder recipientName(String recipientName) { this.recipientName = recipientName; return this; }
        public AddressDTOBuilder phone(String phone) { this.phone = phone; return this; }
        public AddressDTOBuilder latitude(Double latitude) { this.latitude = latitude; return this; }
        public AddressDTOBuilder longitude(Double longitude) { this.longitude = longitude; return this; }
        public AddressDTOBuilder isDefault(Boolean isDefault) { this.isDefault = isDefault; return this; }

        public AddressDTO build() {
            return new AddressDTO(addressId, customerId, city, district, ward, detailedAddress, recipientName, phone, latitude, longitude, isDefault);
        }
    }
}