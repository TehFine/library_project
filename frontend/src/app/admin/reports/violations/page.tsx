'use client'
import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Modal } from '@/components/ui'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// Mock Data
const OVERDUE_READERS = [
  { id: 1, name: 'Trần Văn Minh', cardId: 'TV-2024-001', book: 'Nhà Giả Kim', days: 6, status: 'critical' },
  { id: 2, name: 'Lê Thị Hoa', cardId: 'TV-2024-002', book: 'Dune', days: 2, status: 'warning' },
  { id: 3, name: 'Nguyễn Văn A', cardId: 'TV-2024-003', book: 'Clean Code', days: 12, status: 'critical' },
]

const EXPIRING_CARDS = [
  { id: 1, name: 'Nguyễn Văn An', cardId: 'TV-2024-005', expiry: '01/06/2026', status: 'warning' },
  { id: 2, name: 'Phạm Thị Bích', cardId: 'TV-2024-010', expiry: '15/06/2026', status: 'warning' },
]

type Tab = 'overdue' | 'frequent' | 'unpaid' | 'expiring'

export default function ViolationsReportPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overdue')
  const [showRemindModal, setShowRemindModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Báo cáo vi phạm" 
          description="Quản lý độc giả quá hạn, nợ phí và thẻ sắp hết hạn."
        />
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="font-bold" onClick={() => setShowRemindModal(true)}>
             📢 Gửi nhắc nhở tất cả
          </Button>
          <Button variant="ghost" size="sm" className="font-bold bg-white/50 border border-slate-200">
             📥 Xuất danh sách
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'overdue', label: 'Đang quá hạn (38)', color: 'text-red-600' },
          { id: 'frequent', label: 'Quá hạn nhiều lần' },
          { id: 'unpaid', label: 'Còn nợ phí' },
          { id: 'expiring', label: 'Thẻ sắp hết hạn (15)', color: 'text-amber-600' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2',
              activeTab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table Content */}
      <Card padding="none" className="overflow-hidden border-none shadow-card">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Độc giả</th>
              <th className="px-6 py-4">Mã thẻ</th>
              {activeTab === 'expiring' ? (
                <th className="px-6 py-4">Ngày hết hạn</th>
              ) : (
                <>
                  <th className="px-6 py-4">Sách / Khoản nợ</th>
                  <th className="px-6 py-4 text-center">Tình trạng</th>
                </>
              )}
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {(activeTab === 'overdue' ? OVERDUE_READERS : EXPIRING_CARDS).map((row: any) => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                        row.status === 'critical' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {row.name.split(' ').pop()?.[0]}
                      </div>
                      <span className="font-bold text-slate-800">{row.name}</span>
                   </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.cardId}</td>
                {activeTab === 'expiring' ? (
                  <td className="px-6 py-4 font-bold text-slate-700">{row.expiry}</td>
                ) : (
                  <>
                    <td className="px-6 py-4 text-slate-600">{row.book}</td>
                    <td className="px-6 py-4 text-center">
                       <Badge className={cn(
                         row.days > 5 ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
                       )}>
                         Quá hạn {row.days} ngày
                       </Badge>
                    </td>
                  </>
                )}
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-2">
                      <button className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                        {activeTab === 'expiring' ? 'Gửi nhắc gia hạn' : 'Gửi nhắc nhở'}
                      </button>
                      <button className="text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
                        Xem lịch sử
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Hiển thị {activeTab === 'overdue' ? '3/38' : '2/15'} bản ghi</p>
           <div className="flex gap-1">
              <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center cursor-not-allowed">‹</button>
              <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">1</button>
              <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50">2</button>
              <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50">›</button>
           </div>
        </div>
      </Card>

      {/* Remind Modal */}
      <Modal open={showRemindModal} onClose={() => setShowRemindModal(false)} title="Gửi nhắc nhở hàng loạt" size="sm">
         <div className="space-y-4 text-center py-2">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-2 animate-bounce">📢</div>
            <h3 className="text-sm font-bold text-slate-800">Gửi nhắc nhở cho {activeTab === 'overdue' ? '38 độc giả quá hạn' : '15 thẻ sắp hết hạn'}?</h3>
            <p className="text-xs text-slate-500 leading-relaxed px-4">
              Hệ thống sẽ tự động gửi email thông báo dựa trên mẫu có sẵn cho toàn bộ độc giả trong danh sách đang chọn.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left space-y-2">
               <div className="flex items-center gap-2">
                  <input type="checkbox" checked readOnly className="rounded border-indigo-300 text-indigo-600" />
                  <span className="text-[10px] font-bold text-slate-600">Gửi qua Email (Khuyên dùng)</span>
               </div>
               <div className="flex items-center gap-2 opacity-50">
                  <input type="checkbox" disabled className="rounded border-slate-300" />
                  <span className="text-[10px] font-bold text-slate-600">Gửi qua SMS (Chưa cấu hình)</span>
               </div>
            </div>
            <div className="flex flex-col gap-2 pt-4">
               <Button variant="primary" fullWidth onClick={() => setShowRemindModal(false)}>✅ Gửi ngay bây giờ</Button>
               <Button variant="ghost" fullWidth onClick={() => setShowRemindModal(false)}>Hủy</Button>
            </div>
         </div>
      </Modal>
    </div>
  )
}
