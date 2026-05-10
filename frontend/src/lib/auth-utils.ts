import { Role } from '@/types'

export function getDashboardPath(role: Role | string): string {
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

/**
 * Decode JWT payload without a library (Safe for Middleware/Client)
 */
export function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}
