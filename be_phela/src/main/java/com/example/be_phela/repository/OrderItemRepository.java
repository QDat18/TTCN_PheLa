package com.example.be_phela.repository;

import com.example.be_phela.model.OrderItem;
import com.example.be_phela.model.enums.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, String> {

    // Thống kê sản phẩm bán chạy nhất - SỬA LỖI: order_items thay vì order_item
    @Query("SELECT oi.product.productId, oi.product.productName, SUM(oi.quantity) as totalQuantity " +
            "FROM order_items oi WHERE oi.order.status = :status " +
            "GROUP BY oi.product.productId, oi.product.productName " +
            "ORDER BY totalQuantity DESC")
    List<Object[]> findTopSellingProducts(@Param("status") OrderStatus status, Pageable pageable);

    // Thống kê số lượng sản phẩm bán ra theo danh mục
    @Query("SELECT p.category.categoryName, SUM(oi.quantity) " +
            "FROM order_items oi JOIN oi.product p " +
            "WHERE oi.order.status = 'DELIVERED' " +
            "GROUP BY p.category.categoryName")
    List<Object[]> countProductsSoldByCategory();
}