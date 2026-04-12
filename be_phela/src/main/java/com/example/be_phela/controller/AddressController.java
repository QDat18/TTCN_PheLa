package com.example.be_phela.controller;

import com.example.be_phela.dto.request.AddressCreateDTO;
import com.example.be_phela.dto.response.AddressDTO;
import com.example.be_phela.interService.IAddressService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/address")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AddressController {

    IAddressService addressService;

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<AddressDTO>> getAddressesByCustomerId(@PathVariable String customerId) {
        List<AddressDTO> addresses = addressService.getAddressesByCustomerId(customerId);
        return ResponseEntity.ok(addresses);
    }

    @PostMapping("/customer/{customerId}")
    public ResponseEntity<Map<String, Object>> createAddress(
            @PathVariable String customerId,
            @RequestBody AddressCreateDTO addressCreateDTO) {
        Map<String, Object> response = new HashMap<>();
        try {
            AddressDTO addressDTO = addressService.createAddress(customerId, addressCreateDTO);
            response.put("success", true);
            response.put("data", addressDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<Map<String, Object>> updateAddress(
            @PathVariable String addressId,
            @RequestBody AddressCreateDTO addressCreateDTO) {
        Map<String, Object> response = new HashMap<>();
        try {
            AddressDTO addressDTO = addressService.updateAddress(addressId, addressCreateDTO);
            response.put("success", true);
            response.put("data", addressDTO);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Map<String, Object>> deleteAddress(@PathVariable String addressId) {
        Map<String, Object> response = new HashMap<>();
        try {
            addressService.deleteAddress(addressId);
            response.put("success", true);
            return ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PatchMapping("/customer/{customerId}/default/{addressId}")
    public ResponseEntity<Map<String, Object>> setDefaultAddress(
            @PathVariable String customerId,
            @PathVariable String addressId) {
        Map<String, Object> response = new HashMap<>();
        try {
            AddressDTO addressDTO = addressService.setDefaultAddress(customerId, addressId);
            response.put("success", true);
            response.put("data", addressDTO);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "An unexpected error occurred: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}