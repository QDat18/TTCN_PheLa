-- =========================
-- SEED DATA FOR PHELĂ (CLEAN RESET)
-- =========================

-- Clean existing data to avoid PK/FK conflicts
TRUNCATE TABLE branch, admin, customer, category, product, banner, news, vouchers CASCADE;

-- 1. BRANCH (Status: SHOW, HIDE, HOT)
INSERT INTO branch (branch_code, branch_name, address, district, city, latitude, longitude, status)
VALUES
-- Hà Nội - Ba Đình
('BR001', 'Phê La Ngọc Hà', '19 Ngọc Hà', 'Ba Đình', 'Hà Nội', 21.0368, 105.8317, 'SHOW'),
-- Hà Nội - Hoàn Kiếm
('BR002', 'Phê La Hàng Cót', '24 Hàng Cót', 'Hoàn Kiếm', 'Hà Nội', 21.0358, 105.8491, 'SHOW'),
('BR003', 'Phê La Tông Đản', '25 Tông Đản', 'Hoàn Kiếm', 'Hà Nội', 21.0247, 105.8561, 'SHOW'),
-- Hà Nội - Đống Đa
('BR004', 'Phê La Phạm Ngọc Thạch', '65 Phạm Ngọc Thạch', 'Đống Đa', 'Hà Nội', 21.0178, 105.8412, 'SHOW'),
('BR005', 'Phê La Đặng Tiến Đông', '14 Đặng Tiến Đông', 'Đống Đa', 'Hà Nội', 21.0123, 105.8234, 'SHOW'),
-- Hà Nội - Hai Bà Trưng
('BR006', 'Phê La Đại La', '24 Ngõ 128C Đại La', 'Hai Bà Trưng', 'Hà Nội', 21.0050, 105.8580, 'SHOW'),
-- Hà Nội - Cầu Giấy
('BR007', 'Phê La Trần Quốc Hoàn', '46 Trần Quốc Hoàn', 'Cầu Giấy', 'Hà Nội', 21.0302, 105.7924, 'SHOW'),
-- Hà Nội - Tây Hồ
('BR008', 'Phê La Tây Hồ', 'Khu vực Hồ Tây', 'Tây Hồ', 'Hà Nội', 21.0602, 105.8199, 'SHOW'),
-- Hà Nội - Thanh Xuân
('BR009', 'Phê La Thanh Xuân', 'Quận Thanh Xuân', 'Thanh Xuân', 'Hà Nội', 20.9958, 105.8128, 'SHOW'),
-- TP. Hồ Chí Minh
('BR010', 'Phê La Hồ Tùng Mậu', '125 Hồ Tùng Mậu', 'Quận 1', 'TP. Hồ Chí Minh', 10.7769, 106.7009, 'SHOW'),
-- Huế
('BR011', 'Phê La Lê Lợi', '30 Lê Lợi', 'Thuận Hóa', 'Huế', 16.4637, 107.5909, 'SHOW'),
-- Đà Nẵng
('BR012', 'Phê La Đà Nẵng', 'Trung tâm Đà Nẵng', 'Hải Châu', 'Đà Nẵng', 16.0544, 108.2022, 'SHOW'),
-- Đà Lạt
('BR013', 'Phê La Đà Lạt', 'Trung tâm Đà Lạt', 'Phường 1', 'Đà Lạt', 11.9404, 108.4583, 'SHOW');

-- 2. ADMIN (Added missing columns)
INSERT INTO admin (id, employ_code, username, email, password, fullname, phone, dob, gender, role, status, branch_code, failed_login_attempts, created_at, updated_at)
VALUES ('admin-uuid-001', 'EMP001', 'admin', 'admin@phela.com', '$2b$10$JzSUtEJ6Twq6BvcgRXwe5urMNKWxkGcLyLsw0FxgBHHYdb0yGEU.G', 'Administrator', '0987654321', '1990-01-01', 'MALE', 'ADMIN', 'ACTIVE', 'BR001', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2b. CUSTOMER (Added missing columns)
INSERT INTO customer (id, customer_code, username, email, password, gender, role, status, created_at, updated_at)
VALUES ('cust-uuid-001', 'CUS001', 'customer', 'customer@phela.com', '$2b$10$bFdanVMByU8wZd.kWWWzpeHWvUTpnuSgJCi3R144nfoWpLx7wbLOa', 'MALE', 'CUSTOMER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. CATEGORY (Added missing columns)
INSERT INTO category (category_code, category_name, description, created_at, updated_at) VALUES
('COFFEE', 'Cà Phê', 'Các loại cà phê nóng và đá', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('SYPHON', 'Syphon', 'Đồ uống pha Syphon', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FRENCH_PRESS', 'French Press', 'Đồ uống pha French Press', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('MOKA_POT', 'Moka Pot', 'Đồ uống pha Moka Pot', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('COLD_BREW', 'Cold Brew', 'Cold Brew & Soda', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('OLONG_MATCHA', 'Ô Long & Matcha', 'Ô long và Matcha', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TOPPING', 'Topping', 'Topping và thạch', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('PLUS', 'Plus - Lon/Chai', 'Đồ uống đóng chai/lon tiện lợi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('HOME', 'Mang Phê La Về Nhà', 'Cà phê hạt, trà, quà tặng, merch và bột', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. PRODUCT (Fixed category_id, status=SHOW, Added timestamps)
-- ==================== CÀ PHÊ ====================
INSERT INTO product (product_id, product_code, product_name, description, image_url, original_price, status, category_id, created_at, updated_at) VALUES
('prod-cf-001', 'CF001', 'Phê Xỉu Vani', 'Cà phê sữa đá vị vani thơm ngậy', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430243/Phe-Xiu-Vani_ijnram.jpg', 45000, 'SHOW', 'COFFEE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cf-002', 'CF002', 'Phê Espresso (Hạt Colombia)', 'Espresso đậm đà từ hạt Colombia', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430242/PHE-ESPRESSO-Hat-Colom-Ethi_kuuwht.jpg', 55000, 'SHOW', 'COFFEE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cf-003', 'CF003', 'Phê Espresso (Hạt Arabica)', 'Espresso nguyên chất Arabica', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430242/PHE-ESPRESSO-Hat-Ro-Ara_i0kldo.jpg', 55000, 'SHOW', 'COFFEE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cf-004', 'CF004', 'Phê Latte (Hạt Colombia)', 'Latte mịn màng', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430234/PHE-LATTE-Hat-Colom-Ethi_xozkq4.jpg', 65000, 'SHOW', 'COFFEE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cf-005', 'CF005', 'Phê Latte (Hạt Arabica)', 'Latte Arabica cao cấp', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430233/PHE-CAPPU-HatRo-Ara_ke6wi3.jpg', 65000, 'SHOW', 'COFFEE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cf-006', 'CF006', 'Phê Cappuccino (Hạt Arabica)', 'Cappuccino bọt sữa mịn', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430233/PHE-LATTE-Hat-Ro-Ara_amhtqv.jpg', 65000, 'SHOW', 'COFFEE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cf-007', 'CF007', 'Phê Cappuccino (Hạt Colombia)', 'Cappuccino Colombia', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430232/PHE-CAPPU-Hat-Colom-Ethi_sb35vj.jpg', 65000, 'SHOW', 'COFFEE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cf-008', 'CF008', 'Phê Americano (Hạt Arabica)', 'Americano đậm vị', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430232/PHE-AME-Hat-Ro-Ara_p2aqab.jpg', 50000, 'SHOW', 'COFFEE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cf-009', 'CF009', 'Phê Americano (Hạt Colombia)', 'Americano Colombia', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430231/PHE-AME-Hat-Colom-Ethi_hqeal0.jpg', 50000, 'SHOW', 'COFFEE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cf-010', 'CF010', 'Phê Nâu', 'Cà phê sữa nóng', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430230/phe-nau_d8hdhf.jpg', 45000, 'SHOW', 'COFFEE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cf-011', 'CF011', 'Phê Đen', 'Cà phê đen truyền thống', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430230/phe-den_hhj5wo.jpg', 40000, 'SHOW', 'COFFEE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cf-012', 'CF012', 'Cà Lat', 'Cà phê sữa đá', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430230/da-lat_dvp0d9.jpg', 45000, 'SHOW', 'COFFEE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==================== SYPHON ====================
INSERT INTO product (product_id, product_code, product_name, description, image_url, original_price, status, category_id, created_at, updated_at) VALUES
('prod-sy-001', 'SY001', 'Phan Xi Păng Ô Long Nhãn', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430256/Mat-Nhan-O-Long-Long-Nhan-Sua-scaled_nwfulq.jpg', 75000, 'SHOW', 'SYPHON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-sy-002', 'SY002', 'Mật Nhãn - Ô Long Nhãn Sữa', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430255/O-Long-Nhai-Sua-size-La_wu5fjh.jpg', 75000, 'SHOW', 'SYPHON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-sy-003', 'SY003', 'Phong Lan (Size La)', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430254/PHONG-LAN-scaled_uqu8g6.jpg', 85000, 'SHOW', 'SYPHON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-sy-004', 'SY004', 'Ô Long Nhãn Sữa (Size La)', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430252/O-Long-Sua-Phe-La_vj7s5l.jpg', 85000, 'SHOW', 'SYPHON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-sy-005', 'SY005', 'Ô Long Sữa Phê La (Size La)', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430254/O-Long-Sua-Phe-La-size-La_sql6jh.jpg', 85000, 'SHOW', 'SYPHON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-sy-006', 'SY006', 'Phong Lan (Ô Long Vani Sữa)', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430254/Phong-Lan-size-La_hj3wmj.jpg', 85000, 'SHOW', 'SYPHON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-sy-007', 'SY007', 'Ô Long Nhãn Phê La', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430256/Mat-Nhan-O-Long-Long-Nhan-Sua-scaled_nwfulq.jpg', 75000, 'SHOW', 'SYPHON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-sy-008', 'SY008', 'Ô Long Nhãn Sữa', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430252/O-Long-Nhai-Sua_cxgcqu.jpg', 75000, 'SHOW', 'SYPHON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==================== FRENCH PRESS ====================
INSERT INTO product (product_id, product_code, product_name, description, image_url, original_price, status, category_id, created_at, updated_at) VALUES
('prod-fp-001', 'FP001', 'Đậm - Ô Long Vải Chanh Vàng', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429913/Gam-O-Long-Vai-Chanh-Vang_asdqqz.jpg', 75000, 'SHOW', 'FRENCH_PRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-fp-002', 'FP002', 'Lua Đào - Phiên Bản Đồng Chill Yêu Thích (Size La)', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429912/Lua-Dao-Phien-ban-Dong-Chill-yeu-thich-size-LAAA.jpg', 75000, 'SHOW', 'FRENCH_PRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-fp-003', 'FP003', 'Lua Đào - Phiên Bản Đồng Chill Yêu Thích (Size Phê)', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429912/Lua-Dao-Phien-ban-Dong-Chill-yeu-thich-size-Phe.jpg', 65000, 'SHOW', 'FRENCH_PRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-fp-004', 'FP004', 'Trà Vải Cà Phê (Size La)', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429912/Tra-Vo-Ca-Phe-SizeLa_l0dzvh.jpg', 85000, 'SHOW', 'FRENCH_PRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-fp-005', 'FP005', 'Ô Long Đào Hồng (Size La)', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429912/OLongDaoHong_dvmdhz.jpg', 75000, 'SHOW', 'FRENCH_PRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-fp-006', 'FP006', 'Trà Vải Cà Phê', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429912/Tra-Vo-Ca-Phe-SizeLa_l0dzvh.jpg', 75000, 'SHOW', 'FRENCH_PRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==================== MOKA POT ====================
INSERT INTO product (product_id, product_code, product_name, description, image_url, original_price, status, category_id, created_at, updated_at) VALUES
('prod-mp-001', 'MP001', 'Tấm (Size La)', 'Moka Pot Tấm size lớn', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430246/Tam-SizeLa_teooiz.jpg', 75000, 'SHOW', 'MOKA_POT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-mp-002', 'MP002', 'Khối B''Lao (Size La)', 'Moka Pot Khối B''Lao size lớn', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430244/Khoi-B_Lao_wp3ps2.jpg', 75000, 'SHOW', 'MOKA_POT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-mp-003', 'MP003', 'Tấm', 'Moka Pot Tấm size thường', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430243/Tam_kyv5wj.jpg', 65000, 'SHOW', 'MOKA_POT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-mp-004', 'MP004', 'Khối B''Lao', 'Moka Pot Khối B''Lao size thường', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430244/Khoi-B_Lao_wp3ps2.jpg', 65000, 'SHOW', 'MOKA_POT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==================== COLD BREW ====================
INSERT INTO product (product_id, product_code, product_name, description, image_url, original_price, status, category_id, created_at, updated_at) VALUES
('prod-cb-001', 'CB001', 'Soda Chua Bưởi', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429909/Sua-Chua-Bong-Buoi.jpg', 65000, 'SHOW', 'COLD_BREW', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cb-002', 'CB002', 'Bông Bưởi - Ô Long Bưởi Nhã Đam', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429909/Bong-Buoi-O-Long-Buoi-Nha-Dam.jpg', 75000, 'SHOW', 'COLD_BREW', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cb-003', 'CB003', 'Lang Biang (Size La)', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429908/Lang-Biang-SizeLa_nei5xi.jpg', 85000, 'SHOW', 'COLD_BREW', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cb-004', 'CB004', 'Si Mơ - Cold Brew Ô Long Mơ Gạo (Size La)', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429908/Si-Mo-Cold-Brew-O-Long-Mo-Dao_wqssv1.jpg', 85000, 'SHOW', 'COLD_BREW', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-cb-005', 'CB005', 'Lang Biang', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429907/Lang-Biang_ttqqrc.jpg', 75000, 'SHOW', 'COLD_BREW', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==================== Ô LONG MATCHA ====================
INSERT INTO product (product_id, product_code, product_name, description, image_url, original_price, status, category_id, created_at, updated_at) VALUES
('prod-om-001', 'OM001', 'Matcha Phan Xi Păng', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430247/Matcha-Phan-Xi-Pang-da-xay-MOI.jpg', 75000, 'SHOW', 'OLONG_MATCHA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-om-002', 'OM002', 'Matcha Coco Latte', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430246/matcha-coco-latte__q5wz0y.jpg', 75000, 'SHOW', 'OLONG_MATCHA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==================== TOPPING ====================
INSERT INTO product (product_id, product_code, product_name, description, image_url, original_price, status, category_id, created_at, updated_at) VALUES
('prod-top-001', 'TOP001', 'Trân Châu Chè Kho', '', '', 15000, 'SHOW', 'TOPPING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-top-002', 'TOP002', 'Thạch Trà Chanh Vàng', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430246/matcha-coco-latte__q5wz0y.jpg', 15000, 'SHOW', 'TOPPING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-top-003', 'TOP003', 'Thạch Xíu Vani', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430251/Thach-Xiu-Vani_quimkq.jpg', 15000, 'SHOW', 'TOPPING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-top-004', 'TOP004', 'Thạch Trà Đào Hồng', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430251/ThachTraDaoHong_cicppb.jpg', 15000, 'SHOW', 'TOPPING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-top-005', 'TOP005', 'Thạch Ô Long Matcha', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430249/Thach-O-Long-Matcha-MOI-scaled_zcs1ei.jpg', 15000, 'SHOW', 'TOPPING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-top-006', 'TOP006', 'Thạch Trà Vải', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430249/Thach-Tra-Vo-scaled_yf9gpl.jpg', 15000, 'SHOW', 'TOPPING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-top-007', 'TOP007', 'Trân Châu Phông Lan', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430247/3.-Tran-Chau-Phong-Lan-scaled_jxpzqb.jpg', 15000, 'SHOW', 'TOPPING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-top-008', 'TOP008', 'Trân Châu Ô Long', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430249/2.-Tran-Chau-O-Long_drkzub.jpg', 15000, 'SHOW', 'TOPPING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-top-009', 'TOP009', 'Trân Châu Gạo Rang', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430248/Tran-Chau-Gao-Rang_ranc1j.jpg', 15000, 'SHOW', 'TOPPING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==================== PLUS - LON/CHAI ====================
INSERT INTO product (product_id, product_code, product_name, description, image_url, original_price, status, category_id, created_at, updated_at) VALUES
('prod-plus-001', 'PLUS001', 'Plus - Mật Nhãn', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429906/Plus-Mat-Nhan-O-Long-Long-Nhan.jpg', 65000, 'SHOW', 'PLUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-plus-002', 'PLUS002', 'Plus - Khối B''Lao', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429905/Plus-KhoiBlao_mq7ebt.jpg', 65000, 'SHOW', 'PLUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-plus-003', 'PLUS003', 'Plus - Matcha Coco Latte', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429905/Plus-Matcha-Coco-Latte_ijreqt.jpg', 65000, 'SHOW', 'PLUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-plus-004', 'PLUS004', 'Plus - Lua Đào', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429904/Plus-Lua-Dao-moi-1_k8zr4e.jpg', 65000, 'SHOW', 'PLUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-plus-005', 'PLUS005', 'Plus - Phong Lan', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429904/PHONG-LAN-PLUS_h1kpqk.jpg', 65000, 'SHOW', 'PLUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-plus-006', 'PLUS006', 'Plus - Cold Brew', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429904/1.-Plus-Cold-Brew_uqzusv.jpg', 65000, 'SHOW', 'PLUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-plus-007', 'PLUS007', 'Plus - Đà Lạt', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429902/2.-Plus-Da-Lat_buhfjj.jpg', 55000, 'SHOW', 'PLUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-plus-008', 'PLUS008', 'Plus - Đinh Phù Vân', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429903/3.-Plus-Dinh-Phu-Van_xynuft.jpg', 65000, 'SHOW', 'PLUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-plus-009', 'PLUS009', 'Plus - Tấm', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429902/7.-Plus-Tam_sm6lmn.jpg', 65000, 'SHOW', 'PLUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-plus-010', 'PLUS010', 'Plus - Ô Long Nhãn Sữa', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429902/4.-Plus-O-Long-Nhai-Sua_bigdoj.jpga', 65000, 'SHOW', 'PLUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-plus-011', 'PLUS011', 'Plus - Ô Long Sữa Phê La', '', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429902/5.-Plus-O-Long-Sua-Phe-La.jpg', 65000, 'SHOW', 'PLUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==================== MANG PHÊ LA VỀ NHÀ ====================
INSERT INTO product (product_id, product_code, product_name, description, image_url, original_price, status, category_id, created_at, updated_at) VALUES
('prod-home-001', 'HOME001', 'Cà Phê Phin Giấy - Phê Nguyên Bản', 'Phê phin giấy nguyên bản', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430009/Ca-Phe-Phin-Giay-Phe-Nguyen-Ban.jpg', 120000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-002', 'HOME002', 'Cà Phê Phin Giấy - Hộp 02 Loại', 'Hộp quà cà phê phin giấy', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430010/Ca-Phe-Phin-Giay-Phe-Dac-San_tv4jc3.jpg', 250000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-003', 'HOME003', 'Phê Phin Nguyên Bản - Túi 200gr', 'Cà phê nguyên chất 200gr', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430007/Phe-Phin-Nguyen-Ban_y7wgsu.jpg', 250000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-004', 'HOME004', 'Phê Geisha - Túi 150gr', 'Cà phê Geisha cao cấp', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429963/9.-Phe-Geisha-Tui-150gr-1_qy3if1.jpg', 450000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-005', 'HOME005', 'Phê Ethiopia - Túi 150gr', 'Cà phê Ethiopia', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429916/8.-Phe-Ethiopia-Tui-150gr-2_u0mazc.jpg', 280000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-006', 'HOME006', 'Phê Kenya - Túi 150gr', 'Cà phê Kenya', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429916/7.-Phe-Kenya-Tui-150gr-2_zsxydu.jpg', 280000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-007', 'HOME007', 'Phê Colombia - Túi 150gr', 'Cà phê Colombia', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429915/6.-Phe-Colombia-Tui-150gr-1_shhcea.jpg', 260000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-008', 'HOME008', 'Ô Long Mùa Xuân Đặc Sản - Túi 150gr', 'Ô long mùa xuân', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429915/5.-O-Long-Mua-Xuan-Dac-San-Tui-150gr-3_pw6onk.jpg', 320000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-009', 'HOME009', 'Ô Long Nhài Sữa Phin Giấy', 'Ô long nhài sữa', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774429915/1.-Phin-Giay-O-Long-Nhai-Sua-scaled_qrh0qt.jpg', 180000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-010', 'HOME010', 'Hộp Quà Trà Sữa Tiện Lợi - 06 Ly', 'Set quà 6 ly trà sữa', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430008/Hop-Tra-Sua-Tien-Loi_wn3oev.jpg', 450000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-011', 'HOME011', 'Hộp Quà Đĩa Nhạc - 04 Loại', 'Hộp quà đĩa nhạc cà phê', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430008/Hop-Qua-Dia-Nhac_tggomx.jpg', 350000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-012', 'HOME012', 'Bot Biến Phê La - Ô Long Sữa Phê La', 'Đồ treo Bot Biến', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430228/Bot-bien-O-Long-Sua-Phe-La-scaled_q1je3t.jpg', 89000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-013', 'HOME013', 'Bot Biến Phê La - Phê Latte', 'Đồ treo Bot Biến', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430227/Bot-bien-Phe-Latte-scaled_adksue.jpg', 89000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-014', 'HOME014', 'Bot Biến Phê La - Trân Châu Gạo Rang', 'Đồ treo Bot Biến', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430226/Bot-bien-Tran-Chau-Gao-Rang_aoauuv.jpg', 89000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-015', 'HOME015', 'Bot Biến Phê La - Phê Nâu', 'Đồ treo Bot Biến', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430228/Bot-bien-Phe-Nau-scaled_gteltg.jpg', 89000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-016', 'HOME016', 'Bot Biến Phê La - Xe Van', 'Đồ treo Bot Biến đặc biệt', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430226/Bot-bien-Xe-Van-scaled_s7x5v3.jpg', 99000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-017', 'HOME017', 'Khăn Lụa Đào - Phiên Bản Mới', 'Khăn lụa cao cấp', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430229/Ava-Khan-Lua-Dao-Phien-ban-moi-scaled_zzc9bh.jpg', 150000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-018', 'HOME018', 'Túi Tote Happy Chill Day', 'Túi tote canvas', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430011/Tui-Tote-Happpy-Chill-Day-_-Dai-Khuong-Nhac.jpg', 250000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod-home-019', 'HOME019', 'Túi Tote Happy Chill Day - Đại Khương Nhạc', 'Túi tote phiên bản đặc biệt', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1774430225/Tui-Tote-Happpy-Chill-Day-_-Dai-Tron-scaled_zjxtko.jpg', 280000, 'SHOW', 'HOME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. BANNER (Active)
INSERT INTO banner (banner_id, image_url, status, created_at, updated_at) VALUES
('b1', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1775380932/phe-la-nguyen-lieu_j2adzo.jpg', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b2', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1775380930/website-01_ewpb1u.jpg', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b3', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1775381124/do-uong-phe-la_wg7krt.jpg', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 6. NEWS
INSERT INTO news (news_id, title, summary, content, thumbnail_url, created_at, updated_at)
VALUES (
    'news-uuid-001', 
    'Khai trương chi nhánh mới - Phê La Đống Đa', 
    'Phê La chính thức có mặt tại Đống Đa với concept cắm trại cực chill cùng vô vàn ưu đãi hấp dẫn.', 
    'Sáng ngày hôm nay, Phê La đã chính thức chào đón những vị khách đầu tiên tại "trạm cắm trại" mới toanh tọa lạc ngay trung tâm quận Đống Đa. Đây là cột mốc đánh dấu bước phát triển mới của Phê La trong hành trình mang hương vị Ô Long đặc sản Đà Lạt đến gần hơn với giới trẻ Hà Thành.\n\nKhông gian cắm trại giữa lòng thủ đô\nKhác với sự ồn ào, náo nhiệt của phố thị, Phê La Đống Đa mang đến một không gian vô cùng "chill" với concept cắm trại đặc trưng. Từng góc nhỏ đều được chăm chút tỉ mỉ với những chiếc ghế dù, bàn xếp, điểm xuyết thêm ánh đèn vàng ấm áp và mảng xanh của cây lá.\n\nTrải nghiệm Ô Long đậm vị\nTrong ngày khai trương, khách hàng đã có cơ hội thưởng thức những dòng sản phẩm Signature làm nên tên tuổi của Phê La như: Ô Long Sữa Phê La, Phan Xi Păng, hay Khói B''Lao.\n\nNgập tràn ưu đãi tuần lễ vàng\nNhân dịp khai trương, Phê La Đống Đa mang đến chuỗi ưu đãi cực kỳ hấp dẫn:\n- Mua 1 Tặng 1 toàn bộ đồ uống Ô Long Đặc Sản.\n- Tặng túi Tote giới hạn cho 100 khách hàng đầu tiên.\n- Check-in nhận ngay topping Trân Châu Ô Long.\n\n📍 Địa chỉ: [Số nhà], Đống Đa, Hà Nội\n⏰ Thời gian mở cửa: 07:00 - 23:00', 
    'https://phela.vn/wp-content/uploads/2021/08/Khai-truong.jpg',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 7. VOUCHERS (Renamed from promotion)
INSERT INTO vouchers (id, code, name, description, type, value, start_date, end_date, status, created_at, updated_at)
VALUES ('prom-uuid-001', 'WELCOME10', 'Chào mừng khách hàng mới', 'Giảm 10% cho đơn hàng đầu tiên', 'PERCENTAGE', 10, '2024-01-01 00:00:00', '2025-01-01 23:59:59', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
