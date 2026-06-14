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
import {
  CheckCircle, Clock, MinusCircle, Printer, AlertTriangle,
  Download, FileText, Filter, Wallet, Receipt, Search,
  TrendingUp, type LucideIcon,
} from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
const fmtDate = (s: string | Date | null) => s ? new Date(s).toLocaleDateString('vi-VN') : '—'
const fineTypeLabel = (type: string) => type === 'overdue' ? 'Quá hạn' : type === 'damaged' ? 'Hư hỏng' : type === 'lost' ? 'Mất sách' : type

const statusBadgeClass = (status: string) =>
  status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
  status === 'pending' ? 'bg-red-50 text-red-700 border-red-100' :
  'bg-slate-100 text-slate-600 border-slate-200'

const statusLabel = (status: string) =>
  status === 'paid' ? <><CheckCircle className="w-3.5 h-3.5 inline mr-1 text-emerald-500" /> Đã thu</>
  : status === 'pending' ? <><Clock className="w-3.5 h-3.5 inline mr-1 text-amber-500" /> Nợ</>
  : <><MinusCircle className="w-3.5 h-3.5 inline mr-1 text-gray-400" /> Miễn</>

const statusLabelText = (status: string) =>
  status === 'paid' ? 'Đã thu' : status === 'pending' ? 'Nợ' : 'Miễn'

/* ── Sub-components ────────────────────────────────────────────────────────── */

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-6 py-4">
          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 0 ? '35%' : j === 2 ? '50%' : '40%' }} />
        </td>
      ))}
    </tr>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <tr>
      <td colSpan={7} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Icon className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p className="text-slate-400 font-medium">{title}</p>
            {description && <p className="text-slate-300 text-xs mt-1">{description}</p>}
          </div>
        </div>
      </td>
    </tr>
  )
}

/* ── Summary card colour helpers (avoid dynamic Tailwind classes) ──────── */

const cardBgMap: Record<string, { bg: string; accent: string; progress: string }> = {
  amber: { bg: 'bg-amber-50/80 border-amber-200/60', accent: 'bg-amber-500/20', progress: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50/80 border-emerald-200/60', accent: 'bg-emerald-500/20', progress: 'bg-emerald-500' },
  red: { bg: 'bg-red-50/80 border-red-200/60', accent: 'bg-red-500/20', progress: 'bg-red-500' },
  slate: { bg: 'bg-slate-50/80 border-slate-200/60', accent: 'bg-slate-500/20', progress: 'bg-slate-500' },
}

/* ── Page ────────────────────────────────────────────────────────────────── */

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

  const handlePrintReceipt = (tx: AdminFineTransaction) => {
    exportToPDF(
      ['Trường', 'Thông tin'],
      [
        ['Số biên lai', tx.receiptNumber || '—'],
        ['Độc giả', tx.readerName],
        ['Sách', tx.bookTitle],
        ['Loại phạt', fineTypeLabel(tx.fineType)],
        ['Số ngày trễ', String(tx.overdueDays)],
        ['Số tiền', fmt(tx.amount)],
        ['Phương thức', tx.paymentMethod || '—'],
        ['Ngày thu', fmtDate(tx.paidAt)],
      ],
      `Biên Lai Thu Phí - ${tx.receiptNumber || tx.id.slice(0, 8)}`,
      `BienLai_${tx.receiptNumber || tx.id.slice(0, 8)}`
    )
  }

  const handleExcelExport = () => {
    exportToExcel(
      transactions.map(tx => ({
        'Ngày': fmtDate(tx.createdAt),
        'Độc giả': tx.readerName,
        'Sách': tx.bookTitle,
        'Loại phạt': fineTypeLabel(tx.fineType),
        'Số ngày trễ': tx.overdueDays,
        'Số tiền': tx.amount,
        'Trạng thái': statusLabelText(tx.status),
        'Phương thức': tx.paymentMethod || '',
        'Số biên lai': tx.receiptNumber || '',
      })),
      'BaoCao_TaiChinh', 'PhiPhat'
    )
  }

  const handlePDFExport = () => {
    exportToPDF(
      ['Ngày', 'Độc giả', 'Loại phạt', 'Số tiền', 'Trạng thái'],
      transactions.map(tx => [fmtDate(tx.createdAt), tx.readerName, fineTypeLabel(tx.fineType), fmt(tx.amount), statusLabelText(tx.status)]),
      'Báo Cáo Tài Chính - Phí Phạt', 'BaoCao_TaiChinh'
    )
  }

  /* ── Derived data ──────────────────────────────────────────────────────── */

  const SUMMARY_CARDS: { label: string; value: string; key: string; p: string | null; icon: LucideIcon }[] = summary ? [
    { label: 'Tổng phí phát sinh', value: fmt(summary.totalAmount), key: 'amber', p: null, icon: TrendingUp },
    { label: 'Đã thu', value: fmt(summary.paidAmount), key: 'emerald', p: summary.totalAmount ? Math.round(summary.paidAmount / summary.totalAmount * 100) + '%' : '0%', icon: CheckCircle },
    { label: 'Chưa thu', value: fmt(summary.unpaidAmount), key: 'red', p: summary.totalAmount ? Math.round(summary.unpaidAmount / summary.totalAmount * 100) + '%' : '0%', icon: Clock },
    { label: 'Được miễn', value: fmt(summary.waivedAmount), key: 'slate', p: summary.totalAmount ? Math.round(summary.waivedAmount / summary.totalAmount * 100) + '%' : '0%', icon: MinusCircle },
  ] : []

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
        <PageHeader
          title="Báo cáo tài chính"
          description="Quản lý các khoản thu phí phạt và tình trạng thanh toán."
        />
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" className="rounded-xl border border-slate-200 text-xs font-bold" onClick={handlePDFExport}>
            <FileText className="w-3.5 h-3.5" /> PDF
          </Button>
          <Button variant="secondary" size="sm" className="rounded-xl text-xs font-bold" onClick={handleExcelExport}>
            <Download className="w-3.5 h-3.5" /> Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="lg" className="animate-pulse border-none">
              <div className="space-y-3">
                <div className="h-3 w-16 bg-slate-200 rounded" />
                <div className="h-7 w-28 bg-slate-200 rounded" />
                <div className="h-2 w-full bg-slate-100 rounded" />
              </div>
            </Card>
          ))
        ) : !summary ? (
          /* Error state for summary */
          <div className="col-span-full">
            <Card padding="lg" className="text-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-300" />
                </div>
                <p className="text-slate-500 font-medium">Không thể tải dữ liệu tài chính</p>
                <p className="text-slate-300 text-xs">Vui lòng kiểm tra kết nối và thử lại</p>
                <Button variant="secondary" size="sm" className="mt-2 rounded-xl" onClick={() => fetchData()}>
                  Thử lại
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          SUMMARY_CARDS.map((f, idx) => {
            const colors = cardBgMap[f.key] || cardBgMap.slate
            const Icon = f.icon
            return (
              <Card key={idx} padding="lg" className={`border-none shadow-sm relative overflow-hidden group ${colors.bg}`}>
                <div className={`absolute bottom-0 left-0 w-full h-1 ${colors.accent} group-hover:h-full transition-all duration-500`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</p>
                    <Icon className="w-4 h-4 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">{f.value}</h3>
                  {f.p && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors.progress} rounded-full transition-all duration-500`} style={{ width: f.p }} />
                      </div>
                      <span className="text-[10px] font-black text-slate-500">{f.p}</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Filters */}
      <Card padding="md" className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 items-end bg-white/80 backdrop-blur border border-slate-200 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại phạt</label>
          <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="rounded-xl text-xs">
            <option value="">Tất cả</option>
            <option value="overdue">Quá hạn</option>
            <option value="damaged">Hư hỏng</option>
            <option value="lost">Mất sách</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</label>
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-xl text-xs">
            <option value="">Tất cả</option>
            <option value="pending">Đang nợ</option>
            <option value="paid">Đã thu</option>
            <option value="waived">Được miễn</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Từ ngày</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-all" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đến ngày</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-all" />
        </div>
        <Button variant="primary" className="w-full rounded-xl text-xs font-bold" onClick={applyFilter}>
          <Filter className="w-3.5 h-3.5" /> Áp dụng
        </Button>
      </Card>

      {/* Transactions Table */}
      <Card padding="none" className="overflow-hidden border border-slate-100 shadow-sm rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Ngày</th>
                <th className="px-6 py-4 whitespace-nowrap">Độc giả</th>
                <th className="px-6 py-4 whitespace-nowrap">Sách</th>
                <th className="px-6 py-4 whitespace-nowrap">Loại phạt</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Số tiền</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Trạng thái</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : transactions.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="Không có dữ liệu phù hợp"
                  description="Thử điều chỉnh bộ lọc hoặc khoảng thời gian"
                />
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 text-slate-500 font-medium whitespace-nowrap text-sm">{fmtDate(tx.createdAt)}</td>
                    <td className="px-6 py-5 font-bold text-slate-800 text-sm">{tx.readerName}</td>
                    <td className="px-6 py-5 text-slate-600 font-medium text-sm max-w-[180px] truncate">{tx.bookTitle}</td>
                    <td className="px-6 py-5">
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                        {fineTypeLabel(tx.fineType)}{tx.overdueDays > 0 ? ` ${tx.overdueDays}n` : ''}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-center font-black text-slate-800 whitespace-nowrap">{fmt(tx.amount)}</td>
                    <td className="px-6 py-5 text-center">
                      <Badge className={cn('text-xs', statusBadgeClass(tx.status))}>
                        {statusLabel(tx.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        {tx.status === 'paid' && (
                          <button
                            onClick={() => handlePrintReceipt(tx)}
                            className="text-[10px] sm:text-xs font-bold text-amber-600 hover:bg-amber-50 px-2 sm:px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap transition-colors border border-transparent hover:border-amber-200"
                          >
                            <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> In biên lai
                          </button>
                        )}
                        {tx.status === 'pending' && (
                          <>
                            <button
                              onClick={() => { setShowPayModal(tx); setPayMethod('cash') }}
                              className="text-[10px] sm:text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-2 sm:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
                            >
                              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" /> Thu tiền
                            </button>
                            <button
                              onClick={() => { setShowWaiveModal(tx); setWaiveReason('') }}
                              className="text-[10px] sm:text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 px-2 sm:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
                            >
                              <MinusCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" /> Miễn giảm
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setShowDetailModal(tx)}
                          className="text-[10px] sm:text-xs font-bold text-slate-500 hover:bg-slate-100 px-2 sm:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {!loading && summary && transactions.length > 0 && (
          <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs text-slate-500 font-medium">
              <Search className="w-3 h-3 inline mr-1" />
              Hiển thị {transactions.length} giao dịch
            </p>
            <p className="text-xs font-bold text-slate-700">
              Tổng: {fmt(summary.totalAmount)} &middot; Đã thu: <span className="text-emerald-600">{fmt(summary.paidAmount)}</span> &middot; Chưa thu: <span className="text-red-600">{fmt(summary.unpaidAmount)}</span>
            </p>
          </div>
        )}
      </Card>

      {/* ── Waive Modal ────────────────────────────────────────────────────── */}
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
              className="w-full h-24 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all resize-none"
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

      {/* ── Pay Modal ──────────────────────────────────────────────────────── */}
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
            <Select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="rounded-xl text-xs">
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

      {/* ── Detail Modal ───────────────────────────────────────────────────── */}
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
                  <span className="font-bold text-slate-800 text-right">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              {showDetailModal.status === 'paid' && (
                <Button variant="secondary" fullWidth onClick={() => handlePrintReceipt(showDetailModal)}>
                  <Printer className="w-4 h-4" /> In biên lai
                </Button>
              )}
              <Button variant="ghost" fullWidth onClick={() => setShowDetailModal(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
