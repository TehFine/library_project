'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Badge, Card, EmptyState, Pagination, Skeleton, StatCard } from '@/components/ui'
import { finesApi } from '@/lib/api'
import { Fine } from '@/types'
import { formatCurrency, formatDate, fineStatusMap, fineTypeMap } from '@/lib/utils'

export default function FinesPage() {
  const [fines, setFines]     = useState<Fine[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const LIMIT = 10

  async function load(p: number) {
    setLoading(true)
    try {
      const res = await finesApi.mine({ page: p, limit: LIMIT })
      setFines(res.data)
      setTotal(res.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const pendingTotal = fines.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0)
  const paidTotal    = fines.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0)

  return (
    <div>
      <PageHeader title="Phí phạt" description="Lịch sử phí phạt của bạn" />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Còn nợ" value={formatCurrency(pendingTotal)} sub="Cần thanh toán tại thư viện" />
        <StatCard label="Đã thanh toán" value={formatCurrency(paidTotal)} sub="Tổng đã nộp" />
      </div>

      {pendingTotal > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Bạn còn {formatCurrency(pendingTotal)} chưa thanh toán</p>
              <p className="text-xs text-amber-600 mt-0.5">Vui lòng đến thư viện để thanh toán. Phí phạt chưa thanh toán có thể ảnh hưởng đến quyền mượn sách.</p>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : fines.length === 0 ? (
        <EmptyState
          title="Không có phí phạt nào"
          description="Bạn luôn trả sách đúng hạn và giữ gìn sách tốt!"
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {fines.map(f => {
            const si = fineStatusMap[f.status]
            return (
              <div key={f.id} className="flex items-start gap-4 px-4 py-4 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 truncate">{f.borrowRecord?.book?.title ?? '—'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className={si.color}>{si.label}</Badge>
                    <span className="text-xs text-gray-400">{fineTypeMap[f.fineType]}</span>
                    {f.fineType === 'overdue' && (
                      <span className="text-xs text-gray-400">{f.overdueDays} ngày</span>
                    )}
                  </div>
                  {f.status === 'paid' && (
                    <p className="text-xs text-gray-400 mt-1">Thanh toán {formatDate(f.paidAt)} · Biên lai {f.receiptNumber}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${f.status === 'pending' ? 'text-red-600' : 'text-gray-500'}`}>
                    {formatCurrency(f.amount)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(f.createdAt)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / LIMIT)} onPageChange={p => setPage(p)} />
    </div>
  )
}