'use client'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Modal } from '@/components/ui'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { useState } from 'react'
import { cn } from '@/lib/utils'

// Mock Data
const FINES_SUMMARY = [
  { label: 'Tổng phí phát sinh', value: '3.850.000đ', color: 'indigo' },
  { label: 'Đã thu', value: '1.400.000đ', p: '36%', color: 'emerald' },
  { label: 'Chưa thu', value: '2.250.000đ', p: '58%', color: 'red' },
  { label: 'Được miễn', value: '200.000đ', p: '5%', color: 'slate' },
]

const TRANSACTIONS = [
  { id: 1, date: '09/05/2026', reader: 'Trần Văn Minh', type: 'Trễ hạn 6n', amount: '8.000đ', status: 'pending', label: '⏰ Nợ' },
  { id: 2, date: '07/05/2026', reader: 'Lê Thị Hoa', type: 'Hư hỏng sách', amount: '50.000đ', status: 'paid', label: '✅ Đã thu' },
  { id: 3, date: '05/05/2026', reader: 'Nguyễn Văn C', type: 'Mất sách', amount: '250.000đ', status: 'paid', label: '✅ Đã thu' },
  { id: 4, date: '03/05/2026', reader: 'Phạm Thị D', type: 'Trễ hạn 2n', amount: '2.000đ', status: 'waived', label: '🟡 Miễn' },
]

export default function FinancialReportsPage() {
  const [showWaiveModal, setShowWaiveModal] = useState<any>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Báo cáo tài chính" 
          description="Quản lý các khoản thu phí phạt và tình trạng thanh toán."
        />
        <div className="flex gap-2">
           <Button variant="ghost" className="bg-white/50 border border-slate-200 font-bold text-xs">Xuất PDF</Button>
           <Button variant="secondary" className="font-bold text-xs">Xuất Excel</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {FINES_SUMMARY.map((f, idx) => (
          <Card key={idx} padding="lg" className="border-none shadow-sm relative overflow-hidden group">
            <div className={`absolute bottom-0 left-0 w-full h-1 bg-${f.color}-500/20 group-hover:h-full transition-all duration-500`} />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</p>
              <h3 className={`text-2xl font-black mt-1 text-slate-800`}>{f.value}</h3>
              {f.p && (
                <div className="mt-2 flex items-center gap-2">
                   <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-${f.color}-500`} style={{ width: f.p }} />
                   </div>
                   <span className="text-[10px] font-black text-slate-500">{f.p}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2" padding="lg">
          <div className="flex items-center justify-between mb-8">
             <h3 className="font-bold text-slate-800">Thu phí theo tuần (Tháng 5/2026)</h3>
             <Select className="w-40 border-none bg-slate-50 font-bold">
                <option>Theo tuần</option>
                <option>Theo tháng</option>
             </Select>
          </div>
          <div className="h-64 flex items-end justify-between px-6">
             {[30, 45, 25, 55, 40].map((v, i) => (
               <div key={i} className="w-16 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-emerald-500/10 rounded-t-xl group-hover:bg-emerald-500 transition-all cursor-pointer relative" style={{ height: `${v}%` }}>
                     <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100">{v * 10}k</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Tuần {i + 1}</span>
               </div>
             ))}
          </div>
        </Card>

        {/* Filters */}
        <Card padding="lg" className="flex flex-col gap-4 bg-indigo-900 border-none text-white shadow-glow">
           <h3 className="font-bold text-white mb-2">Bộ lọc báo cáo</h3>
           <div className="space-y-4">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Loại phạt</label>
                 <Select className="bg-white/10 border-white/20 text-white placeholder-white/40">
                    <option className="text-slate-800">Tất cả loại phạt</option>
                    <option className="text-slate-800">Quá hạn</option>
                    <option className="text-slate-800">Hư hỏng/Mất</option>
                 </Select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Trạng thái</label>
                 <Select className="bg-white/10 border-white/20 text-white placeholder-white/40">
                    <option className="text-slate-800">Đang nợ</option>
                    <option className="text-slate-800">Đã thu</option>
                    <option className="text-slate-800">Được miễn</option>
                 </Select>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Từ ngày</label>
                    <input type="date" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs outline-none" defaultValue="2026-05-01" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Đến ngày</label>
                    <input type="date" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs outline-none" defaultValue="2026-05-11" />
                 </div>
              </div>
              <Button variant="primary" fullWidth className="mt-4 shadow-lg shadow-indigo-500/50">Áp dụng bộ lọc</Button>
           </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card padding="none" className="overflow-hidden border-none shadow-card">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Ngày</th>
              <th className="px-6 py-4">Độc giả</th>
              <th className="px-6 py-4">Loại phạt</th>
              <th className="px-6 py-4">Số tiền</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {TRANSACTIONS.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-500 font-medium">{tx.date}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{tx.reader}</td>
                <td className="px-6 py-4 text-slate-600 font-medium">{tx.type}</td>
                <td className="px-6 py-4 font-black text-slate-800">{tx.amount}</td>
                <td className="px-6 py-4">
                  <Badge className={cn(
                    tx.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    tx.status === 'pending' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                  )}>
                    {tx.label}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                     {tx.status === 'paid' ? (
                       <button className="text-xs font-bold text-indigo-600 hover:underline px-3 py-1.5">In biên lai</button>
                     ) : tx.status === 'pending' ? (
                       <button 
                        onClick={() => setShowWaiveModal(tx)}
                        className="text-xs font-bold text-red-600 border border-red-100 hover:bg-red-50 px-3 py-1.5 rounded-lg"
                       >
                         Miễn giảm
                       </button>
                     ) : (
                       <button className="text-xs font-bold text-slate-400 hover:underline px-3 py-1.5">Xem lý do</button>
                     )}
                     <button className="text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg">Chi tiết</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Waive Modal */}
      <Modal open={!!showWaiveModal} onClose={() => setShowWaiveModal(null)} title="Miễn giảm phí phạt" size="sm">
         <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Độc giả:</p>
               <p className="text-sm font-bold text-slate-800 mt-0.5">{showWaiveModal?.reader}</p>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-3">Số tiền miễn giảm:</p>
               <p className="text-xl font-black text-slate-900 mt-0.5">{showWaiveModal?.amount}</p>
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">Lý do miễn giảm:</label>
               <textarea 
                  className="w-full h-24 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Nhập lý do chi tiết..."
               />
            </div>
            <div className="p-3 rounded-lg bg-amber-50 text-[10px] text-amber-800 border border-amber-100">
               ⚠️ Thao tác này sẽ xóa khoản nợ và được lưu vào nhật ký hoạt động hệ thống.
            </div>
            <div className="flex flex-col gap-2 pt-2">
               <Button variant="primary" fullWidth>Xác nhận miễn giảm</Button>
               <Button variant="ghost" fullWidth onClick={() => setShowWaiveModal(null)}>Hủy</Button>
            </div>
         </div>
      </Modal>
    </div>
  )
}
