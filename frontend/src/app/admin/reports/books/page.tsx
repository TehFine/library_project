'use client'
import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Pagination } from '@/components/ui'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { cn } from '@/lib/utils'

// Mock Data
const TOP_BORROWED = [
  { id: 1, title: 'Đắc Nhân Tâm', author: 'Dale Carnegie', category: 'Kỹ năng', total: 142, avg: '12.3n' },
  { id: 2, title: 'Atomic Habits', author: 'James Clear', category: 'Kỹ năng', total: 118, avg: '11.1n' },
  { id: 3, title: 'Sapiens: Lược sử loài người', author: 'Yuval Noah Harari', category: 'Lịch sử', total: 96, avg: '13.5n' },
  { id: 4, title: 'Nhà Giả Kim', author: 'Paulo Coelho', category: 'Tiểu thuyết', total: 88, avg: '10.2n' },
]

const STOCK_STATUS = [
  { id: 1, title: 'Nhà Giả Kim', total: 4, available: 0, borrowed: 4, action: 'Đề xuất mua thêm', critical: true },
  { id: 2, title: 'Đắc Nhân Tâm', total: 5, available: 3, borrowed: 2, action: null, critical: false },
  { id: 3, title: 'Clean Code', total: 4, available: 4, borrowed: 0, action: '⚠️ Ít được mượn', critical: false },
]

const REPLENISHMENT = [
  { id: 1, title: 'Nhà Giả Kim', total: 4, queue: 8, suggestion: 'Mua thêm 4 bản' },
  { id: 2, title: 'Atomic Habits', total: 5, queue: 3, suggestion: 'Mua thêm 2 bản' },
]

const DISPOSAL = [
  { id: 1, title: 'Dune', copyCode: '5678-003', condition: 'Hư nặng', importedAt: '01/2022', action: 'Thanh lý' },
  { id: 2, title: 'Sapiens', copyCode: '3456-002', condition: 'Mất (đã xử lý)', importedAt: '06/2021', action: 'Xóa khỏi hệ thống' },
]

type Tab = 'top' | 'stock' | 'replenish' | 'disposal'

export default function BookReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('top')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Báo cáo & Thống kê sách" 
          description="Theo dõi hiệu suất mượn sách và tình trạng kho sách thực tế."
        />
        <div className="flex gap-2">
          <Button variant="ghost" className="bg-white/50 border border-slate-200 text-xs font-bold">
            📄 Xuất PDF
          </Button>
          <Button variant="secondary" className="text-xs font-bold">
            📊 Xuất Excel
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'top', label: 'Mượn nhiều nhất' },
          { id: 'stock', label: 'Tình trạng kho' },
          { id: 'replenish', label: 'Cần bổ sung' },
          { id: 'disposal', label: 'Cần thanh lý' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
              activeTab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters (only for some tabs) */}
      {(activeTab === 'top' || activeTab === 'stock') && (
        <Card padding="md" className="flex items-center gap-4 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase ml-2">Khoảng thời gian:</span>
            <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium outline-none" defaultValue="2026-05-01" />
            <span className="text-slate-300">→</span>
            <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium outline-none" defaultValue="2026-05-11" />
          </div>
          <div className="w-48">
            <Select placeholder="Thể loại">
              <option value="1">Kỹ năng</option>
              <option value="2">Tiểu thuyết</option>
              <option value="3">Lịch sử</option>
            </Select>
          </div>
          <Button variant="primary" size="sm" className="px-6 font-bold">Áp dụng</Button>
        </Card>
      )}

      {/* Content */}
      {activeTab === 'top' && (
        <Card padding="none" className="overflow-hidden shadow-card border-none">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Tên sách / Tác giả</th>
                <th className="px-6 py-4">Thể loại</th>
                <th className="px-6 py-4 text-center">Lượt mượn</th>
                <th className="px-6 py-4 text-center">TB mượn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {TOP_BORROWED.map((b, i) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5 font-bold text-indigo-600">#{i + 1}</td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-800">{b.title}</p>
                    <p className="text-xs text-slate-400">{b.author}</p>
                  </td>
                  <td className="px-6 py-5">
                    <Badge className="bg-slate-100 text-slate-600 border-slate-200">{b.category}</Badge>
                  </td>
                  <td className="px-6 py-5 text-center font-black text-slate-800">{b.total} lượt</td>
                  <td className="px-6 py-5 text-center text-xs font-bold text-slate-500">{b.avg}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-center">
             <Pagination page={1} totalPages={12} onPageChange={() => {}} />
          </div>
        </Card>
      )}

      {activeTab === 'stock' && (
        <div className="space-y-6">
          <Card padding="lg" className="bg-indigo-600 text-white border-none shadow-glow">
             <h3 className="text-xs font-bold uppercase tracking-widest opacity-60">Tổng quan kho sách</h3>
             <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                   <p className="text-3xl font-black italic">1.240</p>
                   <p className="text-xs font-medium opacity-80 mt-1">Tổng bản sao</p>
                </div>
                <div>
                   <p className="text-3xl font-black italic text-emerald-300">893 <span className="text-sm opacity-60">(72%)</span></p>
                   <p className="text-xs font-medium opacity-80 mt-1">Đang có sẵn</p>
                </div>
                <div>
                   <p className="text-3xl font-black italic text-amber-300">315</p>
                   <p className="text-xs font-medium opacity-80 mt-1">Đang được mượn</p>
                </div>
                <div>
                   <p className="text-3xl font-black italic text-red-300">20</p>
                   <p className="text-xs font-medium opacity-80 mt-1">Sách bị mất</p>
                </div>
             </div>
          </Card>

          <Card padding="none" className="overflow-hidden shadow-card border-none">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Tên sách</th>
                  <th className="px-6 py-4 text-center">Tổng BC</th>
                  <th className="px-6 py-4 text-center">Có sẵn</th>
                  <th className="px-6 py-4 text-center">Đang mượn</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {STOCK_STATUS.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">{s.title}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600">{s.total}</td>
                    <td className="px-6 py-4 text-center font-black">
                      <span className={s.available === 0 ? 'text-red-600' : 'text-emerald-600'}>
                        {s.available} {s.available === 0 ? '❌' : '✅'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">{s.borrowed}</td>
                    <td className="px-6 py-4 text-right">
                       {s.action && (
                         <button className={cn(
                           "text-xs font-bold py-1 px-3 rounded-lg border",
                           s.critical ? "border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100" : "border-slate-100 bg-slate-50 text-slate-500"
                         )}>
                           {s.action}
                         </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {activeTab === 'replenish' && (
        <Card padding="none" className="overflow-hidden shadow-card border-none">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Tên sách</th>
                <th className="px-6 py-4 text-center">Bản sao hiện có</th>
                <th className="px-6 py-4 text-center">Lượt đặt trước</th>
                <th className="px-6 py-4 text-right">Đề xuất mua thêm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {REPLENISHMENT.map(r => (
                <tr key={r.id}>
                  <td className="px-6 py-5 font-bold text-slate-800">{r.title}</td>
                  <td className="px-6 py-5 text-center text-slate-600 font-bold">{r.total}</td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-red-600 font-black">{r.queue} người chờ</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Button variant="primary" size="sm" className="font-bold">
                       {r.suggestion}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'disposal' && (
        <Card padding="none" className="overflow-hidden shadow-card border-none">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Tên sách</th>
                <th className="px-6 py-4">Mã bản sao</th>
                <th className="px-6 py-4">Tình trạng</th>
                <th className="px-6 py-4">Ngày nhập</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {DISPOSAL.map(d => (
                <tr key={d.id}>
                  <td className="px-6 py-5 font-bold text-slate-800">{d.title}</td>
                  <td className="px-6 py-5 font-mono text-xs text-slate-500">{d.copyCode}</td>
                  <td className="px-6 py-5">
                    <Badge className={d.condition.includes('Hư nặng') ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}>
                      {d.condition}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium">{d.importedAt}</td>
                  <td className="px-6 py-5 text-right flex justify-end gap-2">
                    <button className="text-xs font-bold text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50">
                      {d.action}
                    </button>
                    {d.action.includes('Hư nặng') && (
                      <button className="text-xs font-bold text-slate-500 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                        In danh sách PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
