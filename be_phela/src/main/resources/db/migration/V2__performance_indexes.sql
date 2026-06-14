-- =====================================================
-- Performance Indexes - Tối ưu hiệu suất truy vấn
-- Bổ sung index cho các trường thường xuyên được filter/sort
-- =====================================================

-- 1. Index cho bảng orders - filter theo status (dùng trong search, dashboard, report)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

-- 2. Index cho bảng orders - filter theo order_date (dùng trong report doanh thu, thống kê)
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

-- 3. Composite index cho report: status + order_date (truy vấn nặng nhất trong dashboard)
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(order_status, order_date);

-- 4. Index cho bảng orders - filter theo branch_code (dùng trong search & report chi nhánh)
CREATE INDEX IF NOT EXISTS idx_orders_branch_code ON orders(branch_code);

-- 5. Index cho bảng orders - search theo order_code
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);

-- 6. Index cho bảng orders - filter theo customer_id (lịch sử đơn hàng khách)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- 7. Index cho bảng orders - filter theo payment_method
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- 8. Composite index cho full search & filter query (hỗ trợ searchAndFilterOrders)
CREATE INDEX IF NOT EXISTS idx_orders_status_branch_date ON orders(order_status, branch_code, order_date);

-- 9. Index cho order_items - join với orders và products
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
