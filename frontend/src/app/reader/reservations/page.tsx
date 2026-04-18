'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Badge, Card, EmptyState, Pagination, Skeleton } from '@/components/ui'
import { reservationsApi } from '@/lib/api'
import { Reservation } from '@/types'
import { formatDate, reservationStatusMap, cn } from '@/lib/utils'
import Button from '@/components/ui/Button'

export default function ReservationsPage() {
  const [list, setList]       = useState<Reservation[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const LIMIT = 10

  async function load(p: number) {
    setLoading(true)
    try {
      const res = await reservationsApi.mine({ page: p, limit: LIMIT })
      setList(res.data)
      setTotal(res.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  async function handleCancel(id: string) {
    if (!confirm('Bạn có chắc muốn hủy đặt trước này?')) return
    setCancellingId(id)
    try {
      await reservationsApi.cancel(id)
      setList(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
    } catch (e) {
      console.error(e)
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Sách đặt trước" description="Danh sách sách bạn đang chờ mượn" />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
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
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {list.map(r => {
            const si = reservationStatusMap[r.status]
            const canCancel = ['waiting', 'notified'].includes(r.status)
            return (
              <div key={r.id} className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.book?.title ?? '—'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className={si.color}>{si.label}</Badge>
                    <span className="text-xs text-gray-400">Đặt ngày {formatDate(r.reservedAt)}</span>
                    {r.status === 'waiting' && (
                      <span className="text-xs text-amber-600 font-medium">Vị trí hàng đợi: #{r.queuePosition}</span>
                    )}
                  </div>
                  {r.status === 'notified' && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      Sách đã có sẵn! Vui lòng đến nhận trước {formatDate(r.expiresAt)}
                    </p>
                  )}
                </div>
                
                {canCancel && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCancel(r.id)}
                    loading={cancellingId === r.id}
                  >
                    Hủy
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / LIMIT)} onPageChange={p => setPage(p)} />
    </div>
  )
}