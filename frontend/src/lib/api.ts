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
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('access_token')
    : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
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
  me: () => request<AuthResponse['user']>('/auth/me'),
}

// ── Books ─────────────────────────────────────────────────────────────────────
export const booksApi = {
  list: (params?: QueryParams) =>
    request<PaginatedResponse<import('@/types').Book>>(`/books${buildQueryString(params ?? {})}`),
  detail: (id: string) =>
    request<import('@/types').Book>(`/books/${id}`),
}

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => request<import('@/types').Category[]>('/categories'),
}

// ── Library Card ──────────────────────────────────────────────────────────────
export const cardsApi = {
  mine: () => request<import('@/types').LibraryCard[]>('/library-cards/mine'),
}

// ── Borrow Records ────────────────────────────────────────────────────────────
export const borrowsApi = {
  mine: (params?: QueryParams) =>
    request<PaginatedResponse<import('@/types').BorrowRecord>>(
      `/borrow-records/mine${buildQueryString(params ?? {})}`
    ),
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