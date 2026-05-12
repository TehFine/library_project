// Root route — Middleware (proxy.ts) sẽ xử lý redirect:
//   - Khách chưa đăng nhập → /reader/books
//   - Đã đăng nhập → /reader/dashboard (hoặc /admin/dashboard, /librarian/dashboard)
export default function RootPage() {
  return null
}