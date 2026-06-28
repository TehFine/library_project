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
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import {
  BookOpen, RotateCcw, HelpCircle, AlertTriangle,
  DollarSign, Bell, Users, ArrowRight, Clock, CheckCircle, CreditCard, Smartphone
} from 'lucide-react'

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

  // WebSocket realtime: auto-refresh when backend emits updates
  useRealtimeRefresh('librarian:dashboard-update', loadData)

  const shiftInfo = {
    name: 'Ca Hiện Tại',
    time: 'Linh hoạt',
    librarian: user?.fullName || user?.username || '...',
  }

  const statCards = [
    {
      label: 'Yêu cầu mới',
      value: stats?.pendingRequestsCount ?? 0,
      subtext: 'chờ duyệt',
      icon: <HelpCircle className="w-5 h-5" />,
      color: 'bg-amber-50 text-amber-700 ring-amber-200/50',
      iconBg: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Phiếu mượn',
      value: stats?.borrowsToday ?? 0,
      subtext: 'hôm nay',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-700 ring-blue-200/50',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Phiếu trả',
      value: stats?.returnsToday ?? 0,
      subtext: 'hôm nay',
      icon: <RotateCcw className="w-5 h-5" />,
      color: 'bg-emerald-50 text-emerald-700 ring-emerald-200/50',
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Quá hạn',
      value: stats?.overdueCount ?? 0,
      subtext: 'cần xử lý',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-red-50 text-red-700 ring-red-200/50',
      iconBg: 'bg-red-100 text-red-600',
    },
    {
      label: 'Tiền phạt đã thu',
      value: formatCurrency(stats?.finesCollectedToday ?? 0),
      subtext: 'hôm nay',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-violet-50 text-violet-700 ring-violet-200/50',
      iconBg: 'bg-violet-100 text-violet-600',
    },
    {
      label: 'Online hôm nay',
      value: formatCurrency(stats?.onlineCollectedToday ?? 0),
      subtext: 'thanh toán VNPay',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'bg-sky-50 text-sky-700 ring-sky-200/50',
      iconBg: 'bg-sky-100 text-sky-600',
    },
  ]

  const handleEndShift = () => {
    setShowEndShiftModal(false)
    window.location.href = '/auth/login'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tổng quan ca làm việc" description="Theo dõi và quản lý hoạt động thư viện trong ca của bạn" />
        {/* Skeleton shift bar */}
        <div className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        {/* Skeleton quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
        </div>
        {/* Skeleton bottom sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-12 bg-gray-100 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-10 bg-gray-50 animate-pulse rounded-xl" />
                <div className="h-10 bg-gray-50 animate-pulse rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan ca làm việc"
        description="Theo dõi và quản lý hoạt động thư viện trong ca của bạn"
        action={
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
              })}
            </span>
          </div>
        }
      />

      {/* Khu vực 1 — Thanh trạng thái ca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-white via-white to-amber-50/30 border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm gap-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <Badge className="bg-primary-100 text-primary-800 text-xs sm:text-sm px-3 py-1.5 font-bold shrink-0 shadow-sm">
            {shiftInfo.name}
          </Badge>
          <div className="flex items-center gap-2 text-gray-500">
            <Users className="w-4 h-4" />
            <span className="text-gray-700 font-semibold text-xs sm:text-sm">
              Thủ thư: <span className="text-primary font-bold">{shiftInfo.librarian}</span>
            </span>
          </div>
          {stats && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-full px-3 py-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Đang hoạt động
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs px-4 py-1.5 self-end sm:self-auto border border-gray-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all"
          onClick={() => setShowEndShiftModal(true)}
        >
          Kết thúc ca
        </Button>
      </div>

      {/* Khu vực 2 — 6 Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => (
          <div
            key={i}
            className={cn(
              'rounded-2xl p-4 ring-1 shadow-sm flex flex-col items-center justify-center text-center',
              'transition-all duration-200 hover:scale-[1.03] hover:shadow-md',
              s.color,
            )}
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', s.iconBg)}>
              {s.icon}
            </div>
            <p className="text-[11px] sm:text-xs font-bold opacity-80 mb-0.5 uppercase tracking-wider">
              {s.label}
            </p>
            <p className="text-xl sm:text-2xl font-black mb-0.5">{s.value}</p>
            <p className="text-[10px] sm:text-xs opacity-70 font-medium">{s.subtext}</p>
          </div>
        ))}
      </div>

      {/* Khu vực 3 — Thao tác nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/librarian/borrows/new" className="block group">
          <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-3xl p-6 shadow-glow group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-200 cursor-pointer flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold">CHO MƯỢN SÁCH</h3>
              <p className="text-primary-100 text-xs sm:text-sm opacity-90 leading-relaxed">
                Quét thẻ độc giả để tạo phiếu mượn mới
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
        <Link href="/librarian/borrows/return" className="block group">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-3xl p-6 shadow-lg group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-200 cursor-pointer flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <RotateCcw className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold">NHẬN TRẢ SÁCH</h3>
              <p className="text-emerald-100 text-xs sm:text-sm opacity-90 leading-relaxed">
                Quét mã sách để tiến hành nhận trả và xử lý
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </div>

      {/* Khu vực 4 — 3 danh sách chi tiết */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yêu cầu mượn mới */}
        <Card padding="none" className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Yêu cầu mượn mới
              {stats && stats.pendingRequests.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {stats.pendingRequests.length}
                </span>
              )}
            </h3>
            <Link href="/librarian/borrows/requests">
              <Button variant="ghost" size="sm" className="text-primary text-xs px-2 hover:bg-amber-50">
                Xem tất cả
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-gray-50 bg-white min-h-[200px] max-h-[320px] overflow-y-auto">
            {!stats || stats.pendingRequests.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-amber-300" />
                </div>
                <p className="text-gray-400 text-sm font-medium">Không có yêu cầu mới</p>
                <p className="text-gray-300 text-xs mt-1">Các yêu cầu mượn sách sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              stats.pendingRequests.map(r => (
                <div key={r.id} className="p-3 sm:p-4 flex items-center justify-between hover:bg-amber-50/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{r.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {r.user}
                        <span className="mx-1.5 text-gray-300">•</span>
                        <span className="text-amber-600 font-semibold">
                          {new Date(r.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Link href="/librarian/borrows/requests" className="shrink-0 ml-2">
                    <Button variant="ghost" size="sm" className="rounded-full text-xs px-3 text-amber-700 hover:bg-amber-100">
                      Xử lý
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Sách quá hạn cần xử lý */}
        <Card padding="none" className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Sách quá hạn
              {stats && stats.overdueBooks.length > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {stats.overdueBooks.length}
                </span>
              )}
            </h3>
            <Button variant="ghost" size="sm" className="text-primary text-xs px-2 hover:bg-red-50">
              Gửi nhắc nhở
            </Button>
          </div>
          <div className="divide-y divide-gray-50 bg-white min-h-[200px] max-h-[320px] overflow-y-auto">
            {!stats || stats.overdueBooks.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-red-50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-red-300" />
                </div>
                <p className="text-gray-400 text-sm font-medium">Không có sách quá hạn</p>
                <p className="text-gray-300 text-xs mt-1">Tất cả sách đều được trả đúng hạn</p>
              </div>
            ) : (
              stats.overdueBooks.map(b => (
                <div key={b.id} className="p-3 sm:p-4 flex items-center justify-between hover:bg-red-50/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{b.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {b.user}
                        <span className="mx-1.5 text-gray-300">•</span>
                        <span className="text-red-600 font-bold">Trễ {b.days} ngày</span>
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full text-xs px-3 text-red-600 hover:bg-red-100 shrink-0 ml-2">
                    Nhắc nhở
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Thanh toán online hôm nay */}
        <Card padding="none" className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              Thanh toán online hôm nay
              {stats && stats.recentOnlinePayments.length > 0 && (
                <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {stats.recentOnlinePayments.length}
                </span>
              )}
            </h3>
          </div>
          <div className="divide-y divide-gray-50 bg-white min-h-[200px] max-h-[320px] overflow-y-auto">
            {!stats || stats.recentOnlinePayments.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-sky-50 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-sky-300" />
                </div>
                <p className="text-gray-400 text-sm font-medium">Chưa có thanh toán online hôm nay</p>
                <p className="text-gray-300 text-xs mt-1">Khi độc giả thanh toán qua VNPay, giao dịch sẽ xuất hiện tại đây</p>
              </div>
            ) : (
              stats.recentOnlinePayments.map(p => (
                <div key={p.id} className="p-3 sm:p-4 flex items-center justify-between hover:bg-sky-50/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{p.readerName}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {p.bookTitle}
                        <span className="mx-1.5 text-gray-300">•</span>
                        <span className="text-emerald-600 font-semibold">{formatCurrency(p.amount)}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                    {new Date(p.paidAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Modal Kết thúc ca */}
      <Modal open={showEndShiftModal} onClose={() => setShowEndShiftModal(false)} title="Xác nhận kết thúc ca">
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user?.fullName || user?.username}</p>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <p className="text-gray-600 text-sm">Bạn sắp kết thúc ca làm việc. Dưới đây là tổng kết hoạt động trong ca:</p>

          <div className="bg-gray-50 p-5 rounded-2xl space-y-3 text-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-gray-400" /> Số phiếu mượn:
              </span>
              <span className="font-bold text-gray-800">{stats?.borrowsToday ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-gray-400" /> Số phiếu trả:
              </span>
              <span className="font-bold text-gray-800">{stats?.returnsToday ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-gray-400" /> Số quá hạn chưa xử lý:
              </span>
              <span className="font-bold text-red-600">{stats?.overdueCount ?? 0}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-gray-500 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" /> Tiền phạt thu được:
              </span>
              <span className="font-black text-amber-600 text-lg">
                {formatCurrency(stats?.finesCollectedToday ?? 0)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-medium">
              Lưu ý: Hệ thống sẽ in biên bản tổng kết ca làm việc và đăng xuất tài khoản. Các phiếu mượn/trả chưa xử lý sẽ được bàn giao cho ca sau.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="px-5"
              onClick={() => setShowEndShiftModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="px-5"
              onClick={handleEndShift}
            >
              In & Kết thúc
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
