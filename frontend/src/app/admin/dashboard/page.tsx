'use client'
import { Card, Badge } from '@/components/ui'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'

// Mock Data
const KPI_CARDS = [
  { label: 'Tổng độc giả', value: '1.240', trend: '+12 tháng này', icon: '👥', color: 'indigo', href: '/admin/reports/violations' },
  { label: 'Sách đang mượn', value: '347', trend: '38 quá hạn', icon: '📚', color: 'amber', href: '/admin/reports/books' },
  { label: 'Phí phạt nợ', value: '2.450.000đ', trend: '89 khoản chưa thu', icon: '💰', color: 'emerald', href: '/admin/reports/fines' },
  { label: 'Đầu sách', value: '4.820', trend: '+8 tháng này', icon: '📖', color: 'sky', href: '/admin/reports/books' },
]

const TOP_BOOKS = [
  { rank: 1, title: 'Đắc Nhân Tâm', count: 142 },
  { rank: 2, title: 'Atomic Habits', count: 118 },
  { rank: 3, title: 'Nhà Giả Kim', count: 96 },
]

const RECENT_ACTIVITIES = [
  { id: 1, type: 'create', user: 'Thủ thư Lan', content: 'tạo phiếu mượn #PM-0512', time: '14:32', color: 'emerald' },
  { id: 2, type: 'alert', user: 'Trần Văn Minh', content: 'quá hạn 6 ngày', time: '00:00', color: 'red' },
  { id: 3, type: 'reserve', user: 'Lê Thị Hoa', content: 'đặt trước Nhà Giả Kim', time: '13:15', color: 'amber' },
  { id: 4, type: 'fine', user: 'Thu phí phạt', content: '8.000đ — Biên lai #R001', time: '11:40', color: 'emerald' },
]

const SYSTEM_ALERTS = [
  { label: '38 sách đang quá hạn', type: 'critical', action: 'Xem' },
  { label: '15 thẻ sắp hết hạn (30 ngày)', type: 'warning', action: 'Xem' },
  { label: 'Backup cuối: 2 ngày trước', type: 'warning', action: 'Backup' },
  { label: 'Server: CPU 23% / RAM 41%', type: 'healthy', action: 'Chi tiết' },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Xin chào, Admin!" 
        description="Thứ Hai, 11/05/2026 — Chúc bạn một ngày làm việc hiệu quả."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi, idx) => (
          <Card key={idx} padding="lg" className="relative overflow-hidden group hover:shadow-glow transition-all">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-${kpi.color}-500/10 rounded-full blur-2xl group-hover:bg-${kpi.color}-500/20 transition-colors`} />
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-${kpi.color}-50 flex items-center justify-center text-2xl shadow-inner`}>
                {kpi.icon}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-2xl font-black text-slate-800 mt-0.5">{kpi.value}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className={`text-xs font-bold ${kpi.trend.includes('quá hạn') || kpi.trend.includes('chưa thu') ? 'text-red-500' : 'text-emerald-500'}`}>
                {kpi.trend}
              </span>
              <Link href={kpi.href} className="text-xs font-bold text-indigo-600 hover:underline">
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Lượt mượn sách 30 ngày qua</h3>
            <div className="flex gap-2">
              <select className="text-xs font-bold bg-slate-50 border-none rounded-lg px-3 py-1.5 outline-none ring-1 ring-slate-200">
                <option>Tuần này</option>
                <option>Tháng này</option>
                <option>Năm nay</option>
              </select>
              <button className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-700">
                Xuất Excel
              </button>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 px-4">
             {[40, 25, 35, 20, 45, 30, 50, 40, 35, 45, 25, 30, 40, 45, 50, 40, 30, 25, 35, 40].map((h, i) => (
               <div key={i} className="flex-1 group relative">
                  <div 
                    className="w-full bg-indigo-500/20 rounded-t-sm group-hover:bg-indigo-500 transition-all duration-500 cursor-pointer" 
                    style={{ height: `${h}%` }}
                  >
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {h} lượt
                     </div>
                  </div>
               </div>
             ))}
          </div>
          <div className="mt-4 flex justify-between px-4 text-[10px] font-bold text-slate-400 border-t border-slate-100 pt-3">
             <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
             <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
          </div>
        </Card>

        {/* Pie Chart - Categories */}
        <Card padding="lg">
          <h3 className="font-bold text-slate-800 mb-6">Phân bổ theo thể loại</h3>
          <div className="relative aspect-square max-w-[200px] mx-auto mb-6">
             <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#E2E8F0" strokeWidth="4" />
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#6366F1" strokeWidth="4" strokeDasharray="32 100" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#F59E0B" strokeWidth="4" strokeDasharray="28 100" strokeDashoffset="-32" />
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#10B981" strokeWidth="4" strokeDasharray="18 100" strokeDashoffset="-60" />
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#0EA5E9" strokeWidth="4" strokeDasharray="14 100" strokeDashoffset="-78" />
                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#94A3B8" strokeWidth="4" strokeDasharray="8 100" strokeDashoffset="-92" />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 leading-none">4.8k</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng đầu sách</span>
             </div>
          </div>
          <div className="space-y-2">
             {[
               { label: 'Tiểu thuyết', p: '32%', color: 'bg-indigo-500' },
               { label: 'Kỹ năng', p: '28%', color: 'bg-amber-500' },
               { label: 'Lịch sử', p: '18%', color: 'bg-emerald-500' },
               { label: 'Công nghệ', p: '14%', color: 'bg-sky-500' },
               { label: 'Khác', p: '8%', color: 'bg-slate-400' },
             ].map((cat, idx) => (
               <div key={idx} className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                   <span className="text-slate-600 font-medium">{cat.label}</span>
                 </div>
                 <span className="font-bold text-slate-800">{cat.p}</span>
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
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              {TOP_BOOKS.map((b, i) => (
                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-bold text-indigo-600">#{b.rank}</td>
                  <td className="py-3 font-medium text-slate-700">{b.title}</td>
                  <td className="py-3 text-right font-black text-slate-800">{b.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link href="/admin/reports/books" className="block w-full text-center mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 py-2 rounded-lg transition-all">
            Xem báo cáo đầy đủ →
          </Link>
        </Card>

        {/* Recent Activities */}
        <Card padding="lg">
          <h3 className="font-bold text-slate-800 mb-4">Hoạt động gần đây</h3>
          <div className="space-y-4">
            {RECENT_ACTIVITIES.map(act => (
              <div key={act.id} className="flex gap-3">
                <div className={`w-2 h-2 rounded-full bg-${act.color}-500 mt-1.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 leading-tight">
                    <span className="font-bold text-slate-900">{act.user}</span> {act.content}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{act.time}</span>
              </div>
            ))}
          </div>
          <Link href="/admin/audit-logs" className="block w-full text-center mt-6 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 py-2 rounded-lg transition-all">
            Xem nhật ký đầy đủ
          </Link>
        </Card>

        {/* System Alerts */}
        <Card padding="lg" className="bg-slate-900 border-none">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-amber-400 animate-pulse">⚠️</span> Cần xử lý
          </h3>
          <div className="space-y-3">
            {SYSTEM_ALERTS.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    alert.type === 'critical' ? 'bg-red-500' : 
                    alert.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <span className="text-xs font-medium text-slate-300">{alert.label}</span>
                </div>
                <Link href="/admin/audit-logs" className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                  alert.action === 'Backup' || alert.action === 'Chi tiết' ? 'bg-indigo-500 text-white' : 'text-indigo-400 hover:bg-indigo-500/20'
                }`}>
                  [{alert.action}]
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
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
