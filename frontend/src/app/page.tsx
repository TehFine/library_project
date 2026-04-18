import { redirect } from 'next/navigation'

// Root route: redirect về dashboard
// middleware.ts sẽ kiểm tra auth trước
export default function RootPage() {
  redirect('/reader/dashboard')
}