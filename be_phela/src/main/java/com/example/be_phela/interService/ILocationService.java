package com.example.be_phela.interService;

import com.example.be_phela.dto.response.District;
import com.example.be_phela.dto.response.Province;
import com.example.be_phela.dto.response.Ward;

import java.util.List;

public interface ILocationService {
    /**
     * Lấy danh sách tất cả Tỉnh/Thành phố.
     * API: https://provinces.open-api.vn/api/v1/p/
     */
    List<Province> getAllProvinces();

    /**
     * Lấy danh sách Quận/Huyện theo mã Tỉnh/Thành phố.
     * API: https://provinces.open-api.vn/api/v1/p/{provinceCode}?depth=2
     */
    List<District> getDistrictsByProvince(int provinceCode);

    /**
     * Lấy danh sách Phường/Xã theo mã Quận/Huyện.
     * API: https://provinces.open-api.vn/api/v1/d/{districtCode}?depth=2
     */
    List<Ward> getWardsByDistrict(int districtCode);

    /**
     * Lấy toàn bộ cây dữ liệu Tỉnh/Quận/Phường để dựng bản đồ địa lý đầy đủ.
     * API: https://provinces.open-api.vn/api/?depth=3
     */
    List<Province> getLocationHierarchy();
}
