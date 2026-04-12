package com.example.be_phela.utils;

import java.util.List;
import java.util.Optional;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.example.be_phela.dto.response.District;
import com.example.be_phela.dto.response.Province;
import com.example.be_phela.dto.response.Ward;
import com.example.be_phela.exception.LocationServiceException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class LocationApiClient {

    private static final String API_BASE_URL = "https://provinces.open-api.vn/api";
    private static final String API_V1_BASE_URL = API_BASE_URL + "/v1";

    private final RestTemplate restTemplate;

    public List<Province> fetchAllProvinces() {
        String url = API_V1_BASE_URL + "/p/";
        return exchangeForObject(url, new ParameterizedTypeReference<List<Province>>() {});
    }

    public Province fetchProvinceWithDistricts(int provinceCode) {
        String url = API_V1_BASE_URL + "/p/" + provinceCode + "?depth=2";
        return exchangeForObject(url, Province.class);
    }

    public District fetchDistrictWithWards(int districtCode) {
        String url = API_V1_BASE_URL + "/d/" + districtCode + "?depth=2";
        return exchangeForObject(url, District.class);
    }

    public List<Province> fetchLocationHierarchy() {
        String url = API_BASE_URL + "/?depth=3";
        return exchangeForObject(url, new ParameterizedTypeReference<List<Province>>() {});
    }

    private <T> T exchangeForObject(String url, ParameterizedTypeReference<T> typeReference) {
        try {
            ResponseEntity<T> response = restTemplate.exchange(url, HttpMethod.GET, null, typeReference);
            return Optional.ofNullable(response.getBody())
                    .orElseThrow(() -> new LocationServiceException("Không nhận được dữ liệu từ dịch vụ vị trí."));
        } catch (RestClientException ex) {
            log.error("Failed to call location API {}", url, ex);
            throw new LocationServiceException("Không thể tải dữ liệu vị trí từ dịch vụ bên ngoài.", ex);
        }
    }

    private <T> T exchangeForObject(String url, Class<T> responseType) {
        try {
            T body = restTemplate.getForObject(url, responseType);
            return Optional.ofNullable(body)
                    .orElseThrow(() -> new LocationServiceException("Không nhận được dữ liệu từ dịch vụ vị trí."));
        } catch (RestClientException ex) {
            log.error("Failed to call location API {}", url, ex);
            throw new LocationServiceException("Không thể tải dữ liệu vị trí từ dịch vụ bên ngoài.", ex);
        }
    }
}
