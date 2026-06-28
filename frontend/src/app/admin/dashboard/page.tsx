'use client'
import { Card, Badge } from '@/components/ui'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import { adminApi, AdminDashboardStats } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Users, BookOpen, Book, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminApi.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useRealtimeRefresh('admin:dashboard-update', fetchStats)

  if (loading) {
    return <div className="flex items-center justify-center min-h-[500px]">Đang tải...</div>
  }

  if (!stats) {
    return <div className="text-red-500">Lỗi tải dữ liệu.</div>
  }

  const KPI_CARDS = [
    { label: 'Tổng độc giả', value: stats.totalUsers, trend: 'Tất cả tài khoản', icon: Users, color: 'amber', href: '/admin/users' },
    { label: 'Sách đang mượn', value: stats.borrowedBooks, trend: 'Đang lưu hành', icon: BookOpen, color: 'amber', href: '/admin/reports/books' },
    { label: 'Phí phạt chưa thu', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalFines), trend: 'Chờ xử lý', icon: DollarSign, color: 'emerald', href: '/admin/reports/fines' },
    { label: 'Đầu sách', value: stats.totalBooks, trend: 'Tổng trong kho', icon: Book, color: 'sky', href: '/admin/reports/books' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Xin chào, Admin!" 
        description={`${new Intl.DateTimeFormat('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())} — Chúc bạn một ngày làm việc hiệu quả.`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {KPI_CARDS.map((kpi, idx) => (
          <Card key={idx} padding="lg" className="relative overflow-hidden group hover:shadow-glow transition-all">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-2xl transition-colors ${
              kpi.color === 'amber' ? 'bg-amber-500/10 group-hover:bg-amber-500/20' :
              kpi.color === 'emerald' ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' :
              kpi.color === 'emerald' ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' :
              'bg-sky-500/10 group-hover:bg-sky-500/20'
            }`} />
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                kpi.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                kpi.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                kpi.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                'bg-sky-50 text-sky-600'
              }`}>
                <kpi.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1">                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider max-sm:truncate max-sm:max-w-[80px]">{kpi.label}</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">{kpi.value}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className={`text-[10px] sm:text-xs font-bold ${kpi.trend.includes('quá hạn') || kpi.trend.includes('chưa thu') || kpi.trend === 'Chờ xử lý' ? 'text-red-500' : 'text-emerald-500'}`}>
                {kpi.trend}
              </span>
              <Link href={kpi.href} className="text-xs font-bold text-amber-600 hover:underline">
                Xem chi tiết →
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Borrows */}
        <Card className="lg:col-span-2" padding="lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-6">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Lượt mượn sách 30 ngày qua</h3>
            <div className="flex gap-2 self-end sm:self-auto">
              <button 
                onClick={async () => {
                  if (stats?.borrowStats && stats.borrowStats.length > 0) {
                    const { exportToExcel } = await import('@/lib/export')
                    const data = stats.borrowStats.map(s => ({ 'Ngay': new Date(s.date).toLocaleDateString('vi-VN'), 'Luot muon': s.count }))
                    exportToExcel(data, 'Luot_Muon_Sach_30_Ngay', 'ThongKe')
                  }
                }}
                className="text-[11px] sm:text-xs font-bold text-white bg-amber-600 px-2 sm:px-3 py-1.5 rounded-lg shadow-sm hover:bg-amber-700"
              >
                Xuất Excel
              </button>
            </div>
          </div>

          {/* Wrap bars + date labels in a single scrollable container so they stay in sync */}
          <div className="overflow-x-auto scrollbar-hide -mx-2 sm:-mx-0">
            <div className="min-w-[640px]">
              {/* Bars */}
              <div className="h-64 flex gap-[3px] px-2">
                {stats.borrowStats.every(s => s.count === 0) ? (
                  <div className="w-full text-center text-slate-400 text-sm mb-10 self-center">Chưa có dữ liệu mượn sách trong 30 ngày qua</div>
                ) : stats.borrowStats.map((b, i) => {
                  const maxCount = Math.max(...stats.borrowStats.map(s => s.count), 1);
                  const h = Math.max(Math.round((b.count / maxCount) * 100), 2);
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end group">
                      <div 
                        className="w-full rounded-t-sm cursor-pointer transition-all duration-300 hover:opacity-80 relative"
                        style={{
                          height: `${h}%`,
                          background: `linear-gradient(to top, #f59e0b, #fbbf24)`,
                        }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                          {b.count} lượt
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Date labels — xen kẽ (cách 1 ngày) để tránh rối, nhưng vẫn giữ đúng vị trí cột */}
              <div className="mt-3 flex gap-[3px] px-2 text-[9px] sm:text-[10px] font-bold text-slate-400 border-t border-slate-100 pt-2 sm:pt-3">
                {stats.borrowStats.map((b, i) => {
                  const date = new Date(b.date);
                  const show = i % 2 === 0;
                  return (
                    <div key={i} className="flex-1 text-center leading-tight">
                      {show ? (
                        <span className="block">{date.getDate()}/{date.getMonth() + 1}</span>
                      ) : (
                        <span className="block invisible">-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Pie Chart - Categories */}
        <Card padding="lg">            <h3 className="font-bold text-slate-800 mb-4 sm:mb-6 text-sm sm:text-base">Phân bổ theo thể loại</h3>
          <div className="relative aspect-square max-w-[160px] sm:max-w-[200px] mx-auto mb-4 sm:mb-6">
             <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#E2E8F0" strokeWidth="4" />
                {stats.categoryStats.map((cat, idx) => {
                  return null;
                })}
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#E8941A" strokeWidth="4" strokeDasharray="32 100" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#F59E0B" strokeWidth="4" strokeDasharray="28 100" strokeDashoffset="-32" />
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#10B981" strokeWidth="4" strokeDasharray="18 100" strokeDashoffset="-60" />
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#0EA5E9" strokeWidth="4" strokeDasharray="14 100" strokeDashoffset="-78" />
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#94A3B8" strokeWidth="4" strokeDasharray="8 100" strokeDashoffset="-92" />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 leading-none">{stats.totalBooks}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng đầu sách</span>
             </div>
          </div>
          <div className="space-y-2">
             {stats.categoryStats.map((cat, idx) => (
               <div key={idx} className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                   <span className="text-slate-600 font-medium">{cat.label}</span>
                 </div>
                 <span className="font-bold text-slate-800">{cat.p} ({cat.count})</span>
               </div>
             ))}
          </div>
        </Card>
      </div>

      {/* Thống kê phí đã thu */}
      <Card padding="lg" className="border-emerald-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Doanh thu phí phạt hôm nay
          </h3>
          <Link href="/admin/reports/fines" className="text-xs font-bold text-amber-600 hover:underline">
            Xem chi tiết →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Tổng đã thu</p>
            <p className="text-xl font-black text-gray-900 mt-1">{formatCurrency(stats.fineStats.totalPaidToday)}</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">Bao gồm tiền mặt + online</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Tiền mặt tại quầy</p>
            <p className="text-xl font-black text-gray-900 mt-1">{formatCurrency(stats.fineStats.cashCollectedToday)}</p>
            <p className="text-[10px] text-amber-500 mt-0.5">Các thủ thư thu trực tiếp</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200">
            <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Thanh toán online</p>
            <p className="text-xl font-black text-gray-900 mt-1">{formatCurrency(stats.fineStats.onlineCollectedToday)}</p>
            <p className="text-[10px] text-sky-500 mt-0.5">Qua VNPay</p>
          </div>
        </div>
        {stats.fineStats.perLibrarian.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Chi tiết theo thủ thư</p>
            <div className="space-y-1.5">
              {stats.fineStats.perLibrarian.map(lib => (
                <div key={lib.id} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-xl hover:bg-gray-50">
                  <span className="font-medium text-gray-700">{lib.name}</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(lib.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Tables Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Books */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Top sách mượn nhiều nhất</h3>
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
            <table className="w-full min-w-[400px]">
            <thead className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
              <tr>
                <th className="pb-2 text-left">#</th>
                <th className="pb-2 text-left">Tên sách</th>
                <th className="pb-2 text-right">Lượt mượn</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {stats.topBooks.map((b, i) => (
                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-bold text-amber-600">#{b.rank}</td>
                  <td className="py-3 font-medium text-slate-700">{b.title}</td>
                  <td className="py-3 text-right font-black text-slate-800">{b.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <Link href="/admin/reports/books" className="block w-full text-center mt-4 text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 py-2 rounded-lg transition-all">
            Xem báo cáo đầy đủ →
          </Link>
        </Card>

        {/* Recent Activities */}
        <Card padding="lg">
          <h3 className="font-bold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Hoạt động gần đây</h3>
          <div className="space-y-4">
            {stats.recentActivities.map(act => (
              <div key={act.id} className="flex gap-3">
                <div className={`w-2 h-2 rounded-full bg-${act.color}-500 mt-1.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 leading-tight">
                    <span className="font-bold text-slate-900">{act.user}</span> {act.content}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{new Date(act.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
          <Link href="/admin/audit-logs" className="block w-full text-center mt-6 text-xs font-bold text-slate-500 hover:text-amber-600 hover:bg-amber-50 py-2 rounded-lg transition-all">
            Xem nhật ký đầy đủ
          </Link>
        </Card>

        {/* System Alerts */}
        <Card padding="lg" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 -mr-16 -mt-16 rounded-full bg-gradient-to-br from-amber-500/8 to-amber-300/5 blur-3xl pointer-events-none" />
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm sm:text-base">
            <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </span>
            Cần xử lý
          </h3>
          <div className="space-y-2.5">
            {stats.systemAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/70 border border-amber-100/60 hover:bg-white hover:border-amber-200/80 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    alert.type === 'critical' ? 'bg-red-500 ring-2 ring-red-500/20' : 
                    alert.type === 'warning' ? 'bg-amber-500 ring-2 ring-amber-500/20' : 'bg-emerald-500 ring-2 ring-emerald-500/20'
                  }`} />
                  <span className="text-xs font-medium text-slate-600">{alert.label}</span>
                </div>
                <Link href={alert.href || '/admin/audit-logs'} className="text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-colors shrink-0">
                  [{alert.action}]
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-glow">
             <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Sức khỏe hệ thống</p>
             <div className="flex items-center gap-4 mt-2">
                <div className="text-2xl font-black italic">Excellent</div>
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-400 w-[94%] shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                </div>
                <span className="text-xs font-bold">94%</span>
             </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
