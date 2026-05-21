'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { librarianApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function LibrarianBorrowRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('pending')

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [copyCode, setCopyCode] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await librarianApi.getAllRequests()
      let filtered = res
      if (status !== 'all') {
        filtered = filtered.filter((r: any) => r.status === status)
      }
      if (search) {
        filtered = filtered.filter((r: any) => 
          r.book?.title.toLowerCase().includes(search.toLowerCase()) || 
          (r.libraryCard?.user?.fullName || r.libraryCard?.user?.username).toLowerCase().includes(search.toLowerCase())
        )
      }
      setRequests(filtered)
    } catch (err) {
      toast.error('Lỗi khi tải danh sách yêu cầu')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleApprove = async () => {
    if (!selectedRequest || !copyCode) {
        toast.error('Vui lòng nhập mã bản sao')
        return
    }
    setIsProcessing(true)
    try {
        // Tìm bản sao theo code để lấy ID
        const trimmedCode = copyCode.trim()
        const copy = await librarianApi.findCopyByCode(trimmedCode)
        if (!copy || !copy.id) throw new Error('Không tìm thấy bản sao này')
        if (copy.status !== 'available') throw new Error('Bản sao này không có sẵn')

        if (copy.book?.id !== selectedRequest.book?.id && copy.bookId !== selectedRequest.book?.id) {
            throw new Error('Mã bản sao không thuộc cuốn sách mà độc giả yêu cầu!')
        }

        await librarianApi.approveRequest(selectedRequest.id, copy.id)
        toast.success('Đã duyệt yêu cầu mượn thành công')
        setSelectedRequest(null)
        setCopyCode('')
        loadData()
    } catch (err: any) {
        toast.error(err.message || 'Lỗi khi duyệt yêu cầu')
    } finally {
        setIsProcessing(false)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Lý do từ chối:')
    if (!reason) return
    try {
        await librarianApi.rejectRequest(id, reason)
        toast.success('Đã từ chối yêu cầu')
        loadData()
    } catch (err) {
        toast.error('Lỗi khi từ chối yêu cầu')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Duyệt yêu cầu mượn" description="Phê duyệt các yêu cầu mượn sách từ độc giả online" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-50">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <Input 
            placeholder="🔍 Tìm theo tên sách, tên độc giả..." 
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
            <option value="pending">Đang chờ (Pending)</option>
            <option value="approved">Đã duyệt (Approved)</option>
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
                <th className="py-5 px-6">Sách</th>
                <th className="py-5 px-6">Độc giả</th>
                <th className="py-5 px-6">Ngày gửi</th>
                <th className="py-5 px-6">Trạng thái</th>
                <th className="py-5 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400 italic">Đang tải...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400 italic">Không có yêu cầu nào</td></tr>
              ) : requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center font-bold">📖</div>
                      <span className="font-bold text-gray-800 text-sm">{req.book?.title}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">{req.libraryCard?.user?.fullName || req.libraryCard?.user?.username}</span>
                      <span className="text-[10px] text-gray-400 tracking-tighter">Thẻ: {req.libraryCard?.cardNumber}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500 font-medium">
                    {new Date(req.requestedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={cn(
                      'border-none font-bold',
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                      req.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                      'bg-red-50 text-red-600'
                    )}>
                      {req.status === 'pending' ? '● Đang chờ' : 
                       req.status === 'approved' ? '● Đã duyệt' : '● Từ chối'}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    {req.status === 'pending' ? (
                      <>
                        <Button variant="primary" size="sm" className="rounded-full px-4" onClick={() => setSelectedRequest(req)}>Duyệt</Button>
                        <Button variant="ghost" size="sm" className="rounded-full text-red-500 hover:bg-red-50" onClick={() => handleReject(req.id)}>Từ chối</Button>
                      </>
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

      {/* Modal Duyệt Yêu Cầu */}
      <Modal open={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Phê duyệt yêu cầu mượn" size="md">
        <div className="space-y-6">
            <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 space-y-2">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Thông tin mượn</p>
                <p className="text-lg font-black text-blue-900">{selectedRequest?.book?.title}</p>
                <p className="text-sm text-blue-700">Độc giả: {selectedRequest?.libraryCard?.user?.fullName}</p>
            </div>

            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Quét mã bản sao để cấp sách</label>
                <Input 
                    placeholder="Quét hoặc nhập mã bản sao (VD: 3901-001)..." 
                    value={copyCode}
                    onChange={e => setCopyCode(e.target.value)}
                    className="rounded-2xl"
                    autoFocus
                />
                <p className="text-[10px] text-gray-400 italic px-1">Lưu ý: Bạn cần giao đúng cuốn sách vật lý có mã này cho độc giả.</p>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-gray-50">
                <Button variant="primary" className="rounded-2xl py-3 font-black uppercase tracking-widest" onClick={handleApprove} loading={isProcessing}>Xác nhận & Cấp sách</Button>
                <Button variant="ghost" className="rounded-2xl" onClick={() => setSelectedRequest(null)}>Hủy bỏ</Button>
            </div>
        </div>
      </Modal>
    </div>
  )
}
