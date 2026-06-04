-- =========================
-- CREATE DATABASE
-- =========================
CREATE DATABASE IF NOT EXISTS phela_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE phela_db;

-- =========================
-- CUSTOMER
-- =========================
CREATE TABLE customer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE,
    fullname VARCHAR(100),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    gender VARCHAR(10),
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    current_notes INT DEFAULT 0,
    total_accumulated_notes INT DEFAULT 0,
    membership_tier VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- BRANCH
-- =========================
CREATE TABLE branch (
    branch_code VARCHAR(50) PRIMARY KEY,
    branch_name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    status INT, -- ProductStatus ordinal
    opening_time VARCHAR(10),
    closing_time VARCHAR(10)
);

-- =========================
-- ADMIN
-- =========================
CREATE TABLE admin (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employ_code VARCHAR(50) UNIQUE,
    fullname VARCHAR(100) UNIQUE,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    dob DATE,
    gender VARCHAR(10),
    last_login_ip VARCHAR(45),
    failed_login_attempts INT DEFAULT 0,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    branch_code VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_code) REFERENCES branch(branch_code) ON DELETE SET NULL
);

-- =========================
-- VERIFICATION TOKEN
-- =========================
CREATE TABLE verification_token (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    expiry_date DATETIME NOT NULL,
    customer_id BIGINT UNIQUE,
    admin_id BIGINT UNIQUE,
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE
);

-- =========================
-- PASSWORD RESET TOKEN
-- =========================
CREATE TABLE password_reset_token (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    expiry_date DATETIME NOT NULL
);

-- =========================
-- ADDRESS
-- =========================
CREATE TABLE address (
    address_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT,
    recipient_name VARCHAR(100),
    phone VARCHAR(20),
    detailed_address VARCHAR(255),
    ward VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    latitude DOUBLE,
    longitude DOUBLE,
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE
);

-- =========================
-- CATEGORY
-- =========================
CREATE TABLE category (
    category_code VARCHAR(50) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- PRODUCT
-- =========================
CREATE TABLE product (
    product_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    description TEXT,
    original_price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    point_cost INT DEFAULT 0,
    is_gift BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(255),
    status VARCHAR(50),
    category_code VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_code) REFERENCES category(category_code) ON DELETE SET NULL
);

-- =========================
-- PRODUCT SIZE
-- =========================
CREATE TABLE product_size (
    product_size_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    size_name VARCHAR(50) NOT NULL,
    size_code VARCHAR(10),
    additional_price DECIMAL(10,2) DEFAULT 0.00,
    final_price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    status VARCHAR(50),
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
);

-- =========================
-- CART
-- =========================
CREATE TABLE cart (
    cart_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNIQUE NOT NULL,
    address_id BIGINT,
    branch_code VARCHAR(50),
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE,
    FOREIGN KEY (address_id) REFERENCES address(address_id) ON DELETE SET NULL,
    FOREIGN KEY (branch_code) REFERENCES branch(branch_code) ON DELETE SET NULL
);

-- =========================
-- CART ITEM
-- =========================
CREATE TABLE cart_item (
    cart_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_size_id BIGINT,
    quantity INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    note VARCHAR(255),
    size VARCHAR(50),
    ice VARCHAR(50),
    sugar VARCHAR(50),
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
    FOREIGN KEY (product_size_id) REFERENCES product_size(product_size_id) ON DELETE SET NULL
);

-- =========================
-- VOUCHER
-- =========================
CREATE TABLE voucher (
    voucher_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0.00,
    max_discount_amount DECIMAL(10,2),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    usage_limit INT DEFAULT 0,
    used_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- ORDERS
-- =========================
CREATE TABLE orders (
    order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL,
    address_id BIGINT,
    branch_code VARCHAR(50),
    order_status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    note VARCHAR(255),
    address_text VARCHAR(255),
    phone VARCHAR(20),
    receiver_name VARCHAR(100),
    shipping_fee DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    voucher_code VARCHAR(50),
    notes_used INT DEFAULT 0,
    notes_earned INT DEFAULT 0,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE,
    FOREIGN KEY (address_id) REFERENCES address(address_id) ON DELETE SET NULL,
    FOREIGN KEY (branch_code) REFERENCES branch(branch_code) ON DELETE SET NULL
);

-- =========================
-- ORDER ITEM
-- =========================
CREATE TABLE order_item (
    order_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_size_id BIGINT,
    quantity INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    note VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
    FOREIGN KEY (product_size_id) REFERENCES product_size(product_size_id) ON DELETE SET NULL
);

-- =========================
-- ORDER ITEM TOPPING
-- =========================
CREATE TABLE order_item_topping (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_item_id BIGINT NOT NULL,
    topping_id BIGINT NOT NULL,
    topping_name VARCHAR(150) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_item_id) REFERENCES order_item(order_item_id) ON DELETE CASCADE,
    FOREIGN KEY (topping_id) REFERENCES product(product_id) ON DELETE CASCADE
);

-- =========================
-- POINT HISTORY (LOYALTY)
-- =========================
CREATE TABLE point_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    order_id BIGINT,
    note_amount INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);

-- =========================
-- COMPLAINT
-- =========================
CREATE TABLE complaint (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    reason TEXT NOT NULL,
    evidence_images TEXT,
    status VARCHAR(50) NOT NULL,
    resolution_type VARCHAR(50),
    resolution_notes TEXT,
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE
);

-- =========================
-- CONVERSATION (AI CHATBOT)
-- =========================
CREATE TABLE conversation (
    conversation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNIQUE NOT NULL,
    assigned_admin_id BIGINT,
    status VARCHAR(50) NOT NULL,
    source VARCHAR(50) NOT NULL,
    last_message_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_admin_id) REFERENCES admin(id) ON DELETE SET NULL
);

-- =========================
-- CONVERSATION MESSAGE
-- =========================
CREATE TABLE conversation_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_type VARCHAR(50) NOT NULL,
    sender_id VARCHAR(50),
    sender_name VARCHAR(100),
    content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    metadata_json TEXT,
    image_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversation(conversation_id) ON DELETE CASCADE
);

-- =========================
-- CHAT MESSAGE (P2P CHAT)
-- =========================
CREATE TABLE chat_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id VARCHAR(100),
    recipient_id VARCHAR(100),
    sender_name VARCHAR(100),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    image_url VARCHAR(255)
);

-- =========================
-- NOTIFICATION
-- =========================
CREATE TABLE notification (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id VARCHAR(100),
    sender_name VARCHAR(100),
    recipient_id VARCHAR(100),
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- SYSTEM SETTING
-- =========================
CREATE TABLE system_setting (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    setting_group VARCHAR(100),
    description VARCHAR(255),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- BANNER
-- =========================
CREATE TABLE banner (
    banner_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- NEWS
-- =========================
CREATE TABLE news (
    news_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    thumbnail_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- CONTACT
-- =========================
CREATE TABLE contact (
    contact_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- INDEXES FOR PERFORMANCE
-- =========================
CREATE INDEX idx_product_name ON product(product_name);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_complaint_customer ON complaint(customer_id);
CREATE INDEX idx_point_customer ON point_history(customer_id);
