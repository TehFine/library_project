# 📚 Library Management System (Hệ thống Quản lý Thư viện)

Hệ thống quản lý thư viện toàn diện với 3 vai trò: **Độc giả (Reader)**, **Thủ thư (Librarian)**, và **Quản trị viên (Admin)**.

---

## ✨ Tính năng mới

### 🔔 Thông báo hàng loạt (Admin)
- Gửi thông báo tới độc giả qua nhiều kênh (email, SMS trong hệ thống)
- Chọn nhóm đối tượng: toàn bộ độc giả, độc giả quá hạn, sắp hết hạn thẻ, đang nợ phí
- Soạn thảo thông báo dạng nháp (draft) hoặc gửi ngay
- Xem lịch sử thông báo đã gửi

### 🔄 WebSocket Realtime
- Cập nhật thông báo realtime cho admin
- Socket.IO server tích hợp trong NestJS

### 📊 Báo cáo & Thống kê (Admin)
- **Thống kê sách**: Top sách mượn nhiều, tồn kho, tình trạng bản sao
- **Tài chính**: Biểu đồ tổng quan thu/phí, lịch sử giao dịch, in biên lai
- **Vi phạm**: Thống kê vi phạm mượn trả, cảnh cáo, xử lý vi phạm

### 👥 Quản lý người dùng (Admin)
- Danh sách tài khoản thủ thư & độc giả
- Thay đổi vai trò, vô hiệu hóa/kích hoạt tài khoản
- Cấp quyền thủ thư

### 🔐 Nhật ký hoạt động (Admin)
- Audit log chi tiết: ai, làm gì, lúc nào, IP
- Bộ lọc theo thời gian, hành động, bảng dữ liệu

### ⚙️ Cấu hình hệ thống (Admin)
- Cấu hình email server (SMTP)
- Cấu hình phí phạt, thời gian mượn tối đa
- Kiểm tra kết nối

### 👨‍💻 Quy trình mượn trả (Librarian)
- **Cho mượn**: Tìm kiếm độc giả, chọn sách, xác nhận mượn
- **Yêu cầu mượn**: Duyệt/từ chối yêu cầu mượn từ độc giả
- **Nhận trả**: Xử lý sách trả, kiểm tra tình trạng, tính phí phạt nếu quá hạn
- **Quản lý sách**: Thêm/sửa/xoá sách, quản lý bản sao
- **Thẻ độc giả**: Cấp mới, gia hạn thẻ thư viện
- **Đặt trước**: Xem và xử lý đơn đặt trước
- **Phí phạt**: Danh sách phí chưa thu, xoá phí

### 📱 Giao diện đồng bộ
- Tone màu **cam/vàng ấm** (`#F5E6CC`) thống nhất cho cả 3 vai trò
- **iOS-style sidebar**: Bo góc `rounded-3xl`, nổi floating panel
- Ẩn thanh tìm kiếm trên admin (tối giản giao diện)

---

## 🌟 Tính năng theo vai trò

### 1. Độc giả (Reader)
- **Dashboard**: Tổng quan sách đang mượn, quá hạn, phí phạt
- **Tìm kiếm sách**: Tra cứu theo tiêu đề, tác giả, thể loại
- **Chi tiết sách**: Xem thông tin, bản sao có sẵn, đặt trước
- **Sách đang mượn**: Danh sách + trạng thái
- **Đặt trước**: Đặt trước sách đang có người mượn
- **Phí phạt**: Xem và thanh toán phí
- **Hồ sơ**: Cập nhật thông tin cá nhân, xem thẻ thư viện

### 2. Thủ thư (Librarian)
- **Dashboard**: Thống kê nhanh (sách đang mượn, chờ trả, phí chưa thu)
- **Cho mượn**: Form mượn sách với autocomplete tìm độc giả
- **Yêu cầu**: Duyệt/từ chối yêu cầu mượn + chọn bản sao
- **Nhận trả**: Quét/thủ công nhận sách trả + phí phạt
- **Quản lý sách**: CRUD sách, quản lý bản sao
- **Thẻ thư viện**: Cấp mới, gia hạn
- **Đặt trước**: Xem và xử lý
- **Phí phạt**: Danh sách + xử lý

### 3. Quản trị viên (Admin)
- **Dashboard**: KPI tổng quan với biểu đồ tròn
- **Báo cáo sách**: Top sách, tồn kho
- **Báo cáo tài chính**: Biểu đồ thu/phí, giao dịch, in biên lai
- **Báo cáo vi phạm**: Thống kê + xử lý
- **Quản lý tài khoản**: Thay đổi vai trò, vô hiệu hóa
- **Thông báo hàng loạt**: Soạn thảo + gửi + lịch sử
- **Nhật ký hoạt động**: Audit log chi tiết
- **Cấu hình hệ thống**: Email, phí phạt, thời gian mượn

---

## 🛠️ Công nghệ sử dụng

### Frontend
| Công nghệ | Mục đích |
|---|---|
| [Next.js 15+](https://nextjs.org/) (App Router) | Framework React |
| [Tailwind CSS](https://tailwindcss.com/) | Styling utility |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Socket.IO Client](https://socket.io/) | WebSocket realtime |
| [TypeScript](https://www.typescriptlang.org/) | Ngôn ngữ |

### Backend
| Công nghệ | Mục đích |
|---|---|
| [NestJS](https://nestjs.com/) | Framework Node.js |
| [TypeORM](https://typeorm.io/) | ORM — PostgreSQL |
| [Passport.js + JWT](https://www.passportjs.org/) | Authentication |
| [Socket.IO](https://socket.io/) | WebSocket server |
| [class-validator](https://github.com/typestack/class-validator) | Validation |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Mã hóa mật khẩu |

---

## 📂 Cấu trúc dự án

```text
Library_project/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── main.ts             # Entry point
│   │   ├── app.module.ts       # Root module
│   │   ├── common/
│   │   │   ├── database/       # Database module + seeds
│   │   │   ├── guards/         # JWT auth guard
│   │   │   ├── strategies/     # JWT strategy
│   │   │   └── websocket/      # WebSocket gateway (realtime)
│   │   └── modules/
│   │       ├── admin/          # Dashboard, báo cáo, audit log
│   │       ├── auth/           # Đăng nhập, JWT
│   │       ├── books/          # Sách + bản sao
│   │       ├── borrow-records/ # Mượn/trả sách
│   │       ├── borrow-requests/# Yêu cầu mượn
│   │       ├── categories/     # Thể loại
│   │       ├── fines/          # Phí phạt
│   │       ├── librarian/      # Dashboard thủ thư
│   │       ├── library-cards/  # Thẻ thư viện
│   │       ├── notifications/  # Thông báo hàng loạt
│   │       ├── reservations/   # Đặt trước sách
│   │       └── users/          # Người dùng + vai trò
│   └── seed-*.sql              # Seed data
│
├── frontend/                   # Next.js Web App
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/          # Trang quản trị
│   │   │   ├── auth/           # Đăng nhập/đăng ký
│   │   │   ├── librarian/      # Trang thủ thư
│   │   │   └── reader/         # Trang độc giả
│   │   ├── components/
│   │   │   ├── books/          # BookCard
│   │   │   ├── borrows/        # BorrowCard, RequestCard, ReservationCard
│   │   │   ├── layout/         # Sidebar, TopBar, MobileNav
│   │   │   ├── profile/        # SharedProfile
│   │   │   └── ui/             # Button, Input, Modal, Toast, ...
│   │   ├── hooks/              # useAuth, useToast, useWebSocket
│   │   ├── lib/                # API client, utils
│   │   └── types/              # TypeScript types
│   └── tailwind.config.ts
│
├── docker-compose.yml          # PostgreSQL
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu
- **Node.js** 18+
- **PostgreSQL** (hoặc dùng Docker)
- **npm** hoặc **yarn**

### 1. Khởi động Database (Docker)
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
npm install
# Seed dữ liệu mẫu (nếu cần)
npm run seed
npm run start:dev
```
API chạy tại: `http://localhost:3001`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Web app chạy tại: `http://localhost:3000`

### Tài khoản mẫu
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@library.vn` | `admin123` |
| Thủ thư | `librarian@library.vn` | `lib123` |
| Độc giả | `reader@library.vn` | `reader123` |

---

## 📝 Roadmap

- [x] WebSocket realtime cho thông báo
- [x] Thông báo hàng loạt (Admin)
- [x] Báo cáo & thống kê (Admin)
- [x] Nhật ký hoạt động (Admin)
- [x] Giao diện đồng bộ tone cam/vàng
- [x] iOS-style sidebar floating panel
- [ ] Gửi email thật (SMTP)
- [ ] Kênh SMS cho thông báo
- [ ] Upload ảnh bìa sách
- [ ] Tích hợp thanh toán online
- [ ] Unit tests & E2E tests
