# 📚 Hệ thống Quản lý Thư viện (Library Management System)

Hệ thống quản lý thư viện toàn diện với 3 vai trò: **Độc giả (Reader)**, **Thủ thư (Librarian)**, và **Quản trị viên (Admin)** — được xây dựng bằng NestJS + Next.js.

---

## 🛠️ Công nghệ

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, Lucide Icons, Socket.IO Client |
| **Backend** | NestJS 11, TypeORM, Passport.js + JWT, Socket.IO, class-validator, bcryptjs, @nestjs/swagger (Swagger UI) |
| **Database** | PostgreSQL (qua Docker) |
| **Realtime** | WebSocket (Socket.IO) — cập nhật dashboard + thông báo tức thì |

---

## ✨ Tính năng chính

### 👤 Độc giả (Reader)
- **Dashboard** — Xem tổng quan sách đang mượn, quá hạn, phí phạt
- **Tìm kiếm sách** — Tra cứu theo tiêu đề, tác giả, thể loại
- **Mượn sách** — Tự mượn sách đang có sẵn, theo dõi trạng thái
- **Đặt trước** — Đặt trước sách đang có người mượn
- **Gia hạn** — Gia hạn sách đang mượn (tối đa 2 lần)
- **Phí phạt** — Xem và thanh toán phí
- **Hồ sơ** — Cập nhật thông tin cá nhân, xem thẻ thư viện

### 👨‍💻 Thủ thư (Librarian)
- **Dashboard** — Thống kê sách đang mượn, chờ trả, phí chưa thu
- **Cho mượn** — Tạo phiếu mượn, chọn bản sao, xác nhận
- **Yêu cầu mượn** — Duyệt/từ chối yêu cầu từ độc giả
- **Nhận trả** — Nhận sách trả, kiểm tra tình trạng, tính phí phạt
- **Quản lý sách** — Thêm/sửa/xoá sách, quản lý bản sao
- **Thẻ độc giả** — Cấp mới, gia hạn thẻ thư viện
- **Đặt trước** — Xem và xử lý đơn đặt trước
- **Phí phạt** — Danh sách phí chưa thu, thu phí

### 🔐 Quản trị viên (Admin)
- **Dashboard** — KPI tổng quan với biểu đồ mượn sách 30 ngày
- **Báo cáo sách** — Top sách mượn nhiều, tồn kho, tình trạng
- **Báo cáo tài chính** — Biểu đồ thu/phí, lịch sử giao dịch, in biên lai
- **Báo cáo vi phạm** — Thống kê vi phạm, cảnh cáo
- **Quản lý tài khoản** — Thay đổi vai trò, vô hiệu hóa/kích hoạt
- **Thông báo hàng loạt** — Soạn thảo + gửi email hàng loạt (theo nhóm)
- **Nhật ký hoạt động** — Audit log chi tiết (ai, làm gì, IP)
- **Cấu hình hệ thống** — SMTP, phí phạt, thời gian mượn

### ⚙️ Ràng buộc mượn sách
- **Không mượn trùng sách** — Độc giả đang mượn (hoặc quá hạn) cuốn nào thì không thể mượn lại cuốn đó
- **Giới hạn số lượng** — Mặc định tối đa **3 cuốn** cùng lúc (cấu hình qua `MAX_BORROW` trong `.env`)
- **Thời gian mượn** — Mặc định 14 ngày (có thể gia hạn thêm 2 lần, mỗi lần 14 ngày)

---

## 🚀 Cài đặt

### Yêu cầu
- **Node.js** 18+
- **Docker Desktop** (cho PostgreSQL)
- **npm**

### 1. Cấu hình môi trường

Backend sử dụng **biến môi trường** cho kết nối database. Tạo file `backend/.env` với nội dung sau:

```env
# === Database ===
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=library

# === Backend ===
PORT=3001

# === Giới hạn mượn sách ===
# Số cuốn tối đa một độc giả được giữ cùng lúc (mặc định: 3)
MAX_BORROW=3

# === Frontend URL  ===
FRONTEND_URL=http://localhost:3000

# === Email SMTP (Khuyến nghị sử dụng mailtrap ===
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM="Thư viện" <your-email@gmail.com>
```

### 2. Khởi động Database

```bash
# Docker Desktop cần được mở trước
docker compose up -d
```

PostgreSQL sẽ chạy tại **`localhost:5433`** với database `library`.

### 3. Backend

```bash
cd backend
npm install
npm run start:dev
```

API chạy tại: **`http://localhost:3001`**

📖 **Swagger API Docs:** **`http://localhost:3001/api/docs`**
  - Giao diện Swagger UI với danh sách đầy đủ các endpoint
  - Nhấn **Authorize** và nhập JWT token từ `/api/auth/login` để test các API cần xác thực

### 4. Seed dữ liệu mẫu

Sau khi backend đã chạy, chạy các script seed (tuỳ chọn):

```bash
cd backend

# Seed chính — dữ liệu mẫu cho database PostgreSQL
node seed-reports-data.sql      # Dữ liệu báo cáo và thống kê
node seed-borrow-stats.js       # Dữ liệu mượn trả mẫu
node seed-more-overdue.sql      # Thêm dữ liệu quá hạn
node seed-fix-fines.sql         # Sửa dữ liệu phí phạt
node seed-check.sql             # Kiểm tra dữ liệu
node seed-verify.sql            # Xác minh dữ liệu đã seed
```

> **Lưu ý:** Backend có cơ chế in-memory seed sẵn qua `MockDB` khi khởi động. Các script SQL ở trên dùng để bổ sung dữ liệu real cho PostgreSQL.

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Web app chạy tại: **`http://localhost:3000`**

---

## 🔑 Tài khoản mẫu

Tất cả tài khoản đều có mật khẩu **`password123`**:

| Vai trò | Email | Họ tên |
|---------|-------|--------|
| 🔐 **Admin** | `admin@library.vn` | Quản trị viên |
| 👨‍💻 **Librarian** | `librarian@library.vn` | Nguyễn Thị Lan |
| 👤 **Reader** | `reader@example.com` | Trần Văn Minh |
| 👤 **Reader 2** | `reader2@example.com` | Lê Thị Hoa |

---

## 📂 Cấu trúc dự án

```
Library_project/
├── backend/                       # NestJS API
│   ├── src/
│   │   ├── main.ts                # Entry point (set timezone VN)
│   │   ├── app.module.ts          # Root module
│   │   ├── common/
│   │   │   ├── database/          # Database module + seeds (MockDB)
│   │   │   ├── guards/            # JWT auth guard
│   │   │   ├── strategies/        # JWT strategy
│   │   │   ├── utils/             # Hàm tiện ích (toLocalDateStr)
│   │   │   ├── mail/              # Mail service (nodemailer)
│   │   │   └── websocket/         # WebSocket gateway (realtime)
│   │   └── modules/
│   │       ├── admin/             # Dashboard, báo cáo, audit log
│   │       ├── auth/              # Đăng nhập, JWT, quên mật khẩu
│   │       ├── books/             # Sách + bản sao
│   │       ├── borrow-records/    # Mượn/trả sách + ràng buộc
│   │       ├── borrow-requests/   # Yêu cầu mượn
│   │       ├── categories/        # Thể loại
│   │       ├── fines/             # Phí phạt
│   │       ├── librarian/         # Dashboard thủ thư
│   │       ├── library-cards/     # Thẻ thư viện
│   │       ├── notifications/     # Thông báo hàng loạt
│   │       ├── reservations/      # Đặt trước sách
│   │       └── users/             # Người dùng + vai trò
│   ├── .env                       # Biến môi trường (không commit)
│   ├── seed-*.sql                 # Script seed dữ liệu
│   └── docker-compose.yml         # PostgreSQL container
│
├── frontend/                      # Next.js Web App
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/             # Trang quản trị
│   │   │   ├── auth/              # Đăng nhập/đăng ký
│   │   │   ├── librarian/         # Trang thủ thư
│   │   │   └── reader/            # Trang độc giả
│   │   ├── components/
│   │   │   ├── books/             # BookCard
│   │   │   ├── borrows/           # BorrowCard, RequestCard, ReservationCard
│   │   │   ├── layout/            # Sidebar, TopBar, MobileNav
│   │   │   ├── profile/           # SharedProfile
│   │   │   └── ui/                # Button, Input, Modal, Toast, ...
│   │   ├── hooks/                 # useAuth, useToast, useWebSocket
│   │   ├── lib/                   # API client, utils, export
│   │   └── types/                 # TypeScript types
│   └── tailwind.config.ts
│
├── docker-compose.yml             # PostgreSQL container
└── README.md
```

---

## 🌐 API Endpoints chính

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/forgot-password` | Quên mật khẩu |
| POST | `/api/auth/reset-password` | Đặt lại mật khẩu |

### Sách
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/books` | Danh sách sách (phân trang) |
| GET | `/api/books/:id` | Chi tiết sách |
| POST | `/api/books` | Thêm sách (librarian) |

### Mượn trả
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/borrow-records` | Tạo phiếu mượn (librarian) |
| GET | `/api/borrow-records/mine` | Phiếu mượn của tôi (reader) |
| POST | `/api/borrow-records/return/:id` | Trả sách |
| POST | `/api/borrow-records/:id/renew` | Gia hạn |

### Admin
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/dashboard/stats` | Thống kê dashboard |
| GET | `/api/admin/users` | Danh sách người dùng |
| GET | `/api/admin/audit-logs` | Nhật ký hoạt động |

### Swagger
| Trang | URL |
|-------|-----|
| Swagger UI | [`http://localhost:3001/api/docs`](http://localhost:3001/api/docs) |

Endpoint Swagger hỗ trợ **Authorize** với JWT token. Tất cả API đều có mô tả bằng tiếng Việt kèm ví dụ payload.

### WebSocket
| Event | Mô tả |
|-------|-------|
| `admin:dashboard-update` | Dashboard admin thay đổi |
| `librarian:dashboard-update` | Dashboard thủ thư thay đổi |
| `reader:dashboard-update` | Dashboard độc giả thay đổi |
| `reader:request-update` | Yêu cầu mượn thay đổi |

---

## 🧪 Phát triển

### Timezone
Dự án sử dụng **Asia/Ho_Chi_Minh (UTC+7)**. Timezone được thiết lập tự động trong `backend/src/main.ts`:
```typescript
process.env.TZ = 'Asia/Ho_Chi_Minh'
```

Hàm `toLocalDateStr()` trong `backend/src/common/utils/date.ts` dùng để chuyển đổi ngày tháng chính xác theo giờ Việt Nam.

### Ràng buộc mượn sách
Hai ràng buộc được kiểm tra trong `BorrowRecordsService`:
1. **Trùng sách** — Kiểm tra độc giả đã mượn cuốn sách đó chưa (status: `borrowing` hoặc `overdue`)
2. **Giới hạn số lượng** — Đếm tổng số phiếu đang mượn + quá hạn, so với `MAX_BORROW`

### Realtime
Dashboard tự động cập nhật khi có sự kiện mượn/trả nhờ WebSocket.

---

## 📝 Roadmap

- [x] JWT Authentication + 3 vai trò
- [x] CRUD sách + quản lý bản sao
- [x] Mượn/trả sách + ràng buộc
- [x] Yêu cầu mượn + duyệt
- [x] Đặt trước sách
- [x] Phí phạt tự động
- [x] Dashboard + báo cáo
- [x] Thông báo hàng loạt
- [x] WebSocket realtime
- [x] Audit log
- [x] Giao diện responsive
- [x] Timezone Việt Nam
- [x] Swagger API documentation
- [x] Gửi email đặt lại mật khẩu (SMTP/nodemailer)
- [ ] Kênh SMS cho thông báo
- [ ] Upload ảnh bìa sách
- [ ] Tích hợp thanh toán online
- [ ] Unit tests & E2E tests
