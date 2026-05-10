'use client'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Modal } from '@/components/ui'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useState } from 'react'

// Mock Data
const MOCK_LOGS = [
  { id: 1, time: '11/05/2026 14:32:05', user: 'Thủ thư Lan', action: 'INSERT', table: 'borrow_records', content: 'Tạo phiếu mượn #PM-0512', ip: '192.168.1.42', color: 'emerald' },
  { id: 2, time: '11/05/2026 13:15:22', user: 'Reader Minh', action: 'INSERT', table: 'reservations', content: 'Đặt trước sách Nhà Giả Kim', ip: '10.0.0.5', color: 'indigo' },
  { id: 3, time: '11/05/2026 11:40:10', user: 'Thủ thư Lan', action: 'UPDATE', table: 'fines', content: 'Cập nhật status: paid cho Fine #F-99', ip: '192.168.1.42', color: 'amber' },
  { id: 4, time: '10/05/2026 16:00:45', user: 'Admin', action: 'UPDATE', table: 'system_config', content: 'Thay đổi max_borrow_days: 14 -> 21', ip: '127.0.0.1', color: 'blue' },
  { id: 5, time: '10/05/2026 09:20:12', user: 'Admin', action: 'UPDATE', table: 'users', content: 'Khóa tài khoản: user_id=402 (is_active: false)', ip: '127.0.0.1', color: 'red' },
]

export default function AuditLogsPage() {
  const [selectedLog, setSelectedLog] = useState<any>(null)

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Nhật ký hoạt động" 
        description="Theo dõi và kiểm toán mọi thay đổi dữ liệu trong hệ thống."
      />

      {/* Filters Toolbar */}
      <Card padding="md" className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur sticky top-2 z-10">
        <div className="flex-1 min-w-[200px]">
           <Input placeholder="Tìm kiếm nội dung, IP..." />
        </div>
        <div className="flex items-center gap-2">
           <input type="date" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none" defaultValue="2026-05-10" />
           <span className="text-slate-300">→</span>
           <input type="date" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none" defaultValue="2026-05-11" />
        </div>
        <div className="w-32">
           <Select placeholder="Người dùng">
              <option>Admin</option>
              <option>Thủ thư Lan</option>
           </Select>
        </div>
        <div className="w-32">
           <Select placeholder="Thao tác">
              <option>INSERT</option>
              <option>UPDATE</option>
              <option>DELETE</option>
           </Select>
        </div>
        <div className="w-32">
           <Select placeholder="Bảng dữ liệu">
              <option>users</option>
              <option>books</option>
              <option>borrows</option>
           </Select>
        </div>
        <Button variant="primary" size="sm" className="px-6 font-bold">Tìm kiếm</Button>
      </Card>

      {/* Logs Table */}
      <Card padding="none" className="overflow-hidden border-none shadow-card">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Thời điểm</th>
              <th className="px-6 py-4">Người thực hiện</th>
              <th className="px-6 py-4">Thao tác</th>
              <th className="px-6 py-4">Bảng</th>
              <th className="px-6 py-4">Nội dung thay đổi</th>
              <th className="px-6 py-4">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {MOCK_LOGS.map(log => (
              <tr 
                key={log.id} 
                onClick={() => setSelectedLog(log)}
                className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">{log.time}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{log.user}</td>
                <td className="px-6 py-4">
                  <Badge className={`font-mono text-[10px] bg-${log.color}-50 text-${log.color}-700 border-${log.color}-100`}>
                    {log.action}
                  </Badge>
                </td>
                <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{log.table}</td>
                <td className="px-6 py-4 font-medium text-slate-700 max-w-md truncate">{log.content}</td>
                <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-center">
           <div className="flex gap-2">
              <button className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-all">Tải thêm kết quả</button>
           </div>
        </div>
      </Card>

      {/* Log Detail Modal */}
      <Modal open={!!selectedLog} onClose={() => setSelectedLog(null)} title="Chi tiết nhật ký hệ thống" size="md">
         <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{selectedLog?.time}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Người thực hiện</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{selectedLog?.user} ({selectedLog?.ip})</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</p>
                  <div className="mt-1 flex items-center gap-2">
                     <Badge className={`bg-${selectedLog?.color}-50 text-${selectedLog?.color}-700 border-${selectedLog?.color}-100`}>{selectedLog?.action}</Badge>
                     <span className="text-xs font-mono text-slate-500">{selectedLog?.table}</span>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{selectedLog?.content}</p>
               </div>
            </div>

            <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Thay đổi dữ liệu (JSON Diff)</h3>
                  <button className="text-[10px] font-bold text-indigo-600 hover:underline">Sao chép JSON</button>
               </div>
               <div className="rounded-2xl bg-slate-900 p-6 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
                  <pre className="text-emerald-400">
{`{
  "table": "${selectedLog?.table}",
  "operation": "${selectedLog?.action}",
  "timestamp": "${selectedLog?.time}",
  "changes": {`}
                  </pre>
                  <pre className="text-red-400 ml-4">
{`    "old_values": {
      "status": "active",
      "updated_at": "2026-05-09T10:00:00Z"
    },`}
                  </pre>
                  <pre className="text-emerald-400 ml-4">
{`    "new_values": {
      "status": "locked",
      "reason": "Vi phạm quy định nhân sự",
      "updated_at": "2026-05-10T09:20:12Z"
    }`}
                  </pre>
                  <pre className="text-emerald-400">
{`  },
  "context": {
    "user_id": 1,
    "ip_address": "${selectedLog?.ip}",
    "user_agent": "Mozilla/5.0..."
  }
}`}
                  </pre>
               </div>
            </div>

            <div className="flex justify-end pt-2">
               <Button variant="primary" fullWidth onClick={() => setSelectedLog(null)}>Đóng chi tiết</Button>
            </div>
         </div>
      </Modal>
    </div>
  )
}
