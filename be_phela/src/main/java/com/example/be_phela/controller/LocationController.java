package com.example.be_phela.controller;

import com.example.be_phela.dto.response.ApiResponse;
import com.example.be_phela.dto.response.District;
import com.example.be_phela.dto.response.Province;
import com.example.be_phela.dto.response.Ward;
import com.example.be_phela.interService.ILocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final ILocationService locationService;

    @GetMapping("/map")
    public ResponseEntity<ApiResponse<List<Province>>> getLocationMap() {
        List<Province> locationMap = locationService.getLocationHierarchy();
        return ResponseEntity.ok(ApiResponse.success("Fetched location hierarchy successfully", locationMap));
    }

    @GetMapping("/provinces")
    public ResponseEntity<ApiResponse<List<Province>>> getAllProvinces() {
        List<Province> provinces = locationService.getAllProvinces();
        return ResponseEntity.ok(ApiResponse.success("Fetched all provinces successfully", provinces));
    }

    @GetMapping("/districts/{provinceCode}")
    public ResponseEntity<ApiResponse<List<District>>> getDistrictsByProvince(
            @PathVariable int provinceCode
    ) {
        List<District> districts = locationService.getDistrictsByProvince(provinceCode);
        return ResponseEntity.ok(ApiResponse.success("Fetched districts for province code " + provinceCode, districts));
    }

    @GetMapping("/wards/{districtCode}")
    public ResponseEntity<ApiResponse<List<Ward>>> getWardsByDistrict(
            @PathVariable int districtCode
    ) {
        List<Ward> wards = locationService.getWardsByDistrict(districtCode);
        return ResponseEntity.ok(ApiResponse.success("Fetched wards for district code " + districtCode, wards));
    }
}
