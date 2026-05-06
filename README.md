# Phê La - Nốt Hương Đặc Sản ☕

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-blue.svg)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg)](https://tailwindcss.com/)

Hệ thống quản lý và thương mại điện tử toàn diện dành cho chuỗi cửa hàng cà phê Phê La. Dự án tập trung vào trải nghiệm người dùng cao cấp, tích hợp AI tư vấn và quy trình vận hành tối ưu.

---

## 📖 Mục lục
1. [Giới thiệu bài toán](#giới-thiệu-bài-toán)
2. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
3. [Công nghệ sử dụng](#công-nghệ-sử-dụng)
4. [Tính năng chính](#tính-năng-chính)
5. [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
6. [Cấu hình hệ thống](#cấu-hình-hệ-thống)

---

## 🎯 Giới thiệu bài toán
Phê La không chỉ bán cà phê, mà còn bán câu chuyện về "Nốt hương đặc sản". Bài toán đặt ra là xây dựng một nền tảng số hóa giúp:
- **Khách hàng**: Dễ dàng tiếp cận menu, đặt hàng, tích lũy điểm thưởng (Nốt nhạc), và nhận tư vấn thông minh từ AI.
- **Quản trị viên**: Quản lý kho hàng, đơn hàng, nhân sự, tuyển dụng và các chiến dịch marketing một cách tập trung và hiệu quả.
- **Thương hiệu**: Duy trì hình ảnh cao cấp, nhất quán thông qua giao diện UI/UX tinh tế.

---

## 🏗 Kiến trúc hệ thống
Hệ thống được thiết kế theo mô hình **Client-Server** hiện đại:
- **Backend**: RESTful API xây dựng trên Java Spring Boot.
- **Frontend Customer**: Web application dành cho người tiêu dùng.
- **Frontend Admin**: Bảng điều khiển quản trị tập trung.
- **Database**: PostgreSQL tích hợp PgVector để xử lý dữ liệu vector cho AI.
- **Real-time**: WebSocket (STOMP) cho hệ thống chat trực tuyến.

---

## 💻 Công nghệ sử dụng

### Backend
- **Framework**: Spring Boot 3.x
- **Security**: Spring Security (JWT, OAuth2 Google)
- **Database**: PostgreSQL
- **AI Integration**: Google Gemini API, PgVector (Vector DB)
- **Real-time**: Spring WebSocket, STOMP
- **Payment**: PayOS, SePay (Cổng thanh toán ngân hàng)
- **Media**: Cloudinary (Lưu trữ ảnh)

### Frontend
- **Core**: React 18, Remix Framework
- **Styling**: Tailwind CSS (Premium Design System)
- **Animation**: Framer Motion (Micro-interactions)
- **State Management**: React Context API
- **Auth**: Supabase Auth Integration
- **Icons**: Lucide React, React Icons

---

## ✨ Tính năng chính

### 1. Phân hệ Khách hàng (Customer)
- **Trải nghiệm Menu**: Giao diện đặt món trực quan, hỗ trợ topping và size.
- **AI Concierge**: Robot tư vấn thông minh sử dụng Gemini, hỗ trợ tìm món theo sở thích và trả lời thắc mắc.
- **Tích điểm Nốt nhạc**: Hệ thống Loyalty với các hạng thẻ E-Member, Fa, Sol, La.
- **Tin tức & Tuyển dụng**: Trang thông tin thương hiệu và cơ hội nghề nghiệp được thiết kế Premium.
- **Đặt lại đơn hàng**: Tính năng Reorder nhanh chóng từ lịch sử mua hàng.
- **Chat trực tuyến**: Kết nối trực tiếp với nhân viên hỗ trợ qua WebSocket.

### 2. Phân hệ Quản trị (Admin)
- **Dashboard**: Thống kê doanh thu, đơn hàng và lượng khách hàng.
- **Quản lý Sản phẩm**: Điều chỉnh giá, topping, trạng thái kho hàng.
- **Quản lý Đơn hàng**: Quy trình xử lý đơn từ khi đặt đến khi giao thành công.
- **Quản lý Cửa hàng**: Hệ thống bản đồ và danh sách chi nhánh toàn quốc.
- **Quản lý Tuyển dụng**: Đăng tin, duyệt hồ sơ ứng viên.
- **Thông báo**: Hệ thống thông báo thời gian thực cho Admin khi có đơn hàng mới.

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Java 17+
- Node.js 18+
- PostgreSQL
- Maven

### 1. Cấu hình Backend
Di chuyển vào thư mục `be_phela`:
```bash
# Cấu hình Database trong src/main/resources/application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/phela
spring.datasource.username=your_username
spring.datasource.password=your_password

# Chạy ứng dụng
mvn spring-boot:run
```

### 2. Cấu hình Frontend
Hệ thống gồm 2 app chạy trên 2 cổng khác nhau:
```bash
cd fe_phela

# Cài đặt dependencies
npm install

# Chạy App Khách hàng (Port 3001)
npm run dev:customer

# Chạy App Admin (Port 3000)
npm run dev:admin
```

---

## ⚙️ Cấu hình hệ thống (Environment Variables)
Để các tính năng hoạt động đầy đủ, bạn cần cấu hình các biến môi trường sau:
- `GEMINI_API_KEY`: Key để sử dụng chatbot AI.
- `SUPABASE_JWT_SECRET`: Xác thực người dùng qua Supabase.
- `CLOUDINARY_CLOUD_NAME/API_KEY`: Quản lý hình ảnh.
- `PAYOS_CLIENT_ID/API_KEY`: Tích hợp thanh toán QR.

---

## 🎨 Design Philosophy
Dự án sử dụng ngôn ngữ thiết kế **Midnight Coffee**:
- **Màu chủ đạo**: `#1A120B` (Midnight), `#8C5A35` (Phê La Brown), `#FDF5E6` (Cream).
- **Typography**: Ưu tiên các font sans-serif hiện đại, hỗ trợ tiếng Việt hoàn hảo.
- **Hiệu ứng**: Blur glassmorphism, gradient tinh tế và animation mượt mà từ Framer Motion.

---

© 2024 Phê La Coffee Project. All rights reserved.
