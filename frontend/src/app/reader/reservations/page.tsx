'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Badge, EmptyState, Pagination, Skeleton } from '@/components/ui'
import { reservationsApi } from '@/lib/api'
import { Reservation } from '@/types'
import { formatDate, reservationStatusMap, cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'

import ReservationCard from '@/components/borrows/ReservationCard'

export default function ReservationsPage() {
  const [list, setList]       = useState<Reservation[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [statusTab, setStatusTab] = useState<'active' | 'all'>('active')
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null)
  const LIMIT = 12

  async function load(p: number, tab: 'active' | 'all') {
    setLoading(true)
    try {
      const statusParam = tab === 'active' ? 'waiting,notified' : undefined
      const res = await reservationsApi.mine({ page: p, limit: LIMIT, status: statusParam })
      if (Array.isArray(res)) {
        setList(res)
        setTotal(res.length)
      } else if (res && res.data) {
        setList(res.data)
        setTotal(res.total ?? res.data.length)
      } else {
        setList([])
        setTotal(0)
      }
    } catch (err) {
      console.error('Failed to load reservations:', err)
      setList([])
      setTotal(0)
    } finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { 
    load(page, statusTab) 
  }, [page, statusTab])

  const { toast } = useToast()

  function handleCancel(reservation: Reservation) {
    setCancelTarget(reservation)
  }

  async function confirmCancel() {
    if (!cancelTarget) return
    const id = cancelTarget.id
    setCancellingId(id)
    setCancelTarget(null)
    try {
      await reservationsApi.cancel(id)
      setList(prev => prev.filter(r => r.id !== id))
      setTotal(prev => prev - 1)
      toast('Đã hủy đặt trước thành công', 'success')
    } catch (e) {
      console.error(e)
      toast('Hủy đặt trước thất bại, vui lòng thử lại', 'error')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Sách đặt trước" description="Danh sách sách bạn đang chờ mượn" />

      <div className="flex gap-2 mb-6 overflow-x-auto px-1 pb-2 pt-1">
        <button
          onClick={() => { setStatusTab('active'); setPage(1); }}
          className={cn(
            "px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 rounded-xl shrink-0 border",
            statusTab === 'active'
              ? "bg-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-100 border-amber-200"
              : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-transparent hover:border-gray-200"
          )}
        >
          Đang chờ
        </button>
        <button
          onClick={() => { setStatusTab('all'); setPage(1); }}
          className={cn(
            "px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 rounded-xl shrink-0 border",
            statusTab === 'all'
              ? "bg-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-100 border-amber-200"
              : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-transparent hover:border-gray-200"
          )}
        >
          Tất cả
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          title="Không có sách đặt trước"
          description="Sách bạn muốn mượn đang có sẵn hoặc bạn chưa đặt trước cuốn nào."
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(r => (
            <ReservationCard
              key={r.id}
              reservation={r}
              onCancel={() => handleCancel(r)}
              isCancelling={cancellingId === r.id}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / LIMIT)} onPageChange={p => setPage(p)} />

      {/* Cancel confirmation modal */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Xác nhận hủy đặt trước"
        description={cancelTarget ? `Bạn có chắc muốn hủy đặt trước cuốn sách "${cancelTarget.book?.title ?? ''}"?` : ''}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelTarget(null)} className="text-gray-600">
              Không, giữ lại
            </Button>
            <Button variant="primary" onClick={confirmCancel} className="bg-red-600 hover:bg-red-700 ring-red-200">
              Có, hủy đặt trước
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-700">
              Hành động này sẽ hủy đặt trước của bạn. Nếu sách đã sẵn sàng, bạn sẽ mất cơ hội mượn cuốn sách này.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}