'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StatCard, Card, Badge, EmptyState, Skeleton } from '@/components/ui'
import { borrowsApi, cardsApi, finesApi, reservationsApi } from '@/lib/api'
import { BorrowRecord, Fine, LibraryCard, Reservation } from '@/types'
import { formatDate, daysFromNow, formatCurrency, cardStatusMap, cn } from '@/lib/utils'

// ── Hero Banner ───────────────────────────────────────────────────────────────
function HeroBanner({ card }: { card: LibraryCard | null }) {
  return (
    <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-primary via-primary-light to-amber-300 shadow-glow">
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute top-4 right-24 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative z-10 px-8 py-7 flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">Chào mừng trở lại 👋</p>
          <h2 className="text-white text-2xl font-bold mb-3">Thư viện của bạn</h2>
          <p className="text-white/70 text-sm max-w-xs">
            Khám phá hàng nghìn đầu sách. Chúng tôi đã chọn những cuốn sách phù hợp nhất cho bạn.
          </p>
          <Link
            href="/reader/books"
            className="inline-flex items-center gap-2 mt-4 bg-white text-primary font-bold text-sm px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            Tìm kiếm sách
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* Library card chip */}
        {card && (
          <div className="hidden md:block shrink-0 bg-white/20 backdrop-blur-md rounded-2xl px-5 py-4 text-white border border-white/30">
            <p className="text-xs text-white/70 uppercase tracking-wider font-medium mb-1">Thẻ thư viện</p>
            <p className="text-base font-bold">{card.cardNumber}</p>
            <p className="text-xs text-white/60 mt-1">Hết hạn: {formatDate(card.expiryDate)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Borrow Item ───────────────────────────────────────────────────────────────
function BorrowItem({ borrow }: { borrow: BorrowRecord }) {
  const days = daysFromNow(borrow.dueDate)
  const isLate = borrow.status === 'overdue' || days < 0
  const isSoon = !isLate && days <= 3

  return (
    <li className="flex items-center gap-4 px-6 py-3.5 hover:bg-amber-50/60 transition-colors rounded-2xl mx-2">
      {/* Book icon placeholder */}
      <div className="w-9 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{borrow.book?.title ?? '—'}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{borrow.book?.author}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn(
          'text-xs font-bold',
          isLate ? 'text-red-500' : isSoon ? 'text-orange-500' : 'text-gray-500',
        )}>
          {isLate ? `Quá ${Math.abs(days)} ngày` : `Còn ${days} ngày`}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(borrow.dueDate)}</p>
      </div>
    </li>
  )
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [card, setCard]                   = useState<LibraryCard | null>(null)
  const [borrows, setBorrows]             = useState<BorrowRecord[]>([])
  const [reservations, setReservations]   = useState<Reservation[]>([])
  const [pendingFines, setPendingFines]   = useState<Fine[]>([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    Promise.all([
      cardsApi.mine(),
      borrowsApi.mine({ status: 'borrowing', limit: 5 }),
      reservationsApi.mine({ status: 'waiting,notified', limit: 5 }),
      finesApi.mine({ status: 'pending', limit: 5 }),
    ]).then(([cards, bs, rs, fs]) => {
      setCard(cards.find(c => c.status === 'active') ?? null)
      setBorrows(bs.data)
      setReservations(rs.data)
      setPendingFines(fs.data)
    }).finally(() => setLoading(false))
  }, [])

  const overdueCount = borrows.filter(b => b.status === 'overdue').length
  const totalFine    = pendingFines.reduce((s, f) => s + f.amount, 0)
  const cardStatus   = card ? cardStatusMap[card.status] : null

  return (
    <div>
      {/* Hero banner */}
      <HeroBanner card={card} />

      {/* Stat cards row */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          <StatCard
            label="Đang mượn"
            value={borrows.length}
            sub={overdueCount ? `${overdueCount} quá hạn` : 'Tất cả đúng hạn'}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            }
          />
          <StatCard
            label="Đặt trước"
            value={reservations.length}
            sub="Đang chờ"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Phí phạt"
            value={formatCurrency(totalFine)}
            sub={`${pendingFines.length} khoản`}
            gradient={totalFine > 0}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
              </svg>
            }
          />
          {/* Library card */}
          <div className="rounded-3xl shadow-card bg-white p-6 flex flex-col justify-between">
            <p className="text-xs uppercase tracking-wider font-medium text-gray-500">Thẻ thư viện</p>
            {card ? (
              <>
                <p className="text-base font-bold text-gray-800 mt-1">{card.cardNumber}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">Hết hạn: {formatDate(card.expiryDate)}</p>
                  <Badge className={cn('text-xs', cardStatus?.color)}>{cardStatus?.label}</Badge>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Chưa có thẻ</p>
            )}
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid gap-5 md:grid-cols-2">

        {/* Sách đang mượn */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-50">
            <p className="text-sm font-bold text-gray-800">📚 Sách đang mượn</p>
            <Link href="/reader/borrows" className="text-xs text-primary font-semibold hover:underline transition-all">
              Xem tất cả →
            </Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
            </div>
          ) : borrows.length === 0 ? (
            <EmptyState title="Chưa có sách nào đang mượn" />
          ) : (
            <ul className="py-2">
              {borrows.map(b => <BorrowItem key={b.id} borrow={b} />)}
            </ul>
          )}
        </Card>

        {/* Right column */}
        <div className="space-y-4">

          {/* Notified reservations */}
          {reservations.filter(r => r.status === 'notified').map(r => (
            <Card key={r.id} className="border-l-4 border-green-400 bg-green-50/60 shadow-soft-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-green-800">Sách đặt trước đã có!</p>
                  <p className="text-sm text-green-700 mt-0.5 truncate">{r.book?.title}</p>
                  <p className="text-xs text-green-600 mt-1">
                    Vui lòng đến nhận trước {formatDate(r.expiresAt)}
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {/* Fines */}
          {pendingFines.length > 0 && (
            <Card className="border-l-4 border-red-400 bg-red-50/60 shadow-soft-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-800">⚠️ Phí phạt chưa thanh toán</p>
                <Link href="/reader/fines" className="text-xs text-primary font-semibold hover:underline">Chi tiết →</Link>
              </div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalFine)}</p>
              <p className="text-xs text-gray-400 mt-1">Vui lòng đến thư viện để thanh toán</p>
            </Card>
          )}

          {/* Waiting reservations */}
          {reservations.filter(r => r.status === 'waiting').length > 0 && (
            <Card padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-50">
                <p className="text-sm font-bold text-gray-800">⏳ Đang chờ đặt trước</p>
              </div>
              <ul className="py-2">
                {reservations.filter(r => r.status === 'waiting').map(r => (
                  <li key={r.id} className="flex items-center justify-between px-6 py-3 hover:bg-amber-50/60 transition-colors rounded-2xl mx-2">
                    <p className="text-sm text-gray-800 truncate flex-1">{r.book?.title}</p>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold ml-3">
                      #{r.queuePosition}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Empty right col fallback */}
          {reservations.length === 0 && pendingFines.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-3xl mb-2">✨</p>
              <p className="text-sm font-semibold text-gray-700">Mọi thứ đều ổn!</p>
              <p className="text-xs text-gray-400 mt-1">Không có phí phạt hay sách đặt trước nào.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}