package com.example.be_phela.dto.response;

public interface CustomerCancelledCountProjection {
    String getCustomerId();
    long getCancelledCount();
}
