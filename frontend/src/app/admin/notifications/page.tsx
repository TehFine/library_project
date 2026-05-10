'use client'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Modal } from '@/components/ui'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useState } from 'react'

export default function BulkNotificationsPage() {
  const [target, setTarget] = useState('all')
  const [template, setTemplate] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Gửi thông báo hàng loạt" 
        description="Gửi thông báo Email/SMS đến nhóm độc giả được chỉ định."
      />

      <Card padding="lg" className="space-y-8">
        {/* Target Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">1</span>
            Đối tượng nhận tin
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-8">
             {[
               { id: 'all', label: 'Tất cả độc giả', count: '1.240 người' },
               { id: 'overdue', label: 'Độc giả có sách quá hạn', count: '38 người', color: 'text-red-600' },
               { id: 'expiring', label: 'Độc giả có thẻ sắp hết hạn', count: '15 người', color: 'text-amber-600' },
               { id: 'debt', label: 'Độc giả còn nợ phí phạt', count: '42 người', color: 'text-rose-600' },
             ].map(opt => (
               <label key={opt.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                 target === opt.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50'
               }`}>
                 <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="target" 
                      checked={target === opt.id} 
                      onChange={() => setTarget(opt.id)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                 </div>
                 <span className={`text-[10px] font-black tracking-widest uppercase ${opt.color || 'text-slate-400'}`}>{opt.count}</span>
               </label>
             ))}
          </div>
          <div className="px-8">
             <Input label="Tùy chọn — Nhập danh sách email/mã thẻ (phân cách bằng dấu phẩy):" placeholder="reader1@example.com, TV-2024-001..." />
          </div>
        </div>

        {/* Channel & Template */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">2</span>
                Kênh gửi & Mẫu tin
              </h3>
              <div className="px-8 space-y-4">
                 <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                       <input type="checkbox" checked readOnly className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                       <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                       <input type="checkbox" disabled className="rounded border-slate-300" />
                       <span className="text-sm font-medium text-slate-600">SMS</span>
                    </label>
                 </div>
                 <Select 
                   label="Chọn mẫu có sẵn" 
                   value={template} 
                   onChange={(e: any) => setTemplate(e.target.value)}
                 >
                    <option value="">— Thông báo tự soạn —</option>
                    <option value="overdue">Nhắc trả sách quá hạn</option>
                    <option value="expiring">Nhắc gia hạn thẻ</option>
                    <option value="fine">Nhắc thanh toán phí phạt</option>
                 </Select>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">3</span>
                Tiêu đề thông báo
              </h3>
              <div className="px-8">
                 <Input placeholder="Ví dụ: [Bookly] Nhắc nhở trả sách quá hạn" />
              </div>
           </div>
        </div>

        {/* Content Editor */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">4</span>
            Nội dung thông báo
          </h3>
          <div className="px-8 space-y-3">
             <div className="relative group">
                <textarea 
                  className="w-full h-48 rounded-2xl bg-slate-50 border border-slate-200 p-6 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans leading-relaxed"
                  placeholder="Kính gửi {{tên_độc_giả}}, ..."
                  defaultValue={`Kính gửi {{tên_độc_giả}},\n\nBạn đang có sách quá hạn {{số_ngày}} ngày. Vui lòng hoàn trả sách sớm để tránh phát sinh thêm phí phạt.\n\nTrân trọng,\nBan quản lý thư viện Bookly.`}
                />
                <div className="absolute top-4 right-4 flex gap-1">
                   <div className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400">Characters: 184</div>
                </div>
             </div>
             <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Biến động:</span>
                {['{{tên_độc_giả}}', '{{số_ngày}}', '{{tên_sách}}', '{{mã_thẻ}}'].map(v => (
                  <button key={v} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                    {v}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
           <div className="flex gap-2">
              <Button variant="ghost" className="font-bold text-slate-500" onClick={() => setShowPreview(true)}>
                 👁️ Xem trước
              </Button>
              <Button variant="ghost" className="font-bold text-slate-500">
                 💾 Lưu nháp
              </Button>
           </div>
           <Button variant="primary" className="px-12 font-bold shadow-glow shadow-indigo-500/30">
              🚀 Gửi ngay bây giờ
           </Button>
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="Xem trước thông báo (Email)" size="md">
         <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Gửi đến: <span className="text-slate-900 ml-2">Trần Văn Minh (minh.tv@example.com)</span></p>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tiêu đề: <span className="text-slate-900 ml-2">[Bookly] Nhắc nhở trả sách quá hạn</span></p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-inner min-h-[300px] text-sm text-slate-700 leading-relaxed font-sans">
               <div className="flex justify-center mb-8">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">B</div>
               </div>
               <p>Kính gửi <span className="font-bold">Trần Văn Minh</span>,</p>
               <br/>
               <p>Hệ thống ghi nhận bạn đang có sách <span className="font-bold italic">"Nhà Giả Kim"</span> quá hạn <span className="text-red-600 font-bold">6 ngày</span>.</p>
               <p>Vui lòng sắp xếp thời gian đến thư viện hoàn trả sách sớm để tránh phát sinh thêm phí phạt theo quy định.</p>
               <br/>
               <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 italic text-xs text-amber-900">
                  Phí phạt hiện tại ước tính: 8.000đ
               </div>
               <br/>
               <p>Trân trọng,</p>
               <p className="font-bold text-indigo-600">Ban quản lý thư viện Bookly.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
               <Button variant="ghost" onClick={() => setShowPreview(false)}>Quay lại sửa</Button>
               <Button variant="primary">🚀 Gửi thử bản này</Button>
            </div>
         </div>
      </Modal>
    </div>
  )
}
