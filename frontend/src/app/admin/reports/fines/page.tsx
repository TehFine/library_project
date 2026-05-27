'use client'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Modal } from '@/components/ui'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { finesApi, AdminFineTransaction, AdminFineSummary } from '@/lib/api'
import { exportToExcel, exportToPDF } from '@/lib/export'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import toast from 'react-hot-toast'
import { CheckCircle, Clock, MinusCircle, Printer, AlertTriangle } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
const fmtDate = (s: string | Date | null) => s ? new Date(s).toLocaleDateString('vi-VN') : '—'
const fineTypeLabel = (type: string) => type === 'overdue' ? 'Quá hạn' : type === 'damaged' ? 'Hư hỏng' : type === 'lost' ? 'Mất sách' : type

const statusBadgeClass = (status: string) =>
  status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
  status === 'pending' ? 'bg-red-50 text-red-700 border-red-100' :
  'bg-slate-100 text-slate-600 border-slate-200'

const statusLabel = (status: string) =>
  status === 'paid' ? <><CheckCircle className="w-3.5 h-3.5 inline mr-1 text-emerald-500" /> Đã thu</> : status === 'pending' ? <><Clock className="w-3.5 h-3.5 inline mr-1 text-amber-500" /> Nợ</> : <><MinusCircle className="w-3.5 h-3.5 inline mr-1 text-gray-400" /> Miễn</>

const statusLabelText = (status: string) =>
  status === 'paid' ? 'Đã thu' : status === 'pending' ? 'Nợ' : 'Miễn'

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AdminFineSummary | null>(null)
  const [transactions, setTransactions] = useState<AdminFineTransaction[]>([])

  const [showWaiveModal, setShowWaiveModal] = useState<AdminFineTransaction | null>(null)
  const [waiveReason, setWaiveReason] = useState('')
  const [waiveLoading, setWaiveLoading] = useState(false)

  const [showDetailModal, setShowDetailModal] = useState<AdminFineTransaction | null>(null)
  const [showPayModal, setShowPayModal] = useState<AdminFineTransaction | null>(null)
  const [payMethod, setPayMethod] = useState('cash')
  const [payLoading, setPayLoading] = useState(false)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const fetchData = useCallback(async (params?: { from?: string; to?: string; status?: string; fineType?: string }) => {
    setLoading(true)
    try {
      const res = await finesApi.getAdminStats(params)
      setSummary(res.summary)
      setTransactions(res.transactions)
    } catch {
      toast.error('Không thể tải dữ liệu tài chính')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useRealtimeRefresh('admin:dashboard-update', fetchData)

  const applyFilter = () => {
    fetchData({
      from: fromDate || undefined,
      to: toDate || undefined,
      status: filterStatus || undefined,
      fineType: filterType || undefined,
    })
  }

  const handleWaive = async () => {
    if (!showWaiveModal || !waiveReason.trim()) return
    setWaiveLoading(true)
    try {
      await finesApi.waive(showWaiveModal.id, waiveReason)
      toast.success('Đã miễn giảm thành công')
      setShowWaiveModal(null)
      setWaiveReason('')
      applyFilter()
    } catch {
      toast.error('Lỗi khi miễn giảm phí phạt')
    } finally {
      setWaiveLoading(false)
    }
  }

  const handlePay = async () => {
    if (!showPayModal) return
    setPayLoading(true)
    try {
      await finesApi.mine() // placeholder — actual pay via librarianApi
      // Collect fine via existing pay endpoint
      const res = await fetch(`/api/fines/${showPayModal.id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ method: payMethod })
      })
      if (!res.ok) throw new Error()
      toast.success('Thu phí thành công')
      setShowPayModal(null)
      applyFilter()
    } catch {
      toast.error('Lỗi khi thu phí')
    } finally {
      setPayLoading(false)
    }
  }

  const handlePrintReceipt = async (tx: AdminFineTransaction) => {
    const { exportToPDF } = await import('@/lib/export')
    exportToPDF(
      ['Truong', 'Thong tin'],
      [
        ['So bien lai', tx.receiptNumber || '—'],
        ['Doc gia', tx.readerName],
        ['Sach', tx.bookTitle],
        ['Loai phat', fineTypeLabel(tx.fineType)],
        ['So ngay tre', String(tx.overdueDays)],
        ['So tien', fmt(tx.amount)],
        ['Phuong thuc', tx.paymentMethod || '—'],
        ['Ngay thu', fmtDate(tx.paidAt)],
      ],
      `Bien Lai Thu Phi - ${tx.receiptNumber || tx.id.slice(0, 8)}`,
      `BienLai_${tx.receiptNumber || tx.id.slice(0, 8)}`
    )
  }

  const handleExcelExport = () => {
    exportToExcel(
      transactions.map(tx => ({
        'Ngay': fmtDate(tx.createdAt),
        'Doc gia': tx.readerName,
        'Sach': tx.bookTitle,
        'Loai phat': fineTypeLabel(tx.fineType),
        'So ngay tre': tx.overdueDays,
        'So tien': tx.amount,
        'Trang thai': statusLabelText(tx.status),
        'Phuong thuc': tx.paymentMethod || '',
        'So bien lai': tx.receiptNumber || '',
      })),
      'BaoCao_TaiChinh', 'PhiPhat'
    )
  }

  const handlePDFExport = async () => {
    const { exportToPDF } = await import('@/lib/export')
    exportToPDF(
      ['Ngay', 'Doc gia', 'Loai phat', 'So tien', 'Trang thai'],
      transactions.map(tx => [fmtDate(tx.createdAt), tx.readerName, fineTypeLabel(tx.fineType), fmt(tx.amount), statusLabelText(tx.status)]),
      'Bao Cao Tai Chinh - Phi Phat', 'BaoCao_TaiChinh'
    )
  }

  const SUMMARY_CARDS = summary ? [
    { label: 'Tổng phí phát sinh', value: fmt(summary.totalAmount), color: 'amber', p: null },
    { label: 'Đã thu', value: fmt(summary.paidAmount), color: 'emerald', p: summary.totalAmount ? Math.round(summary.paidAmount / summary.totalAmount * 100) + '%' : '0%' },
    { label: 'Chưa thu', value: fmt(summary.unpaidAmount), color: 'red', p: summary.totalAmount ? Math.round(summary.unpaidAmount / summary.totalAmount * 100) + '%' : '0%' },
    { label: 'Được miễn', value: fmt(summary.waivedAmount), color: 'slate', p: summary.totalAmount ? Math.round(summary.waivedAmount / summary.totalAmount * 100) + '%' : '0%' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Báo cáo tài chính"
          description="Quản lý các khoản thu phí phạt và tình trạng thanh toán."
        />
        <div className="flex gap-2">
          <Button variant="ghost" className="bg-white/50 border border-slate-200 font-bold text-xs" onClick={handlePDFExport}>Xuất PDF</Button>
          <Button variant="secondary" className="font-bold text-xs" onClick={handleExcelExport}>Xuất Excel</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="lg" className="animate-pulse h-24 bg-slate-100 border-none"><div /></Card>
          ))
        ) : (
          SUMMARY_CARDS.map((f, idx) => (
            <Card key={idx} padding="lg" className="border-none shadow-sm relative overflow-hidden group">
              <div className={`absolute bottom-0 left-0 w-full h-1 bg-${f.color}-500/20 group-hover:h-full transition-all duration-500`} />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</p>
                <h3 className="text-xl font-black mt-1 text-slate-800">{f.value}</h3>
                {f.p && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-${f.color}-500`} style={{ width: f.p }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500">{f.p}</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Filters */}
      <Card padding="lg" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-amber-900 border-none text-white shadow-glow">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Loại phạt</label>
          <Select className="bg-white/10 border-white/20 text-white" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="overdue">Quá hạn</option>
            <option value="damaged">Hư hỏng</option>
            <option value="lost">Mất sách</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Trạng thái</label>
          <Select className="bg-white/10 border-white/20 text-white" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="pending">Đang nợ</option>
            <option value="paid">Đã thu</option>
            <option value="waived">Được miễn</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Từ ngày</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Đến ngày</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none" />
        </div>
        <Button variant="primary" className="w-full shadow-lg shadow-amber-500/50" onClick={applyFilter}>Áp dụng</Button>
      </Card>

      {/* Transactions Table */}
      <Card padding="none" className="overflow-hidden border-none shadow-card">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Ngày</th>
              <th className="px-6 py-4">Độc giả</th>
              <th className="px-6 py-4">Sách</th>
              <th className="px-6 py-4">Loại phạt</th>
              <th className="px-6 py-4">Số tiền</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">Đang tải...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">Không có dữ liệu phù hợp</td></tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{fmtDate(tx.createdAt)}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{tx.readerName}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium max-w-[180px] truncate">{tx.bookTitle}</td>
                  <td className="px-6 py-4">
                    <Badge className="bg-slate-100 text-slate-600 border-slate-200">{fineTypeLabel(tx.fineType)}{tx.overdueDays > 0 ? ` ${tx.overdueDays}n` : ''}</Badge>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-800 whitespace-nowrap">{fmt(tx.amount)}</td>
                  <td className="px-6 py-4">
                    <Badge className={statusBadgeClass(tx.status)}>{statusLabel(tx.status)}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {tx.status === 'paid' && (<button onClick={() => handlePrintReceipt(tx)} className="text-xs font-bold text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> In biên lai</button>
                      )}
                      {tx.status === 'pending' && (
                        <>
                          <button onClick={() => { setShowPayModal(tx); setPayMethod('cash') }} className="text-xs font-bold text-emerald-700 border border-emerald-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg">
                            Thu tiền
                          </button>
                          <button onClick={() => { setShowWaiveModal(tx); setWaiveReason('') }} className="text-xs font-bold text-amber-700 border border-amber-100 hover:bg-amber-50 px-3 py-1.5 rounded-lg">
                            Miễn giảm
                          </button>
                        </>
                      )}
                      <button onClick={() => setShowDetailModal(tx)} className="text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg">Chi tiết</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && transactions.length > 0 && (
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Hiển thị {transactions.length} giao dịch</p>
            <p className="text-xs font-bold text-slate-700">
              Tổng: {fmt(summary?.totalAmount ?? 0)} | Đã thu: {fmt(summary?.paidAmount ?? 0)} | Chưa thu: <span className="text-red-600">{fmt(summary?.unpaidAmount ?? 0)}</span>
            </p>
          </div>
        )}
      </Card>

      {/* Waive Modal */}
      <Modal open={!!showWaiveModal} onClose={() => setShowWaiveModal(null)} title="Miễn giảm phí phạt" size="sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Độc giả:</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{showWaiveModal?.readerName}</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-3">Sách:</p>
            <p className="text-sm text-slate-700 mt-0.5">{showWaiveModal?.bookTitle}</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-3">Số tiền miễn giảm:</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{showWaiveModal ? fmt(showWaiveModal.amount) : ''}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Lý do miễn giảm: <span className="text-red-500">*</span></label>
            <textarea
              className="w-full h-24 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
              placeholder="Nhập lý do chi tiết..."
              value={waiveReason}
              onChange={e => setWaiveReason(e.target.value)}
            />
          </div>
          <div className="p-3 rounded-lg bg-amber-50 text-[10px] text-amber-800 border border-amber-100 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <span>Thao tác này sẽ xóa khoản nợ và được lưu vào nhật ký hoạt động hệ thống.</span>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="primary" fullWidth onClick={handleWaive} disabled={waiveLoading || !waiveReason.trim()}>
              {waiveLoading ? 'Đang xử lý...' : 'Xác nhận miễn giảm'}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setShowWaiveModal(null)}>Hủy</Button>
          </div>
        </div>
      </Modal>

      {/* Pay Modal */}
      <Modal open={!!showPayModal} onClose={() => setShowPayModal(null)} title="Thu phí phạt" size="sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Độc giả:</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{showPayModal?.readerName}</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-3">Số tiền cần thu:</p>
            <p className="text-2xl font-black text-red-600 mt-0.5">{showPayModal ? fmt(showPayModal.amount) : ''}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Phương thức thanh toán:</label>
            <Select value={payMethod} onChange={e => setPayMethod(e.target.value)}>
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
              <option value="card">Thẻ ngân hàng</option>
            </Select>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="primary" fullWidth onClick={handlePay} disabled={payLoading}>
              {payLoading ? 'Đang xử lý...' : <><CheckCircle className="w-4 h-4" /> Xác nhận đã thu tiền</>}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setShowPayModal(null)}>Hủy</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!showDetailModal} onClose={() => setShowDetailModal(null)} title="Chi tiết phí phạt" size="sm">
        {showDetailModal && (
          <div className="space-y-4">
            <div className="space-y-3 text-sm">
              {([
                ['Độc giả', showDetailModal.readerName],
                ['Sách', showDetailModal.bookTitle],
                ['Loại phạt', fineTypeLabel(showDetailModal.fineType)],
                ['Số ngày trễ', showDetailModal.overdueDays > 0 ? `${showDetailModal.overdueDays} ngày` : '—'],
                ['Số tiền', fmt(showDetailModal.amount)],
                ['Trạng thái', statusLabelText(showDetailModal.status)],
                ['Phương thức', showDetailModal.paymentMethod || '—'],
                ['Số biên lai', showDetailModal.receiptNumber || '—'],
                ['Ngày thu', fmtDate(showDetailModal.paidAt)],
                ['Ngày tạo', fmtDate(showDetailModal.createdAt)],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-bold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              {showDetailModal.status === 'paid' && (
                <Button variant="secondary" fullWidth onClick={() => handlePrintReceipt(showDetailModal)}><Printer className="w-4 h-4" /> In biên lai</Button>
              )}
              <Button variant="ghost" fullWidth onClick={() => setShowDetailModal(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
