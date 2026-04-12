# Phela Application - Render Blueprint

## Hướng dẫn Deploy với Render Blueprint

### 1. Push code lên GitHub
```bash
git add .
git commit -m "Add Render Blueprint configuration"
git push origin main
```

### 2. Deploy trên Render

#### Cách 1: Sử dụng Blueprint (Khuyến nghị - Deploy tất cả cùng lúc)
1. Truy cập: https://dashboard.render.com/
2. Click **"Blueprints"** → **"New Blueprint Instance"**
3. Connect GitHub repository của bạn
4. Render sẽ tự động phát hiện file `render.yaml`
5. Nhập các **Secret Environment Variables**:
   - `DB_URL`: jdbc:mysql://your-db-host:3306/dbname?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
   - `DB_USER`: your_db_username
   - `DB_PASSWORD`: your_db_password
   - `JWT_SIGNER_KEY`: your_jwt_secret_key (ít nhất 32 ký tự)
   - `MAIL_USERNAME`: your_email@gmail.com
   - `SENDGRID_API_KEY`: your_sendgrid_api_key
   - `CLOUDINARY_CLOUD_NAME`: your_cloudinary_cloud_name
   - `CLOUDINARY_API_KEY`: your_cloudinary_api_key
   - `CLOUDINARY_API_SECRET`: your_cloudinary_api_secret
   - `VNPAY_TMN_CODE`: your_vnpay_tmn_code
   - `VNPAY_HASH_SECRET`: your_vnpay_hash_secret

6. Click **"Apply"** - Render sẽ tự động tạo 3 services:
   - ✅ `phela-backend` (Backend API)
   - ✅ `phela-customer` (Frontend Customer)
   - ✅ `phela-admin` (Frontend Admin)

#### Cách 2: Deploy từng service riêng lẻ
Nếu không dùng Blueprint, có thể deploy manual từng service:

**Backend:**
- Type: Web Service
- Build Command: (Docker auto-detect)
- Start Command: (Docker auto-detect)

**Frontend Customer:**
- Type: Web Service
- Build Command: `npm install && npm run build:customer`
- Start Command: `npm run dev:customer`

**Frontend Admin:**
- Type: Web Service
- Build Command: `npm install && npm run build:admin`
- Start Command: `npm run dev:admin`

### 3. Sau khi Deploy

**URLs sẽ có dạng:**
- Backend: `https://phela-backend-dyl7.onrender.com`
- Customer: `https://phela-customer.onrender.com`
- Admin: `https://phela-admin.onrender.com`

**Cập nhật CORS_ALLOWED_ORIGINS** nếu URLs khác:
```
CORS_ALLOWED_ORIGINS=https://your-customer-app.onrender.com,https://your-admin-app.onrender.com
```

### 4. Kiểm tra Health

**Backend:**
```bash
curl https://phela-backend-dyl7.onrender.com/healthz
```

**Frontend:**
```bash
curl https://phela-customer.onrender.com
curl https://phela-admin.onrender.com
```

### 5. Troubleshooting

**Backend không start:**
- Kiểm tra logs: Dashboard → phela-backend → Logs
- Verify environment variables đã set đúng
- Check DB connection string

**Frontend không load:**
- Kiểm tra `VITE_API_URL` đã đúng chưa
- Verify build command chạy thành công
- Check browser console cho CORS errors

**CORS errors:**
- Đảm bảo `CORS_ALLOWED_ORIGINS` chứa đúng frontend URLs
- Format: `https://domain1.com,https://domain2.com` (không có space)

### 6. Free Tier Limitations

⚠️ **Lưu ý với Free Plan:**
- Services sẽ sleep sau 15 phút không hoạt động
- Cold start có thể mất 30-60 giây
- Bandwidth giới hạn 100GB/month
- Build time giới hạn

**Khuyến nghị:**
- Dùng cron job hoặc UptimeRobot để ping services 5-10 phút/lần
- Nâng cấp lên Starter plan nếu cần production-ready

### 7. Database

**Nếu dùng Render PostgreSQL:**
```yaml
databases:
  - name: phela-db
    databaseName: phela
    user: phela_user
    plan: free
```

**Nếu dùng External MySQL (AWS RDS, PlanetScale, etc.):**
- Chỉ cần set `DB_URL`, `DB_USER`, `DB_PASSWORD` trong environment variables

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Users                         │
└────────────┬────────────────────┬───────────────┘
             │                    │
             │                    │
     ┌───────▼────────┐   ┌──────▼────────┐
     │  Customer Web  │   │   Admin Web   │
     │ (React + Vite) │   │ (React + Vite)│
     └───────┬────────┘   └──────┬────────┘
             │                    │
             └──────────┬─────────┘
                        │
                 ┌──────▼──────┐
                 │   Backend   │
                 │ (Spring Boot)│
                 └──────┬──────┘
                        │
                 ┌──────▼──────┐
                 │    MySQL    │
                 │  (AWS RDS)  │
                 └─────────────┘
```

## Maintenance

**Update code:**
```bash
git add .
git commit -m "Update features"
git push origin main
```
→ Render tự động deploy lại

**Update environment variables:**
1. Dashboard → Service → Environment
2. Add/Edit variables
3. Click "Save Changes"
→ Service sẽ restart
