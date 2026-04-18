'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import BorrowCard from '@/components/borrows/BorrowCard'
import { Pagination, EmptyState, Skeleton } from '@/components/ui'
import { borrowsApi } from '@/lib/api'
import { BorrowRecord, BorrowStatus } from '@/types'
import { cn } from '@/lib/utils'

const TABS: { label: string; value: BorrowStatus | 'all' }[] = [
  { label: 'Đang mượn',  value: 'borrowing' },
  { label: 'Quá hạn',   value: 'overdue'   },
  { label: 'Lịch sử',   value: 'returned'  },
  { label: 'Tất cả',    value: 'all'       },
]

export default function BorrowsPage() {
  const [records, setRecords]   = useState<BorrowRecord[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<BorrowStatus | 'all'>('borrowing')
  const [renewingId, setRenewingId] = useState<string | null>(null)
  const LIMIT = 12

  async function load(p: number, t: BorrowStatus | 'all') {
    setLoading(true)
    try {
      const res = await borrowsApi.mine({
        page: p, limit: LIMIT,
        ...(t !== 'all' && { status: t }),
      })
      setRecords(res.data)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page, tab) }, [page, tab])

  function handleTabChange(t: BorrowStatus | 'all') {
    setTab(t)
    setPage(1)
  }

  async function handleRenew(id: string) {
    setRenewingId(id)
    try {
      const updated = await borrowsApi.renew(id)
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r))
    } catch (e) {
      console.error(e)
    } finally {
      setRenewingId(null)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div>
      <PageHeader title="Sách đang mượn" description="Theo dõi tình trạng mượn sách của bạn" />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => handleTabChange(t.value)}
            className={cn(
              'px-4 py-2 text-sm transition-colors border-b-2 -mb-px',
              tab === t.value
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-600',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          title="Không có phiếu mượn nào"
          description={tab === 'borrowing' ? 'Đến thư viện để mượn sách đầu tiên của bạn' : 'Không có dữ liệu'}
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map(r => (
            <BorrowCard
              key={r.id}
              record={r}
              onRenew={handleRenew}
              isRenewing={renewingId === r.id}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}