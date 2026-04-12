package com.example.be_phela.repository;

import com.example.be_phela.model.Banner;
import com.example.be_phela.model.enums.BannerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, String> {

    // Tìm 5 banner có trạng thái là ACTIVE, sắp xếp theo ngày tạo mới nhất
    List<Banner> findTop5ByStatusOrderByCreatedAtDesc(BannerStatus status);

    // Lấy tất cả banner, sắp xếp theo ngày tạo mới nhất để hiển thị ở admin
    List<Banner> findAllByOrderByCreatedAtDesc();
}
