import { AuthResponse, PaginatedResponse, QueryParams } from '@/types'
import { buildQueryString } from './utils'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { skipAuthRedirect?: boolean } = {},
): Promise<T> {
  const { skipAuthRedirect, ...fetchOptions } = options
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('access_token')
    : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    
    // Auto logout on 401
    if (res.status === 401 && typeof window !== 'undefined' && !skipAuthRedirect) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login'
      }
    }

    throw new ApiError(res.status, body.message ?? 'Đã có lỗi xảy ra')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    email: string; password: string; username: string
    fullName: string; phone: string; address: string; dateOfBirth: string
  }) => request<{ message: string }>('/auth/register', {
    method: 'POST', body: JSON.stringify(data),
  }),
  me: () => request<AuthResponse['user']>('/auth/me', { skipAuthRedirect: true }),
}

// ── Books ─────────────────────────────────────────────────────────────────────
export const booksApi = {
  list: (params?: QueryParams) =>
    request<PaginatedResponse<import('@/types').Book>>(`/books${buildQueryString(params ?? {})}`, { skipAuthRedirect: true }),
  detail: (id: string) =>
    request<import('@/types').Book>(`/books/${id}`, { skipAuthRedirect: true }),
}

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => request<import('@/types').Category[]>('/categories', { skipAuthRedirect: true }),
}

// ── Library Card ──────────────────────────────────────────────────────────────
export const cardsApi = {
  mine: () => request<import('@/types').LibraryCard[]>('/library-cards/mine'),
  create: () => request<import('@/types').LibraryCard>('/library-cards', { method: 'POST', body: JSON.stringify({}) }),
}

// ── Borrow Records ────────────────────────────────────────────────────────────
export const borrowsApi = {
  mine: (params?: QueryParams) =>
    request<PaginatedResponse<import('@/types').BorrowRecord>>(
      `/borrow-records/mine${buildQueryString(params ?? {})}`
    ),
  borrow: (bookId: string) =>
    request<import('@/types').BorrowRecord>('/borrow-records/book', {
      method: 'POST', body: JSON.stringify({ bookId }),
    }),
  renew: (id: string) =>
    request<import('@/types').BorrowRecord>(`/borrow-records/${id}/renew`, { method: 'POST' }),
}

// ── Reservations ──────────────────────────────────────────────────────────────
export const reservationsApi = {
  mine: (params?: QueryParams) =>
    request<PaginatedResponse<import('@/types').Reservation>>(
      `/reservations/mine${buildQueryString(params ?? {})}`
    ),
  create: (bookId: string) =>
    request<import('@/types').Reservation>('/reservations', {
      method: 'POST', body: JSON.stringify({ bookId }),
    }),
  cancel: (id: string) =>
    request<void>(`/reservations/${id}/cancel`, { method: 'POST' }),
}

// ── Fines ─────────────────────────────────────────────────────────────────────
export const finesApi = {
  mine: (params?: QueryParams) =>
    request<PaginatedResponse<import('@/types').Fine>>(
      `/fines/mine${buildQueryString(params ?? {})}`
    ),
}

export { ApiError }