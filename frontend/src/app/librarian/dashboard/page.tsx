'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, Badge } from '@/components/ui'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { cn, formatCurrency } from '@/lib/utils'
import { librarianApi, LibrarianStats, authApi } from '@/lib/api'
import { User } from '@/types'

export default function LibrarianDashboard() {
  const [showEndShiftModal, setShowEndShiftModal] = useState(false)
  const [stats, setStats] = useState<LibrarianStats | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [s, me] = await Promise.all([
        librarianApi.getStats(),
        authApi.me()
      ])
      setStats(s)
      setUser(me)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const shiftInfo = {
    name: 'Ca Hiện Tại',
    time: 'Linh hoạt',
    librarian: user?.fullName || user?.username || '...',
  }

  const statCards = [
    { label: 'Yêu cầu mới', value: stats?.pendingRequestsCount ?? 0, subtext: 'chờ duyệt', color: 'bg-amber-50 text-amber-700 ring-amber-200' },
    { label: 'Phiếu mượn', value: stats?.borrowsToday ?? 0, subtext: 'hôm nay', color: 'bg-blue-50 text-blue-700 ring-blue-200' },
    { label: 'Phiếu trả', value: stats?.returnsToday ?? 0, subtext: 'hôm nay', color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    { label: 'Quá hạn', value: stats?.overdueCount ?? 0, subtext: 'cần xử lý', color: 'bg-red-50 text-red-700 ring-red-200' },
  ]

  const handleEndShift = () => {
    setShowEndShiftModal(false)
    window.location.href = '/auth/login'
  }

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Đang tải dữ liệu...</div>

  return (
    <div className="space-y-6">
      <PageHeader title="Tổng quan ca làm việc" description="Theo dõi và quản lý hoạt động thư viện trong ca của bạn" />

      {/* Khu vực 1 — Thanh trạng thái ca */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Badge className="bg-primary-100 text-primary-800 text-sm px-3 py-1 font-bold">
            {shiftInfo.name} ({shiftInfo.time})
          </Badge>
          <span className="text-gray-700 font-semibold">Thủ thư: {shiftInfo.librarian}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowEndShiftModal(true)}>
          Kết thúc ca ▼
        </Button>
      </div>

      {/* Khu vực 2 — Stat cards (4 ô) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className={cn('rounded-2xl p-5 ring-1 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:scale-105', s.color)}>
            <p className="text-sm font-bold opacity-80 mb-1 uppercase tracking-wider">{s.label}</p>
            <p className="text-3xl font-black mb-1">{s.value}</p>
            <p className="text-xs opacity-70 font-medium">{s.subtext}</p>
          </div>
        ))}
      </div>

      {/* Khu vực 3 — Thao tác nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/librarian/borrows/new" className="block">
          <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-3xl p-6 shadow-glow hover:scale-[1.02] transition-transform cursor-pointer flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">📖</span> CHO MƯỢN SÁCH
              </h3>
              <p className="text-primary-100 mt-1 opacity-90">Quét thẻ để bắt đầu tạo phiếu mượn mới</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
        <Link href="/librarian/borrows/return" className="block">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-3xl p-6 shadow-lg hover:scale-[1.02] transition-transform cursor-pointer flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">↩️</span> NHẬN TRẢ SÁCH
              </h3>
              <p className="text-emerald-100 mt-1 opacity-90">Quét mã sách để tiến hành nhận trả sách</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Khu vực 4 — Yêu cầu mượn mới */}
        <Card padding="none" className="rounded-3xl overflow-hidden border-none shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
               Yêu cầu mượn mới
            </h3>
            <Link href="/librarian/borrows/requests">
               <Button variant="ghost" size="sm" className="text-primary">Xem tất cả</Button>
            </Link>
          </div>
          <div className="divide-y divide-gray-50 bg-white min-h-[200px]">
            {!stats || stats.pendingRequests.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm italic">Không có yêu cầu mới</div>
            ) : (
              stats.pendingRequests.map(r => (
                <div key={r.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl font-bold">?</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{r.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.user} • <span className="text-amber-600 font-bold">{new Date(r.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></p>
                    </div>
                  </div>
                  <Link href="/librarian/borrows/requests">
                    <Button variant="ghost" size="sm" className="rounded-full">Xử lý</Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Khu vực 5 — Sách quá hạn */}
        <Card padding="none" className="rounded-3xl overflow-hidden border-none shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h3 className="font-bold text-gray-900">Sách quá hạn cần xử lý</h3>
            <Button variant="ghost" size="sm" className="text-primary">Gửi nhắc nhở</Button>
          </div>
          <div className="divide-y divide-gray-50 bg-white min-h-[200px]">
            {!stats || stats.overdueBooks.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm italic">Không có sách quá hạn</div>
            ) : (
              stats.overdueBooks.map(b => (
                <div key={b.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center text-xl font-bold">!</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{b.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{b.user} • <span className="text-red-600 font-bold">Trễ {b.days} ngày</span></p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full">Nhắc nhở</Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Modal Kết thúc ca */}
      <Modal open={showEndShiftModal} onClose={() => setShowEndShiftModal(false)} title="Xác nhận kết thúc ca">
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">Bạn sắp kết thúc ca làm việc. Dưới đây là tổng kết hoạt động trong ca:</p>
          <div className="bg-gray-50 p-5 rounded-2xl space-y-3 text-sm border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-500">Số phiếu mượn:</span>
              <span className="font-bold">{stats?.borrowsToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số phiếu trả:</span>
              <span className="font-bold">{stats?.returnsToday}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-gray-500">Tiền phạt thu được:</span>
              <span className="font-black text-amber-600 text-lg">{formatCurrency(stats?.finesCollectedToday ?? 0)}</span>
            </div>
          </div>
          <p className="text-xs text-amber-600 font-bold italic bg-amber-50 p-3 rounded-xl border border-amber-100">Lưu ý: Hệ thống sẽ in biên bản tổng kết và đăng xuất tài khoản.</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowEndShiftModal(false)}>Hủy</Button>
            <Button variant="primary" onClick={handleEndShift}>In & Kết thúc</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
