// ── Auth ──────────────────────────────────────────────────────────────────────
export type Role = 'library_admin' | 'librarian' | 'reader'

export interface User {
  id: string
  username: string
  email: string
  role: Role
  fullName: string | null
  phone: string | null
  idCardNumber: string | null
  dateOfBirth: string | null
  address: string | null
  isActive: boolean
  lastLogin: string | null
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

// ── Library Card ──────────────────────────────────────────────────────────────
export type CardStatus = 'active' | 'expired' | 'suspended' | 'cancelled'

export interface LibraryCard {
  id: string
  userId: string
  cardNumber: string
  issuedDate: string
  expiryDate: string
  status: CardStatus
  issuedBy: string
}

// ── Category ──────────────────────────────────────────────────────────────────
export interface Category {
  id: number
  name: string
}

// ── Book ─────────────────────────────────────────────────────────────────────
export interface Book {
  id: string
  isbn: string
  title: string
  author: string
  publisher: string | null
  categoryId: number
  category: Category
  publishYear: number | null
  description: string | null
  coverUrl: string | null
  totalCopies: number
  availableCopies: number
  createdAt: string
}

// ── Book Copy ─────────────────────────────────────────────────────────────────
export type CopyCondition = 'new' | 'good' | 'fair' | 'damaged' | 'lost'
export type CopyStatus = 'available' | 'borrowed' | 'reserved' | 'lost' | 'disposed'

export interface BookCopy {
  id: string
  bookId: string
  copyCode: string
  condition: CopyCondition
  status: CopyStatus
  notes: string | null
  createdAt: string
}

// ── Borrow ────────────────────────────────────────────────────────────────────
export type BorrowStatus = 'borrowing' | 'overdue' | 'returned' | 'lost'

export interface BorrowRecord {
  id: string
  libraryCardId: string
  bookCopyId: string
  librarianId: string
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: BorrowStatus
  renewalCount: number
  originalDueDate: string | null
  renewedAt: string | null
  renewedBy: string | null
  createdAt: string
  // Joined
  book?: Book
  bookCopy?: BookCopy
}

// ── Reservation ───────────────────────────────────────────────────────────────
export type ReservationStatus = 'waiting' | 'notified' | 'fulfilled' | 'cancelled' | 'expired'

export interface Reservation {
  id: string
  libraryCardId: string
  bookId: string
  queuePosition: number
  status: ReservationStatus
  reservedAt: string
  notifiedAt: string | null
  expiresAt: string | null
  // Joined
  book?: Book
}

// ── Fine ──────────────────────────────────────────────────────────────────────
export type FineType = 'overdue' | 'damage' | 'lost'
export type FineStatus = 'pending' | 'paid' | 'waived'

export interface Fine {
  id: string
  borrowRecordId: string
  fineType: FineType
  overdueDays: number
  amount: number
  status: FineStatus
  collectedBy: string | null
  paymentMethod: string | null
  receiptNumber: string | null
  paidAt: string | null
  createdAt: string
  // Joined
  borrowRecord?: BorrowRecord
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface QueryParams {
  page?: number
  limit?: number
  search?: string
  categoryId?: number
  status?: string
  [key: string]: string | number | undefined
}