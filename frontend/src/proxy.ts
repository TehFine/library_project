import { NextResponse, NextRequest } from 'next/server'

// Decode JWT payload without a library (Safe for Middleware)
function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = Buffer.from(base64, 'base64').toString()
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function getDashboardPath(role: string): string {
  switch (role) {
    case 'library_admin':
      return '/admin/dashboard'
    case 'librarian':
      return '/librarian/dashboard'
    case 'reader':
    default:
      return '/reader/dashboard'
  }
}

const PUBLIC_ROUTES = ['/auth/login', '/auth/register']

// Các route trong /reader dành cho khách (không cần đăng nhập)
const READER_PUBLIC_ROUTES = ['/reader/books']

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value
  const payload = token ? decodeJwt(token) : null
  const role = payload?.role

  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  // Kiểm tra xem đây có phải route Reader công khai không
  const isReaderPublic = READER_PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  // 1. Root redirect
  if (pathname === '/') {
    if (token && role) {
      return NextResponse.redirect(new URL(getDashboardPath(role), request.url))
    }
    // Khách vào trang gốc => hiển thị trang Landing Page
    return NextResponse.next()
  }

  // 2. Protect Admin routes
  if (pathname.startsWith('/admin') && (!token || role !== 'library_admin')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 3. Protect Librarian routes
  if (pathname.startsWith('/librarian') && (!token || role !== 'librarian')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 4. Protect Reader routes — nhưng cho phép các route công khai (sách)
  if (pathname.startsWith('/reader') && !isReaderPublic) {
    if (!token || role !== 'reader') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // 5. Redirect logged in users away from public routes
  if (isPublic && token && role) {
    return NextResponse.redirect(new URL(getDashboardPath(role), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)',
  ],
}