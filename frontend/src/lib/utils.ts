import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BorrowStatus, CardStatus, FineStatus, FineType, ReservationStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date formatting ───────────────────────────────────────────────────────────
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

export function daysFromNow(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(dueDateStr: string, returnDate: string | null): boolean {
  if (returnDate) return false
  return new Date(dueDateStr) < new Date()
}

// ── Currency formatting ───────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

// ── Status labels & colors ────────────────────────────────────────────────────
export const borrowStatusMap: Record<BorrowStatus, { label: string; color: string }> = {
  borrowing: { label: 'Đang mượn', color: 'bg-blue-50 text-blue-700' },
  overdue:   { label: 'Quá hạn',   color: 'bg-red-50 text-red-700'   },
  returned:  { label: 'Đã trả',    color: 'bg-gray-100 text-gray-600' },
  lost:      { label: 'Mất sách',  color: 'bg-orange-50 text-orange-700' },
}

export const reservationStatusMap: Record<ReservationStatus, { label: string; color: string }> = {
  waiting:   { label: 'Đang chờ',         color: 'bg-yellow-50 text-yellow-700' },
  notified:  { label: 'Sách đã có sẵn',   color: 'bg-green-50 text-green-700'  },
  fulfilled: { label: 'Đã nhận sách',     color: 'bg-gray-100 text-gray-600'   },
  cancelled: { label: 'Đã hủy',           color: 'bg-gray-100 text-gray-500'   },
  expired:   { label: 'Hết hạn chờ',      color: 'bg-red-50 text-red-600'      },
}

export const fineStatusMap: Record<FineStatus, { label: string; color: string }> = {
  pending: { label: 'Chưa thanh toán', color: 'bg-red-50 text-red-700'   },
  paid:    { label: 'Đã thanh toán',   color: 'bg-green-50 text-green-700'},
  waived:  { label: 'Được miễn',       color: 'bg-gray-100 text-gray-600' },
}

export const fineTypeMap: Record<FineType, string> = {
  overdue: 'Trả trễ hạn',
  damage:  'Hư hỏng sách',
  lost:    'Mất sách',
}

export const cardStatusMap: Record<CardStatus, { label: string; color: string }> = {
  active:    { label: 'Còn hiệu lực', color: 'bg-green-50 text-green-700' },
  expired:   { label: 'Hết hạn',      color: 'bg-yellow-50 text-yellow-700' },
  suspended: { label: 'Bị khóa',      color: 'bg-red-50 text-red-700'   },
  cancelled: { label: 'Đã hủy',       color: 'bg-gray-100 text-gray-500' },
}

// ── Truncate text ─────────────────────────────────────────────────────────────
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}

// ── Build query string ────────────────────────────────────────────────────────
export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
  return filtered.length ? '?' + filtered.join('&') : ''
}