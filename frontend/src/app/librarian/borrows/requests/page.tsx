'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { librarianApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import { Book, Upload } from 'lucide-react'

export default function LibrarianRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('pending')

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Load cả hai loại yêu cầu song song
      const [borrowReqs, returnReqs] = await Promise.all([
        librarianApi.getAllRequests(),
        librarianApi.getPendingReturns(),
      ])

      // Chuẩn hóa dữ liệu: gắn thêm trường requestType
      const borrowItems = (Array.isArray(borrowReqs) ? borrowReqs : []).map((r: any) => ({
        ...r,
        requestType: 'borrow' as const,
        _date: r.requestedAt,
        _readerName: r.libraryCard?.user?.fullName || r.libraryCard?.user?.username,
        _cardNumber: r.libraryCard?.cardNumber,
        _bookTitle: r.book?.title,
      }))

      const returnItems = (Array.isArray(returnReqs) ? returnReqs : []).map((r: any) => ({
        ...r,
        id: `return-${r.id}`, // prefix để tránh trùng ID
        recordId: r.id,       // lưu lại recordId thật
        requestType: 'return' as const,
        status: r.returnRequested ? 'pending' : r.status,
        _date: r.createdAt || r.updatedAt,
        _readerName: r.libraryCard?.user?.profile?.fullName || r.libraryCard?.user?.username,
        _cardNumber: r.libraryCard?.cardNumber,
        _bookTitle: r.bookCopy?.book?.title,
        book: r.bookCopy?.book, // đồng bộ cấu trúc
        libraryCard: r.libraryCard,
      }))

      // Gộp và sắp xếp theo ngày
      let combined = [...borrowItems, ...returnItems].sort(
        (a, b) => new Date(b._date).getTime() - new Date(a._date).getTime()
      )

      // Lọc theo status
      if (status !== 'all') {
        combined = combined.filter(r => r.status === status)
      }

      // Lọc theo search
      if (search) {
        const lower = search.toLowerCase()
        combined = combined.filter(r =>
          (r._bookTitle || '').toLowerCase().includes(lower) ||
          (r._readerName || '').toLowerCase().includes(lower)
        )
      }

      setRequests(combined)
    } catch (err) {
      toast.error('Lỗi khi tải danh sách yêu cầu')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtimeRefresh('librarian:dashboard-update', loadData)

  const handleApproveBorrow = (req: any) => {
    sessionStorage.setItem('borrow_request_prefill', JSON.stringify({
      requestId: req.id,
      cardId: req.libraryCard?.id,
      bookId: req.book?.id,
      bookTitle: req._bookTitle,
      readerName: req._readerName,
      cardNumber: req._cardNumber,
    }))
    router.push('/librarian/borrows/new')
  }

  const handleApproveReturn = (req: any) => {
    // Lưu thông tin yêu cầu trả vào sessionStorage
    sessionStorage.setItem('return_request_prefill', JSON.stringify({
      borrowRecordId: req.recordId,
      copyCode: req.bookCopy?.copyCode,
      bookTitle: req._bookTitle,
      readerName: req._readerName,
      cardNumber: req._cardNumber,
    }))
    router.push('/librarian/borrows/return')
  }

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }
    setIsRejecting(true)
    try {
      await librarianApi.rejectRequest(rejectTarget.id, rejectReason.trim())
      toast.success('Đã từ chối yêu cầu')
      setRejectTarget(null)
      setRejectReason('')
      loadData()
    } catch (err) {
      toast.error('Lỗi khi từ chối yêu cầu')
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Yêu cầu" description="Duyệt các yêu cầu mượn sách và yêu cầu trả sách từ độc giả" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <Input 
            placeholder="Tìm theo tên sách, tên độc giả..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs rounded-2xl"
          />
          <Select 
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="rounded-2xl"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Đang chờ</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <Card padding="none" className="rounded-3xl overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="py-5 px-6">Loại</th>
                <th className="py-5 px-6">Sách</th>
                <th className="py-5 px-6">Độc giả</th>
                <th className="py-5 px-6">Ngày gửi</th>
                <th className="py-5 px-6">Trạng thái</th>
                <th className="py-5 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">Đang tải...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">Không có yêu cầu nào</td></tr>
              ) : requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="py-4 px-6">
                    <Badge className={cn(
                      'border-none font-bold text-[10px]',
                      req.requestType === 'borrow'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-emerald-50 text-emerald-600'
                    )}>
                      {req.requestType === 'borrow' ? <><Book className="w-3 h-3 inline" /> Mượn</> : <><Upload className="w-3 h-3 inline" /> Trả</>}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center font-bold"><Book className="w-4 h-4" /></div>
                      <span className="font-bold text-gray-800 text-sm">{req._bookTitle}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">{req._readerName}</span>
                      <span className="text-[10px] text-gray-400 tracking-tighter">Thẻ: {req._cardNumber}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500 font-medium">
                    {new Date(req._date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={cn(
                      'border-none font-bold',
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                      req.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                      'bg-red-50 text-red-600'
                    )}>
                      {req.status === 'pending' ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />Đang chờ</> : 
                       req.status === 'approved' ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />Đã duyệt</> : <><span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1" />Từ chối</>}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    {req.status === 'pending' ? (
                      req.requestType === 'borrow' ? (
                        <>
                          <Button variant="primary" size="sm" className="rounded-full px-4" onClick={() => handleApproveBorrow(req)}>Duyệt</Button>
                          <Button variant="ghost" size="sm" className="rounded-full text-red-500 hover:bg-red-50" onClick={() => { setRejectTarget(req); setRejectReason('') }}>Từ chối</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="primary" size="sm" className="rounded-full px-4 bg-emerald-500 hover:bg-emerald-600" onClick={() => handleApproveReturn(req)}>Nhận trả</Button>
                        </>
                      )
                    ) : (
                      <span className="text-xs text-gray-400 italic">Đã xử lý</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Từ chối yêu cầu mượn */}
      <Modal open={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason('') }} title="Từ chối yêu cầu mượn" size="sm">
        <div className="space-y-5">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <p className="text-sm font-bold text-red-800">{rejectTarget?._bookTitle}</p>
            <p className="text-xs text-red-600 mt-1">
              Độc giả: {rejectTarget?._readerName}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Lý do từ chối</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối yêu cầu mượn này..."
              rows={4}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-gray-50">
            <Button variant="primary" className="rounded-2xl py-3 bg-red-500 hover:bg-red-600" onClick={handleReject} loading={isRejecting}>
              Xác nhận từ chối
            </Button>
            <Button variant="ghost" className="rounded-2xl" onClick={() => { setRejectTarget(null); setRejectReason('') }}>
              Hủy bỏ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}