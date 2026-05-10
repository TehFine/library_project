'use client'
import { useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

// Mock Data
const MOCK_READERS = [
  { id: 'TV-2024-001', name: 'Trần Văn Minh', expiry: '10/01/2025', borrowed: 1, max: 3, debt: 0, status: 'valid' },
  { id: 'TV-2024-002', name: 'Lê Thị Hoa', expiry: '15/12/2024', borrowed: 2, max: 3, debt: 50000, status: 'invalid', reason: 'Thẻ hết hạn và đang nợ phí' },
]

const MOCK_BOOKS = [
  { copyCode: '3901-001', title: 'Đắc Nhân Tâm', condition: 'Tốt', status: 'available' },
  { copyCode: '2219-002', title: 'Atomic Habits', condition: 'Khá', status: 'available' },
]

export default function NewBorrowPage() {
  const [step, setStep] = useState(1)
  
  // Step 1 State
  const [searchReader, setSearchReader] = useState('')
  const [selectedReader, setSelectedReader] = useState<typeof MOCK_READERS[0] | null>(null)
  
  // Step 2 State
  const [searchBook, setSearchBook] = useState('')
  const [selectedBooks, setSelectedBooks] = useState<typeof MOCK_BOOKS[0][]>([])

  // Step 3 State
  const [borrowType, setBorrowType] = useState('home')

  // Step 4 State
  const [borrowId, setBorrowId] = useState('')

  const handleSearchReader = () => {
    const reader = MOCK_READERS.find(r => r.id === searchReader || r.name.toLowerCase().includes(searchReader.toLowerCase()))
    setSelectedReader(reader || null)
  }

  const handleAddBook = () => {
    const book = MOCK_BOOKS.find(b => b.copyCode === searchBook || b.title.toLowerCase().includes(searchBook.toLowerCase()))
    if (book && !selectedBooks.find(b => b.copyCode === book.copyCode)) {
      setSelectedBooks([...selectedBooks, book])
      setSearchBook('')
    }
  }

  const handleRemoveBook = (code: string) => {
    setSelectedBooks(selectedBooks.filter(b => b.copyCode !== code))
  }

  const handleSubmit = () => {
    // Gọi API lưu dữ liệu
    setBorrowId(`PM-2026-0512-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`)
    setStep(4)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Tạo phiếu mượn mới" 
        description={`Bước ${step}/4: ${
          step === 1 ? 'Xác minh độc giả' : 
          step === 2 ? 'Thêm sách' : 
          step === 3 ? 'Xác nhận' : 'Hoàn tất'
        }`} 
      />

      {/* Tiến trình */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }} />
        </div>
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
            s < step ? 'bg-primary text-white' : 
            s === step ? 'bg-primary text-white ring-4 ring-primary/20' : 
            'bg-gray-200 text-gray-500'
          }`}>
            {s}
          </div>
        ))}
      </div>

      <Card padding="lg">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Xác minh độc giả</h3>
            {!selectedReader ? (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input 
                    value={searchReader}
                    onChange={e => setSearchReader(e.target.value)}
                    placeholder="Nhập mã thẻ (VD: TV-2024-001) hoặc tên độc giả..." 
                    className="flex-1"
                    onKeyDown={e => e.key === 'Enter' && handleSearchReader()}
                  />
                  <Button onClick={handleSearchReader}>Tìm kiếm</Button>
                </div>
              </div>
            ) : (
              <div className={`p-5 rounded-2xl border ${selectedReader.status === 'valid' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`text-lg font-bold flex items-center gap-2 ${selectedReader.status === 'valid' ? 'text-emerald-800' : 'text-red-800'}`}>
                      {selectedReader.status === 'valid' ? '✅' : '⚠️'} 
                      {selectedReader.name.toUpperCase()} — Thẻ: {selectedReader.id}
                    </h4>
                    <p className={`mt-2 text-sm ${selectedReader.status === 'valid' ? 'text-emerald-600' : 'text-red-600'}`}>
                      Hết hạn: {selectedReader.expiry} • Đang mượn: {selectedReader.borrowed}/{selectedReader.max} • {selectedReader.debt > 0 ? `Nợ: ${selectedReader.debt}đ` : 'Không nợ'}
                    </p>
                    {selectedReader.status === 'invalid' && (
                      <p className="mt-1 font-medium text-red-700">❌ {selectedReader.reason}</p>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <Button variant="ghost" onClick={() => setSelectedReader(null)}>Tìm lại</Button>
                  {selectedReader.status === 'valid' && (
                    <Button variant="primary" onClick={() => setStep(2)}>Xác nhận →</Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Thêm sách vào phiếu</h3>
            <div className="flex gap-3">
              <Input 
                value={searchBook}
                onChange={e => setSearchBook(e.target.value)}
                placeholder="Quét mã vạch bản sao (VD: 3901-001) hoặc tìm theo tên..." 
                className="flex-1"
                onKeyDown={e => e.key === 'Enter' && handleAddBook()}
              />
              <Button onClick={handleAddBook}>Thêm sách</Button>
            </div>

            <div className="space-y-3 mt-6">
              <p className="font-medium text-gray-700">Sách đã thêm ({selectedBooks.length}/{selectedReader?.max})</p>
              {selectedBooks.length === 0 ? (
                <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                  Chưa có sách nào được chọn. Quét mã vạch để thêm sách.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedBooks.map(b => (
                    <div key={b.copyCode} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 bg-amber-100 rounded flex items-center justify-center text-sm">📕</div>
                        <div>
                          <p className="font-medium text-gray-900">{b.title}</p>
                          <p className="text-xs text-gray-500">Mã: {b.copyCode} • Tình trạng: {b.condition}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveBook(b.copyCode)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setStep(1)}>← Quay lại</Button>
              <Button variant="primary" disabled={selectedBooks.length === 0} onClick={() => setStep(3)}>Tiếp tục →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Xác nhận & Cài đặt</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Loại mượn</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={borrowType === 'home'} onChange={() => setBorrowType('home')} className="text-primary focus:ring-primary" />
                      <span>Mượn về nhà</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={borrowType === 'library'} onChange={() => setBorrowType('library')} className="text-primary focus:ring-primary" />
                      <span>Đọc tại chỗ</span>
                    </label>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ngày mượn:</span>
                    <span className="font-medium">10/05/2026 (hôm nay)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hạn trả:</span>
                    <span className="font-medium text-primary-600">{borrowType === 'home' ? '24/05/2026 (+14 ngày)' : '10/05/2026 (Trong ngày)'}</span>
                  </div>
                </div>
              </div>

              <div className="border-l border-gray-200 pl-6 space-y-4">
                <p className="font-medium text-gray-700">Tóm tắt phiếu mượn</p>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <p className="text-sm font-medium text-amber-900">Độc giả: {selectedReader?.name.toUpperCase()} — {selectedReader?.id}</p>
                </div>
                <ul className="space-y-2 text-sm">
                  {selectedBooks.map(b => (
                    <li key={b.copyCode} className="flex justify-between items-center bg-white p-2 border border-gray-100 rounded-md">
                      <span className="font-medium">{b.title}</span>
                      <span className="text-gray-500">Bản sao: {b.copyCode}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100 mt-6">
              <Button variant="ghost" onClick={() => setStep(2)}>← Quay lại</Button>
              <Button variant="primary" onClick={handleSubmit}>✅ Xác nhận & Tạo phiếu</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-12 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-sm ring-4 ring-emerald-50">
              ✓
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Tạo phiếu mượn thành công!</h3>
              <p className="text-gray-500 mt-2">Số phiếu: <span className="font-bold text-gray-900">{borrowId}</span></p>
              <p className="text-gray-500">Hạn trả: <span className="font-medium text-primary-600">{borrowType === 'home' ? '24/05/2026' : '10/05/2026'}</span></p>
            </div>
            
            <div className="flex justify-center gap-4 pt-6">
              <Button variant="ghost" onClick={() => window.print()}>🖨️ In phiếu mượn</Button>
              <Button variant="secondary" onClick={() => { setStep(1); setSelectedReader(null); setSelectedBooks([]); setSearchReader(''); setSearchBook('') }}>Mượn tiếp</Button>
              <Link href="/librarian/dashboard">
                <Button variant="primary">Về tổng quan</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
