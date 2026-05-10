'use client'
import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Modal } from '@/components/ui'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { cn } from '@/lib/utils'

type Tab = 'rules' | 'email' | 'tasks'

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('rules')
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Cập nhật trạng thái quá hạn', schedule: '00:00 hàng ngày', enabled: true },
    { id: 2, name: 'Gửi nhắc sắp đến hạn (3 ngày)', schedule: '08:00 hàng ngày', enabled: true },
    { id: 3, name: 'Gửi cảnh báo quá hạn', schedule: '09:00 hàng ngày', enabled: true },
    { id: 4, name: 'Hết hạn đặt trước', schedule: '01:00 hàng ngày', enabled: true },
    { id: 5, name: 'Backup dữ liệu', schedule: '02:00 hàng ngày', enabled: true },
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Cấu hình hệ thống" 
          description="Thiết lập các quy định nghiệp vụ và thông số kỹ thuật."
        />
        <Button variant="primary" className="px-8 shadow-glow shadow-indigo-500/30">
           Lưu thay đổi
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'rules', label: 'Quy định mượn trả' },
          { id: 'email', label: 'Cấu hình Email' },
          { id: 'tasks', label: 'Tác vụ tự động' },
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

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <Card padding="lg">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 mb-6">QUY ĐỊNH MƯỢN SÁCH</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-600">Số sách tối đa / lần mượn</label>
                        <div className="w-24">
                           <Input type="number" defaultValue={3} className="text-center" />
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-600">Số ngày mượn tối đa</label>
                        <div className="w-24">
                           <Input type="number" defaultValue={14} className="text-center" />
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-600">Số lần gia hạn tối đa</label>
                        <div className="w-24">
                           <Input type="number" defaultValue={1} className="text-center" />
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-600">Số ngày gia hạn thêm</label>
                        <div className="w-24">
                           <Input type="number" defaultValue={14} className="text-center" />
                        </div>
                     </div>
                  </div>
               </div>
            </Card>

            <Card padding="lg">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 mb-6">QUY ĐỊNH PHÍ PHẠT</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                     <label className="text-sm font-medium text-slate-600">Phí phạt ngày 1 – 5</label>
                     <div className="w-32 flex items-center gap-2">
                        <Input type="number" defaultValue={1000} className="text-right" />
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">đ / ngày</span>
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <label className="text-sm font-medium text-slate-600">Phí phạt từ ngày 6 trở đi</label>
                     <div className="w-32 flex items-center gap-2">
                        <Input type="number" defaultValue={3000} className="text-right" />
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">đ / ngày</span>
                     </div>
                  </div>
               </div>
            </Card>

            <Card padding="lg">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 mb-6">QUY ĐỊNH THẺ ĐỘC GIẢ</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-600">Lệ phí làm thẻ mới</label>
                      <div className="w-32 flex items-center gap-2">
                         <Input type="number" defaultValue={5000} className="text-right" />
                         <span className="text-[10px] font-bold text-slate-400">đ</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-600">Thời hạn mặc định</label>
                      <div className="w-32">
                         <Select defaultValue="1y">
                            <option value="6m">6 tháng</option>
                            <option value="1y">1 năm</option>
                            <option value="2y">2 năm</option>
                         </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-600 text-left">Tự động hủy thẻ hết hạn sau</label>
                      <div className="w-24 flex items-center gap-2">
                         <Input type="number" defaultValue={3} className="text-center" />
                         <span className="text-[10px] font-bold text-slate-400">tháng</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-600">Tự động khóa thẻ khi quá hạn</label>
                      <div className="w-24 flex items-center gap-2">
                         <Input type="number" defaultValue={30} className="text-center" />
                         <span className="text-[10px] font-bold text-slate-400">ngày</span>
                      </div>
                    </div>
                  </div>
               </div>
            </Card>
          </div>
        )}

        {activeTab === 'email' && (
          <Card padding="lg" className="space-y-6">
             <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">CẤU HÌNH SMTP EMAIL</h3>
                <div className="flex gap-2">
                   <Button variant="ghost" className="text-xs font-bold text-indigo-600">Kiểm tra kết nối (Test)</Button>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                   <Input label="SMTP Host" defaultValue="smtp.gmail.com" />
                </div>
                <Input label="SMTP Port" defaultValue="587" />
                <Select label="SSL/TLS" defaultValue="tls">
                   <option value="tls">STARTTLS</option>
                   <option value="ssl">SSL/TLS</option>
                </Select>
                <Input label="Username" defaultValue="library@gmail.com" />
                <Input label="Password" type="password" defaultValue="••••••••••••" />
                <Input label="Tên hiển thị" defaultValue="Thư Viện Bookly" />
                <Input label="Email gửi đi" defaultValue="no-reply@library.vn" />
             </div>
             <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg">✉️</div>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Cấu hình này được dùng để gửi thông báo quá hạn, đặt trước, gia hạn thẻ và cấp lại mật khẩu cho nhân viên/độc giả. Đảm bảo thông tin SMTP là chính xác để không bị gián đoạn dịch vụ.
                </p>
             </div>
          </Card>
        )}

        {activeTab === 'tasks' && (
          <Card padding="none" className="overflow-hidden border-none shadow-card">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">LỊCH TÁC VỤ TỰ ĐỘNG</h3>
               <Badge className="bg-emerald-50 text-emerald-700">Tất cả đang hoạt động tốt</Badge>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Tác vụ</th>
                  <th className="px-6 py-4">Lịch chạy</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {tasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-800">{task.name}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium italic">{task.schedule}</td>
                    <td className="px-6 py-4 text-center">
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={task.enabled}
                            onChange={() => {
                               setTasks(tasks.map(t => t.id === task.id ? { ...t, enabled: !t.enabled } : t))
                            }}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                       </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all">
                          ▶ Chạy ngay
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
               Nhật ký tác vụ gần nhất: 11/05/2026 09:00:15 — Thành công
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
