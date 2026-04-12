package com.example.be_phela.dto.request;

public class CustomerLocationUpdateDTO {
    private Double latitude;
    private Double longitude;

    public CustomerLocationUpdateDTO() {}

    public CustomerLocationUpdateDTO(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
}