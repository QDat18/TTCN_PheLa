-- =========================
-- CREATE DATABASE
-- =========================
IF DB_ID(N'phela_db') IS NULL
    CREATE DATABASE phela_db;
GO

USE phela_db;
GO


-- =========================
-- DROP TABLES IF EXISTS (for rerun)
-- =========================
DROP TABLE IF EXISTS contact;
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS banner;
DROP TABLE IF EXISTS system_setting;
DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS chat_message;
DROP TABLE IF EXISTS conversation_message;
DROP TABLE IF EXISTS conversation;
DROP TABLE IF EXISTS complaint;
DROP TABLE IF EXISTS point_history;
DROP TABLE IF EXISTS order_item_topping;
DROP TABLE IF EXISTS order_item;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS voucher;
DROP TABLE IF EXISTS cart_item;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS product_size;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS address;
DROP TABLE IF EXISTS password_reset_token;
DROP TABLE IF EXISTS verification_token;
DROP TABLE IF EXISTS admin;
DROP TABLE IF EXISTS branch;
DROP TABLE IF EXISTS customer;
GO

-- =========================
-- CUSTOMER
-- =========================
CREATE TABLE customer (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_code NVARCHAR(50) UNIQUE,
    fullname NVARCHAR(100),
    username NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(255),
    email NVARCHAR(255) UNIQUE NOT NULL,
    phone NVARCHAR(20) UNIQUE,
    gender NVARCHAR(10),
    role NVARCHAR(50) NOT NULL,
    status NVARCHAR(50) NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    current_notes INT DEFAULT 0,
    total_accumulated_notes INT DEFAULT 0,
    membership_tier NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- =========================
-- BRANCH
-- =========================
CREATE TABLE branch (
    branch_code NVARCHAR(50) PRIMARY KEY,
    branch_name NVARCHAR(150) NOT NULL,
    address NVARCHAR(255) NOT NULL,
    district NVARCHAR(100) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    status INT, -- ProductStatus ordinal
    opening_time NVARCHAR(10),
    closing_time NVARCHAR(10)
);
GO

-- =========================
-- ADMIN
-- =========================
CREATE TABLE admin (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    employ_code NVARCHAR(50) UNIQUE,
    fullname NVARCHAR(100) UNIQUE,
    username NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    email NVARCHAR(255),
    phone NVARCHAR(20),
    dob DATE,
    gender NVARCHAR(10),
    last_login_ip NVARCHAR(45),
    failed_login_attempts INT DEFAULT 0,
    role NVARCHAR(50) NOT NULL,
    status NVARCHAR(50) NOT NULL,
    branch_code NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (branch_code) REFERENCES branch(branch_code)
);
GO

-- =========================
-- VERIFICATION TOKEN
-- =========================
CREATE TABLE verification_token (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    token NVARCHAR(255) NOT NULL,
    expiry_date DATETIME NOT NULL,
    customer_id BIGINT UNIQUE,
    admin_id BIGINT UNIQUE,
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (admin_id) REFERENCES admin(id)
);
GO

-- =========================
-- PASSWORD RESET TOKEN
-- =========================
CREATE TABLE password_reset_token (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    token NVARCHAR(255) UNIQUE NOT NULL,
    email NVARCHAR(255) NOT NULL,
    expiry_date DATETIME NOT NULL
);
GO

-- =========================
-- ADDRESS
-- =========================
CREATE TABLE address (
    address_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id BIGINT,
    recipient_name NVARCHAR(100),
    phone NVARCHAR(20),
    detailed_address NVARCHAR(255),
    ward NVARCHAR(100),
    district NVARCHAR(100),
    city NVARCHAR(100),
    latitude FLOAT,
    longitude FLOAT,
    is_default BIT DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);
GO

-- =========================
-- CATEGORY
-- =========================
CREATE TABLE category (
    category_code NVARCHAR(50) PRIMARY KEY,
    category_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- =========================
-- PRODUCT
-- =========================
CREATE TABLE product (
    product_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_code NVARCHAR(50) UNIQUE NOT NULL,
    product_name NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX),
    original_price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    point_cost INT DEFAULT 0,
    is_gift BIT DEFAULT 0,
    image_url NVARCHAR(255),
    status NVARCHAR(50),
    category_code NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (category_code) REFERENCES category(category_code)
);
GO

-- =========================
-- PRODUCT SIZE
-- =========================
CREATE TABLE product_size (
    product_size_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    product_id BIGINT NOT NULL,
    size_name NVARCHAR(50) NOT NULL,
    size_code NVARCHAR(10),
    additional_price DECIMAL(10,2) DEFAULT 0.00,
    final_price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    sku NVARCHAR(100) UNIQUE,
    status NVARCHAR(50),
    FOREIGN KEY (product_id) REFERENCES product(product_id)
);
GO

-- =========================
-- CART
-- =========================
CREATE TABLE cart (
    cart_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id BIGINT UNIQUE NOT NULL,
    address_id BIGINT,
    branch_code NVARCHAR(50),
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (address_id) REFERENCES address(address_id),
    FOREIGN KEY (branch_code) REFERENCES branch(branch_code)
);
GO

-- =========================
-- CART ITEM
-- =========================
CREATE TABLE cart_item (
    cart_item_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_size_id BIGINT,
    quantity INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    note NVARCHAR(255),
    size NVARCHAR(50),
    ice NVARCHAR(50),
    sugar NVARCHAR(50),
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id),
    FOREIGN KEY (product_id) REFERENCES product(product_id),
    FOREIGN KEY (product_size_id) REFERENCES product_size(product_size_id)
);
GO

-- =========================
-- VOUCHER
-- =========================
CREATE TABLE voucher (
    voucher_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX),
    type NVARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0.00,
    max_discount_amount DECIMAL(10,2),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status NVARCHAR(50) NOT NULL,
    usage_limit INT DEFAULT 0,
    used_count INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- =========================
-- ORDERS
-- =========================
CREATE TABLE orders (
    order_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_code NVARCHAR(50) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL,
    address_id BIGINT,
    branch_code NVARCHAR(50),
    order_status NVARCHAR(50) NOT NULL,
    payment_method NVARCHAR(50) NOT NULL,
    payment_status NVARCHAR(50) NOT NULL,
    note NVARCHAR(255),
    address_text NVARCHAR(255),
    phone NVARCHAR(20),
    receiver_name NVARCHAR(100),
    shipping_fee DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    voucher_code NVARCHAR(50),
    notes_used INT DEFAULT 0,
    notes_earned INT DEFAULT 0,
    order_date DATETIME DEFAULT GETDATE(),
    delivery_date DATETIME,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (address_id) REFERENCES address(address_id),
    FOREIGN KEY (branch_code) REFERENCES branch(branch_code)
);
GO

-- =========================
-- ORDER ITEM
-- =========================
CREATE TABLE order_item (
    order_item_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_size_id BIGINT,
    quantity INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    note NVARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES product(product_id),
    FOREIGN KEY (product_size_id) REFERENCES product_size(product_size_id)
);
GO

-- =========================
-- ORDER ITEM TOPPING
-- =========================
CREATE TABLE order_item_topping (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_item_id BIGINT NOT NULL,
    topping_id BIGINT NOT NULL,
    topping_name NVARCHAR(150) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_item_id) REFERENCES order_item(order_item_id),
    FOREIGN KEY (topping_id) REFERENCES product(product_id)
);
GO

-- =========================
-- POINT HISTORY (LOYALTY)
-- =========================
CREATE TABLE point_history (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    order_id BIGINT,
    note_amount INT NOT NULL,
    type NVARCHAR(50) NOT NULL,
    description NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
GO

-- =========================
-- COMPLAINT
-- =========================
CREATE TABLE complaint (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    order_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    reason NVARCHAR(MAX) NOT NULL,
    evidence_images NVARCHAR(MAX),
    status NVARCHAR(50) NOT NULL,
    resolution_type NVARCHAR(50),
    resolution_notes NVARCHAR(MAX),
    admin_notes NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);
GO

-- =========================
-- CONVERSATION (AI CHATBOT)
-- =========================
CREATE TABLE conversation (
    conversation_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    customer_id BIGINT UNIQUE NOT NULL,
    assigned_admin_id BIGINT,
    status NVARCHAR(50) NOT NULL,
    source NVARCHAR(50) NOT NULL,
    last_message_at DATETIME,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (assigned_admin_id) REFERENCES admin(id)
);
GO

-- =========================
-- CONVERSATION MESSAGE
-- =========================
CREATE TABLE conversation_message (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_type NVARCHAR(50) NOT NULL,
    sender_id NVARCHAR(50),
    sender_name NVARCHAR(100),
    content NVARCHAR(MAX) NOT NULL,
    message_type NVARCHAR(50) NOT NULL,
    metadata_json NVARCHAR(MAX),
    image_url NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (conversation_id) REFERENCES conversation(conversation_id)
);
GO

-- =========================
-- CHAT MESSAGE (P2P CHAT)
-- =========================
CREATE TABLE chat_message (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    content NVARCHAR(MAX) NOT NULL,
    sender_id NVARCHAR(100),
    recipient_id NVARCHAR(100),
    sender_name NVARCHAR(100),
    [timestamp] DATETIME DEFAULT GETDATE(),
    image_url NVARCHAR(255)
);
GO

-- =========================
-- NOTIFICATION
-- =========================
CREATE TABLE notification (
    notification_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    sender_id NVARCHAR(100),
    sender_name NVARCHAR(100),
    recipient_id NVARCHAR(100),
    message NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(50) NOT NULL,
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- =========================
-- SYSTEM SETTING
-- =========================
CREATE TABLE system_setting (
    setting_key NVARCHAR(100) PRIMARY KEY,
    setting_value NVARCHAR(MAX),
    setting_group NVARCHAR(100),
    description NVARCHAR(255),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- =========================
-- BANNER
-- =========================
CREATE TABLE banner (
    banner_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    image_url NVARCHAR(255) NOT NULL,
    status NVARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- =========================
-- NEWS
-- =========================
CREATE TABLE news (
    news_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    summary NVARCHAR(MAX),
    content NVARCHAR(MAX) NOT NULL,
    thumbnail_url NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- =========================
-- CONTACT
-- =========================
CREATE TABLE contact (
    contact_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- =========================
-- INDEXES FOR PERFORMANCE
-- =========================
CREATE INDEX idx_product_name ON product(product_name);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_complaint_customer ON complaint(customer_id);
CREATE INDEX idx_point_customer ON point_history(customer_id);
GO

ALTER TABLE voucher
ADD customer_id BIGINT NULL,
    product_id BIGINT NULL;
GO

ALTER TABLE voucher
ADD CONSTRAINT FK_voucher_customer
FOREIGN KEY (customer_id)
REFERENCES customer(id);
GO

ALTER TABLE voucher
ADD CONSTRAINT FK_voucher_product
FOREIGN KEY (product_id)
REFERENCES product(product_id);
GO

ALTER TABLE cart
ADD voucher_id BIGINT NULL;
GO

ALTER TABLE cart
ADD CONSTRAINT FK_cart_voucher
FOREIGN KEY (voucher_id)
REFERENCES voucher(voucher_id);
GO
