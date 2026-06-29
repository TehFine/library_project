'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { librarianApi, booksApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { cn, formatCurrency } from '@/lib/utils'
import { useShift } from '@/hooks/useShift'
import { Search, Camera, Barcode, Book, Check, TriangleAlert, XCircle, Home, BookOpen, Printer } from 'lucide-react'
import BarcodeScanner from '@/components/scanner/BarcodeScanner'

export default function NewBorrowPage() {
  const { onShift } = useShift()
  const [step, setStep] = useState(1)
  
  // Step 1 State
  const [searchReader, setSearchReader] = useState('')
  const [selectedReader, setSelectedReader] = useState<any | null>(null)
  const [isSearchingReader, setIsSearchingReader] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  // Step 2 State
  const [searchMode, setSearchMode] = useState<'title' | 'code'>('title')
  const [searchBook, setSearchBook] = useState('')
  const [selectedBooks, setSelectedBooks] = useState<any[]>([])
  const [isSearchingBook, setIsSearchingBook] = useState(false)
  const [bookSearchResults, setBookSearchResults] = useState<any[]>([])
  const [isSearchingBookTitle, setIsSearchingBookTitle] = useState(false)
  const [selectedBookForCopies, setSelectedBookForCopies] = useState<any>(null)
  const [availableCopies, setAvailableCopies] = useState<any[]>([])
  const [loadingCopies, setLoadingCopies] = useState(false)

  // Scanner state
  const [showScanner, setShowScanner] = useState(false)

  // Step 3 State
  const [borrowType, setBorrowType] = useState('home')

  // Step 4 State
  const [borrowResults, setBorrowResults] = useState<any[]>([])

  // Request prefill: nếu đến từ trang duyệt yêu cầu
  const [prefillRequestId, setPrefillRequestId] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('borrow_request_prefill')
    if (!raw) return
    sessionStorage.removeItem('borrow_request_prefill')

    let cancelled = false

    async function doPrefill() {
      try {
        const data = JSON.parse(raw as string)
        if (data.requestId && !cancelled) setPrefillRequestId(data.requestId)

        // 1. Lấy thông tin reader
        const details = await librarianApi.getCardDetails(data.cardId)
        if (cancelled) return

        const borrowingCount = details.borrowRecords?.filter((r: any) => r.status === 'borrowing').length || 0
        const overdueCount   = details.borrowRecords?.filter((r: any) => r.status === 'borrowing' && new Date(r.dueDate) < new Date()).length || 0

        setSelectedReader({
          ...details,
          borrowingCount,
          overdueCount,
          status: details.status === 'active' && overdueCount === 0 ? 'valid' : 'invalid',
          reason: details.status !== 'active'
            ? 'Thẻ đang bị khóa hoặc hết hạn'
            : overdueCount > 0
              ? 'Độc giả đang có sách quá hạn'
              : '',
        })

        // 2. Lấy available copies
        const res = await librarianApi.getAvailableCopies(data.bookId)
        if (cancelled) return
        const copies = res.availableCopies ?? []

        if (copies.length === 0) {
          toast.error('Cuốn sách yêu cầu hiện không còn bản sao nào có sẵn')
          return
        }

        // 3. Auto-chọn bản sao đầu tiên
        const copy = copies[0]
        setSelectedBooks(prev => [...prev, copy])

        // 4. Chuyển tới bước xác nhận
        if (!cancelled) setStep(3)
      } catch (err: any) {
        toast.error(err?.message || 'Không thể tự động điền thông tin từ yêu cầu mượn')
      }
    }

    doPrefill()
    return () => { cancelled = true }
  }, [])

  const handleSearchReader = async () => {
    if (!searchReader) return
    setIsSearchingReader(true)
    try {
      const res = await librarianApi.searchCards(searchReader)
      setSearchResults(res)
      if (res.length === 1) {
        handleSelectReader(res[0].id)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi tìm kiếm độc giả')
    } finally {
      setIsSearchingReader(false)
    }
  }

  const handleSelectReader = async (id: string) => {
    try {
      const details = await librarianApi.getCardDetails(id)
      // Tính toán sơ bộ
      const borrowingCount = details.borrowRecords?.filter((r: any) => r.status === 'borrowing').length || 0
      const overdueCount = details.borrowRecords?.filter((r: any) => r.status === 'borrowing' && new Date(r.dueDate) < new Date()).length || 0
      
      setSelectedReader({
        ...details,
        borrowingCount,
        overdueCount,
        status: details.status === 'active' && overdueCount === 0 ? 'valid' : 'invalid',
        reason: details.status !== 'active' ? 'Thẻ đang bị khóa hoặc hết hạn' : overdueCount > 0 ? 'Độc giả đang có sách quá hạn' : ''
      })
      setSearchResults([])
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi lấy thông tin chi tiết thẻ')
    }
  }

  const handleSearchBookTitle = async () => {
    if (!searchBook) return
    setIsSearchingBookTitle(true)
    setBookSearchResults([])
    setSelectedBookForCopies(null)
    try {
      const res = await booksApi.list({ search: searchBook })
      const books = Array.isArray(res) ? res : res.data ?? []
      setBookSearchResults(books)
      if (books.length === 0) {
        toast.error('Không tìm thấy sách nào')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi tìm kiếm sách')
    } finally {
      setIsSearchingBookTitle(false)
    }
  }

  const handleSelectBookForCopies = async (bookId: string) => {
    setSelectedBookForCopies(bookId)
    setLoadingCopies(true)
    setAvailableCopies([])
    try {
      const res = await librarianApi.getAvailableCopies(bookId)
      const copies = res.availableCopies ?? []
      if (copies.length === 0) {
        toast.error('Cuốn sách này hiện không còn bản sao nào có sẵn')
        setSelectedBookForCopies(null)
      }
      setAvailableCopies(copies)
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi lấy danh sách bản sao')
      setSelectedBookForCopies(null)
    } finally {
      setLoadingCopies(false)
    }
  }

  const handleSelectCopy = (copy: any) => {
    if (selectedBooks.find(b => b.id === copy.id)) {
      toast.error('Sách đã có trong danh sách')
      return
    }
    setSelectedBooks([...selectedBooks, copy])
    setSearchBook('')
    setBookSearchResults([])
    setSelectedBookForCopies(null)
    setAvailableCopies([])
    toast.success(`Đã thêm: ${copy.book?.title || copy.bookTitle}`)
  }

  const handleAddBook = async () => {
    if (!searchBook) return
    await findAndAddBook(searchBook)
  }

  const handleAddBookWithCode = async (code: string) => {
    await findAndAddBook(code)
  }

  const findAndAddBook = async (code: string) => {
    if (!code) return
    setIsSearchingBook(true)
    try {
      const book = await librarianApi.findCopyByCode(code)
      if (book.status !== 'available') {
        toast.error('Sách này hiện không có sẵn (đang mượn hoặc mất)')
        return
      }
      if (selectedBooks.find(b => b.id === book.id)) {
        toast.error('Sách đã có trong danh sách')
        return
      }
      setSelectedBooks(prev => [...prev, book])
      setSearchBook('')
    } catch (err: any) {
      toast.error(err?.message || 'Không tìm thấy mã sách này')
    } finally {
      setIsSearchingBook(false)
    }
  }

  const handleRemoveBook = (id: string) => {
    setSelectedBooks(selectedBooks.filter(b => b.id !== id))
  }

  const handleSubmit = async () => {
    try {
      const results = []
      for (let i = 0; i < selectedBooks.length; i++) {
        const book = selectedBooks[i]
        const res = await librarianApi.createBorrow({
          cardId: selectedReader.id,
          copyId: book.id,
          // Chỉ gửi requestId cho sách đầu tiên (sách từ yêu cầu mượn)
          ...(prefillRequestId && i === 0 ? { requestId: prefillRequestId } : {}),
        })
        results.push(res)
      }
      setBorrowResults(results)
      setStep(4)
      toast.success('Đã tạo phiếu mượn thành công')
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo phiếu mượn')
    }
  }

  const maxBooks = 3 // Có thể lấy từ config hệ thống sau

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
                  <Button onClick={handleSearchReader} loading={isSearchingReader}>Tìm kiếm</Button>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                    {searchResults.map(r => (
                      <div key={r.id} className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center" onClick={() => handleSelectReader(r.id)}>
                        <div>
                          <p className="font-bold text-gray-900">{r.user?.fullName || r.user?.username}</p>
                          <p className="text-xs text-gray-500">Mã thẻ: {r.cardNumber} • CCCD: {r.user?.idCardNumber || 'N/A'}</p>
                        </div>
                        <Button variant="ghost" size="sm">Chọn</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={`p-5 rounded-2xl border ${selectedReader.status === 'valid' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`text-lg font-bold flex items-center gap-2 ${selectedReader.status === 'valid' ? 'text-emerald-800' : 'text-red-800'}`}>
                      {selectedReader.status === 'valid' ? <Check className="w-5 h-5 text-emerald-600" /> : <TriangleAlert className="w-5 h-5 text-red-600" />} 
                      {(selectedReader.user?.fullName || selectedReader.user?.username).toUpperCase()} — Thẻ: {selectedReader.cardNumber}
                    </h4>
                    <p className={`mt-2 text-sm ${selectedReader.status === 'valid' ? 'text-emerald-600' : 'text-red-600'}`}>
                      Hạn dùng: {selectedReader.expiryDate} • Đang mượn: {selectedReader.borrowingCount}/{maxBooks} • {selectedReader.overdueCount > 0 ? `CÓ ${selectedReader.overdueCount} SÁCH QUÁ HẠN` : 'Không có sách quá hạn'}
                    </p>
                    {selectedReader.status === 'invalid' && (
                      <p className="mt-1 font-bold text-red-700 flex items-center gap-1"><XCircle className="w-4 h-4" /> {selectedReader.reason}</p>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <Button variant="ghost" onClick={() => setSelectedReader(null)}>Tìm lại</Button>
                  {selectedReader.status === 'valid' && (
                    <Button variant="primary" onClick={() => setStep(2)} disabled={!onShift} title={!onShift ? 'Cần trong ca trực để tiếp tục' : ''}>Xác nhận →</Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Thêm sách vào phiếu</h3>

            {/* Mode Switcher */}
            <div className="flex gap-1 sm:gap-2 bg-gray-50 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl w-fit overflow-x-auto scrollbar-hide max-w-full pt-1">
              <button
                onClick={() => { setSearchMode('title'); setSearchBook(''); setBookSearchResults([]); setSelectedBookForCopies(null); setAvailableCopies([]) }}
                className={cn(
                  'px-3 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-sm font-semibold transition-all duration-200 rounded-lg sm:rounded-xl whitespace-nowrap shrink-0',
                  searchMode === 'title'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Tìm theo tên
              </button>
              <button
                onClick={() => { setSearchMode('code'); setSearchBook(''); setBookSearchResults([]); setSelectedBookForCopies(null); setAvailableCopies([]) }}
                className={cn(
                  'px-3 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-sm font-semibold transition-all duration-200 rounded-lg sm:rounded-xl whitespace-nowrap shrink-0',
                  searchMode === 'code'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                <Barcode className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Quét mã vạch
              </button>
            </div>

            {/* Search / Input */}
            {searchMode === 'code' ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Input 
                    value={searchBook}
                    onChange={e => setSearchBook(e.target.value)}
                    placeholder="Nhập mã bản sao hoặc quét bằng camera..." 
                    className="flex-1"
                    onKeyDown={e => e.key === 'Enter' && handleAddBook()}
                  />
                  <button
                    onClick={() => setShowScanner(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-sm shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    title="Mở camera quét mã vạch"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">Quét camera</span>
                  </button>
                  <Button onClick={handleAddBook} loading={isSearchingBook}>Thêm sách</Button>
                </div>

                {/* Camera Scanner Overlay */}
                {showScanner && (
                  <BarcodeScanner
                    onScan={(code) => {
                      setShowScanner(false)
                      // Auto-search after a brief delay so React unmounts scanner first
                      setTimeout(() => handleAddBookWithCode(code), 100)
                    }}
                    onClose={() => setShowScanner(false)}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input 
                    value={searchBook}
                    onChange={e => setSearchBook(e.target.value)}
                    placeholder="Nhập tên sách (VD: Harry Potter)..." 
                    className="flex-1"
                    onKeyDown={e => e.key === 'Enter' && handleSearchBookTitle()}
                  />
                  <Button onClick={handleSearchBookTitle} loading={isSearchingBookTitle}>Tìm sách</Button>
                </div>

                {/* Book Search Results */}
                {bookSearchResults.length > 0 && !selectedBookForCopies && (
                  <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
                    {bookSearchResults.map((book: any) => (
                      <div
                        key={book.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors"
                        onClick={() => handleSelectBookForCopies(book.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"><Book className="w-5 h-5" /></div>
                          <div>
                            <p className="font-bold text-gray-900">{book.title}</p>
                            <p className="text-xs text-gray-500">{book.author}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-emerald-600">Còn {book.availableCopies} bản</span>
                          <span className="text-gray-300">→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available Copies for Selected Book */}
                {selectedBookForCopies && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-700">
                        Chọn bản sao có sẵn cho sách này:
                      </p>
                      <button
                        onClick={() => { setSelectedBookForCopies(null); setAvailableCopies([]) }}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        ← Tìm lại
                      </button>
                    </div>
                    {loadingCopies ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {availableCopies.map((copy: any) => (
                          <button
                            key={copy.id}
                            onClick={() => handleSelectCopy(copy)}
                            disabled={!!selectedBooks.find(b => b.id === copy.id)}
                            className={cn(
                              'p-4 rounded-2xl border-2 text-left transition-all',
                              selectedBooks.find(b => b.id === copy.id)
                                ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                : 'border-emerald-100 bg-emerald-50/50 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md cursor-pointer',
                            )}
                          >
                            <p className="font-mono font-bold text-sm">{copy.copyCode}</p>
                            <p className="text-[11px] text-gray-500 mt-1">
                              Tình trạng: {copy.condition === 'new' ? 'Mới' : copy.condition === 'good' ? 'Tốt' : copy.condition}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Có sẵn</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Selected Books List */}
            <div className="space-y-3 mt-6">
              <p className="font-medium text-gray-700">Sách đã thêm ({selectedBooks.length}/{maxBooks - selectedReader.borrowingCount})</p>
              {selectedBooks.length === 0 ? (
                <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                  {searchMode === 'title'
                    ? 'Chưa có sách nào. Tìm sách theo tên và chọn bản sao bên trên.'
                    : 'Chưa có sách nào được chọn. Quét mã vạch để thêm sách.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedBooks.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-xl font-bold"><Book className="w-5 h-5" /></div>
                        <div>
                          <p className="font-bold text-gray-900">{b.book?.title}</p>
                          <p className="text-xs text-gray-500">Mã BC: <span className="font-mono">{b.copyCode}</span> • Tình trạng: {b.condition}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveBook(b.id)} className="p-2 text-gray-500 hover:text-red-600 bg-amber-50 hover:bg-red-100 rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setStep(1)}>← Quay lại</Button>
              <Button variant="primary" disabled={selectedBooks.length === 0 || !onShift} onClick={() => setStep(3)} title={!onShift ? 'Cần trong ca trực để tiếp tục' : ''}>Tiếp tục →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Xác nhận & Cài đặt</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Loại mượn</label>
                  <div className="flex gap-4">
                    <label className={cn("flex-1 flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all", borrowType === 'home' ? "bg-primary/5 border-primary text-primary" : "border-gray-100 hover:bg-gray-50")}>
                      <input type="radio" checked={borrowType === 'home'} onChange={() => setBorrowType('home')} className="hidden" />                        <Home className="w-5 h-5" />
                      <span className="font-bold">Mượn về nhà</span>
                    </label>
                    <label className={cn("flex-1 flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all", borrowType === 'library' ? "bg-primary/5 border-primary text-primary" : "border-gray-100 hover:bg-gray-50")}>
                      <input type="radio" checked={borrowType === 'library'} onChange={() => setBorrowType('library')} className="hidden" />                        <BookOpen className="w-5 h-5" />
                      <span className="font-bold">Đọc tại chỗ</span>
                    </label>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ngày mượn:</span>
                    <span className="font-bold">{new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hạn trả dự kiến:</span>
                    <span className="font-bold text-primary">
                      {borrowType === 'home' 
                        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN') + ' (+14 ngày)' 
                        : new Date().toLocaleDateString('vi-VN') + ' (Trong ngày)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <p className="font-bold text-gray-900 uppercase text-xs tracking-widest border-b pb-2">Tóm tắt phiếu mượn</p>
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                  <p className="text-sm font-bold text-amber-900 italic">Độc giả: {(selectedReader.user?.fullName || selectedReader.user?.username).toUpperCase()}</p>
                </div>
                <ul className="space-y-3">
                  {selectedBooks.map(b => (
                    <li key={b.id} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                      <span className="font-bold text-sm text-gray-800">{b.book?.title}</span>
                      <span className="text-[10px] font-mono text-gray-400">#{b.copyCode}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100 mt-6">
              <Button variant="ghost" onClick={() => setStep(2)}>← Quay lại</Button>
              <Button variant="primary" onClick={handleSubmit} disabled={!onShift} title={!onShift ? 'Cần trong ca trực để tạo phiếu' : ''}><Check className="w-4 h-4" /> Xác nhận & Tạo phiếu</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-12 space-y-6">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-5xl mx-auto shadow-sm ring-8 ring-emerald-50">
              <Check className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight">Mượn sách thành công!</h3>
              <p className="text-gray-500 mt-2">Hệ thống đã cập nhật trạng thái kho sách và thẻ độc giả.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 max-w-sm mx-auto space-y-2">
              {borrowResults.map((r, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-500">Mã phiếu #{i+1}:</span>
                  <span className="font-mono font-bold text-gray-900">{r.id.split('-')[0]}...</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 pt-8">
              <Button variant="ghost" onClick={() => window.print()} className="rounded-full"><Printer className="w-4 h-4" /> In phiếu mượn</Button>
              <Button variant="secondary" onClick={() => { setStep(1); setSelectedReader(null); setSelectedBooks([]); setSearchReader(''); setSearchBook('') }} className="rounded-full">Mượn tiếp</Button>
              <Link href="/librarian/dashboard">
                <Button variant="primary" className="rounded-full px-8">Hoàn tất</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
