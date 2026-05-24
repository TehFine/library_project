import { AuthResponse, PaginatedResponse, QueryParams, User } from '@/types'
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
  updateProfile: (data: { fullName?: string; phone?: string; address?: string; dateOfBirth?: string }) =>
    request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}

// ── Books ─────────────────────────────────────────────────────────────────────
export const booksApi = {
  list: (params?: QueryParams) =>
    request<PaginatedResponse<import('@/types').Book>>(`/books${buildQueryString(params ?? {})}`, { skipAuthRedirect: true }),
  detail: (id: string) =>
    request<import('@/types').Book>(`/books/${id}`, { skipAuthRedirect: true }),
  create: (data: any) =>
    request<import('@/types').Book>('/books', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<import('@/types').Book>(`/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  createCopy: (bookId: string, data: any) =>
    request<any>(`/books/${bookId}/copies`, { method: 'POST', body: JSON.stringify(data) }),
  updateCopy: (copyId: string, data: any) =>
    request<any>(`/books/copies/${copyId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCopy: (copyId: string) =>
    request<any>(`/books/copies/${copyId}`, { method: 'DELETE' }),
  // Aliases for consistency
  getAll: (params?: QueryParams) => booksApi.list(params),
  getOne: (id: string) => booksApi.detail(id),
}

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => request<import('@/types').Category[]>('/categories', { skipAuthRedirect: true }),
  getAll: () => categoriesApi.list(),
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

// ── Borrow Requests ───────────────────────────────────────────────────────────
export const borrowRequestsApi = {
  create: (bookId: string) => request<any>('/borrow-requests', { method: 'POST', body: JSON.stringify({ bookId }) }),
  mine: () => request<any[]>('/borrow-requests/mine'),
}

export { ApiError }

// ── Librarian ──────────────────────────────────────────────────────────────────
export interface LibrarianStats {
  borrowsToday: number
  returnsToday: number
  overdueCount: number
  finesCollectedToday: number
  pendingRequestsCount: number
  overdueBooks: { id: string; title: string; user: string; days: number }[]
  readyReservations: { id: string; title: string; user: string; queue: number }[]
  pendingRequests: { id: string; title: string; user: string; date: string }[]
}

export const librarianApi = {
  getStats: () => request<LibrarianStats>('/librarian/dashboard/stats'),
  
  // Search
  searchCards: (q: string) => request<any[]>(`/library-cards/search?q=${encodeURIComponent(q)}`),
  getCardDetails: (id: string) => request<any>(`/library-cards/${id}`),
  searchCopies: (q: string) => request<any[]>(`/books/copies/search?q=${encodeURIComponent(q)}`),
  findCopyByCode: (code: string) => request<any>(`/books/copies/${encodeURIComponent(code)}`),
  findBorrowByCopyCode: (code: string) => request<any>(`/borrow-records/copy/${encodeURIComponent(code)}`),
  
  // Cards & Users
  searchUsers: (q: string) => request<User[]>(`/users/search?q=${encodeURIComponent(q)}`),
  createCard: (userId: string, duration: string) => {
    const today = new Date()
    let addYears = 1
    let addMonths = 0
    if (duration === '6m') addMonths = 6
    else if (duration === '2y') addYears = 2
    today.setFullYear(today.getFullYear() + addYears)
    today.setMonth(today.getMonth() + addMonths)
    return request<any>('/library-cards', { method: 'POST', body: JSON.stringify({ userId, expiryDate: today.toISOString().split('T')[0] }) })
  },
  renewCard: (id: string, duration: string) => request<any>(`/library-cards/${id}/renew`, { method: 'PATCH', body: JSON.stringify({ duration }) }),
  
  // Borrows
  createBorrow: (dto: { cardId: string; copyId: string }) => request<any>('/borrow-records', { method: 'POST', body: JSON.stringify(dto) }),
  returnBook: (id: string, condition: string) => request<any>(`/borrow-records/${id}/return`, { method: 'PATCH', body: JSON.stringify({ condition }) }),
  
  // Borrow Requests
  getAllRequests: () => request<any[]>('/borrow-requests'),
  approveRequest: (id: string, copyId: string) => request<any>(`/borrow-requests/${id}/approve`, { method: 'POST', body: JSON.stringify({ copyId }) }),
  rejectRequest: (id: string, reason: string) => request<any>(`/borrow-requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Fines
  getAllFines: () => request<any[]>('/fines'),
  payFine: (id: string, method: string) => request<any>(`/fines/${id}/pay`, { method: 'PATCH', body: JSON.stringify({ method }) }),

  // Reservations
  getReservations: () => request<any[]>('/reservations'),
  notifyReservation: (id: string) => request<any>(`/reservations/${id}/notify`, { method: 'POST' }),
  fulfillReservation: (id: string) => request<any>(`/reservations/${id}/fulfill`, { method: 'POST' }),
}