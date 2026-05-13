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
      
      if (Array.isArray(res)) {
        setRecords(res)
        setTotal(res.length)
      } else if (res && res.data) {
        setRecords(res.data)
        setTotal(res.total ?? res.data.length)
      } else {
        setRecords([])
        setTotal(0)
      }
    } catch (err) {
      console.error('Failed to load borrows:', err)
      setRecords([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
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

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => handleTabChange(t.value)}
            className={cn(
              'px-5 py-2.5 text-sm font-semibold transition-all duration-200 rounded-xl',
              tab === t.value
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-transparent hover:border-gray-200',
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