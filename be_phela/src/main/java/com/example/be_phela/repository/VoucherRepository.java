package com.example.be_phela.repository;

import com.example.be_phela.model.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, String> {
    Optional<Voucher> findByCode(String code);

    @Query("SELECT v FROM Voucher v WHERE v.status = :status " +
           "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit) " +
           "AND (v.startDate IS NULL OR v.startDate <= :now) " +
           "AND (v.endDate IS NULL OR v.endDate >= :now)")
    List<Voucher> findActiveVouchers(@Param("status") com.example.be_phela.model.enums.PromotionStatus status, @Param("now") LocalDateTime now);
}
