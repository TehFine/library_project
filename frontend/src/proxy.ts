import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes công khai — không cần đăng nhập
const PUBLIC_ROUTES = ['/auth/login', '/auth/register']

// Routes yêu cầu đăng nhập
const PROTECTED_PREFIX = ['/reader']

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Lấy token từ cookie (Next.js middleware không đọc được localStorage)
  // Frontend sẽ lưu token vào cookie khi đăng nhập
  const token = request.cookies.get('access_token')?.value

  const isPublic    = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  const isProtected = PROTECTED_PREFIX.some(r => pathname.startsWith(r))

  // Nếu truy cập root, redirect về reader dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/reader/dashboard', request.url))
  }

  // Chưa đăng nhập mà vào route bảo vệ → chuyển về login
  if (isProtected && !token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Đã đăng nhập mà vào login/register → chuyển về dashboard
  if (isPublic && token) {
    return NextResponse.redirect(new URL('/reader/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)',
  ],
}