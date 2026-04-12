package com.example.be_phela.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.be_phela.dto.response.District;
import com.example.be_phela.dto.response.Province;
import com.example.be_phela.dto.response.Ward;
import com.example.be_phela.interService.ILocationService;
import com.example.be_phela.utils.LocationApiClient;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LocationService implements ILocationService {

    private final LocationApiClient locationApiClient;

    @Override
    public List<Province> getAllProvinces() {
        return locationApiClient.fetchAllProvinces();
    }

    @Override
    public List<District> getDistrictsByProvince(int provinceCode) {
        Province province = locationApiClient.fetchProvinceWithDistricts(provinceCode);
        return Optional.ofNullable(province.getDistricts()).orElse(List.of());
    }

    @Override
    public List<Ward> getWardsByDistrict(int districtCode) {
        District district = locationApiClient.fetchDistrictWithWards(districtCode);
        return Optional.ofNullable(district.getWards()).orElse(List.of());
    }

    @Override
    public List<Province> getLocationHierarchy() {
        return locationApiClient.fetchLocationHierarchy();
    }
}
