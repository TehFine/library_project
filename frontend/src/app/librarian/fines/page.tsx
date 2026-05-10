'use client'
import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

// Mock Data
const MOCK_FINES = [
  { id: 'F-001', reader: 'Trần Văn Minh', cardId: 'TV-2024-001', book: 'Nhà Giả Kim', reason: 'Trễ 6 ngày', amount: 8000, date: '09/05/2026', status: 'pending', recordId: 'PM-001' },
  { id: 'F-002', reader: 'Lê Thị Hoa', cardId: 'TV-2024-002', book: 'Atomic Habits', reason: 'Sách hư hỏng', amount: 50000, date: '07/05/2026', status: 'pending', recordId: 'PM-002' },
  { id: 'F-003', reader: 'Nguyễn Văn C', cardId: 'TV-2024-005', book: 'Đắc Nhân Tâm', reason: 'Trễ 2 ngày', amount: 2000, date: '01/05/2026', status: 'paid', recordId: 'PM-003' },
]

export default function LibrarianFinesPage() {
  const [tab, setTab] = useState<'pending' | 'paid' | 'all'>('pending')
  const [search, setSearch] = useState('')
  const [selectedFine, setSelectedFine] = useState<typeof MOCK_FINES[0] | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const filteredFines = MOCK_FINES.filter(f => {
    if (tab !== 'all' && f.status !== tab) return false
    if (search && !f.reader.toLowerCase().includes(search.toLowerCase()) && !f.cardId.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý Phí Phạt" description="Theo dõi và thu phí trễ hạn, hư hỏng sách" />

      {/* Toolbar & Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex gap-1 border-b border-gray-200">
          <button onClick={() => setTab('pending')} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'pending' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500'}`}>Chưa thanh toán (2)</button>
          <button onClick={() => setTab('paid')} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'paid' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500'}`}>Đã thanh toán (1)</button>
          <button onClick={() => setTab('all')} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'all' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500'}`}>Tất cả</button>
        </div>
        <div className="w-full sm:w-64">
          <Input 
            placeholder="🔍 Tìm theo tên độc giả, mã thẻ..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {filteredFines.map(fine => (
          <Card key={fine.id} padding="none">
            <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="font-bold text-gray-900">{fine.reader.toUpperCase()} <span className="text-gray-400 font-normal">• {fine.cardId} • {fine.book}</span></p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`text-sm font-medium ${fine.reason.includes('hư hỏng') ? 'text-amber-600' : 'text-red-600'}`}>{fine.reason}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm font-bold text-gray-900">Phí: {fine.amount.toLocaleString()}đ</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500">⏰ Tạo: {fine.date}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Xem phiếu mượn</Button>
                {fine.status === 'pending' && (
                  <Button variant="primary" size="sm" onClick={() => setSelectedFine(fine)}>Thu tiền</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filteredFines.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
            Không có dữ liệu phiếu phạt nào.
          </div>
        )}
      </div>

      {/* Modal Thu Tiền */}
      <Modal open={!!selectedFine} onClose={() => setSelectedFine(null)} title="Thu Phí Phạt">
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">Độc giả:</span>
              <span className="font-medium">{selectedFine?.reader}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 py-2">
              <span className="text-gray-600">Lý do phạt:</span>
              <span className="font-medium">{selectedFine?.reason} ({selectedFine?.book})</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-gray-600 font-medium">Số tiền cần thu:</span>
              <span className="font-bold text-amber-600 text-lg">{selectedFine?.amount.toLocaleString()}đ</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Hình thức thanh toán</label>
            <div className="grid grid-cols-3 gap-3">
              <label className={`border rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-colors ${paymentMethod === 'cash' ? 'border-primary bg-primary-50 text-primary-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="sr-only" />
                <span className="text-2xl">💵</span>
                <span className="text-sm font-medium">Tiền mặt</span>
              </label>
              <label className={`border rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-colors ${paymentMethod === 'transfer' ? 'border-primary bg-primary-50 text-primary-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} className="sr-only" />
                <span className="text-2xl">🏦</span>
                <span className="text-sm font-medium">Chuyển khoản</span>
              </label>
              <label className={`border rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-colors ${paymentMethod === 'qr' ? 'border-primary bg-primary-50 text-primary-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" checked={paymentMethod === 'qr'} onChange={() => setPaymentMethod('qr')} className="sr-only" />
                <span className="text-2xl">📱</span>
                <span className="text-sm font-medium">QR Code</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setSelectedFine(null)}>Hủy</Button>
            <Button variant="primary" onClick={() => setSelectedFine(null)}>Xác nhận & In biên lai</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
