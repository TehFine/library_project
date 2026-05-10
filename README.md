# 📚 Library Management System (Hệ thống Quản lý Thư viện)

Chào mừng bạn đến với dự án **Library Management System**! Đây là một nền tảng quản lý thư viện hiện đại, được xây dựng để hỗ trợ quản lý sách, độc giả, quy trình mượn trả và nhiều tính năng quản trị khác một cách hiệu quả.

---

## 🌟 Tính năng chính

Hệ thống được thiết kế với 3 vai trò người dùng chính:

### 1. Dành cho Độc giả (Reader)
- **Tra cứu sách**: Tìm kiếm sách theo tiêu đề, tác giả, ISBN hoặc danh mục.
- **Xem chi tiết sách**: Xem thông tin chi tiết, trạng thái sẵn có của sách.
- **Quản lý mượn sách**: Xem lịch sử mượn trả và trạng thái các cuốn sách đang mượn.
- **Đặt trước (Reservation)**: Đặt trước các đầu sách đang hết hàng.
- **Thẻ thư viện**: Quản lý thông tin thẻ thư viện cá nhân.

### 2. Dành cho Thủ thư (Librarian)
- **Quản lý mượn trả**: Xử lý quy trình mượn sách và nhận sách trả từ độc giả.
- **Quản lý sách**: Thêm, sửa, xóa các đầu sách và quản lý số lượng bản sao.
- **Quản lý danh mục**: Tổ chức sách theo các thể loại khoa học.
- **Kiểm soát vi phạm**: Quản lý các khoản phạt (fines) đối với sách trả muộn.

### 3. Dành cho Quản trị viên (Admin)
- **Quản lý người dùng**: Cấp quyền và quản lý tài khoản thủ thư và độc giả.
- **Báo cáo & Thống kê**: Theo dõi hoạt động của thư viện (tính năng đang phát triển).

---

## 🛠️ Công nghệ sử dụng

Dự án được xây dựng theo kiến trúc **Full-stack Modern Web**:

- **Frontend**:
  - [Next.js 15+](https://nextjs.org/) (App Router)
  - [Tailwind CSS](https://tailwindcss.com/) (Styling)
  - [Lucide React](https://lucide.dev/) (Icons)
  - [TypeScript](https://www.typescriptlang.org/)

- **Backend**:
  - [NestJS](https://nestjs.com/) (Node.js Framework)
  - [Passport.js](https://www.passportjs.org/) (Authentication)
  - Mock Database (Sử dụng dữ liệu mẫu cho giai đoạn phát triển hiện tại)

---

## 📂 Cấu trúc dự án

```text
Library_project/
├── backend/            # Mã nguồn NestJS API
│   ├── src/
│   │   ├── modules/    # Các module logic (auth, books, users...)
│   │   └── common/     # Database mock & utilities
├── frontend/           # Mã nguồn Next.js Web App
│   ├── src/
│   │   ├── app/        # Routes & Pages (admin, librarian, reader)
│   │   ├── components/ # Reusable UI components
│   │   └── services/   # API connectors
```

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Yêu cầu hệ thống
- Node.js (phiên bản 18 trở lên)
- npm hoặc yarn

### 2. Chạy Backend
```bash
cd backend
npm install
npm run start:dev
```
API sẽ chạy tại: `http://localhost:3001`

### 3. Chạy Frontend
```bash
cd frontend
npm install
npm run dev
```
Ứng dụng web sẽ chạy tại: `http://localhost:3000`

---

## 📝 Roadmap & Phát triển tiếp theo

- [ ] Tích hợp MongoDB/PostgreSQL để lưu trữ dữ liệu thực tế.
- [ ] Chức năng tải lên hình ảnh bìa sách.
- [ ] Gửi thông báo qua Email khi sách đến hạn trả.
- [ ] Bổ sung biểu đồ thống kê cho Admin dashboard.

---

Dự án đang trong quá trình hoàn thiện. Mọi đóng góp xin vui lòng liên hệ đội ngũ phát triển!
