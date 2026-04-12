package com.example.be_phela.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.example.be_phela.model.enums.ProductStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@Entity(name = "branch")
public class Branch {
    @Id
    @NotNull(message = "Branch code is required")
    @Column(name = "branch_code", nullable = false)
    private String branchCode;

    @Column(name = "branch_name", nullable = false)
    private String branchName;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "city", nullable = false)
    private String city;

    @Column(name = "district", nullable = false)
    private String district;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    @JsonIgnore
    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<Admin> admins;

    @JsonIgnore
    @OneToMany(mappedBy = "branch", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<JobPosting> jobPostings;

    public Branch() {}

    // Getters and Setters
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public ProductStatus getStatus() { return status; }
    public void setStatus(ProductStatus status) { this.status = status; }

    public List<Admin> getAdmins() { return admins; }
    public void setAdmins(List<Admin> admins) { this.admins = admins; }

    public List<JobPosting> getJobPostings() { return jobPostings; }
    public void setJobPostings(List<JobPosting> jobPostings) { this.jobPostings = jobPostings; }

    // Manual Builder
    public static BranchBuilder builder() {
        return new BranchBuilder();
    }

    public static class BranchBuilder {
        private String branchCode;
        private String branchName;
        private Double latitude;
        private Double longitude;
        private String city;
        private String district;
        private String address;
        private ProductStatus status;

        public BranchBuilder branchCode(String branchCode) { this.branchCode = branchCode; return this; }
        public BranchBuilder branchName(String branchName) { this.branchName = branchName; return this; }
        public BranchBuilder latitude(Double latitude) { this.latitude = latitude; return this; }
        public BranchBuilder longitude(Double longitude) { this.longitude = longitude; return this; }
        public BranchBuilder city(String city) { this.city = city; return this; }
        public BranchBuilder district(String district) { this.district = district; return this; }
        public BranchBuilder address(String address) { this.address = address; return this; }
        public BranchBuilder status(ProductStatus status) { this.status = status; return this; }

        public Branch build() {
            Branch b = new Branch();
            b.setBranchCode(this.branchCode);
            b.setBranchName(this.branchName);
            b.setLatitude(this.latitude);
            b.setLongitude(this.longitude);
            b.setCity(this.city);
            b.setDistrict(this.district);
            b.setAddress(this.address);
            b.setStatus(this.status);
            return b;
        }
    }
}
