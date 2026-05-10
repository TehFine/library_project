'use client'
import { useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

// Mock Data
const MOCK_RECORDS = [
  { id: 'PM-2026-0501-003', book: 'Đắc Nhân Tâm', copyCode: '3901-001', reader: 'Trần Văn Minh', borrowDate: '01/05/2026', dueDate: '15/05/2026', daysLeft: 4, fine: 0 },
  { id: 'PM-2026-0420-015', book: 'Nhà Giả Kim', copyCode: '4502-005', reader: 'Lê Thị Hoa', borrowDate: '20/04/2026', dueDate: '04/05/2026', daysLeft: -6, fine: 6000 },
]

export default function ReturnBorrowPage() {
  const [step, setStep] = useState(1)
  
  // Step 1 State
  const [searchRecord, setSearchRecord] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<typeof MOCK_RECORDS[0] | null>(null)
  
  // Step 2 State
  const [condition, setCondition] = useState('good')
  const [conditionNote, setConditionNote] = useState('')

  // Step 3 State
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSearchRecord = () => {
    const record = MOCK_RECORDS.find(r => r.id === searchRecord || r.copyCode === searchRecord)
    setSelectedRecord(record || null)
  }

  const damageFine = condition === 'damaged' ? 50000 : 0
  const totalFine = (selectedRecord?.fine || 0) + damageFine

  const handleSubmit = () => {
    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Nhận trả sách" description="Hoàn tất" />
        <Card padding="lg">
          <div className="text-center py-12 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-sm ring-4 ring-emerald-50">
              ✓
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Nhận trả sách thành công!</h3>
              <p className="text-gray-500 mt-2">Phiếu mượn <span className="font-bold text-gray-900">{selectedRecord?.id}</span> đã được hoàn tất.</p>
              {totalFine > 0 && (
                <p className="text-gray-500">Đã thu phí phạt: <span className="font-medium text-amber-600">{totalFine}đ</span></p>
              )}
            </div>
            
            <div className="flex justify-center gap-4 pt-6">
              {totalFine > 0 && <Button variant="ghost" onClick={() => window.print()}>🖨️ In biên lai thu tiền</Button>}
              <Button variant="secondary" onClick={() => { setStep(1); setIsSuccess(false); setSelectedRecord(null); setSearchRecord(''); setCondition('good'); setConditionNote('') }}>Nhận trả tiếp</Button>
              <Link href="/librarian/dashboard">
                <Button variant="primary">Về tổng quan</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Nhận trả sách" 
        description={`Bước ${step}/3: ${
          step === 1 ? 'Xác định phiếu' : 
          step === 2 ? 'Kiểm tra tình trạng sách' : 'Tổng kết & Thu phí'
        }`} 
      />

      {/* Tiến trình */}
      <div className="flex items-center justify-between mb-8 relative px-12">
        <div className="absolute left-16 right-16 top-1/2 -translate-y-1/2 h-1 bg-gray-200 -z-10 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        </div>
        {[1, 2, 3].map(s => (
          <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
            s < step ? 'bg-emerald-500 text-white' : 
            s === step ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20' : 
            'bg-gray-200 text-gray-500'
          }`}>
            {s}
          </div>
        ))}
      </div>

      <Card padding="lg">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Xác định phiếu mượn</h3>
            {!selectedRecord ? (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input 
                    value={searchRecord}
                    onChange={e => setSearchRecord(e.target.value)}
                    placeholder="Quét mã vạch sách (VD: 3901-001) hoặc nhập mã phiếu (VD: PM-2026-0501)..." 
                    className="flex-1"
                    onKeyDown={e => e.key === 'Enter' && handleSearchRecord()}
                  />
                  <Button onClick={handleSearchRecord}>Tìm kiếm</Button>
                </div>
              </div>
            ) : (
              <div className={`p-5 rounded-2xl border ${selectedRecord.daysLeft >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-16 rounded flex items-center justify-center text-2xl ${selectedRecord.daysLeft >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {selectedRecord.daysLeft >= 0 ? '📗' : '📕'}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      {selectedRecord.book} — Bản sao: {selectedRecord.copyCode}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Mượn bởi: <span className="font-medium text-gray-900">{selectedRecord.reader}</span> • Ngày mượn: {selectedRecord.borrowDate}
                    </p>
                    <p className={`mt-2 text-sm font-medium ${selectedRecord.daysLeft >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      Hạn trả: {selectedRecord.dueDate} → {selectedRecord.daysLeft >= 0 ? `Còn ${selectedRecord.daysLeft} ngày ✅` : `Quá hạn ${Math.abs(selectedRecord.daysLeft)} ngày ❌ (Phí: ${selectedRecord.fine}đ)`}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <Button variant="ghost" onClick={() => setSelectedRecord(null)}>Tìm lại</Button>
                  <Button variant="primary" onClick={() => setStep(2)}>Tiếp tục →</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Kiểm tra tình trạng sách</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="radio" checked={condition === 'good'} onChange={() => setCondition('good')} className="mt-1 text-emerald-500 focus:ring-emerald-500" />
                <div>
                  <p className="font-medium text-gray-900">Tốt (như lúc mượn)</p>
                  <p className="text-sm text-gray-500">Sách nguyên vẹn, không rách, không bẩn.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="radio" checked={condition === 'fair'} onChange={() => setCondition('fair')} className="mt-1 text-emerald-500 focus:ring-emerald-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Cũ hơn / Hư nhẹ</p>
                  <p className="text-sm text-gray-500">Bị nhăn mép, bẩn nhẹ nhưng vẫn đọc tốt.</p>
                  {condition === 'fair' && (
                    <Input 
                      className="mt-3" 
                      placeholder="Mô tả hư hỏng..." 
                      value={conditionNote} 
                      onChange={e => setConditionNote(e.target.value)} 
                    />
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50 rounded-xl cursor-pointer">
                <input type="radio" checked={condition === 'damaged'} onChange={() => setCondition('damaged')} className="mt-1 text-amber-500 focus:ring-amber-500" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900">Hư nặng</p>
                  <p className="text-sm text-amber-700">Rách nhiều trang, dính nước nặng → Phát sinh phí phạt hư hỏng (Mặc định: 50.000đ)</p>
                </div>
              </label>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setStep(1)}>← Quay lại</Button>
              <Button variant="primary" onClick={() => setStep(3)}>Tiếp tục →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Tổng kết & Thu phí</h3>
            
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">{selectedRecord?.book}</p>
                  <p className="text-sm text-gray-500">Trạng thái khi trả: <span className="font-medium">{condition === 'good' ? 'Tốt' : condition === 'fair' ? 'Hư nhẹ' : 'Hư nặng'}</span></p>
                </div>
                {condition === 'damaged' && <span className="text-sm font-medium text-amber-600">Phạt hư hỏng: {damageFine}đ</span>}
              </div>

              {selectedRecord!.fine > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span className="text-sm font-medium">Phí phạt trễ hạn ({Math.abs(selectedRecord!.daysLeft)} ngày):</span>
                  <span className="font-bold">{selectedRecord!.fine}đ</span>
                </div>
              )}

              {totalFine > 0 ? (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-medium text-gray-900">Tổng phí phải thu:</span>
                    <span className="font-bold text-amber-600">{totalFine}đ</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Hình thức thu</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="text-primary focus:ring-primary" />
                        <span>Tiền mặt</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} className="text-primary focus:ring-primary" />
                        <span>Chuyển khoản</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={paymentMethod === 'qr'} onChange={() => setPaymentMethod('qr')} className="text-primary focus:ring-primary" />
                        <span>QR Code</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2 text-center text-emerald-600 font-medium">
                  Không phát sinh phí phạt.
                </div>
              )}
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setStep(2)}>← Quay lại</Button>
              <Button variant="primary" onClick={handleSubmit}>✅ Xác nhận trả {totalFine > 0 && '& Thu phí'}</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
