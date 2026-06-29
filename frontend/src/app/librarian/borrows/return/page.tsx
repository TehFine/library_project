'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { librarianApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { useShift } from '@/hooks/useShift'
import { Barcode, Search, Book, BookMarked, BookX, TriangleAlert, XCircle, Printer, Check } from 'lucide-react'

export default function ReturnBorrowPage() {
  const { onShift } = useShift()
  const [step, setStep] = useState(1)

  // Search mode: 'code' (quét mã vạch) or 'title' (tìm tên sách)
  const [searchMode, setSearchMode] = useState<'code' | 'title'>('code')

  // Step 1 State
  const [searchRecord, setSearchRecord] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Book title search results
  const [titleSearchResults, setTitleSearchResults] = useState<any[]>([])
  const [isSearchingTitle, setIsSearchingTitle] = useState(false)

  // Step 2 State
  const [condition, setCondition] = useState('good')
  const [conditionNote, setConditionNote] = useState('')

  // Step 3 State
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [isSuccess, setIsSuccess] = useState(false)
  const [returnResult, setReturnResult] = useState<any>(null)

  // ── Prefill from requests page ──
  useEffect(() => {
    const raw = sessionStorage.getItem('return_request_prefill')
    if (!raw) return
    sessionStorage.removeItem('return_request_prefill')

    let cancelled = false
    async function doPrefill() {
      try {
        const data = JSON.parse(raw as string)
        if (data.borrowRecordId) {
          // Có borrowRecordId → tìm theo mã copy code
          setSearchRecord(data.copyCode || '')
          if (data.copyCode) {
            const record = await librarianApi.findBorrowByCopyCode(data.copyCode)
            if (cancelled) return
            if (record) {
              const today = new Date()
              const dueDate = new Date(record.dueDate)
              let fine = 0
              let daysOverdue = 0
              if (today > dueDate) {
                const diffTime = today.getTime() - dueDate.getTime()
                daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                fine = daysOverdue <= 5 ? daysOverdue * 1000 : 5000 + (daysOverdue - 5) * 3000
              }
              if (!cancelled) {
                setSelectedRecord({ ...record, fine, daysOverdue })
              }
            } else {
              toast.error('Không tìm thấy phiếu mượn')
            }
          }
        } else {
          // Không có borrowRecordId → search bằng copyCode
          setSearchRecord(data.copyCode || '')
          // Tự động tìm kiếm
          if (data.copyCode) {
            try {
              const record = await librarianApi.findBorrowByCopyCode(data.copyCode)
              if (cancelled) return
              if (record) {
                const today = new Date()
                const dueDate = new Date(record.dueDate)
                let fine = 0
                let daysOverdue = 0
                if (today > dueDate) {
                  const diffTime = today.getTime() - dueDate.getTime()
                  daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  fine = daysOverdue <= 5 ? daysOverdue * 1000 : 5000 + (daysOverdue - 5) * 3000
                }
                if (!cancelled) {
                  setSelectedRecord({ ...record, fine, daysOverdue })
                }
              } else {
                toast.error('Không tìm thấy phiếu mượn')
              }
            } catch (err: any) {
              toast.error(err?.message || 'Lỗi khi tìm kiếm phiếu mượn')
            }
          }
        }
      } catch (err: any) {
        toast.error(err?.message || 'Lỗi xử lý dữ liệu từ yêu cầu trả')
      }
    }
    doPrefill()
    return () => { cancelled = true }
  }, [])

  // ── Search by copy code ──
  const handleSearchByCode = async () => {
    if (!searchRecord) return
    setIsSearching(true)
    try {
      const record = await librarianApi.findBorrowByCopyCode(searchRecord)
      if (!record) {
        toast.error('Không tìm thấy phiếu mượn đang hoạt động cho mã sách này')
        return
      }

      const today = new Date()
      const dueDate = new Date(record.dueDate)
      let fine = 0
      let daysOverdue = 0
      if (today > dueDate) {
        const diffTime = today.getTime() - dueDate.getTime()
        daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        fine = daysOverdue <= 5 ? daysOverdue * 1000 : 5000 + (daysOverdue - 5) * 3000
      }

      setSelectedRecord({ ...record, fine, daysOverdue })
      setTitleSearchResults([])
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi tìm kiếm phiếu mượn')
    } finally {
      setIsSearching(false)
    }
  }

  // ── Search by book title ──
  const handleSearchByTitle = async () => {
    if (!searchRecord) return
    setIsSearchingTitle(true)
    setTitleSearchResults([])
    try {
      const results = await librarianApi.searchBorrowByBookTitle(searchRecord)
      setTitleSearchResults(Array.isArray(results) ? results : [])
      if (!results || results.length === 0) {
        toast.error('Không tìm thấy phiếu mượn nào phù hợp')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi tìm kiếm sách')
    } finally {
      setIsSearchingTitle(false)
    }
  }

  const selectBorrowRecord = (record: any) => {
    const today = new Date()
    const dueDate = new Date(record.dueDate)
    let fine = 0
    let daysOverdue = 0
    if (today > dueDate) {
      const diffTime = today.getTime() - dueDate.getTime()
      daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      fine = daysOverdue <= 5 ? daysOverdue * 1000 : 5000 + (daysOverdue - 5) * 3000
    }
    setSelectedRecord({ ...record, fine, daysOverdue })
    setTitleSearchResults([])
  }

  const damageFine = condition === 'damaged' ? 50000 : 0
  const totalFine = (selectedRecord?.fine || 0) + damageFine

  const handleSubmit = async () => {
    try {
      const res = await librarianApi.returnBook(selectedRecord.id, condition, totalFine > 0 ? paymentMethod : undefined)
      setReturnResult(res)
      setIsSuccess(true)
      toast.success('Nhận trả sách thành công')
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi nhận trả sách')
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Nhận trả sách" description="Hoàn tất" />
        <Card padding="lg">
          <div className="text-center py-12 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-sm ring-4 ring-emerald-50">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Nhận trả sách thành công!</h3>
              <p className="text-gray-500 mt-2">Sách <span className="font-bold text-gray-900">{selectedRecord?.bookCopy?.book?.title}</span> đã được nhập kho.</p>
              {totalFine > 0 && (
                <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 inline-block">
                   <p className="text-amber-800 font-medium">Đã thu phí phạt: <span className="font-bold text-lg">{formatCurrency(totalFine)}</span></p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4 pt-6">
              {totalFine > 0 && <Button variant="ghost" onClick={() => window.print()}><Printer className="w-4 h-4" /> In biên lai</Button>}
              <Button variant="secondary" onClick={() => { setStep(1); setIsSuccess(false); setSelectedRecord(null); setSearchRecord(''); setCondition('good'); setConditionNote(''); setTitleSearchResults([]) }}>Nhận trả tiếp</Button>
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

      {/* Progress */}
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
              <div className="space-y-6">
                {/* Search Mode Toggle */}
                <div className="flex gap-1 sm:gap-2 bg-gray-50 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl w-fit overflow-x-auto scrollbar-hide max-w-full pt-1">
                  <button
                    onClick={() => { setSearchMode('code'); setSearchRecord(''); setTitleSearchResults([]) }}
                    className={`px-3 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-sm font-semibold transition-all duration-200 rounded-lg sm:rounded-xl whitespace-nowrap shrink-0 ${
                      searchMode === 'code'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Barcode className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Quét mã
                  </button>
                  <button
                    onClick={() => { setSearchMode('title'); setSearchRecord(''); setTitleSearchResults([]) }}
                    className={`px-3 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-sm font-semibold transition-all duration-200 rounded-lg sm:rounded-xl whitespace-nowrap shrink-0 ${
                      searchMode === 'title'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Tìm tên sách
                  </button>
                </div>

                {/* Code Search */}
                {searchMode === 'code' ? (
                  <div className="flex gap-3">
                    <Input 
                      value={searchRecord}
                      onChange={e => setSearchRecord(e.target.value)}
                      placeholder="Quét mã vạch sách (VD: 3901-001)..."
                      className="flex-1"
                      onKeyDown={e => e.key === 'Enter' && handleSearchByCode()}
                      autoFocus
                    />
                    <Button onClick={handleSearchByCode} loading={isSearching}>Tìm kiếm</Button>
                  </div>
                ) : (
                  /* Book Title Search */
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Input 
                        value={searchRecord}
                        onChange={e => setSearchRecord(e.target.value)}
                        placeholder="Nhập tên sách hoặc mã bản sao..."
                        className="flex-1"
                        onKeyDown={e => e.key === 'Enter' && handleSearchByTitle()}
                      />
                      <Button onClick={handleSearchByTitle} loading={isSearchingTitle}>Tìm kiếm</Button>
                    </div>

                    {/* Title Search Results */}
                    {titleSearchResults.length > 0 && (
                      <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
                        {titleSearchResults.map((r: any) => (
                          <div
                            key={r.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors"
                            onClick={() => selectBorrowRecord(r)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-12 rounded flex items-center justify-center text-lg font-bold shrink-0 ${
                                new Date(r.dueDate) < new Date() ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                {new Date(r.dueDate) < new Date() ? <BookX className="w-5 h-5" /> : <Book className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{r.bookCopy?.book?.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Mã BC: <span className="font-mono">{r.bookCopy?.copyCode}</span>
                                  {' • '}Độc giả: <span className="font-medium">{r.libraryCard?.user?.profile?.fullName || r.libraryCard?.user?.username}</span>
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400 shrink-0 ml-4">
                              Hạn: {r.dueDate}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className={`p-5 rounded-2xl border ${selectedRecord.daysOverdue <= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-16 rounded flex items-center justify-center text-2xl ${selectedRecord.daysOverdue <= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {selectedRecord.daysOverdue <= 0 ? <BookMarked className="w-6 h-6" /> : <BookX className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      {selectedRecord.bookCopy?.book?.title} — Mã BC: {selectedRecord.bookCopy?.copyCode}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Mượn bởi: <span className="font-medium text-gray-900">{selectedRecord.libraryCard?.user?.fullName || selectedRecord.libraryCard?.user?.username}</span> • Ngày mượn: {selectedRecord.borrowDate}
                    </p>
                    <p className={`mt-2 text-sm font-bold ${selectedRecord.daysOverdue <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      Hạn trả: {selectedRecord.dueDate} → {selectedRecord.daysOverdue <= 0 ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />Còn hạn</> : <><span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1" />Quá hạn {selectedRecord.daysOverdue} ngày <TriangleAlert className="w-3.5 h-3.5 inline" /> (Phí dự kiến: {formatCurrency(selectedRecord.fine)})</>}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <Button variant="ghost" onClick={() => { setSelectedRecord(null); setSearchRecord(''); setTitleSearchResults([]) }}>Tìm lại</Button>
                  <Button variant="primary" onClick={() => setStep(2)} disabled={!onShift} title={!onShift ? 'Cần trong ca trực để tiếp tục' : ''}>Tiếp tục →</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Kiểm tra tình trạng sách</h3>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="radio" checked={condition === 'good'} onChange={() => setCondition('good')} className="mt-1 text-emerald-500 focus:ring-emerald-500" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">Tốt (như lúc mượn)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Sách nguyên vẹn, không rách, không bẩn.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="radio" checked={condition === 'fair'} onChange={() => setCondition('fair')} className="mt-1 text-emerald-500 focus:ring-emerald-500" />
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">Cũ hơn / Hư nhẹ</p>
                  <p className="text-xs text-gray-500 mt-0.5">Bị nhăn mép, bẩn nhẹ nhưng vẫn đọc tốt.</p>
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

              <label className="flex items-start gap-3 p-4 border border-amber-100 bg-amber-50 rounded-2xl cursor-pointer">
                <input type="radio" checked={condition === 'damaged'} onChange={() => setCondition('damaged')} className="mt-1 text-amber-500 focus:ring-amber-500" />
                <div className="flex-1">
                  <p className="font-bold text-amber-900 text-sm">Hư nặng / Mất sách</p>
                  <p className="text-xs text-amber-700 mt-0.5">Rách nhiều trang, dính nước nặng → Phí phạt hư hỏng (Mặc định: 50.000đ)</p>
                </div>
              </label>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setStep(1)}>← Quay lại</Button>
              <Button variant="primary" onClick={() => setStep(3)} disabled={!onShift} title={!onShift ? 'Cần trong ca trực để tiếp tục' : ''}>Tiếp tục →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Tổng kết & Thu phí</h3>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                <div>
                  <p className="font-bold text-gray-900">{selectedRecord?.bookCopy?.book?.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider">Tình trạng: <span className="font-bold text-primary">{condition === 'good' ? 'Tốt' : condition === 'fair' ? 'Hư nhẹ' : 'Hư nặng'}</span></p>
                </div>
                {condition === 'damaged' && <span className="text-sm font-bold text-amber-600">Phạt hư hỏng: {formatCurrency(damageFine)}</span>}
              </div>

              {selectedRecord!.fine > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span className="text-sm font-bold italic">Phí phạt trễ hạn ({selectedRecord!.daysOverdue} ngày):</span>
                  <span className="font-black">{formatCurrency(selectedRecord!.fine)}</span>
                </div>
              )}

              {totalFine > 0 ? (
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex justify-between items-center text-xl">
                    <span className="font-black text-gray-900">TỔNG PHÍ PHẢI THU:</span>
                    <span className="font-black text-primary">{formatCurrency(totalFine)}</span>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Hình thức thanh toán</label>
                    <div className="flex gap-3">
                      {['cash', 'transfer', 'qr'].map(m => (
                        <label key={m} className={`flex-1 flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === m ? 'bg-primary/5 border-primary text-primary font-bold' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <input type="radio" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="hidden" />
                          <span className="capitalize">{m === 'cash' ? 'Tiền mặt' : m === 'transfer' ? 'Chuyển khoản' : 'QR Code'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2 text-center text-emerald-600 font-bold italic">
                  <Check className="w-4 h-4 inline text-emerald-500 mr-1" /> Không phát sinh phí phạt.
                </div>
              )}
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setStep(2)}>← Quay lại</Button>
              <Button variant="primary" onClick={handleSubmit} disabled={!onShift} title={!onShift ? 'Cần trong ca trực để nhận trả' : ''}><Check className="w-4 h-4" /> Xác nhận {totalFine > 0 ? 'Thu phí & Nhập kho' : 'Nhập kho'}</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}