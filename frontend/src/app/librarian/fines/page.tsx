'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge } from '@/components/ui'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { librarianApi } from '@/lib/api'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { Check } from 'lucide-react'


export default function LibrarianFinesPage() {
  const [fines, setFines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  
  const [selectedFine, setSelectedFine] = useState<any | null>(null)
  const [receiptFine, setReceiptFine] = useState<any | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await librarianApi.getAllFines()
      let filtered = res
      if (status !== 'all') {
        filtered = filtered.filter((f: any) => f.status === status)
      }
      if (search) {
        filtered = filtered.filter((f: any) => 
          (f.borrowRecord?.libraryCard?.user?.fullName || f.borrowRecord?.libraryCard?.user?.username).toLowerCase().includes(search.toLowerCase()) ||
          f.borrowRecord?.bookCopy?.book?.title.toLowerCase().includes(search.toLowerCase())
        )
      }
      setFines(filtered)
    } catch (err) {
      toast.error('Lỗi khi tải danh sách phí phạt')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handlePayFine = async () => {
    if (!selectedFine) return
    try {
      await librarianApi.payFine(selectedFine.id, paymentMethod)
      toast.success('Đã thanh toán phí phạt thành công')
      setSelectedFine(null)
      loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi thanh toán')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý phí phạt" description="Thu phí trễ hạn, làm mất hoặc hư hỏng sách" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-50">
        <div className="flex gap-2 flex-1 w-full overflow-x-auto px-1 pb-2 pt-1">
          <Input 
            placeholder="Tìm sách, độc giả..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-[180px] sm:max-w-xs rounded-2xl text-sm"
          />
          <Select 
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="rounded-2xl text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chưa thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="waived">Đã miễn giảm</option>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <Card padding="none" className="rounded-3xl overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="py-5 px-6">Độc giả</th>
                <th className="py-5 px-6">Sách</th>
                <th className="py-5 px-6">Lý do</th>
                <th className="py-5 px-6">Số tiền</th>
                <th className="py-5 px-6">Trạng thái</th>
                <th className="py-5 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">Đang tải...</td></tr>
              ) : fines.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">Không có dữ liệu phí phạt</td></tr>
              ) : fines.map(fine => (
                <tr key={fine.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">{fine.borrowRecord?.libraryCard?.user?.fullName || fine.borrowRecord?.libraryCard?.user?.username}</span>
                      <span className="text-[10px] text-gray-400 tracking-tighter">Thẻ: {fine.borrowRecord?.libraryCard?.cardNumber}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600 font-medium">{fine.borrowRecord?.bookCopy?.book?.title}</td>
                  <td className="py-4 px-6 text-xs text-gray-500 capitalize">{fine.fineType === 'overdue' ? 'Trễ hạn' : fine.fineType}</td>
                  <td className="py-4 px-6 font-black text-sm text-gray-900">{formatCurrency(fine.amount)}</td>
                  <td className="py-4 px-6">
                    <Badge className={
                      fine.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                      fine.status === 'waived' ? 'bg-gray-100 text-gray-600' :
                      'bg-red-50 text-red-600'
                    }>
                      {fine.status === 'paid' ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" /> Đã thu</> :
                       fine.status === 'waived' ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 mr-1" /> Đã miễn giảm</> :
                       <><span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1" /> Chờ thu</>}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {fine.status === 'pending' ? (
                      <Button variant="primary" size="sm" className="rounded-full px-4 text-xs" onClick={() => setSelectedFine(fine)}>Thu phí</Button>
                    ) : fine.status === 'waived' ? (
                      <Button variant="ghost" size="sm" className="rounded-full text-xs px-3 text-gray-500" onClick={() => setReceiptFine(fine)}>Đã miễn</Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="rounded-full text-xs px-3" onClick={() => setReceiptFine(fine)}>Biên lai</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Thu Phí */}
      <Modal open={!!selectedFine} onClose={() => setSelectedFine(null)} title="Xác nhận thu phí phạt" size="md">
        <div className="space-y-6">
           <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 text-center space-y-2">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Tổng tiền cần thu</p>
              <p className="text-4xl font-black text-amber-900">{formatCurrency(selectedFine?.amount || 0)}</p>
           </div>
           
           <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Thông tin chi tiết</p>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Độc giả:</span>
                  <span className="font-bold text-gray-900">{selectedFine?.borrowRecord?.libraryCard?.user?.fullName || selectedFine?.borrowRecord?.libraryCard?.user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lý do:</span>
                  <span className="font-bold text-gray-900">{selectedFine?.fineType === 'overdue' ? 'Trễ hạn sách' : 'Khác'}</span>
                </div>
              </div>
           </div>

           <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phương thức thanh toán</label>
              <div className="grid grid-cols-3 gap-2">
                {['cash', 'transfer', 'qr'].map(m => (
                  <label key={m} className={cn(
                    "p-3 rounded-2xl border text-center cursor-pointer transition-all text-xs font-bold capitalize",
                    paymentMethod === m ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                  )}>
                    <input type="radio" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="hidden" />
                    {m === 'cash' ? 'Tiền mặt' : m === 'transfer' ? 'Chuyển khoản' : 'QR Code'}
                  </label>
                ))}
              </div>
           </div>

           <div className="flex flex-col gap-2 pt-4 border-t border-gray-50">
              <Button variant="primary" className="rounded-2xl py-3 font-black uppercase tracking-widest" onClick={handlePayFine}>Xác nhận thanh toán</Button>
              <Button variant="ghost" className="rounded-2xl" onClick={() => setSelectedFine(null)}>Hủy bỏ</Button>
           </div>
        </div>
      </Modal>

      {/* Modal Biên Lai / Chi Tiết Miễn Giảm */}
      <Modal open={!!receiptFine} onClose={() => setReceiptFine(null)} title={receiptFine?.status === 'waived' ? 'Chi tiết miễn giảm' : 'Biên lai điện tử'} size="sm">
        <div className="space-y-6">
          {receiptFine?.status === 'waived' ? (
            /* ── Waive receipt ── */
            <>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 text-center space-y-2">
                <div className="w-12 h-12 bg-gray-200 text-gray-500 rounded-full mx-auto flex items-center justify-center text-xl font-bold mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Đã miễn giảm</p>
                <p className="text-4xl font-black text-gray-700">{formatCurrency(receiptFine?.amount || 0)}</p>
              </div>
              <div className="space-y-4 text-sm px-2">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-400">Mã chứng từ</span>
                  <span className="font-bold text-gray-900 font-mono text-xs">{receiptFine?.receiptNumber || '---'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-400">Ngày miễn giảm</span>
                  <span className="font-bold text-gray-900">{receiptFine?.paidAt ? new Date(receiptFine.paidAt).toLocaleString('vi-VN') : '---'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-400">Lý do</span>
                  <span className="font-bold text-gray-900 text-right max-w-[60%]">
                    {(receiptFine?.paymentMethod || '').replace(/^waive:/, '') || '---'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Người xử lý</span>
                  <span className="font-bold text-gray-900">{receiptFine?.collectedBy?.fullName || receiptFine?.collectedBy?.username || 'Thủ thư'}</span>
                </div>
              </div>
            </>
          ) : (
            /* ── Payment receipt ── */
            <>
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center text-xl font-bold mb-4"><Check className="w-6 h-6" /></div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Đã thanh toán</p>
                <p className="text-4xl font-black text-emerald-900">{formatCurrency(receiptFine?.amount || 0)}</p>
              </div>
              <div className="space-y-4 text-sm px-2">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-400">Mã biên lai</span>
                  <span className="font-bold text-gray-900 font-mono text-xs">{receiptFine?.receiptNumber || '---'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-400">Ngày thanh toán</span>
                  <span className="font-bold text-gray-900">{receiptFine?.paidAt ? new Date(receiptFine.paidAt).toLocaleString('vi-VN') : '---'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-400">Hình thức</span>
                  <span className="font-bold text-gray-900 capitalize">
                    {receiptFine?.paymentMethod === 'cash' ? 'Tiền mặt' : receiptFine?.paymentMethod === 'transfer' ? 'Chuyển khoản' : receiptFine?.paymentMethod === 'qr' ? 'QR Code' : receiptFine?.paymentMethod || '---'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Người thu</span>
                  <span className="font-bold text-gray-900">{receiptFine?.collectedBy?.fullName || receiptFine?.collectedBy?.username || 'Thủ thư'}</span>
                </div>
              </div>
            </>
          )}

           <div className="pt-4 border-t border-gray-50 text-center">
              <Button variant="ghost" className="rounded-2xl px-8" onClick={() => setReceiptFine(null)}>Đóng</Button>
           </div>
        </div>
      </Modal>
    </div>
  )
}
