'use client'
import { Card, Badge } from '@/components/ui'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import { adminApi, AdminDashboardStats } from '@/lib/api'
import { Users, BookOpen, Book, DollarSign, AlertTriangle } from 'lucide-react'

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi, idx) => (
          <Card key={idx} padding="lg" className="relative overflow-hidden group hover:shadow-glow transition-all">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-2xl transition-colors ${
              kpi.color === 'amber' ? 'bg-amber-500/10 group-hover:bg-amber-500/20' :
              kpi.color === 'emerald' ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' :
              kpi.color === 'emerald' ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' :
              'bg-sky-500/10 group-hover:bg-sky-500/20'
            }`} />
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                kpi.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                kpi.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                kpi.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                'bg-sky-50 text-sky-600'
              }`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-2xl font-black text-slate-800 mt-0.5">{kpi.value}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className={`text-xs font-bold ${kpi.trend.includes('quá hạn') || kpi.trend.includes('chưa thu') || kpi.trend === 'Chờ xử lý' ? 'text-red-500' : 'text-emerald-500'}`}>
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
          <div className="flex items-left justify-between mb-6">
            <h3 className="font-bold text-slate-800">Lượt mượn sách 30 ngày qua</h3>
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  if (stats?.borrowStats && stats.borrowStats.length > 0) {
                    const { exportToExcel } = await import('@/lib/export')
                    const data = stats.borrowStats.map(s => ({ 'Ngay': new Date(s.date).toLocaleDateString('vi-VN'), 'Luot muon': s.count }))
                    exportToExcel(data, 'Luot_Muon_Sach_30_Ngay', 'ThongKe')
                  }
                }}
                className="text-xs font-bold text-white bg-amber-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-amber-700"
              >
                Xuất Excel
              </button>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-1 px-4">
             {stats.borrowStats.length === 0 ? (
                <div className="w-full text-center text-slate-400 text-sm mb-10">Chưa có dữ liệu mượn sách 30 ngày qua</div>
             ) : stats.borrowStats.map((b, i) => {
               const maxCount = Math.max(...stats.borrowStats.map(s => s.count), 1);
               const h = Math.max(Math.round((b.count / maxCount) * 100), 2);
               return (
               <div key={i} className="flex-1 group relative">
                  <div 
                    className="w-full bg-amber-500/20 rounded-t-sm group-hover:bg-amber-500 transition-all duration-500 cursor-pointer" 
                    style={{ height: `${h}%` }}
                  >
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {b.count} lượt
                     </div>
                  </div>
               </div>
             )})}
          </div>
          <div className="mt-4 flex justify-between px-4 text-[10px] font-bold text-slate-400 border-t border-slate-100 pt-3 overflow-x-auto whitespace-nowrap gap-4 scrollbar-hide">
             {stats.borrowStats.map((b, i) => {
                const date = new Date(b.date);
                return <span key={i}>{date.getDate()}/{date.getMonth() + 1}</span>;
             })}
          </div>
        </Card>

        {/* Pie Chart - Categories */}
        <Card padding="lg">
          <h3 className="font-bold text-slate-800 mb-6">Phân bổ theo thể loại</h3>
          <div className="relative aspect-square max-w-[200px] mx-auto mb-6">
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

      {/* Tables Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Books */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Top sách mượn nhiều nhất</h3>
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <table className="w-full">
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
          <Link href="/admin/reports/books" className="block w-full text-center mt-4 text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 py-2 rounded-lg transition-all">
            Xem báo cáo đầy đủ →
          </Link>
        </Card>

        {/* Recent Activities */}
        <Card padding="lg">
          <h3 className="font-bold text-slate-800 mb-4">Hoạt động gần đây</h3>
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
        <Card padding="lg" className="bg-slate-900 border-none">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" /> Cần xử lý
          </h3>
          <div className="space-y-3">
            {stats.systemAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    alert.type === 'critical' ? 'bg-red-500' : 
                    alert.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <span className="text-xs font-medium text-slate-300">{alert.label}</span>
                </div>
                <Link href="/admin/audit-logs" className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                  alert.action === 'Backup' || alert.action === 'Chi tiết' ? 'bg-amber-500 text-white' : 'text-amber-400 hover:bg-amber-500/20'
                }`}>
                  [{alert.action}]
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white">
             <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Sức khỏe hệ thống</p>
             <div className="flex items-center gap-4 mt-2">
                <div className="text-2xl font-black italic">Excellent</div>
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-400 w-[94%]" />
                </div>
                <span className="text-xs font-bold">94%</span>
             </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
