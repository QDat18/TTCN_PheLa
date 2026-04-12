package com.example.be_phela.dto.response;

import com.example.be_phela.model.enums.ProductStatus;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BranchResponseDTO {
    String branchCode;
    String branchName;
    String city;
    String district;
    String address;
    Double latitude;
    Double longitude;
    ProductStatus status;

    // Manual Getters
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public String getCity() { return city; }
    public String getDistrict() { return district; }
    public String getAddress() { return address; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public ProductStatus getStatus() { return status; }

    // Manual Builder (Fix for Lombok issues in Service)
    public static BranchResponseDTOBuilder builder() {
        return new BranchResponseDTOBuilder();
    }

    public static class BranchResponseDTOBuilder {
        private String branchCode;
        private String branchName;
        private String city;
        private String district;
        private String address;
        private Double latitude;
        private Double longitude;
        private ProductStatus status;

        public BranchResponseDTOBuilder branchCode(String branchCode) { this.branchCode = branchCode; return this; }
        public BranchResponseDTOBuilder branchName(String branchName) { this.branchName = branchName; return this; }
        public BranchResponseDTOBuilder city(String city) { this.city = city; return this; }
        public BranchResponseDTOBuilder district(String district) { this.district = district; return this; }
        public BranchResponseDTOBuilder address(String address) { this.address = address; return this; }
        public BranchResponseDTOBuilder latitude(Double latitude) { this.latitude = latitude; return this; }
        public BranchResponseDTOBuilder longitude(Double longitude) { this.longitude = longitude; return this; }
        public BranchResponseDTOBuilder status(ProductStatus status) { this.status = status; return this; }

        public BranchResponseDTO build() {
            return new BranchResponseDTO(branchCode, branchName, city, district, address, latitude, longitude, status);
        }
    }
}
