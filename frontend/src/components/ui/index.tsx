import { cn } from '@/lib/utils'

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  className?: string
}
export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700', className)}>
      {children}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}
const cardPadding = { none: '', sm: 'p-5', md: 'p-6', lg: 'p-8' }
export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div className={cn('rounded-3xl bg-amber-50/60 border border-amber-100/80', cardPadding[padding], className)}>
      {children}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-t border-amber-100', className)} />
}

// ── Empty State ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-amber-300">{icon}</div>}
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-amber-100/70', className)} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-amber-50/60 border border-amber-100/80 p-6 space-y-4">
      <Skeleton className="h-5 w-2/3 rounded-full" />
      <Skeleton className="h-4 w-1/2 rounded-full" />
      <Skeleton className="h-4 w-3/4 rounded-full" />
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1.5 pt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="h-9 w-9 rounded-full flex items-center justify-center text-sm text-gray-500 hover:bg-white hover:shadow-soft-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        ‹
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce<(number | '...')[]>((acc, p, idx, arr) => {
          if (idx > 0 && (arr[idx - 1] as number) + 1 !== p) acc.push('...')
          acc.push(p)
          return acc
        }, [])
        .map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} className="h-9 w-9 flex items-center justify-center text-sm text-gray-400">…</span>
            : <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200',
                  p === page
                    ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-glow'
                    : 'text-gray-600 hover:bg-white hover:shadow-soft-sm',
                )}
              >{p}</button>
        )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="h-9 w-9 rounded-full flex items-center justify-center text-sm text-gray-500 hover:bg-white hover:shadow-soft-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        ›
      </button>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  gradient?: boolean
}
export function StatCard({ label, value, sub, icon, gradient }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-3xl p-6',
      gradient
        ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-glow'
        : 'bg-amber-50/60 border border-amber-100/80',
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn('text-xs uppercase tracking-wide font-medium', gradient ? 'text-white/70' : 'text-gray-500')}>{label}</p>
          <p className={cn('mt-1 text-2xl font-bold', gradient ? 'text-white' : 'text-gray-800')}>{value}</p>
          {sub && <p className={cn('mt-0.5 text-xs', gradient ? 'text-white/60' : 'text-gray-400')}>{sub}</p>}
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-2xl', gradient ? 'bg-white/20' : 'bg-amber-100')}>
            <span className={gradient ? 'text-white' : 'text-primary'}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  )
}