# Biểu đồ Lớp (Class Diagram) & Thực thể Dữ liệu (ORM / ERD) - Hệ thống PheLaWeb

Tài liệu này tổng hợp toàn bộ phân tích về kiến trúc mã nguồn của hệ thống **PheLaWeb**, bao gồm biểu đồ lớp và bản đồ thực thể cơ sở dữ liệu.

> [!NOTE]
> **Lưu ý về thuật ngữ ODM và ORM:**
> Dự án PheLaWeb sử dụng cơ sở dữ liệu quan hệ **PostgreSQL** kết hợp với **Spring Data JPA (Hibernate)**. Do đó, hệ thống sử dụng mô hình **ORM (Object-Relational Mapping)** để ánh xạ các class Java sang các bảng cơ sở dữ liệu quan hệ, thay vì **ODM (Object-Document Mapping)** vốn dành cho cơ sở dữ liệu dạng tài liệu (NoSQL) như MongoDB. Bản vẽ dưới đây sẽ thể hiện biểu đồ thực thể quan hệ JPA (JPA ORM / ERD) của hệ thống.

---

## 1. Kiến trúc Tổng quan Hệ thống (Layered Architecture)

Hệ thống PheLaWeb được xây dựng theo kiến trúc phân tầng tiêu chuẩn (Layered Architecture) của Spring Boot:

```mermaid
graph TD
    %% Styling
    classDef controller fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef service fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    classDef repository fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef entity fill:#fce4ec,stroke:#c2185b,stroke-width:2px;
    classDef dto fill:#ede7f6,stroke:#5e35b1,stroke-width:2px;
    classDef database fill:#cfd8dc,stroke:#37474f,stroke-width:2px;

    %% Elements
    Client[Client UI / React Frontend]
    
    subgraph Spring Boot Backend
        Controller[Controller Layer<br>Ex: OrderController]:::controller
        Service[Service Layer<br>Ex: OrderService]:::service
        Repository[Repository Layer<br>Ex: OrderRepository]:::repository
        Entity[JPA Entity Layer<br>Ex: Order Entity]:::entity
        DTO[DTO / Request - Response Models]:::dto
        Mapper[MapStruct Mappers]:::dto
    end

    Database[(PostgreSQL Database)]:::database

    %% Connections
    Client <-->|HTTP RESTful / JSON| Controller
    Controller <--> DTO
    Controller -->|DTO| Service
    Service <-->|Entity| Repository
    Service <--> Mapper
    Mapper <--> DTO
    Repository <-->|SQL / Hibernate| Database
    Repository <--> Entity
```

---

## 2. Biểu đồ Lớp (Class Diagram)

Tài liệu thiết kế lớp được chia làm hai mức độ: **Mức Khái niệm (Domain Class Diagram)** biểu diễn cấu trúc dữ liệu thực thể tổng quan, và **Mức Thiết kế (Design Class Diagram)** biểu diễn chi tiết triển khai phần mềm (các lớp Controller, Service, Repository, DTO).

### 2.1. Biểu đồ lớp khái niệm (Domain Class Diagram - Overview)

Dưới đây là **Biểu đồ lớp khái niệm của toàn bộ hệ thống** bao quát cả 26 lớp thực thể và mối quan hệ giữa chúng, được chia thành các phân hệ nghiệp vụ chính:

```mermaid
classDiagram
    %% Package User & Auth
    class Customer {
        +String customerId
        +String customerCode
        +String fullname
        +String username
        +String password
        +String email
        +String phone
        +String gender
        +Roles role
        +Status status
        +Double latitude
        +Double longitude
        +Integer currentNotes
        +Integer totalAccumulatedNotes
        +MembershipTier membershipTier
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }
    class Admin {
        +String id
        +String employCode
        +String fullname
        +String username
        +String password
        +String email
        +String phone
        +LocalDate dob
        +String gender
        +Roles role
        +Status status
        +String lastLoginIp
        +int failedLoginAttempts
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }
    class Address {
        +String addressId
        +String city
        +String district
        +String ward
        +String recipientName
        +String phone
        +String detailedAddress
        +Double latitude
        +Double longitude
        +Boolean isDefault
    }
    class VerificationToken {
        +String id
        +String token
        +LocalDateTime expiryDate
    }
    class PasswordResetToken {
        +String id
        +String token
        +String email
        +LocalDateTime expiryDate
    }
    class UserDetails {
        <<interface>>
        +getAuthorities() Collection
        +getPassword() String
        +getUsername() String
        +isEnabled() boolean
    }

    %% Package Product Catalog
    class Product {
        +String productId
        +String productCode
        +String productName
        +String description
        +Double originalPrice
        +Double discountPrice
        +Integer pointCost
        +Boolean isGift
        +String imageUrl
        +ProductStatus status
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }
    class ProductSize {
        +String productSizeId
        +String sizeName
        +String sizeCode
        +Double additionalPrice
        +Double finalPrice
        +Integer stockQuantity
        +String sku
        +String status
    }
    class Category {
        +String categoryCode
        +String categoryName
        +String description
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }

    %% Package Cart & Order
    class Cart {
        +String id
        +Double totalAmount
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }
    class CartItem {
        +String cartItemId
        +Integer quantity
        +Double amount
        +String note
        +String size
        +String ice
        +String sugar
    }
    class Order {
        +String id
        +String orderCode
        +Double totalAmount
        +Double finalAmount
        +OrderStatus status
        +PaymentMethod paymentMethod
        +PaymentStatus paymentStatus
        +String note
        +String addressText
        +Double shippingFee
        +String phone
        +String receiverName
        +String voucherCode
        +Double discountAmount
        +Integer notesUsed
        +Integer notesEarned
        +LocalDateTime orderDate
        +LocalDateTime deliveryDate
    }
    class OrderItem {
        +String orderItemId
        +Integer quantity
        +Double amount
        +String note
    }
    class OrderItemTopping {
        +String id
        +String toppingName
        +Double price
        +Integer quantity
    }
    class Voucher {
        +String id
        +String code
        +String name
        +String description
        +DiscountType type
        +Double value
        +Double minOrderAmount
        +Double maxDiscountAmount
        +LocalDateTime startDate
        +LocalDateTime endDate
        +PromotionStatus status
        +Integer usageLimit
        +Integer usedCount
    }



    %% Package Support & Loyalty & Operation
    class Branch {
        +String branchCode
        +String branchName
        +Double latitude
        +Double longitude
        +String city
        +String district
        +String address
        +ProductStatus status
        +String openingTime
        +String closingTime
    }
    class PointHistory {
        +String id
        +Integer noteAmount
        +PointType type
        +String description
        +LocalDateTime createdAt
    }
    class Complaint {
        +String id
        +String reason
        +String evidenceImages
        +ComplaintStatus status
        +ResolutionType resolutionType
        +String resolutionNotes
        +String adminNotes
    }
    class Notification {
        +String notificationId
        +String senderId
        +String senderName
        +String recipientId
        +String message
        +NotificationType type
        +boolean isRead
    }

    %% Package AI & Chat
    class Conversation {
        +String id
        +String customerId
        +String assignedAdminId
        +ConversationStatus status
        +ConversationSource source
        +LocalDateTime lastMessageAt
    }
    class ConversationMessage {
        +String id
        +String conversationId
        +SenderType senderType
        +String senderId
        +String senderName
        +String content
        +MessageType messageType
        +String metadataJson
        +String imageUrl
    }
    class ChatMessage {
        +String id
        +String content
        +String senderId
        +String recipientId
        +String senderName
        +LocalDateTime timestamp
        +String imageUrl
    }
    
    %% Other entities
    class SystemSetting {
        +String settingKey
        +String settingValue
        +String settingGroup
        +String description
    }
    class Banner {
        +String bannerId
        +String imageUrl
        +BannerStatus status
    }
    class News {
        +String newsId
        +String title
        +String summary
        +String content
        +String thumbnailUrl
    }
    class Contact {
        +String contactId
        +String fullName
        +String email
        +String content
    }

    %% Relationships
    UserDetails <|.. Customer : Implements
    UserDetails <|.. Admin : Implements

    Customer "1" --> "0..*" Address : has
    Customer "1" --> "0..1" Cart : owns
    Customer "1" --> "0..*" Order : places
    Customer "1" --> "0..*" PointHistory : accumulates
    Customer "1" --> "0..1" VerificationToken : verified by
    Admin "1" --> "0..1" VerificationToken : verified by

    Admin "0..*" --> "1" Branch : works at

    Cart "1" *-- "0..*" CartItem : contains
    CartItem "0..*" --> "1" Product : points to
    CartItem "0..*" --> "1" ProductSize : size of
    Cart "0..*" --> "0..1" Address : uses_address
    Cart "0..*" --> "0..1" Branch : selected_branch

    Product "0..*" --> "1" Category : belongs to
    Product "1" *-- "0..*" ProductSize : contains sizes

    Order "1" *-- "0..*" OrderItem : contains
    OrderItem "0..*" --> "1" Product : references
    OrderItem "0..*" --> "1" ProductSize : references size
    OrderItem "1" *-- "0..*" OrderItemTopping : customized with
    OrderItemTopping "0..*" --> "1" Product : is topping

    Order "0..*" --> "0..1" Address : delivers to
    Order "0..*" --> "0..1" Branch : processes at
    
    PointHistory "0..*" --> "1" Customer : logs for
    PointHistory "0..*" --> "0..1" Order : derived from
    Complaint "0..*" --> "1" Customer : submitted by
    Complaint "0..*" --> "1" Order : regarding
    
    Conversation "1" *-- "0..*" ConversationMessage : contains

```

### 2.2. Biểu đồ lớp mức thiết kế (Design Class Diagram - BCE Pattern)

Biểu đồ lớp mức thiết kế áp dụng mô hình **Boundary - Control - Entity (BCE)** kết hợp với mẫu **DAO (Data Access Object)** để mô tả cấu trúc tĩnh và luồng đi của dữ liệu.

Để thể hiện rõ ràng và trực quan nhất mối quan hệ giữa các lớp theo đúng mô hình BCE + DAO, tài liệu chia thành hai sơ đồ thiết kế chi tiết cho hai luồng nghiệp vụ cốt lõi: **Đặt hàng (Place Order)** và **Tư vấn AI Chatbot (AI Chat)**. Các đường liên kết được đánh số thứ tự từ **(1)** đến **(6)** biểu diễn luồng điều khiển và luồng dữ liệu chạy qua các lớp.

---

#### 2.2.1. Phân hệ Đặt hàng (Ordering Use Case - Design Class Diagram)

*   **Tác nhân**: `Customer_Actor` (Khách hàng).
*   **Lớp biên (Boundary)**: 
    *   `OrderForm` (UI phía Client nhận thao tác bấm nút đặt hàng).
    *   `OrderController` (API nhận dữ liệu yêu cầu tạo đơn).
    *   `OrderCreateRequest` & `OrderResponse` (Các DTO truyền tải thông tin).
*   **Lớp điều khiển (Control)**: `OrderManager` (Chứa nghiệp vụ kiểm tra kho, tính tiền, áp voucher).
*   **Lớp truy xuất dữ liệu (DAO)**: `OrderDAO` (Thực hiện lưu đơn vào CSDL).
*   **Lớp thực thể (Entity)**: `Order` (Đối tượng đơn hàng lưu giữ thông tin trạng thái).

```mermaid
classDiagram
    %% Stereotypes Definition & Styling
    classDef boundary fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef control fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    classDef entity fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef dao fill:#ede7f6,stroke:#5e35b1,stroke-width:2px;
    classDef actor fill:#fce4ec,stroke:#c2185b,stroke-width:2px;

    %% Elements
    class Customer_Actor {
        <<Actor>>
    }
    class OrderForm {
        <<Boundary / UI>>
        +submitOrder() void
        +showOrderConfirmation() void
    }
    class OrderController {
        <<Boundary / API>>
        -OrderManager orderManager
        +createOrder(OrderCreateRequest req) OrderResponse
        +cancelOrder(String orderId) void
    }
    class OrderCreateRequest {
        <<Boundary / DTO>>
        +String customerId
        +String voucherCode
        +String addressText
        +String phone
        +double shippingFee
    }
    class OrderResponse {
        <<Boundary / DTO>>
        +String orderId
        +String orderCode
        +double finalAmount
        +String status
    }
    class OrderManager {
        <<Control>>
        -OrderDAO orderDAO
        +processNewOrder(OrderCreateRequest req) OrderResponse
        +cancelExistingOrder(String orderId) void
        -calculateTotal(Cart cart) double
    }
    class OrderDAO {
        <<Interface / DAO>>
        +save(Order order) void
        +findById(String id) Order
        +findByCode(String code) Order
    }
    class Order {
        <<Entity>>
        -String id
        -String orderCode
        -double totalAmount
        -String status
        +getId() String
        +setStatus(String status) void
    }

    %% Apply Styles
    style Customer_Actor actor
    style OrderForm boundary
    style OrderController boundary
    style OrderCreateRequest boundary
    style OrderResponse boundary
    style OrderManager control
    style OrderDAO dao
    style Order entity

    %% Design Connections & Flow
    Customer_Actor --> OrderForm : (1) Giao tiếp (Interacts)
    OrderForm --> OrderController : (2) Gửi request (Sends Request)
    OrderController --> OrderManager : (3) Gọi xử lý (Calls Control)
    OrderManager --> Order : (4) Tác động thực thể (Manipulates Entity)
    OrderManager --> OrderDAO : (5) Gọi truy xuất (Calls DAO)
    OrderDAO --> Order : (6) Trả về / Lưu trữ (Manages Entity)

    OrderController ..> OrderCreateRequest : Nhận dữ liệu (Consumes)
    OrderController ..> OrderResponse : Trả về (Returns)
```

---

#### 2.2.2. Phân hệ Tư vấn AI (AI Chatbot Use Case - Design Class Diagram)

*   **Tác nhân**: `Customer_Actor` (Khách hàng).
*   **Lớp biên (Boundary)**: 
    *   `ChatBoxUI` (Giao diện khung chat nhận tin nhắn gõ từ khách hàng).
    *   `ChatAIController` (API Controller nhận tin nhắn từ client và chuyển tiếp).
*   **Lớp điều khiển (Control)**: `ChatAIManager` (Chịu trách nhiệm gọi API AI Gemini để sinh câu trả lời).
*   **Lớp truy xuất dữ liệu (DAO)**: `ConversationDAO` (Tìm kiếm và lưu trữ lịch sử cuộc hội thoại).
*   **Lớp thực thể (Entity)**: `Conversation` (Lớp lưu trữ thông tin phòng chat giữa khách hàng và AI).

```mermaid
classDiagram
    %% Stereotypes Definition & Styling
    classDef boundary fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef control fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    classDef entity fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef dao fill:#ede7f6,stroke:#5e35b1,stroke-width:2px;
    classDef actor fill:#fce4ec,stroke:#c2185b,stroke-width:2px;

    %% Elements
    class Customer_Actor {
        <<Actor>>
    }
    class ChatBoxUI {
        <<Boundary / UI>>
        +displayMessage(String text) void
        +sendMessage() void
    }
    class ChatAIController {
        <<Boundary / API>>
        -ChatAIManager chatManager
        +askAI(String customerId, String text) String
        +getHistory(String customerId) List~ConversationMessage~
    }
    class ChatAIManager {
        <<Control>>
        -ConversationDAO conversationDAO
        -GeminiChatModel geminiModel
        +generateAIResponse(String customerId, String text) String
        +fetchHistory(String customerId) List~ConversationMessage~
    }
    class ConversationDAO {
        <<Interface / DAO>>
        +save(Conversation conv) void
        +findByCustomerId(String customerId) Conversation
    }
    class Conversation {
        <<Entity>>
        -String id
        -String status
        -LocalDateTime lastMessageAt
        +getId() String
        +getStatus() String
    }

    %% Apply Styles
    style Customer_Actor actor
    style ChatBoxUI boundary
    style ChatAIController boundary
    style ChatAIManager control
    style ConversationDAO dao
    style Conversation entity

    %% Design Connections & Flow
    Customer_Actor --> ChatBoxUI : (1) Giao tiếp (Interacts)
    ChatBoxUI --> ChatAIController : (2) Gửi request (Sends Request)
    ChatAIController --> ChatAIManager : (3) Gọi xử lý (Calls Control)
    ChatAIManager --> Conversation : (4) Cập nhật trạng thái (Updates Entity)
    ChatAIManager --> ConversationDAO : (5) Gọi truy xuất (Calls DAO)
    ConversationDAO --> Conversation : (6) Trả về / Lưu trữ (Manages Entity)
```

---

#### 2.2.3. Phân hệ Báo cáo & Dashboard (Dashboard & Reports Use Case - Design Class Diagram)

*   **Tác nhân**: `Admin_Actor` (Quản trị viên / Nhân viên).
*   **Lớp biên (Boundary)**:
    *   `GiaoDienDashboard` (Xem thông tin KPIs tóm tắt và danh sách đơn mới nhất).
    *   `GiaoDienBaoCaoDoanhThu` (Xem báo cáo doanh thu của các chi nhánh theo chu kỳ thời gian).
    *   `GiaoDienBaoCaoDonHang` (Xem phân bổ trạng thái đơn hàng và thống kê danh mục sản phẩm).
*   **Lớp điều khiển (Control)**: `DieuKhienBaoCao` (Chịu trách nhiệm truy vấn tổng hợp từ các bảng và thực hiện logic phân quyền chi nhánh).
*   **Lớp truy xuất dữ liệu (DAO)**:
    *   `OrderDAO`, `ProductDAO`, `CustomerDAO`, `BranchDAO`, `AdminDAO`.
*   **Lớp thực thể (Entity)**:
    *   `Order`, `Product`, `Customer`, `Branch`, `Admin`.

```mermaid
classDiagram
    %% Stereotypes Definition & Styling
    classDef boundary fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef control fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    classDef entity fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef dao fill:#ede7f6,stroke:#5e35b1,stroke-width:2px;
    classDef actor fill:#fce4ec,stroke:#c2185b,stroke-width:2px;

    %% Elements
    class Admin_Actor {
        <<Actor>>
    }
    class GiaoDienDashboard {
        <<Boundary / UI>>
        +hienThiDashboard() void
    }
    class GiaoDienBaoCaoDoanhThu {
        <<Boundary / UI>>
        +hienThiBaoCao() void
        +nutXuatExcelClick() void
    }
    class GiaoDienBaoCaoDonHang {
        <<Boundary / UI>>
        +hienThiBaoCao() void
    }
    class DieuKhienBaoCao {
        <<Control>>
        -OrderDAO orderDAO
        -ProductDAO productDAO
        +layThongTinDashboard(String token) Object
        +layBaoCaoDoanhThuChiNhanh(String token, String period) List
        +layBaoCaoDonHangAnl(String token) Object
    }
    class OrderDAO {
        <<Interface / DAO>>
        +sumRevenueThisMonth() double
        +findBranchRevenue(String period) List
    }
    class ProductDAO {
        <<Interface / DAO>>
        +countActiveProducts() long
    }

    %% Apply Styles
    style Admin_Actor actor
    style GiaoDienDashboard boundary
    style GiaoDienBaoCaoDoanhThu boundary
    style GiaoDienBaoCaoDonHang boundary
    style DieuKhienBaoCao control
    style OrderDAO dao
    style ProductDAO dao

    %% Design Connections & Flow
    Admin_Actor --> GiaoDienDashboard : (1) Tương tác (Interacts)
    Admin_Actor --> GiaoDienBaoCaoDoanhThu : (1) Tương tác (Interacts)
    Admin_Actor --> GiaoDienBaoCaoDonHang : (1) Tương tác (Interacts)
    
    GiaoDienDashboard --> DieuKhienBaoCao : (2) Gọi xử lý (Calls Control)
    GiaoDienBaoCaoDoanhThu --> DieuKhienBaoCao : (2) Gửi yêu cầu lọc / xuất (Sends Request)
    GiaoDienBaoCaoDonHang --> DieuKhienBaoCao : (2) Gọi xử lý (Calls Control)
    
    DieuKhienBaoCao --> OrderDAO : (3) Truy vấn doanh thu / đơn hàng (Calls DAO)
    DieuKhienBaoCao --> ProductDAO : (3) Truy vấn sản phẩm (Calls DAO)
```

---

## 3. Biểu đồ Đối tượng Tổng quan (System Object Diagram - ODM)

Trong phân tích thiết kế hướng đối tượng (OOAD), **Biểu đồ Đối tượng (Object Diagram - ODM)** đóng vai trò chụp lại trạng thái runtime cụ thể của hệ thống tại một thời điểm xác định. Dưới đây là biểu đồ đối tượng tổng quan bao quát toàn bộ các nghiệp vụ lớn của hệ thống PheLaWeb: **Đặt hàng, Chăm sóc khách hàng bằng AI, Tích điểm thành viên và Quản lý cửa hàng/sản phẩm**:

```mermaid
classDiagram
    %% 1. Phân hệ Cửa hàng & Nhân sự (Branch & Admin)
    class branch_CG {
        branchCode = "CN-CG"
        branchName = "Phê La Cầu Giấy"
        address = "Số 10 Duy Tân"
        city = "Hà Nội"
        status = SHOW
    }
    class admin_Tuan {
        id = "adm-001"
        employCode = "NV001"
        fullname = "Trần Anh Tuấn"
        username = "tuan.ta"
        role = STAFF
        status = ACTIVE
    }

    %% 2. Phân hệ Đặt hàng & Khách hàng (Customer & Order)
    class customer_Nam {
        customerId = "cust-123"
        customerCode = "KH123"
        fullname = "Nguyễn Hoàng Nam"
        email = "nam.nh@gmail.com"
        currentNotes = 150
        membershipTier = SILVER
    }
    class addr_Nam {
        addressId = "addr-456"
        recipientName = "Nguyễn Hoàng Nam"
        phone = "0988777666"
        detailedAddress = "Tòa nhà Keangnam"
        city = "Hà Nội"
    }
    class order_001 {
        id = "ord-999"
        orderCode = "PL102938"
        totalAmount = 120000.0
        finalAmount = 110000.0
        status = CONFIRMED
        paymentMethod = BANK_TRANSFER
        paymentStatus = COMPLETED
        notesEarned = 11
    }
    class item_Latte {
        orderItemId = "item-001"
        quantity = 2
        amount = 60000.0
        note = "Ít đá"
    }
    class product_Latte {
        productId = "prod-latte"
        productCode = "CF-LATTE"
        productName = "Phê Latte"
        originalPrice = 50000.0
    }
    class size_L {
        productSizeId = "sz-large"
        sizeName = "Size L"
        finalPrice = 60000.0
    }
    class voucher_10K {
        id = "vouch-10k"
        code = "PHELA10K"
        value = 10000.0
        status = ACTIVE
    }

    %% 3. Phân hệ Tích điểm & Khiếu nại (Loyalty & Complaint)
    class point_Earn {
        id = "pt-901"
        noteAmount = 11
        type = EARN
        description = "Tích lũy đơn hàng PL102938"
    }
    class complaint_01 {
        id = "comp-501"
        reason = "Đơn giao hơi muộn, nước đá tan nhiều"
        status = PENDING
    }



    %% 5. Phân hệ Trò chuyện AI (AI Chatbot)
    class conv_Nam_AI {
        id = "conv-701"
        status = AI_ACTIVE
        source = AI
    }
    class msg_1 {
        id = "msg-001"
        senderType = CUSTOMER
        content = "Hôm nay cửa hàng có khuyến mãi gì không?"
    }
    class msg_2 {
        id = "msg-002"
        senderType = AI
        content = "Chào bạn! Hiện tại bạn có thể áp dụng mã PHELA10K để được giảm ngay 10.000đ nhé!"
    }

    %% Links / Associations between objects
    admin_Tuan ..> branch_CG : works_at
    customer_Nam ..> addr_Nam : owns
    customer_Nam ..> order_001 : placed
    order_001 ..> addr_Nam : shipped_to
    order_001 ..> branch_CG : processed_at
    order_001 ..> item_Latte : contains
    order_001 ..> voucher_10K : applied_voucher
    
    item_Latte ..> product_Latte : product_info
    item_Latte ..> size_L : size_info
    
    point_Earn ..> customer_Nam : earned_by
    point_Earn ..> order_001 : generated_by
    complaint_01 ..> order_001 : regarding_order

    conv_Nam_AI ..> customer_Nam : chat_with
    conv_Nam_AI ..> msg_1 : contains_message
    conv_Nam_AI ..> msg_2 : contains_message
```

---

## 4. Biểu đồ Cơ sở Dữ liệu Quan hệ (Entity-Relationship Diagram - ERD/ERM)

Biểu đồ dưới đây biểu diễn **Mô hình Quan hệ Thực thể (ERD/ERM)** của cơ sở dữ liệu hệ thống PheLaWeb. Cấu trúc các bảng, khóa chính (PK) tự tăng kiểu `bigint`, các khóa ngoại (FK) và kiểu dữ liệu được thiết kế đồng bộ 100% với file cơ sở dữ liệu quan hệ [database_final.sql](file:///d:/KyVI_HocVienNganHang/TTCN/PheLaWeb/database_final.sql):

```mermaid
erDiagram
    %% Entities Definition
    CUSTOMER {
        bigint id PK
        varchar customer_code UK
        varchar fullname
        varchar username UK
        varchar password
        varchar email UK
        varchar phone UK
        varchar gender
        varchar role
        varchar status
        double latitude
        double longitude
        int current_notes
        int total_accumulated_notes
        varchar membership_tier
        datetime created_at
        datetime updated_at
    }

    ADMIN {
        bigint id PK
        varchar employ_code UK
        varchar fullname UK
        varchar username UK
        varchar password
        varchar email
        varchar phone
        date dob
        varchar gender
        varchar last_login_ip
        int failed_login_attempts
        varchar role
        varchar status
        varchar branch_code FK
        datetime created_at
        datetime updated_at
    }

    BRANCH {
        varchar branch_code PK
        varchar branch_name
        varchar address
        varchar district
        varchar city
        double latitude
        double longitude
        int status
        varchar opening_time
        varchar closing_time
    }

    ADDRESS {
        bigint address_id PK
        bigint customer_id FK
        varchar recipient_name
        varchar phone
        varchar detailed_address
        varchar ward
        varchar district
        varchar city
        double latitude
        double longitude
        boolean is_default
    }

    CATEGORY {
        varchar category_code PK
        varchar category_name
        text description
        datetime created_at
        datetime updated_at
    }

    PRODUCT {
        bigint product_id PK
        varchar product_code UK
        varchar product_name
        text description
        double original_price
        double discount_price
        int point_cost
        boolean is_gift
        varchar image_url
        varchar status
        varchar category_code FK
        datetime created_at
        datetime updated_at
    }

    PRODUCT_SIZE {
        bigint product_size_id PK
        bigint product_id FK
        varchar size_name
        varchar size_code
        double additional_price
        double final_price
        int stock_quantity
        varchar sku UK
        varchar status
    }

    CART {
        bigint cart_id PK
        bigint customer_id FK "UK"
        bigint address_id FK
        varchar branch_code FK
        double total_amount
        datetime created_at
        datetime updated_at
    }

    CART_ITEM {
        bigint cart_item_id PK
        bigint cart_id FK
        bigint product_id FK
        bigint product_size_id FK
        int quantity
        double amount
        varchar note
        varchar size
        varchar ice
        varchar sugar
    }

    ORDERS {
        bigint order_id PK
        varchar order_code UK
        bigint customer_id FK
        bigint address_id FK
        varchar branch_code FK
        varchar order_status
        varchar payment_method
        varchar payment_status
        varchar note
        varchar address_text
        varchar phone
        varchar receiver_name
        double shipping_fee
        double total_amount
        double discount_amount
        varchar voucher_code
        int notes_used
        int notes_earned
        datetime order_date
        datetime delivery_date
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEM {
        bigint order_item_id PK
        bigint order_id FK
        bigint product_id FK
        bigint product_size_id FK
        int quantity
        double amount
        varchar note
    }

    ORDER_ITEM_TOPPING {
        bigint id PK
        bigint order_item_id FK
        bigint topping_id FK "Product"
        varchar topping_name
        double price
        int quantity
    }

    VOUCHER {
        bigint voucher_id PK
        varchar code UK
        varchar name
        text description
        varchar type
        double value
        double min_order_amount
        double max_discount_amount
        datetime start_date
        datetime end_date
        varchar status
        int usage_limit
        int used_count
        datetime created_at
        datetime updated_at
    }

    POINT_HISTORY {
        bigint id PK
        bigint customer_id FK
        bigint order_id FK
        int note_amount
        varchar type
        varchar description
        datetime created_at
    }

    COMPLAINT {
        bigint id PK
        bigint order_id FK
        bigint customer_id FK
        text reason
        text evidence_images
        varchar status
        varchar resolution_type
        text resolution_notes
        text admin_notes
        datetime created_at
        datetime updated_at
    }

    VERIFICATION_TOKEN {
        bigint id PK
        varchar token
        bigint admin_id FK "UK"
        bigint customer_id FK "UK"
        datetime expiry_date
    }

    PASSWORD_RESET_TOKEN {
        bigint id PK
        varchar token UK
        varchar email
        datetime expiry_date
    }

    CONVERSATION {
        bigint conversation_id PK
        bigint customer_id UK
        bigint assigned_admin_id FK
        varchar status
        varchar source
        datetime last_message_at
        datetime created_at
        datetime updated_at
    }

    CONVERSATION_MESSAGE {
        bigint id PK
        bigint conversation_id FK
        varchar sender_type
        varchar sender_id
        varchar sender_name
        text content
        varchar message_type
        text metadata_json
        varchar image_url
        datetime created_at
    }

    SYSTEM_SETTING {
        varchar setting_key PK
        text setting_value
        varchar setting_group
        varchar description
        datetime updated_at
    }

    BANNER {
        bigint banner_id PK
        varchar image_url
        varchar status
        datetime created_at
        datetime updated_at
    }

    NEWS {
        bigint news_id PK
        varchar title
        text summary
        text content
        varchar thumbnailUrl
        datetime created_at
        datetime updated_at
    }

    CONTACT {
        bigint contact_id PK
        varchar full_name
        varchar email
        text content
        datetime created_at
    }

    CHAT_MESSAGE {
        bigint id PK
        text content
        varchar sender_id
        varchar recipient_id
        varchar sender_name
        varchar image_url
        datetime timestamp
    }

    %% Relationships Mapping (Relational Mapping)
    CUSTOMER ||--o{ ADDRESS : "has"
    CUSTOMER ||--o| CART : "owns"
    CUSTOMER ||--o{ ORDERS : "places"
    CUSTOMER ||--o{ COMPLAINT : "submits"
    CUSTOMER ||--o{ POINT_HISTORY : "accumulates"
    CUSTOMER ||--o| VERIFICATION_TOKEN : "owns"
    CUSTOMER ||--o| CONVERSATION : "initiates"

    ADMIN ||--o| VERIFICATION_TOKEN : "owns"
    ADMIN ||--o{ CONVERSATION : "handles"

    BRANCH ||--o{ ADMIN : "employs"
    BRANCH ||--o{ ORDERS : "delivers from"
    BRANCH ||--o{ CART : "services to"

    ADDRESS ||--o{ CART : "associated with"
    ADDRESS ||--o{ ORDERS : "shipped to"

    CATEGORY ||--o{ PRODUCT : "classifies"
    PRODUCT ||--o{ PRODUCT_SIZE : "has options"
    PRODUCT ||--o{ CART_ITEM : "added to"
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    PRODUCT ||--o{ ORDER_ITEM_TOPPING : "used as topping"

    CART ||--o{ CART_ITEM : "contains"
    CART_ITEM }o--|| PRODUCT_SIZE : "selected size"

    ORDERS ||--o{ ORDER_ITEM : "contains"
    ORDERS ||--o{ POINT_HISTORY : "earns notes"
    ORDERS ||--o{ COMPLAINT : "has complaint"

    ORDER_ITEM ||--o{ ORDER_ITEM_TOPPING : "has toppings"
    ORDER_ITEM }o--|| PRODUCT_SIZE : "selected size"

    CONVERSATION ||--o{ CONVERSATION_MESSAGE : "has"
```
