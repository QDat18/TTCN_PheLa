package com.example.be_phela.controller;

import com.example.be_phela.dto.request.ComplaintRequestDTO;
import com.example.be_phela.dto.request.ComplaintResolveRequestDTO;
import com.example.be_phela.dto.response.ComplaintResponseDTO;
import com.example.be_phela.model.Customer;
import com.example.be_phela.service.ComplaintService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    // --- Customer Endpoints ---

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ComplaintResponseDTO> createComplaint(
            @AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt,
            @RequestBody ComplaintRequestDTO requestDTO) {
        String customerId = jwt.getSubject();
        ComplaintResponseDTO response = complaintService.createComplaint(customerId, requestDTO);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-complaints")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<ComplaintResponseDTO>> getMyComplaints(
            @AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt) {
        String customerId = jwt.getSubject();
        List<ComplaintResponseDTO> complaints = complaintService.getComplaintsByCustomer(customerId);
        return ResponseEntity.ok(complaints);
    }

    // --- Admin Endpoints ---

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<List<ComplaintResponseDTO>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ComplaintResponseDTO> getComplaintById(@PathVariable String id) {
        return ResponseEntity.ok(complaintService.getComplaintById(id));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ComplaintResponseDTO> resolveComplaint(
            @PathVariable String id,
            @RequestBody ComplaintResolveRequestDTO resolveDTO) {
        return ResponseEntity.ok(complaintService.resolveComplaint(id, resolveDTO));
    }
}
